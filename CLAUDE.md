# Khu₹truke CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cross-platform expense tracker app built with Expo SDK 54 + TypeScript (strict mode).
Targets iOS and Android. Primary audience: daily-life users aged 20–40.
App category: productivity / lifestyle. Local-first — no backend, no auth server.

App is named **Khu₹truke**. npm package name is `khutruke`.

## Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81.5, React 19.1.0)
- **Navigation**: Expo Router (file-based routing) — Stack + bottom tabs with a fully custom floating tab bar (center FAB); built on React Navigation v6 internally
- **State management**: Zustand — store split into slices (`store/slices/`), composed in `store/index.ts`. Screens access state via `hooks/` only — never import `useAppStore` directly in screens. Persisted via AsyncStorage and expo-secure-store. No backend, local-first.
- **Styling**: StyleSheet API (NativeWind is NOT used in this project)
- **Charts**: react-native-chart-kit + react-native-svg (donut/pie, bar, line charts)
- **Type safety**: TypeScript strict mode — `tsconfig.json` extends `expo/tsconfig.base`
- **Image handling**: expo-image-picker (receipt capture), expo-file-system (backup file I/O)
- **File sharing**: expo-sharing (export backup), expo-document-picker (import backup)
- **Icons**: @expo/vector-icons (Ionicons set)

## Commands

- `npm start` — launch the Expo dev server (Metro bundler + QR for Expo Go)
- `npm run android` / `npm run ios` / `npm run web` — start with a target platform preselected
- `npx expo install --fix` — realign native module versions after Expo SDK updates
- `npx tsc --noEmit` — type-check without emitting (no `test` or `lint` script defined)

EAS cloud builds (requires `eas-cli`):
- `eas build --profile preview --platform android` — APK for sideloading
- `eas build --profile testing --platform android` — internal distribution APK

There is no `test` or `lint` script defined in `package.json`.

## Entry point

`"main": "expo-router/entry"` in `package.json`. The `app/` directory is the route root — all screens are file-based routes. Providers, the root Stack layout, and SplashScreen handling are in `app/_layout.tsx`.

## Platform note

Development happens on Windows (PowerShell). iOS builds require a Mac or EAS Build; Android and web can be exercised locally.

## Architecture

### Navigation (`app/` directory)

Expo Router file-based routing. The `app/` directory defines all routes:

```
app/
├── _layout.tsx         # Root layout — providers, SplashScreen gate, Stack screen config
├── index.tsx           # Entry — OTA update check + initial redirect
├── (auth)/
│   ├── _layout.tsx     # Passthrough Stack for auth screens
│   ├── onboarding.tsx
│   └── setup.tsx
├── (tabs)/
│   ├── _layout.tsx     # Bottom tab layout using CustomTabBar
│   ├── index.tsx       # Home tab (full screen code inline)
│   ├── reports.tsx
│   ├── analytics.tsx
│   └── profile.tsx
├── add-edit.tsx        # Modal (presentation: modal, animation: slide_from_bottom)
├── manage-categories.tsx # Pushed from Profile → Manage categories
└── backup-restore.tsx  # Pushed from Profile → Backup & Restore
```

Screen code lives directly inside each route file (no separate `screens/` directory). All routes are self-contained — the pattern matches `app/(tabs)/index.tsx`.

Initial route logic in `app/index.tsx` (runs after all data is loaded):
```
isUserConfigured  →  "/(tabs)"
!isUserConfigured && onboarded  →  "/(auth)/setup"
neither  →  "/(auth)/onboarding"
```
`isUserConfigured = !!userName || setup || Object.values(expenses).some(a => a.length > 0)` — derived in `useUserProfile` hook, not stored in Zustand state.

- `SplashScreen.preventAutoHideAsync()` keeps the native splash visible in `app/_layout.tsx` until the store's `initialize()` completes and sets `ready: true`.
- OTA force-update check runs in `app/index.tsx` via `expo-updates`.
- Screens use `useRouter()` from `expo-router` for all navigation. Editing an expense passes only `expense.id` as a URL param (`/add-edit?id=<id>`); `AddEditScreen` looks it up from `useExpenses().expenses`.

### State management

Global state is split into Zustand slices under `store/slices/`, composed into one store in `store/index.ts`. The store is never imported by screens directly — use hooks instead.

```
store/
├── index.ts            # Composes all slices; exports useAppStore (hooks only) + re-exports types
├── storeTypes.ts       # All slice types + AppStore union type (no circular deps)
└── slices/
    ├── userSlice.ts    # userName, profileImage, currency, onboarded, setup, joinedAt + 4 actions
    ├── expenseSlice.ts # expenses: Record<string, Expense[]> + selectExpenses + CRUD
    ├── budgetSlice.ts  # budgets: Record<string, number> + saveBudget + clearBudgetForCurrency
    ├── categorySlice.ts# customCategories, builtInCategories + CRUD
    └── backupSlice.ts  # exportBackup, importBackup actions
```

**State shape:**

```ts
// Persisted state
userName: string
profileImage: string | null        // local file URI
currency: Currency                 // active currency object
onboarded: boolean
setup: boolean                     // @pw/setup flag
joinedAt: string                   // ISO date string

expenses: Record<string, Expense[]> // ALL currencies in memory, keyed by code
budgets:  Record<string, number>    // ALL currencies in memory, keyed by code
customCategories: Category[]
builtInCategories: Category[]       // initialized from DEFAULT_CATEGORIES

// Ephemeral
ready: boolean                      // true after initialize() completes
```

**Key design points:**
- `expenses` holds ALL currencies in memory simultaneously — no reload needed on currency switch
- `budgets` is also per-currency in memory
- `isUserConfigured` is NOT stored — derived in `useUserProfile` hook
- `selectExpenses(code?: string): Expense[]` — selector action on the store; returns the active (or named) currency's array

**`initialize()` in `store/index.ts`:**
1. Phase 1 (parallel): load userName, onboarded, setup flag, currency, profileImage
2. Phase 2 (parallel): load ALL currencies' expenses + budgets + categories + joinedAt
3. Legacy migration: moves unpartitioned `@pw/expenses` key to `@pw/expenses:USD`
4. Sets `ready: true`

`app/_layout.tsx` renders a `SplashGate` component that calls `useAppStore.getState().initialize()` once on mount.

### Hooks layer (`hooks/`)

Screens MUST use hooks — never import `useAppStore` directly in a screen. Hooks are the public API.

```
hooks/
├── useExpenses.ts      # expenses (active currency array), allExpensesRecord, selectExpenses, CRUD
├── useUserProfile.ts   # userName, currency, profileImage, joinedAt, isUserConfigured, actions
├── useCategories.ts    # customCategories, builtInCategories, allCategories (deduped merged), actions
├── useBudget.ts        # budget (active currency number), budgets (full Record), saveBudget, clear
└── useBackup.ts        # exportBackup, importBackup
```

Screen consumption pattern:
```ts
// Instead of: const { expenses, budget, currency } = useAppStore();
const { expenses, addExpense } = useExpenses();
const { budget } = useBudget();
const { currency } = useUserProfile();
```

`useExpenses` exposes both `expenses` (active currency `Expense[]`) and `allExpensesRecord` (`Record<string, Expense[]>`) for multi-currency access (e.g. SettingsScreen counts, BackupRestoreScreen total).

### Types (`types/index.ts`)

All shared domain types live here. Import from `'../types'` (not from `'../store'`, though `store/index.ts` re-exports them for backwards compatibility).

```ts
Currency      = { code, symbol, label }
Category      = { name, icon, color? }
Expense       = { id, amount, category, icon, note, tags, date, receipt, paymentType }
BackupState   = { userName, currency, onboarded, joinedAt, expenses, budgets,
                  customCategories, builtInCategories, profileImageBase64: string|null }
BackupDataV2  = { version: 2, app: 'khutruke', createdAt: string, state: BackupState }
BackupData    = BackupDataV2   // union when V3 is introduced
```

`profileImageBase64` is the profile photo encoded as base64 — allows profile photo to survive a backup/restore across devices.

### Backup & Restore (`utils/backup.ts` + `store/slices/backupSlice.ts`)

The backup file IS the Zustand state — no transformation, no mapping.

**Export flow:**
1. `getBackupState()` extracts persistent state from the store; reads profile image as base64 from disk
2. Wraps in `BackupDataV2` envelope (`version`, `app`, `createdAt`, `state`)
3. Writes JSON to `Paths.document` via `expo-file-system` `File` API
4. Opens system share sheet via `expo-sharing`

**Import flow:**
1. `DocumentPicker.getDocumentAsync()` lets user pick a `.json` file
2. `isValidBackup()` type-guards the raw content
3. `migrateBackup()` handles future version upgrades (pass-through today)
4. `persistBackupState()` writes all fields back to AsyncStorage/SecureStore + restores profile image from base64
5. `set({ ...state, profileImage: restoredUri, ready: true })` hydrates the store directly — no `initialize()` needed

**File I/O uses expo-file-system v19 API** (`File`, `Paths` classes — NOT the deprecated `FileSystem.*` legacy API):
```ts
import { File as FSFile, Paths } from 'expo-file-system';
const file = new FSFile(Paths.document, 'khutruke_backup_2026-05-27.json');
file.write(json);              // sync
const text = await file.text(); // async read
```

Route: `app/backup-restore.tsx`
Accessible from: Profile screen → Backup & Restore row

### Storage layer (`utils/storage.ts`)

A thin `storeGet / storeSet / storeRemove / storeMultiRemove` abstraction routes keys between two backends:

- **`expo-secure-store`** (encrypted): `@pw/budget:<CODE>`, `@pw/profileImage`, `@pw/darkMode`
- **`AsyncStorage`**: everything else

Both backends contain one-time migration logic that silently moves data when a key's home changes — reads old location, writes to new, deletes old.

Storage key conventions:
- `@pw/expenses:<CURRENCY_CODE>` — per-currency expense arrays (e.g. `@pw/expenses:USD`)
- `@pw/budget:<CURRENCY_CODE>` — per-currency monthly budget (e.g. `@pw/budget:USD`)
- `@pw/categories` — custom category list
- `@pw/builtInCategories` — modified built-in categories
- `@pw/userName`, `@pw/currency`, `@pw/onboarded`, `@pw/setup`, `@pw/joinedAt` — profile fields

Expenses and budgets are siloed per currency code — clearing one currency's data does not affect others.

### Shared constants (`constants/`)

Application-wide data that multiple screens share. Import from the barrel:

```ts
import { CURRENCIES, DEFAULT_CATEGORIES, CATEGORY_COLORS, COMMON_TAGS } from '../constants';
```

| File | Exports |
|---|---|
| `currencies.ts` | `CURRENCIES` — the fixed list of 5 supported Currency objects |
| `categories.ts` | `DEFAULT_CATEGORIES` — the default built-in expense categories; `EMOJI_SUGGESTIONS` — 7 emoji picker suggestions; `CATEGORY_COLORS` — hex colors keyed by category name |
| `tags.ts` | `COMMON_TAGS` — 6 pre-defined tag strings |

Store-private storage keys (`LEGACY_BUDGET_KEY`, `LEGACY_EXPENSES_KEY`, etc.) stay in `store/index.ts` — they are implementation details, not shared constants.

**Constants rule**: **All named constants must live in `constants/`** — no exceptions. Constants used in only one file still belong there; the `constants/` folder is the single source of truth for every fixed value in the project. Pick the most relevant existing file (`categories.ts`, `currencies.ts`, `tags.ts`) or create a new feature-specific file (e.g. `charts.ts`, `limits.ts`). Do **not** inline magic numbers or shared strings directly in screen or component files.

### Utility helpers (`utils/`)

- **`expenses.ts`** — `sumAmount`, `expensesOn`, `expensesInMonth`, `byCategory`, `formatMoney`
- **`validation.ts`** — `sanitizeAmountInput` (formatting/cleaning), `validateAmountField` (range check), `AMOUNT_MIN` (0.01), `AMOUNT_MAX` (999,999); `sanitizeUserNameInput`, `validateUserName`, `USER_NAME_MAX` (40)
- **`storage.ts`** — `storeGet / storeSet / storeRemove / storeMultiRemove` abstraction
- **`backup.ts`** — `isValidBackup`, `migrateBackup`, `getBackupState`, `exportBackup`, `readBackupFile`, `persistBackupState`

### Chart components (`components/`)

Each chart type is its own component; `AnalyticsScreen` composes them rather than rendering chart primitives directly.

| File | Renders |
|---|---|
| `CategoryPieChart.tsx` | react-native-chart-kit PieChart for category breakdown |
| `DayDonutChart.tsx` | Custom SVG donut (react-native-svg) for per-day spending; owns `DAY_COLORS`, `polarToCartesian`, `arcPath` helpers |
| `MonthLineChart.tsx` | react-native-chart-kit LineChart for 6-month trend; owns `selectedPoint` state |

### Theming (`theme.ts` + `context/ThemeContext.tsx`)

- `theme.ts` exports `COLORS` (light), `DARK_COLORS`, `FONTS`, `SPACING`, `RADIUS` tokens. Primary: `#7c3aed`.
- `ThemeProvider` wraps the app in `app/_layout.tsx`; dark mode is persisted at `@pw/darkMode`.
- Screens use `const C = useColors()` and define styles as `useMemo(() => makeStyles(C), [C])` so they re-derive on theme toggle.

### Data model

```ts
Expense = {
  id: string,           // Date.now().toString() at creation
  amount: number,
  category: string,     // built-in or custom category name
  icon: string,         // emoji
  note: string,
  tags: string[],       // e.g. ['food', 'work', 'reimburse']
  date: string,         // ISO 8601
  receipt: string|null, // local file URI from expo-image-picker
  paymentType: string,  // e.g. 'Cash', 'Card', 'Online'
}
```

Built-in categories: Groceries, Dining, Coffee, Transport, Bills, Fun, Shopping, Health.
Supported currencies (fixed list in `constants/currencies.ts`): USD, THB, NPR, INR, CAD.

### Design conventions

The "stamped" card look uses `shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, shadowOpacity: 1` (hard shadow, no blur) on cards and the FAB — do not soften these. All interactive elements use `Pressable`, not `TouchableOpacity`.

**Safe area**: `SafeAreaProvider` is at the root (`app/_layout.tsx`). All screens must account for system insets:
- Tab screens use `const insets = useSafeAreaInsets()` and set `paddingBottom: (Platform.OS === 'ios' ? 96 : 86) + insets.bottom` on their root `View`.
- Stack screens (Settings, BackupRestore) use `paddingBottom: insets.bottom + 24` on their `ScrollView`.
- `CustomTabBar` positions itself at `bottom: (Platform.OS === 'ios' ? 28 : 18) + insets.bottom`.
- Never use hardcoded bottom padding that ignores `insets.bottom` — it will clip content on 3-button Android devices.

## API Integration Readiness

The architecture is designed so adding a backend is a service-layer swap, not a store rewrite:

- Each slice's CRUD actions can delegate to a `services/expenseService.ts` (etc.) instead of AsyncStorage — change the body, not the interface
- `BackupState` IS the API DTO shape — maps directly to `PUT /api/sync` or per-resource endpoints
- Auth would be a new `authSlice` + token in SecureStore; existing slices unchanged
- `profileImageBase64` in `BackupState` becomes `profileImageUrl` when cloud storage is wired; add a `migrate_v2_to_v3` function

# Khu₹truke — Expense Tracker (React Native / Expo)

A clean, production-ready React Native expense tracker: purple primary palette, big-logo Add/Edit, calendar-based Reports, donut + trend-card Analytics, dark mode, receipt capture, backup & restore, and persistent local storage — no backend required.

Built with Expo SDK 54 + TypeScript, targeting iOS and Android.

## Stack

- **Expo SDK 54** (`react-native@0.81.5`, `react@19.1.0`) + **TypeScript** (strict mode)
- **Expo Router** (file-based routing) — Stack + bottom tabs with a fully custom floating tab bar (center FAB); backed by React Navigation v6
- **Zustand** — global state split into slices (`store/slices/`); screens access state via `hooks/` only, never the store directly
- **expo-updates** — OTA force-update check on every launch
- **@react-native-async-storage/async-storage** — persists expenses (namespaced per currency), categories, and profile flags
- **expo-secure-store** — stores sensitive values (budget, profile image URI, dark mode preference)
- **react-native-chart-kit** + **react-native-svg** — pie, bar, line, and custom donut charts on the Analytics screen
- **react-native-safe-area-context** — proper iOS notch / Android system navigation bar handling
- **expo-image-picker** — receipt capture from camera or photo library
- **expo-file-system** (v19 `File`/`Paths` API) — backup file read/write
- **expo-sharing** — share backup JSON via system share sheet
- **expo-document-picker** — pick a backup `.json` file from device storage

## Run it

```bash
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android, or scan the QR code with the **Expo Go** app.

```bash
npx tsc --noEmit        # type-check
npx expo install --fix  # realign native module versions if needed
```

EAS cloud builds (requires `eas-cli`):

```bash
eas build --profile preview --platform android   # APK for sideloading
eas build --profile testing --platform android   # internal distribution APK
```

## Screens

| # | Screen | Route | Notes |
|---|---|---|---|
| 1 | **Onboarding** | `(auth)/onboarding` | Logo hero + CTA. Skip or Get Started both proceed. Re-triggerable via Profile → Log out. |
| 2 | **Setup** | `(auth)/setup` | Name + currency picker. Runs once, skipped for returning users. |
| 3 | **Home** | `(tabs)/index` | Budget hero card, quick stats (today / week / daily avg with tooltip), recent + all expenses toggle. |
| 4 | **Reports** | `(tabs)/reports` | Calendar month grid with per-day spending heatmap. Tap a day to drill in. |
| 5 | **Add / Edit** | `add-edit` | Amount input (comma-formatted, max 999,999), category strip, note, tag chips, receipt scan/upload. Edit mode adds delete. |
| 6 | **Analytics** | `(tabs)/analytics` | Swipeable category pie + day donut chart, line chart (6-month trend), category trend cards. |
| 7 | **Profile** | `(tabs)/profile` | Avatar (tap for action sheet: view/take/gallery/remove), username editing (pencil icon), monthly budget editor (hidden-input, tap to open keyboard), dark mode toggle, currency switcher, CSV export, logout. |
| 8 | **Manage Categories** | `manage-categories` | Manage custom categories, clear data per currency. |
| 9 | **Backup & Restore** | `backup-restore` | Export full state as `.json`; import and restore on any device. |

## Navigation map

File-based routes under `app/`:

```
app/
├── index             (entry — OTA check + redirect to initial route)
├── (auth)/
│   ├── onboarding    (first launch only)
│   └── setup         (after onboarding, before first use)
├── (tabs)/
│   ├── index         (Home tab)
│   ├── reports
│   ├── analytics
│   └── profile
├── add-edit          (modal, slides from bottom — FAB or tap a transaction)
├── manage-categories (pushed from Profile → Manage categories)
└── backup-restore    (pushed from Profile → Backup & Restore)
```

Initial route logic (after store `initialize()` completes):
```
isUserConfigured  →  /(tabs)
!isUserConfigured && onboarded  →  /(auth)/setup
neither  →  /(auth)/onboarding
```

`isUserConfigured = !!userName || setup || Object.values(expenses).some(a => a.length > 0)`

The center **+** FAB is not a tab — it's a custom bar button that pushes `/add-edit` as a modal so it slides up over everything.

## Data model

```ts
type Expense = {
  id: string;             // Date.now().toString() at creation
  amount: number;
  category: string;       // built-in or custom category name
  icon: string;           // emoji
  note: string;
  tags: string[];         // e.g. ['food', 'work', 'reimburse']
  date: string;           // ISO 8601
  receipt: string | null; // local file URI from expo-image-picker
  paymentType: string;    // e.g. 'Cash', 'Card', 'Online'
}
```

Built-in categories: Groceries, Dining, Coffee, Transport, Bills, Fun, Shopping, Health. Users can add custom categories (emoji + name) via Settings.

Supported currencies: USD, THB, NPR, INR, CAD. Expenses and budgets are **siloed per currency** — switching currency loads a separate bucket; clearing one does not affect others.

### Storage keys

| Key | Backend | Holds |
|---|---|---|
| `@pw/expenses:<CODE>` | AsyncStorage | expense array for that currency |
| `@pw/budget:<CODE>` | SecureStore | monthly budget for that currency |
| `@pw/categories` | AsyncStorage | custom category list |
| `@pw/builtInCategories` | AsyncStorage | modified built-in categories |
| `@pw/userName` | AsyncStorage | display name |
| `@pw/currency` | AsyncStorage | active currency object |
| `@pw/onboarded` / `@pw/setup` | AsyncStorage | flow completion flags |
| `@pw/joinedAt` | AsyncStorage | ISO date of first launch |
| `@pw/profileImage` | SecureStore | profile photo URI |
| `@pw/darkMode` | SecureStore | `"1"` when dark mode is on |

## Project layout

```
Khu₹truke/
├── app/                           # Expo Router file-based routes (screen code lives here)
│   ├── _layout.tsx                # root layout — providers, SplashScreen, Stack config
│   ├── index.tsx                  # entry — OTA update check + initial redirect
│   ├── (auth)/
│   │   ├── _layout.tsx            # passthrough Stack for auth screens
│   │   ├── onboarding.tsx
│   │   └── setup.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx            # tab layout with custom floating tab bar
│   │   ├── index.tsx              # Home tab
│   │   ├── reports.tsx
│   │   ├── analytics.tsx
│   │   └── profile.tsx
│   ├── add-edit.tsx               # AddEdit modal route
│   ├── manage-categories.tsx      # Manage categories route
│   └── backup-restore.tsx         # Backup & Restore route
├── store/
│   ├── index.ts                   # composes all slices; exports useAppStore + types
│   ├── storeTypes.ts              # all slice + store types (no circular deps)
│   └── slices/
│       ├── userSlice.ts           # userName, profileImage, currency, onboarded, setup, joinedAt
│       ├── expenseSlice.ts        # expenses: Record<string, Expense[]> + CRUD
│       ├── budgetSlice.ts         # budgets: Record<string, number> + saveBudget
│       ├── categorySlice.ts       # customCategories, builtInCategories + CRUD
│       └── backupSlice.ts         # exportBackup, importBackup
├── hooks/
│   ├── useExpenses.ts             # expenses (active currency), allExpensesRecord, CRUD
│   ├── useUserProfile.ts          # userName, currency, profileImage, isUserConfigured, actions
│   ├── useCategories.ts           # customCategories, builtInCategories, allCategories, actions
│   ├── useBudget.ts               # budget, budgets, saveBudget, clear
│   └── useBackup.ts               # exportBackup, importBackup
├── types/
│   └── index.ts                   # Currency, Category, Expense, BackupState, BackupDataV2
├── theme.ts                       # COLORS, DARK_COLORS, FONTS, SPACING, RADIUS
├── context/
│   └── ThemeContext.tsx            # ThemeProvider, useColors(), useTheme()
├── constants/
│   ├── currencies.ts              # CURRENCIES — 5 supported currency objects
│   ├── categories.ts              # DEFAULT_CATEGORIES, EMOJI_SUGGESTIONS, CATEGORY_COLORS
│   ├── tags.ts                    # COMMON_TAGS — 6 pre-defined tag strings
│   └── index.ts                   # barrel re-export
├── utils/
│   ├── expenses.ts                # sumAmount, expensesOn, expensesInMonth, byCategory, formatMoney
│   ├── validation.ts              # sanitizeAmountInput, validateAmountField, AMOUNT_MIN, AMOUNT_MAX
│   ├── storage.ts                 # storeGet/storeSet abstraction (AsyncStorage ↔ SecureStore)
│   └── backup.ts                  # isValidBackup, exportBackup, importBackup, persistBackupState
├── components/
│   ├── CustomTabBar.tsx           # floating tab bar with center FAB (safe-area aware)
│   ├── ScreenHeader.tsx           # large title + purple underline (safe-area aware)
│   ├── StatCard.tsx               # small stat tile (supports tooltip modal)
│   ├── CategoryPieChart.tsx       # pie chart — category breakdown
│   ├── DayDonutChart.tsx          # SVG donut chart — per-day spending
│   ├── MonthLineChart.tsx         # line chart — 6-month trend
│   ├── Logo.tsx                   # ₹ squircle logo mark
│   ├── Chip.tsx                   # tag pill (pressable or static)
│   └── LegalModal.tsx             # reusable legal/info modal
├── app.json                       # Expo config (slug: khutruke, scheme: khutruke)
├── tsconfig.json                  # extends expo/tsconfig.base, strict: true
└── eas.json                       # EAS build profiles (preview, testing APKs)
```

## State management

Global state is split into Zustand slices under `store/slices/`. Screens never import the store directly — all state access goes through the `hooks/` layer.

```ts
// State shape (simplified)
userName: string
profileImage: string | null
currency: Currency
onboarded: boolean
setup: boolean
joinedAt: string

expenses: Record<string, Expense[]>  // all currencies in memory, keyed by code
budgets:  Record<string, number>     // all currencies in memory, keyed by code
customCategories: Category[]
builtInCategories: Category[]
ready: boolean                       // true after initialize() completes
```

`initialize()` in `store/index.ts` runs once on app launch (inside `SplashGate`): loads all persisted state in two parallel phases, then sets `ready: true` to dismiss the native splash screen.

## Backup & Restore

The backup file IS the Zustand state — no transformation needed.

- **Export**: Reads full store state + profile image as base64, writes a `BackupDataV2` JSON file, opens system share sheet.
- **Import**: User picks a `.json` file, validates structure, writes all fields back to AsyncStorage/SecureStore, hydrates the store directly.

## Theme

| Token | Light | Dark |
|---|---|---|
| `purple` | `#7c3aed` | `#8b5cf6` |
| `purpleDark` | `#5b21b6` | `#c4b5fd` |
| `purpleSoft` | `#ede9fe` | `#2d1b69` |
| `ink` | `#1a1a1a` | `#f5f5f5` |
| `paper` | `#fafaf7` | `#0b0b0d` |

The "stamped" card look uses `shadowOffset: {width: 2, height: 2}` with `shadowRadius: 0` (hard shadow, no blur) on cards and the FAB. All screens consume the active palette via `const C = useColors()` and rebuild styles with `useMemo(() => makeStyles(C), [C])` on theme toggle.

## Next steps

- **Real auth** — swap the logout/onboarding flag for Supabase / Firebase / Clerk.
- **Push notifications** — `expo-notifications` for budget-threshold alerts (75 %, 90 %, 100 %).
- **Custom fonts** — load `Caveat` or `Kalam` via `expo-font`; `FONTS.hand` in `theme.ts` already points to the slot.

## License

MIT. Use it, fork it, ship it.

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
- **State management**: Zustand (`useAppStore`) — single store in `store.ts`, persisted via AsyncStorage and expo-secure-store — no server, local-first
- **Styling**: StyleSheet API (NativeWind is NOT used in this project)
- **Charts**: react-native-chart-kit + react-native-svg (donut/pie, bar, line charts)
- **Type safety**: TypeScript strict mode — `tsconfig.json` extends `expo/tsconfig.base`
- **Image handling**: expo-image-picker (receipt capture from camera or photo library)
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
├── _layout.tsx      # Root layout — providers, SplashScreen gate, Stack screen config
├── index.tsx        # Entry — OTA update check + initial redirect
├── (auth)/
│   ├── _layout.tsx  # Passthrough Stack for auth screens
│   ├── onboarding.tsx
│   └── setup.tsx
├── (tabs)/
│   ├── _layout.tsx  # Bottom tab layout using CustomTabBar
│   ├── index.tsx    # Home tab
│   ├── reports.tsx
│   ├── analytics.tsx
│   └── profile.tsx
├── add-edit.tsx     # Modal (presentation: modal, animation: slide_from_bottom)
└── settings.tsx     # Pushed from Profile → Manage categories
```

Initial route logic in `app/index.tsx` (runs after all data is loaded):
```
isUserConfigured  →  "/(tabs)"
!isUserConfigured && onboarded  →  "/(auth)/setup"
neither  →  "/(auth)/onboarding"
```
`isUserConfigured = !!userName || setupDone || hasAnyExpenses` — returning users skip the flow.

- `SplashScreen.preventAutoHideAsync()` keeps the native splash visible in `app/_layout.tsx` until the store's `initialize()` completes and sets `ready: true`.
- OTA force-update check runs in `app/index.tsx` via `expo-updates`.
- Screens use `useRouter()` from `expo-router` for all navigation. Editing an expense passes only `expense.id` as a URL param (`/add-edit?id=<id>`); AddEditScreen looks it up from `useAppStore().expenses`.

### State management

All global state lives in a single Zustand store exported as **`useAppStore`** from `store.ts`. Screens consume it with `const { expenses, budget, ... } = useAppStore()`.

`app/_layout.tsx` renders a `SplashGate` component that calls `useAppStore.getState().initialize()` once on mount. `initialize()` loads all data from storage in two sequential phases (profile first, then budget + expenses + categories), then sets `ready: true` which triggers `SplashScreen.hideAsync()`.

**Currency change**: `saveCurrency(code)` updates the store immediately and reloads the budget and expenses for the new currency bucket. A guard (`get().currency.code !== activeCode`) prevents stale writes if the user switches currencies quickly.

The `hooks/` directory has been deleted — its three files (`useUserProfile`, `useExpenses`, `useCustomCategories`) are fully absorbed into the Zustand store.

### Storage layer (`utils/storage.ts`)

A thin `storeGet / storeSet / storeRemove / storeMultiRemove` abstraction routes keys between two backends:

- **`expo-secure-store`** (encrypted): `@pw/budget`, `@pw/profileImage`, `@pw/darkMode`
- **`AsyncStorage`**: everything else

Both backends contain one-time migration logic that silently moves data when a key's home changes — reads old location, writes to new, deletes old.

Storage key conventions:
- `@pw/expenses:<CURRENCY_CODE>` — per-currency expense arrays (e.g. `@pw/expenses:USD`)
- `@pw/budget:<CURRENCY_CODE>` — per-currency monthly budget
- `@pw/categories` — custom category list
- `@pw/userName`, `@pw/currency`, `@pw/onboarded`, `@pw/setup` — profile flags

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

Store-private storage keys (`LEGACY_BUDGET_KEY`, `LEGACY_EXPENSES_KEY`, `FLAG`, etc.) stay in `store.ts` — they are implementation details, not shared constants.

**Constants rule**: **All named constants must live in `constants/`** — no exceptions. Constants used in only one file still belong there; the `constants/` folder is the single source of truth for every fixed value in the project. Pick the most relevant existing file (`categories.ts`, `currencies.ts`, `tags.ts`) or create a new feature-specific file (e.g. `charts.ts`, `limits.ts`). Do **not** inline magic numbers or shared strings directly in screen or component files.

### Utility helpers (`utils/`)

- **`expenses.ts`** — `sumAmount`, `expensesOn`, `expensesInMonth`, `byCategory`, `formatMoney`
- **`validation.ts`** — `sanitizeAmountInput` (formatting/cleaning), `validateAmountField` (range check), `AMOUNT_MIN` (0.01), `AMOUNT_MAX` (999,999)
- **`storage.ts`** — `storeGet / storeSet / storeRemove / storeMultiRemove` abstraction

### Chart components (`components/`)

Each chart type is its own component; `AnalyticsScreen` composes them rather than rendering chart primitives directly.

| File | Renders |
|---|---|
| `CategoryPieChart.tsx` | react-native-chart-kit PieChart for category breakdown |
| `DayDonutChart.tsx` | Custom SVG donut (react-native-svg) for per-day spending; owns `DAY_COLORS`, `polarToCartesian`, `arcPath` helpers |
| `SpendingBarChart.tsx` | react-native-chart-kit BarChart for last-7-days spend |
| `MonthLineChart.tsx` | react-native-chart-kit LineChart for 6-month trend; owns `selectedPoint` state |

### Theming (`theme.ts` + `context/ThemeContext.tsx`)

- `theme.ts` exports `COLORS` (light), `DARK_COLORS`, `FONTS`, `SPACING`, `RADIUS` tokens. Primary: `#7c3aed`.
- `ThemeProvider` wraps the app in `app/_layout.tsx`; dark mode is persisted at `@pw/darkMode`.
- Screens use `const C = useColors()` and define styles as `useMemo(() => makeStyles(C), [C])` so they re-derive on theme toggle.

### Data model

```js
Expense = {
  id: string,          // Date.now().toString() at creation
  amount: number,
  category: string,    // built-in or custom category name
  icon: string,        // emoji
  note: string,
  tags: string[],      // e.g. ['food', 'work', 'reimburse']
  date: string,        // ISO 8601
  receipt: string|null // local file URI from expo-image-picker
}
```

Built-in categories: Groceries, Dining, Coffee, Transport, Bills, Fun, Shopping, Health.
Supported currencies (fixed list in `constants/currencies.ts`): USD, THB, NPR, INR, CAD.

### Design conventions

The "stamped" card look uses `shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, shadowOpacity: 1` (hard shadow, no blur) on cards and the FAB — do not soften these. All interactive elements use `Pressable`, not `TouchableOpacity`.

**Safe area**: `SafeAreaProvider` is at the root (`app/_layout.tsx`). All screens must account for system insets:
- Tab screens use `const insets = useSafeAreaInsets()` and set `paddingBottom: (Platform.OS === 'ios' ? 96 : 86) + insets.bottom` on their root `View`.
- Stack screens (Settings) use `paddingBottom: insets.bottom + 24` on their `ScrollView`.
- `CustomTabBar` positions itself at `bottom: (Platform.OS === 'ios' ? 28 : 18) + insets.bottom`.
- Never use hardcoded bottom padding that ignores `insets.bottom` — it will clip content on 3-button Android devices.

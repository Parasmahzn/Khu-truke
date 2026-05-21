# Khu₹truke CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cross-platform expense tracker app built with Expo SDK 54 + TypeScript (strict mode).
Targets iOS and Android. Primary audience: daily-life users aged 20–40.
App category: productivity / lifestyle. Local-first — no backend, no auth server.

App is named **Khu₹truke**. npm package name is `khutruke`.

## Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81.5, React 19.1.0)
- **Navigation**: React Navigation v6 — native stack + bottom tabs with a fully custom floating tab bar (center FAB)
- **State management**: React Context (`ExpenseContext`) + three custom hooks, persisted via AsyncStorage and expo-secure-store — no server, local-first
- **Styling**: StyleSheet API (NativeWind is NOT used in this project)
- **Charts**: react-native-chart-kit + react-native-svg (donut/pie and bar charts)
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

`"main": "node_modules/expo/AppEntry.js"` in `package.json` — standard Expo entry point. The root component is `App.tsx` in the project root (not a file-system router). Navigation, providers, and the custom tab bar are all defined there.

## Platform note

Development happens on Windows (PowerShell). iOS builds require a Mac or EAS Build; Android and web can be exercised locally.

## Architecture

### Navigation types (`src/navigation/types.ts`)

Navigation param lists and screen prop types are centralised here:
- `RootStackParamList` — Onboarding, Setup, Main, AddEdit (accepts `{ expense?: Expense }`), Settings
- `MainTabParamList` — Home, Reports, Analytics, Profile
- `RootStackScreenProps<T>` — screen props helper for root stack screens
- `TabScreenProps<T>` — composite screen props for tab screens (gives access to both tab and root stack navigators)

### Navigation (`App.tsx`)

Two navigators are composed in `App.tsx`:

- **Root `NativeStack`**: `Onboarding` → `Setup` → `Main` → `AddEdit` (modal, slides from bottom) → `Settings`
- **`MainTabs` (BottomTabNavigator)**: `Home`, `Reports`, `Analytics`, `Profile` — rendered with a custom `CustomTabBar` component that has a center FAB wired to `navigation.navigate("AddEdit")`

Initial route logic on launch:
```
isUserConfigured  →  "Main"
!isUserConfigured && onboarded  →  "Setup"
neither  →  "Onboarding"
```
`isUserConfigured = !!userName || setupDone || hasAnyExpenses` — returning users with any persisted data skip the flow even if setup flags are missing.

### State management

All global state lives in a single **`ExpenseContext`** (`src/store.ts`). The context value is composed in `App.tsx` from three hooks and passed down via `ExpenseContext.Provider`. Screens consume it with `useContext(ExpenseContext)`.

| Hook | File | Owns |
|---|---|---|
| `useUserProfile()` | `src/hooks/useUserProfile.ts` | `userName`, `profileImage`, `currency`, `budget`, `onboarded`, `setupDone` |
| `useExpenses(currencyCode)` | `src/hooks/useExpenses.ts` | `expenses[]` for the active currency |
| `useCustomCategories()` | `src/hooks/useCustomCategories.ts` | `customCategories[]` |

**Critical ordering**: `useExpenses` is gated on `profileReady` so the active currency is restored from storage before expenses load — prevents migrating legacy data into the wrong currency bucket.

### Storage layer (`src/storage.ts`)

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

### Shared constants (`src/constants/`)

Application-wide data that multiple screens or hooks share. Import from the barrel:

```ts
import { CURRENCIES, BUILT_IN_CATEGORIES, CATEGORY_COLORS, COMMON_TAGS, MONTHS } from '../constants';
```

| File | Exports |
|---|---|
| `currencies.ts` | `CURRENCIES` — the fixed list of 5 supported Currency objects |
| `categories.ts` | `BUILT_IN_CATEGORIES` — 8 built-in expense categories; `EMOJI_SUGGESTIONS` — 7 emoji picker suggestions; `CATEGORY_COLORS` — hex colors keyed by category name |
| `tags.ts` | `COMMON_TAGS` — 6 pre-defined tag strings |
| `time.ts` | `MONTHS` — 12 full month name strings |

Hook-private storage keys (`LEGACY_KEY`, `FLAG`, `KEY`, etc.) stay in their respective hook files — they are implementation details, not shared constants.

### Theming (`src/theme.ts` + `src/ThemeContext.tsx`)

- `src/theme.ts` exports `COLORS` (light), `DARK_COLORS`, `FONTS`, `SPACING`, `RADIUS` tokens. Primary: `#7c3aed`.
- `ThemeProvider` wraps the app in `App.tsx`; dark mode is persisted at `@pw/darkMode`.
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
Supported currencies (fixed list in `src/constants/currencies.ts`): USD, THB, NPR, INR, CAD.

### Utility helpers (`src/store.ts`)

- `sumAmount(list)` — total spend
- `expensesOn(list, dateObj)` — filter to a single day
- `expensesInMonth(list, year, month)` — filter to a month
- `byCategory(list)` — `[{ name, value }]` sorted descending
- `formatMoney(n, withCents?)` — thousands-formatted string

### Design conventions

The "stamped" card look uses `shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, shadowOpacity: 1` (hard shadow, no blur) on cards and the FAB — do not soften these. All interactive elements use `Pressable`, not `TouchableOpacity`.

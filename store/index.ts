import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeGet, storeSet, storeRemove } from '../utils/storage';
import { CURRENCIES, DEFAULT_CATEGORIES, CHART_CUSTOM_PALETTE, COMMON_TAGS } from '../constants';
import type { Expense, Category } from '../types';
import type { AppStore } from './storeTypes';
import { createUserSlice } from './slices/userSlice';
import { createExpenseSlice } from './slices/expenseSlice';
import { createBudgetSlice } from './slices/budgetSlice';
import { createCategorySlice } from './slices/categorySlice';
import { createTagSlice } from './slices/tagSlice';
import { createBackupSlice } from './slices/backupSlice';

const FLAG = '1';
const isOn = (raw: string | null) => raw === FLAG;
const budgetKeyFor = (code: string) => `@pw/budget:${code}`;
const expensesKeyFor = (code: string) => `@pw/expenses:${code}`;
const LEGACY_BUDGET_KEY = '@pw/budget';
const LEGACY_EXPENSES_KEY = '@pw/expenses';
const SYNTHETIC_ID = /^s\d+$/;

export const useAppStore = create<AppStore>()((...args) => {
  const [set, get] = args;

  return {
    ready: false,

    initialize: async () => {
      if (get().ready) return;
      try {
        // Phase 1: load profile fields in parallel
        const [n, o, s, c, img, allKeys] = await Promise.all([
          storeGet('@pw/userName').catch(() => null),
          storeGet('@pw/onboarded').catch(() => null),
          storeGet('@pw/setup').catch(() => null),
          storeGet('@pw/currency').catch(() => null),
          storeGet('@pw/profileImage').catch(() => null),
          AsyncStorage.getAllKeys().catch(() => [] as readonly string[]),
        ]);

        const foundCurrency = c ? (CURRENCIES.find((x) => x.code === c) ?? CURRENCIES[0]) : CURRENCIES[0];
        const setupDone = isOn(s);

        // Check whether any expenses exist (for joinedAt fallback)
        const expenseKeys = [...allKeys].filter(
          (k) => k === '@pw/expenses' || k.startsWith('@pw/expenses:'),
        );
        let hasAnyExpenses = false;
        for (const k of expenseKeys) {
          const raw = await AsyncStorage.getItem(k).catch(() => null);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) { hasAnyExpenses = true; break; }
          } catch {}
        }

        set({
          userName: n ?? '',
          profileImage: img ?? null,
          currency: foundCurrency,
          onboarded: isOn(o),
          setup: setupDone,
        });

        // Phase 2: load ALL currencies' expenses + budgets, then categories
        const activeCode = foundCurrency.code;
        try {
          const currencyResults = await Promise.all(
            CURRENCIES.map(async (cur) => {
              const code = cur.code;

              // Expenses — legacy migration only for the active currency
              let expRaw = await AsyncStorage.getItem(expensesKeyFor(code)).catch(() => null);
              if (expRaw === null && code === activeCode) {
                const legacy = await AsyncStorage.getItem(LEGACY_EXPENSES_KEY).catch(() => null);
                if (legacy !== null) {
                  await AsyncStorage.setItem(expensesKeyFor(code), legacy).catch(() => {});
                  await AsyncStorage.removeItem(LEGACY_EXPENSES_KEY).catch(() => {});
                  expRaw = legacy;
                }
              }

              // Budget — legacy migration only for the active currency
              let budgetRaw = await storeGet(budgetKeyFor(code)).catch(() => null);
              if (budgetRaw === null && code === activeCode) {
                const legacy = await storeGet(LEGACY_BUDGET_KEY).catch(() => null);
                if (legacy !== null) {
                  await storeSet(budgetKeyFor(code), legacy).catch(() => {});
                  await storeRemove(LEGACY_BUDGET_KEY).catch(() => {});
                  budgetRaw = legacy;
                }
              }

              return { code, expRaw, budgetRaw };
            }),
          );

          const expenses: Record<string, Expense[]> = {};
          const budgets: Record<string, number> = {};

          for (const { code, expRaw, budgetRaw } of currencyResults) {
            let exps: Expense[] = [];
            if (expRaw) {
              const parsed: Expense[] = JSON.parse(expRaw);
              const cleaned = parsed.filter((x) => !SYNTHETIC_ID.test(x.id));
              if (cleaned.length < parsed.length) {
                AsyncStorage.setItem(expensesKeyFor(code), JSON.stringify(cleaned)).catch(() => {});
              }
              exps = cleaned;
            }
            expenses[code] = exps;
            budgets[code] = budgetRaw ? parseFloat(budgetRaw) || 0 : 0;
          }

          // Categories + tags
          const [catRaw, builtInCatRaw, tagsRaw, builtInTagsRaw] = await Promise.all([
            AsyncStorage.getItem('@pw/categories'),
            AsyncStorage.getItem('@pw/builtInCategories'),
            AsyncStorage.getItem('@pw/customTags'),
            AsyncStorage.getItem('@pw/builtInTags'),
          ]);

          let customCategories: Category[] = catRaw ? JSON.parse(catRaw) : [];
          if (customCategories.some((cat) => !cat.color)) {
            customCategories = customCategories.map((cat) => {
              if (cat.color) return cat;
              const used = new Set(customCategories.map((x) => x.color).filter(Boolean));
              return { ...cat, color: CHART_CUSTOM_PALETTE.find((p) => !used.has(p)) ?? CHART_CUSTOM_PALETTE[0] };
            });
            AsyncStorage.setItem('@pw/categories', JSON.stringify(customCategories)).catch(() => {});
          }

          // joinedAt
          const joinedRaw = await AsyncStorage.getItem('@pw/joinedAt');
          let joinedAt = joinedRaw ?? '';
          const activeExps = expenses[activeCode] ?? [];
          if (!joinedAt && activeExps.length > 0) {
            joinedAt = activeExps
              .reduce((min, x) => (x.date < min ? x.date : min), activeExps[0].date)
              .slice(0, 10);
            AsyncStorage.setItem('@pw/joinedAt', joinedAt).catch(() => {});
          } else if (!joinedAt && (n || setupDone || hasAnyExpenses)) {
            joinedAt = new Date().toISOString().slice(0, 10);
            AsyncStorage.setItem('@pw/joinedAt', joinedAt).catch(() => {});
          }

          set({
            expenses,
            budgets,
            customCategories,
            builtInCategories: builtInCatRaw ? JSON.parse(builtInCatRaw) : DEFAULT_CATEGORIES,
            customTags: tagsRaw ? JSON.parse(tagsRaw) : [],
            builtInTags: builtInTagsRaw ? JSON.parse(builtInTagsRaw) : COMMON_TAGS,
            joinedAt,
          });
        } catch {
          // Phase 2 failure — data stays at initialised defaults
        }
      } catch {
        // Phase 1 failure
      } finally {
        set({ ready: true });
      }
    },

    ...createUserSlice(...args),
    ...createExpenseSlice(...args),
    ...createBudgetSlice(...args),
    ...createCategorySlice(...args),
    ...createTagSlice(...args),
    ...createBackupSlice(...args),
  };
});

// Re-export types so `import type { Category } from '../store'` continues to work
export type { Currency, Category, Expense, BackupData, BackupDataV2, BackupState } from '../types';

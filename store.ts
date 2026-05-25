import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as FSFile, Paths } from 'expo-file-system';
import { storeGet, storeSet, storeRemove } from './utils/storage';
import { CURRENCIES } from './constants';

export type Currency = { code: string; symbol: string; label: string };
export type Category = { name: string; icon: string };
export type Expense = {
  id: string;
  amount: number;
  category: string;
  icon: string;
  note: string;
  tags: string[];
  date: string;
  receipt: string | null;
};

// private helpers
const FLAG = '1';
const isOn = (raw: string | null) => raw === FLAG;
const budgetKeyFor = (code: string) => `@pw/budget:${code}`;
const expensesKeyFor = (code: string) => `@pw/expenses:${code}`;
const LEGACY_BUDGET_KEY = '@pw/budget';
const LEGACY_EXPENSES_KEY = '@pw/expenses';
const SYNTHETIC_ID = /^s\d+$/;

type AppStore = {
  ready: boolean;
  expenses: Expense[];
  userName: string;
  profileImage: string | null;
  currency: Currency;
  budget: number;
  onboarded: boolean;
  isUserConfigured: boolean;
  customCategories: Category[];

  initialize: () => Promise<void>;
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  clearExpensesForCurrency: (code: string) => Promise<void>;
  countExpensesForCurrency: (code: string) => Promise<number>;
  saveProfileImage: (uri: string | null) => Promise<void>;
  saveCurrency: (code: string) => Promise<void>;
  saveBudget: (val: number) => Promise<void>;
  clearBudgetForCurrency: (code: string) => Promise<void>;
  markOnboarded: () => Promise<void>;
  completeSetup: (name: string, currencyCode: string) => Promise<void>;
  addCustomCategory: (cat: Category) => Promise<void>;
  removeCustomCategory: (name: string) => Promise<void>;
  updateCustomCategory: (oldName: string, updated: Category) => Promise<void>;
};

export const useAppStore = create<AppStore>()((set, get) => ({
  ready: false,
  expenses: [],
  userName: '',
  profileImage: null,
  currency: CURRENCIES[0],
  budget: 0,
  onboarded: false,
  isUserConfigured: false,
  customCategories: [],

  initialize: async () => {
    if (get().ready) return;
    try {
      // Phase 1: load profile fields in parallel — individual .catch so a single
      // SecureStore/AsyncStorage failure doesn't abort the whole phase
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

      let hasAnyExpenses = false;
      const expenseKeys = [...allKeys].filter(
        (k) => k === '@pw/expenses' || k.startsWith('@pw/expenses:'),
      );
      for (const k of expenseKeys) {
        const raw = await AsyncStorage.getItem(k).catch(() => null);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) { hasAnyExpenses = true; break; }
        } catch {}
      }

      const isUserConfigured = !!(n) || setupDone || hasAnyExpenses;

      set({
        userName: n || '',
        profileImage: img || null,
        currency: foundCurrency,
        onboarded: isOn(o),
        isUserConfigured,
      });

      // Phase 2: load budget, categories, expenses — isolated so failures
      // don't lose the Phase 1 state already written above
      const activeCode = foundCurrency.code;
      try {
        const [budgetRaw, catRaw, expRaw] = await Promise.all([
          (async () => {
            let raw = await storeGet(budgetKeyFor(activeCode));
            if (raw === null) {
              const legacy = await storeGet(LEGACY_BUDGET_KEY);
              if (legacy !== null) {
                await storeSet(budgetKeyFor(activeCode), legacy).catch(() => {});
                await storeRemove(LEGACY_BUDGET_KEY).catch(() => {});
                raw = legacy;
              }
            }
            return raw;
          })(),
          AsyncStorage.getItem('@pw/categories'),
          (async () => {
            let raw = await AsyncStorage.getItem(expensesKeyFor(activeCode));
            if (raw === null) {
              const legacy = await AsyncStorage.getItem(LEGACY_EXPENSES_KEY);
              if (legacy !== null) {
                await AsyncStorage.setItem(expensesKeyFor(activeCode), legacy).catch(() => {});
                await AsyncStorage.removeItem(LEGACY_EXPENSES_KEY).catch(() => {});
                raw = legacy;
              }
            }
            return raw;
          })(),
        ]);

        if (get().currency.code !== activeCode) return;

        let expenses: Expense[] = [];
        if (expRaw) {
          const parsed: Expense[] = JSON.parse(expRaw);
          const cleaned = parsed.filter((x) => !SYNTHETIC_ID.test(x.id));
          if (cleaned.length < parsed.length) {
            AsyncStorage.setItem(expensesKeyFor(activeCode), JSON.stringify(cleaned)).catch(() => {});
          }
          expenses = cleaned;
        }

        set({
          budget: budgetRaw ? parseFloat(budgetRaw) || 0 : 0,
          customCategories: catRaw ? JSON.parse(catRaw) : [],
          expenses,
        });
      } catch {
        // Phase 2 failure — budget/expenses/categories stay at defaults
      }
    } catch {
      // Phase 1 failure — isUserConfigured stays false, ready fires via finally
    } finally {
      set({ ready: true });
    }
  },

  addExpense: (exp) => {
    const next = [{ ...exp, id: Date.now().toString() }, ...get().expenses];
    set({ expenses: next });
    AsyncStorage.setItem(expensesKeyFor(get().currency.code), JSON.stringify(next)).catch(() => {});
  },

  updateExpense: (id, patch) => {
    const next = get().expenses.map((x) => (x.id === id ? { ...x, ...patch } : x));
    set({ expenses: next });
    AsyncStorage.setItem(expensesKeyFor(get().currency.code), JSON.stringify(next)).catch(() => {});
  },

  deleteExpense: (id) => {
    const next = get().expenses.filter((x) => x.id !== id);
    set({ expenses: next });
    AsyncStorage.setItem(expensesKeyFor(get().currency.code), JSON.stringify(next)).catch(() => {});
  },

  clearExpensesForCurrency: async (code) => {
    if (!code) return;
    await AsyncStorage.removeItem(expensesKeyFor(code)).catch(() => {});
    if (get().currency.code === code) set({ expenses: [] });
  },

  countExpensesForCurrency: async (code) => {
    if (!code) return 0;
    try {
      const raw = await AsyncStorage.getItem(expensesKeyFor(code));
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  },

  saveProfileImage: async (uri) => {
    const prev = get().profileImage;

    if (uri) {
      // Copy into documentDirectory so the file survives OS cache clears
      let finalUri = uri;
      try {
        const dest = new FSFile(Paths.document, `profile_${Date.now()}.jpg`);
        new FSFile(uri).copy(dest);
        finalUri = dest.uri;
      } catch {
        // copy failed — use original URI (works for this session at least)
      }
      set({ profileImage: finalUri });
      await storeSet('@pw/profileImage', finalUri).catch(() => {});
      // Delete previous permanent file after the new one is saved
      if (prev) { try { new FSFile(prev).delete(); } catch {} }
    } else {
      set({ profileImage: null });
      await storeRemove('@pw/profileImage').catch(() => {});
      if (prev) { try { new FSFile(prev).delete(); } catch {} }
    }
  },

  saveCurrency: async (code) => {
    const found = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
    set({ currency: found });
    try { await storeSet('@pw/currency', found.code); } catch {}

    const activeCode = found.code;
    try {
      const [budgetRaw, expRaw] = await Promise.all([
        (async () => {
          let raw = await storeGet(budgetKeyFor(activeCode));
          if (raw === null) {
            const legacy = await storeGet(LEGACY_BUDGET_KEY);
            if (legacy !== null) {
              await storeSet(budgetKeyFor(activeCode), legacy).catch(() => {});
              await storeRemove(LEGACY_BUDGET_KEY).catch(() => {});
              raw = legacy;
            }
          }
          return raw;
        })(),
        AsyncStorage.getItem(expensesKeyFor(activeCode)),
      ]);

      if (get().currency.code !== activeCode) return;

      let expenses: Expense[] = [];
      if (expRaw) {
        const parsed: Expense[] = JSON.parse(expRaw);
        expenses = parsed.filter((x) => !SYNTHETIC_ID.test(x.id));
      }
      set({ budget: budgetRaw ? parseFloat(budgetRaw) || 0 : 0, expenses });
    } catch {}
  },

  saveBudget: async (val) => {
    const code = get().currency.code;
    set({ budget: val });
    try { await storeSet(budgetKeyFor(code), String(val)); } catch {}
  },

  clearBudgetForCurrency: async (code) => {
    if (!code) return;
    try { await storeRemove(budgetKeyFor(code)); } catch {}
    if (get().currency.code === code) set({ budget: 0 });
  },

  markOnboarded: async () => {
    set({ onboarded: true });
    await storeSet('@pw/onboarded', FLAG).catch(() => {});
  },

  completeSetup: async (name, currencyCode) => {
    const found = CURRENCIES.find((x) => x.code === currencyCode) || CURRENCIES[0];
    set({ userName: name, currency: found, isUserConfigured: true });
    await Promise.all([
      storeSet('@pw/userName', name).catch(() => {}),
      storeSet('@pw/currency', found.code).catch(() => {}),
      storeSet('@pw/setup', FLAG).catch(() => {}),
    ]);
  },

  addCustomCategory: async (cat) => {
    const next = [...get().customCategories, cat];
    set({ customCategories: next });
    AsyncStorage.setItem('@pw/categories', JSON.stringify(next)).catch(() => {});
  },

  removeCustomCategory: async (name) => {
    const next = get().customCategories.filter((c) => c.name !== name);
    set({ customCategories: next });
    AsyncStorage.setItem('@pw/categories', JSON.stringify(next)).catch(() => {});
  },

  updateCustomCategory: async (oldName, updated) => {
    const next = get().customCategories.map((c) => c.name === oldName ? updated : c);
    set({ customCategories: next });
    AsyncStorage.setItem('@pw/categories', JSON.stringify(next)).catch(() => {});
  },
}));

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      // Phase 1: load profile fields in parallel
      const [n, o, s, c, img, allKeys] = await Promise.all([
        storeGet('@pw/userName'),
        storeGet('@pw/onboarded'),
        storeGet('@pw/setup'),
        storeGet('@pw/currency'),
        storeGet('@pw/profileImage'),
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

      set({
        userName: n || '',
        profileImage: img || null,
        currency: foundCurrency,
        onboarded: isOn(o),
        isUserConfigured: !!(n) || setupDone || hasAnyExpenses,
      });

      // Phase 2: load budget, categories, expenses in parallel
      const activeCode = foundCurrency.code;

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
        ready: true,
      });
    } catch {
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
    set({ profileImage: uri });
    try {
      if (uri) await storeSet('@pw/profileImage', uri);
      else await storeRemove('@pw/profileImage');
    } catch {}
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
    try { await storeSet('@pw/onboarded', FLAG); } catch {}
  },

  completeSetup: async (name, currencyCode) => {
    const found = CURRENCIES.find((x) => x.code === currencyCode) || CURRENCIES[0];
    set({ userName: name, currency: found, isUserConfigured: true });
    try {
      await Promise.all([
        storeSet('@pw/userName', name),
        storeSet('@pw/currency', found.code),
        storeSet('@pw/setup', FLAG),
      ]);
    } catch {}
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
}));

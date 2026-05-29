import type { StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppStore, ExpenseSlice } from '../storeTypes';

const expensesKeyFor = (code: string) => `@pw/expenses:${code}`;

export const createExpenseSlice: StateCreator<AppStore, [], [], ExpenseSlice> = (set, get) => ({
  expenses: {},

  selectExpenses: (code) => {
    const activeCode = code ?? get().currency.code;
    return get().expenses[activeCode] ?? [];
  },

  addExpense: (exp) => {
    const code = get().currency.code;
    const current = get().expenses[code] ?? [];
    const next = [{ ...exp, id: Date.now().toString() }, ...current];
    set({ expenses: { ...get().expenses, [code]: next } });
    AsyncStorage.setItem(expensesKeyFor(code), JSON.stringify(next)).catch(() => {});
  },

  updateExpense: (id, patch) => {
    const code = get().currency.code;
    const current = get().expenses[code] ?? [];
    const next = current.map((x) => (x.id === id ? { ...x, ...patch } : x));
    set({ expenses: { ...get().expenses, [code]: next } });
    AsyncStorage.setItem(expensesKeyFor(code), JSON.stringify(next)).catch(() => {});
  },

  deleteExpense: (id) => {
    const code = get().currency.code;
    const current = get().expenses[code] ?? [];
    const next = current.filter((x) => x.id !== id);
    set({ expenses: { ...get().expenses, [code]: next } });
    AsyncStorage.setItem(expensesKeyFor(code), JSON.stringify(next)).catch(() => {});
  },

  clearExpensesForCurrency: async (code) => {
    if (!code) return;
    await AsyncStorage.removeItem(expensesKeyFor(code)).catch(() => {});
    const updated = { ...get().expenses };
    delete updated[code];
    set({ expenses: updated });
  },

  countExpensesForCurrency: (code) => {
    return get().expenses[code]?.length ?? 0;
  },
});

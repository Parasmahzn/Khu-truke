import type { StateCreator } from 'zustand';
import { storeSet, storeRemove } from '../../utils/storage';
import type { AppStore, BudgetSlice } from '../storeTypes';

const budgetKeyFor = (code: string) => `@pw/budget:${code}`;

export const createBudgetSlice: StateCreator<AppStore, [], [], BudgetSlice> = (set, get) => ({
  budgets: {},

  saveBudget: async (val) => {
    const code = get().currency.code;
    set({ budgets: { ...get().budgets, [code]: val } });
    await storeSet(budgetKeyFor(code), String(val)).catch(() => {});
  },

  clearBudgetForCurrency: async (code) => {
    if (!code) return;
    await storeRemove(budgetKeyFor(code)).catch(() => {});
    const updated = { ...get().budgets };
    delete updated[code];
    set({ budgets: updated });
  },
});

import { createContext } from 'react';

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

export type ExpenseContextValue = {
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  clearExpensesForCurrency: (code: string) => Promise<void>;
  countExpensesForCurrency: (code: string) => Promise<number>;
  userName: string;
  profileImage: string | null;
  saveProfileImage: (uri: string | null) => Promise<void>;
  currency: Currency;
  saveCurrency: (code: string) => Promise<void>;
  budget: number;
  saveBudget: (val: number) => Promise<void>;
  clearBudgetForCurrency: (code: string) => Promise<void>;
  customCategories: Category[];
  addCustomCategory: (cat: Category) => Promise<void>;
  removeCustomCategory: (name: string) => Promise<void>;
};

export const ExpenseContext = createContext<ExpenseContextValue>({
  expenses: [],
  addExpense: () => {},
  updateExpense: () => {},
  deleteExpense: () => {},
  clearExpensesForCurrency: async () => {},
  countExpensesForCurrency: async () => 0,
  userName: '',
  profileImage: null,
  saveProfileImage: async () => {},
  currency: { code: 'USD', symbol: '$', label: 'US Dollar' },
  saveCurrency: async () => {},
  budget: 0,
  saveBudget: async () => {},
  clearBudgetForCurrency: async () => {},
  customCategories: [],
  addCustomCategory: async () => {},
  removeCustomCategory: async () => {},
});

export function sumAmount(list: Expense[]): number {
  return list.reduce((s, x) => s + x.amount, 0);
}

export function expensesOn(list: Expense[], dateObj: Date): Expense[] {
  const y = dateObj.getFullYear(), m = dateObj.getMonth(), d = dateObj.getDate();
  return list.filter((x) => {
    const dd = new Date(x.date);
    return dd.getFullYear() === y && dd.getMonth() === m && dd.getDate() === d;
  });
}

export function expensesInMonth(list: Expense[], year: number, month: number): Expense[] {
  return list.filter((x) => {
    const d = new Date(x.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function byCategory(list: Expense[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  list.forEach((x) => { map[x.category] = (map[x.category] || 0) + x.amount; });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function formatMoney(n: number, withCents = true): string {
  if (withCents) return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

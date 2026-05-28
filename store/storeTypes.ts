import type { Currency, Category, Expense, BackupState } from '../types';

export type UserSlice = {
  userName: string;
  profileImage: string | null;
  currency: Currency;
  onboarded: boolean;
  setup: boolean;
  joinedAt: string;
  completeSetup: (name: string, currencyCode: string) => Promise<void>;
  markOnboarded: () => Promise<void>;
  saveCurrency: (code: string) => Promise<void>;
  saveProfileImage: (uri: string | null) => Promise<void>;
  saveUserName: (name: string) => Promise<void>;
};

export type ExpenseSlice = {
  expenses: Record<string, Expense[]>;
  selectExpenses: (code?: string) => Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  clearExpensesForCurrency: (code: string) => Promise<void>;
  countExpensesForCurrency: (code: string) => number;
};

export type BudgetSlice = {
  budgets: Record<string, number>;
  saveBudget: (val: number) => Promise<void>;
  clearBudgetForCurrency: (code: string) => Promise<void>;
};

export type CategorySlice = {
  customCategories: Category[];
  builtInCategories: Category[];
  addCustomCategory: (cat: Category) => Promise<void>;
  removeCustomCategory: (name: string) => Promise<void>;
  updateCustomCategory: (oldName: string, updated: Category) => Promise<void>;
  updateBuiltInCategory: (oldName: string, updated: Category) => Promise<void>;
  removeBuiltInCategory: (name: string) => Promise<void>;
};

export type TagSlice = {
  builtInTags: string[];
  customTags: string[];
  addCustomTag: (tag: string) => Promise<void>;
  removeCustomTag: (tag: string) => Promise<void>;
  updateCustomTag: (oldTag: string, newTag: string) => Promise<void>;
  updateBuiltInTag: (oldTag: string, newTag: string) => Promise<void>;
};

export type BackupSlice = {
  exportBackup: () => Promise<void>;
  importBackup: (state: BackupState) => Promise<void>;
};

export type AppStore = UserSlice &
  ExpenseSlice &
  BudgetSlice &
  CategorySlice &
  TagSlice &
  BackupSlice & {
    ready: boolean;
    initialize: () => Promise<void>;
  };

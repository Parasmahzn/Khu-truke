export type Currency = { code: string; symbol: string; label: string };
export type Category = { name: string; icon: string; color?: string };
export type Expense = {
  id: string;
  amount: number;
  category: string;
  icon: string;
  note: string;
  tags: string[];
  date: string;
  receipt: string | null;
  paymentType: string;
};

/** Persisted app state — matches the Zustand store shape minus ephemeral fields */
export interface BackupState {
  userName: string;
  currency: Currency;
  onboarded: boolean;
  joinedAt: string;
  expenses: Record<string, Expense[]>;
  budgets: Record<string, number>;
  customCategories: Category[];
  builtInCategories: Category[];
  customTags: string[];
  builtInTags: string[];
  profileImageBase64: string | null;
}

export interface BackupDataV2 {
  version: 2;
  app: 'khutruke';
  appVersion: string;
  createdAt: string;
  state: BackupState;
}

/** Extend this union when a V3 is introduced */
export type BackupData = BackupDataV2;

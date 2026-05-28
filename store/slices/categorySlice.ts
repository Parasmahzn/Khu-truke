import type { StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHART_CUSTOM_PALETTE, DEFAULT_CATEGORIES } from '../../constants';
import type { Category } from '../../types';
import type { AppStore, CategorySlice } from '../storeTypes';

const pickCategoryColor = (existing: Category[]): string => {
  const used = new Set(existing.map((c) => c.color).filter(Boolean));
  return (
    CHART_CUSTOM_PALETTE.find((c) => !used.has(c)) ??
    CHART_CUSTOM_PALETTE[existing.length % CHART_CUSTOM_PALETTE.length]
  );
};

export const createCategorySlice: StateCreator<AppStore, [], [], CategorySlice> = (set, get) => ({
  customCategories: [],
  builtInCategories: DEFAULT_CATEGORIES,

  addCustomCategory: async (cat) => {
    const all = [...get().builtInCategories, ...get().customCategories];
    const withColor = { ...cat, color: pickCategoryColor(all) };
    const next = [...get().customCategories, withColor];
    set({ customCategories: next });
    AsyncStorage.setItem('@pw/categories', JSON.stringify(next)).catch(() => {});
  },

  removeCustomCategory: async (name) => {
    const next = get().customCategories.filter((c) => c.name !== name);
    set({ customCategories: next });
    AsyncStorage.setItem('@pw/categories', JSON.stringify(next)).catch(() => {});
  },

  updateCustomCategory: async (oldName, updated) => {
    const next = get().customCategories.map((c) => (c.name === oldName ? updated : c));
    set({ customCategories: next });
    AsyncStorage.setItem('@pw/categories', JSON.stringify(next)).catch(() => {});
  },

  updateBuiltInCategory: async (oldName, updated) => {
    const next = get().builtInCategories.map((c) => (c.name === oldName ? updated : c));
    set({ builtInCategories: next });
    AsyncStorage.setItem('@pw/builtInCategories', JSON.stringify(next)).catch(() => {});
  },

  removeBuiltInCategory: async (name) => {
    const next = get().builtInCategories.filter((c) => c.name !== name);
    set({ builtInCategories: next });
    AsyncStorage.setItem('@pw/builtInCategories', JSON.stringify(next)).catch(() => {});
  },
});

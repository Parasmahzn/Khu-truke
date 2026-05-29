import type { StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMMON_TAGS } from '../../constants';
import type { AppStore, TagSlice } from '../storeTypes';

export const createTagSlice: StateCreator<AppStore, [], [], TagSlice> = (set, get) => ({
  builtInTags: COMMON_TAGS,
  customTags: [],

  addCustomTag: async (tag) => {
    const next = [...get().customTags, tag];
    set({ customTags: next });
    AsyncStorage.setItem('@pw/customTags', JSON.stringify(next)).catch(() => {});
  },

  removeCustomTag: async (tag) => {
    const next = get().customTags.filter((t) => t !== tag);
    set({ customTags: next });
    AsyncStorage.setItem('@pw/customTags', JSON.stringify(next)).catch(() => {});
  },

  updateCustomTag: async (oldTag, newTag) => {
    const next = get().customTags.map((t) => (t === oldTag ? newTag : t));
    set({ customTags: next });
    AsyncStorage.setItem('@pw/customTags', JSON.stringify(next)).catch(() => {});
  },

  updateBuiltInTag: async (oldTag, newTag) => {
    const next = get().builtInTags.map((t) => (t === oldTag ? newTag : t));
    set({ builtInTags: next });
    AsyncStorage.setItem('@pw/builtInTags', JSON.stringify(next)).catch(() => {});
  },
});

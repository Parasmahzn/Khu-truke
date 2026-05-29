import type { StateCreator } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as FSFile, Paths } from 'expo-file-system';
import { storeGet, storeSet, storeRemove } from '../../utils/storage';
import { CURRENCIES } from '../../constants';
import type { AppStore, UserSlice } from '../storeTypes';

const FLAG = '1';

export const createUserSlice: StateCreator<AppStore, [], [], UserSlice> = (set, get) => ({
  userName: '',
  profileImage: null,
  currency: CURRENCIES[0],
  onboarded: false,
  setup: false,
  joinedAt: '',

  completeSetup: async (name, currencyCode) => {
    const found = CURRENCIES.find((x) => x.code === currencyCode) ?? CURRENCIES[0];
    const today = new Date().toISOString().slice(0, 10);
    set({ userName: name, currency: found, setup: true, joinedAt: today });
    await Promise.all([
      storeSet('@pw/userName', name).catch(() => {}),
      storeSet('@pw/currency', found.code).catch(() => {}),
      storeSet('@pw/setup', FLAG).catch(() => {}),
      AsyncStorage.setItem('@pw/joinedAt', today).catch(() => {}),
    ]);
  },

  markOnboarded: async () => {
    set({ onboarded: true });
    await storeSet('@pw/onboarded', FLAG).catch(() => {});
  },

  saveCurrency: async (code) => {
    const found = CURRENCIES.find((x) => x.code === code) ?? CURRENCIES[0];
    set({ currency: found });
    await storeSet('@pw/currency', found.code).catch(() => {});
    // No need to reload expenses/budgets — all currencies are already in memory
  },

  saveUserName: async (name) => {
    set({ userName: name });
    await storeSet('@pw/userName', name).catch(() => {});
  },

  saveProfileImage: async (uri) => {
    const prev = get().profileImage;
    if (uri) {
      let finalUri = uri;
      try {
        const dest = new FSFile(Paths.document, `profile_${Date.now()}.jpg`);
        new FSFile(uri).copy(dest);
        finalUri = dest.uri;
      } catch {}
      set({ profileImage: finalUri });
      await storeSet('@pw/profileImage', finalUri).catch(() => {});
      if (prev) { try { new FSFile(prev).delete(); } catch {} }
    } else {
      set({ profileImage: null });
      await storeRemove('@pw/profileImage').catch(() => {});
      if (prev) { try { new FSFile(prev).delete(); } catch {} }
    }
  },
});

import type { StateCreator } from 'zustand';
import { storeSet } from '../../utils/storage';
import { exportBackup, persistBackupState } from '../../utils/backup';
import type { BackupState } from '../../types';
import type { AppStore, BackupSlice } from '../storeTypes';

export const createBackupSlice: StateCreator<AppStore, [], [], BackupSlice> = (set, get) => ({
  exportBackup: async () => {
    const { userName, currency, onboarded, joinedAt, expenses, budgets,
      customCategories, builtInCategories, customTags, builtInTags, profileImage } = get();
    await exportBackup({
      userName, currency, onboarded, joinedAt, expenses, budgets,
      customCategories, builtInCategories, customTags, builtInTags, profileImage,
    });
  },

  importBackup: async (state: BackupState) => {
    const restoredImageUri = await persistBackupState(state, storeSet);

    // Hydrate store directly — no re-initialize needed
    set({
      userName: state.userName,
      currency: state.currency,
      onboarded: state.onboarded,
      setup: true,
      joinedAt: state.joinedAt,
      expenses: state.expenses,
      budgets: state.budgets,
      customCategories: state.customCategories,
      builtInCategories: state.builtInCategories,
      customTags: state.customTags ?? [],
      builtInTags: state.builtInTags ?? [],
      profileImage: restoredImageUri,
      ready: true,
    });
  },
});

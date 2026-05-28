import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File as FSFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { COMMON_TAGS } from '../constants';
import type { BackupData, BackupDataV2, BackupState } from '../types';

// ── Validation ────────────────────────────────────────────────────────────────

export function isValidBackup(raw: unknown): raw is BackupData {
  if (!raw || typeof raw !== 'object') return false;
  const d = raw as Record<string, unknown>;
  if (d.app !== 'khutruke') return false;
  if (d.version !== 2) return false;
  if (typeof d.createdAt !== 'string') return false;
  if (!d.state || typeof d.state !== 'object') return false;
  const s = d.state as Record<string, unknown>;
  if (typeof s.userName !== 'string') return false;
  if (typeof s.onboarded !== 'boolean') return false;
  if (typeof s.joinedAt !== 'string') return false;
  if (!s.currency || typeof s.currency !== 'object') return false;
  const cur = s.currency as Record<string, unknown>;
  if (typeof cur.code !== 'string') return false;
  if (typeof cur.symbol !== 'string') return false;
  if (typeof cur.label !== 'string') return false;
  if (!Array.isArray(s.customCategories)) return false;
  if (!Array.isArray(s.builtInCategories)) return false;
  if (!s.expenses || typeof s.expenses !== 'object') return false;
  for (const val of Object.values(s.expenses as object)) {
    if (!Array.isArray(val)) return false;
  }
  if (!s.budgets || typeof s.budgets !== 'object') return false;
  return true;
}

// ── Migration ─────────────────────────────────────────────────────────────────

export function migrateBackup(data: BackupData): BackupDataV2 {
  // Currently only v2 exists. Add migrate_v1_to_v2 here when needed.
  return data as BackupDataV2;
}

// ── Serialise persisted state ─────────────────────────────────────────────────

/** Extracts the persistent state from an AppStore snapshot. */
export async function getBackupState(
  store: {
    userName: string;
    currency: BackupState['currency'];
    onboarded: boolean;
    joinedAt: string;
    expenses: BackupState['expenses'];
    budgets: BackupState['budgets'];
    customCategories: BackupState['customCategories'];
    builtInCategories: BackupState['builtInCategories'];
    customTags: string[];
    builtInTags: string[];
    profileImage: string | null;
  },
): Promise<BackupState> {
  let profileImageBase64: string | null = null;
  if (store.profileImage) {
    try {
      profileImageBase64 = await new FSFile(store.profileImage).base64();
    } catch {
      // Image file may have been deleted or moved — skip it silently
    }
  }

  return {
    userName: store.userName,
    currency: store.currency,
    onboarded: store.onboarded,
    joinedAt: store.joinedAt,
    expenses: store.expenses,
    budgets: store.budgets,
    customCategories: store.customCategories,
    builtInCategories: store.builtInCategories,
    customTags: store.customTags,
    builtInTags: store.builtInTags,
    profileImageBase64,
  };
}

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Builds a BackupDataV2 payload from the current store state, writes it to
 * the document directory, and opens the system share sheet.
 *
 * Throws on failure — callers should catch and show an Alert.
 */
export async function exportBackup(
  store: Parameters<typeof getBackupState>[0],
): Promise<void> {
  const state = await getBackupState(store);
  const payload: BackupDataV2 = {
    version: 2,
    app: 'khutruke',
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    createdAt: new Date().toISOString(),
    state,
  };

  const date = new Date().toISOString().slice(0, 10);
  const filename = `khutruke_backup_${date}.json`;
  const file = new FSFile(Paths.document, filename);

  // Delete any stale same-day export before writing
  if (file.exists) file.delete();
  file.write(JSON.stringify(payload, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your Khu₹truke backup',
  });
}

// ── Import ────────────────────────────────────────────────────────────────────

/**
 * Opens the native file picker (JSON filter), reads the selected file,
 * validates it, and returns a migrated BackupDataV2.
 *
 * Returns null if the user cancelled.
 * Throws a descriptive Error on invalid content.
 */
export async function readBackupFile(): Promise<BackupDataV2 | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset?.uri) return null;

  let text: string;
  try {
    text = await new FSFile(asset.uri).text();
  } catch {
    throw new Error('Could not read the selected file.');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!isValidBackup(raw)) {
    throw new Error('This file is not a valid Khu₹truke backup.');
  }

  return migrateBackup(raw);
}

// ── Restore helpers ───────────────────────────────────────────────────────────

const expensesKeyFor = (code: string) => `@pw/expenses:${code}`;
const budgetKeyFor = (code: string) => `@pw/budget:${code}`;

/**
 * Writes all fields from a BackupState to their respective storage locations.
 * Does NOT mutate the Zustand store — callers do that after this resolves.
 *
 * Returns the local URI of the restored profile image, or null if none.
 */
export async function persistBackupState(
  state: BackupDataV2['state'],
  storeSet: (key: string, value: string) => Promise<void>,
): Promise<string | null> {
  await Promise.all([
    storeSet('@pw/userName', state.userName),
    storeSet('@pw/currency', state.currency.code),
    storeSet('@pw/setup', '1'),
    AsyncStorage.setItem('@pw/joinedAt', state.joinedAt).catch(() => {}),
    AsyncStorage.setItem('@pw/categories', JSON.stringify(state.customCategories)).catch(() => {}),
    AsyncStorage.setItem('@pw/builtInCategories', JSON.stringify(state.builtInCategories)).catch(() => {}),
    AsyncStorage.setItem('@pw/customTags', JSON.stringify(state.customTags ?? [])).catch(() => {}),
    AsyncStorage.setItem('@pw/builtInTags', JSON.stringify(state.builtInTags ?? COMMON_TAGS)).catch(() => {}),
    ...Object.entries(state.expenses).map(([code, exps]) =>
      AsyncStorage.setItem(expensesKeyFor(code), JSON.stringify(exps)).catch(() => {}),
    ),
    ...Object.entries(state.budgets).map(([code, budget]) =>
      storeSet(budgetKeyFor(code), String(budget)).catch(() => {}),
    ),
  ]);

  // Restore profile image from base64 if present
  if (state.profileImageBase64) {
    try {
      const destFile = new FSFile(Paths.document, `profile_restored_${Date.now()}.jpg`);
      destFile.write(state.profileImageBase64, { encoding: 'base64' });
      await storeSet('@pw/profileImage', destFile.uri);
      return destFile.uri;
    } catch {
      // Image restore failed — proceed without it
    }
  }

  return null;
}

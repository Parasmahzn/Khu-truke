import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = new Set([
  '@pw/budget',
  '@pw/profileImage',
  '@pw/darkMode',
]);

const MOVED_TO_ASYNC = new Set([
  '@pw/userName',
  '@pw/currency',
  '@pw/onboarded',
  '@pw/setup',
]);

export async function storeGet(key: string): Promise<string | null> {
  if (SECURE_KEYS.has(key)) {
    const val = await SecureStore.getItemAsync(key);
    if (val !== null) return val;

    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) {
      await SecureStore.setItemAsync(key, legacy).catch(() => {});
      await AsyncStorage.removeItem(key).catch(() => {});
    }
    return legacy;
  }

  const val = await AsyncStorage.getItem(key);
  if (val !== null) return val;

  if (MOVED_TO_ASYNC.has(key)) {
    try {
      const legacy = await SecureStore.getItemAsync(key);
      if (legacy !== null) {
        await AsyncStorage.setItem(key, legacy).catch(() => {});
        await SecureStore.deleteItemAsync(key).catch(() => {});
        return legacy;
      }
    } catch {}
  }

  return null;
}

export async function storeSet(key: string, value: string): Promise<void> {
  if (!SECURE_KEYS.has(key)) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

export async function storeRemove(key: string): Promise<void> {
  if (!SECURE_KEYS.has(key)) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export async function storeMultiRemove(keys: string[]): Promise<void> {
  const secureKeys = keys.filter((k) => SECURE_KEYS.has(k));
  const asyncKeys  = keys.filter((k) => !SECURE_KEYS.has(k));
  await Promise.all([
    ...secureKeys.map((k) => SecureStore.deleteItemAsync(k).catch(() => {})),
    asyncKeys.length ? AsyncStorage.multiRemove(asyncKeys) : Promise.resolve(),
  ]);
}

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '../store';

const KEY = '@pw/categories';

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setCustomCategories(JSON.parse(raw));
      } catch {
        // use defaults
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const addCustomCategory = useCallback(async (cat: Category) => {
    setCustomCategories((prev) => {
      const next = [...prev, cat];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeCustomCategory = useCallback(async (name: string) => {
    setCustomCategories((prev) => {
      const next = prev.filter((c) => c.name !== name);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { customCategories, ready, addCustomCategory, removeCustomCategory };
}

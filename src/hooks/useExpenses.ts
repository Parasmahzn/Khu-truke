import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense } from '../store';

const LEGACY_KEY = '@pw/expenses';
const keyFor = (code: string) => `@pw/expenses:${code}`;
const SYNTHETIC_ID = /^s\d+$/;

export function useExpenses(currencyCode: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ready, setReady] = useState(false);
  const activeCodeRef = useRef(currencyCode);

  useEffect(() => {
    activeCodeRef.current = currencyCode;
    if (!currencyCode) return;

    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        const key = keyFor(currencyCode);
        let raw = await AsyncStorage.getItem(key);

        if (raw === null) {
          const legacy = await AsyncStorage.getItem(LEGACY_KEY);
          if (legacy !== null) {
            await AsyncStorage.setItem(key, legacy).catch(() => {});
            await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
            raw = legacy;
          }
        }

        let next: Expense[] = [];
        if (raw) {
          const parsed: Expense[] = JSON.parse(raw);
          const cleaned = parsed.filter((x) => !SYNTHETIC_ID.test(x.id));
          if (cleaned.length < parsed.length) {
            await AsyncStorage.setItem(key, JSON.stringify(cleaned)).catch(() => {});
          }
          next = cleaned;
        }

        if (!cancelled && activeCodeRef.current === currencyCode) {
          setExpenses(next);
        }
      } catch {
        if (!cancelled && activeCodeRef.current === currencyCode) setExpenses([]);
      } finally {
        if (!cancelled && activeCodeRef.current === currencyCode) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [currencyCode]);

  const addExpense = useCallback((exp: Omit<Expense, 'id'>) => {
    setExpenses((prev) => {
      const next = [{ ...exp, id: Date.now().toString() }, ...prev];
      const code = activeCodeRef.current;
      if (code) AsyncStorage.setItem(keyFor(code), JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Omit<Expense, 'id'>>) => {
    setExpenses((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
      const code = activeCodeRef.current;
      if (code) AsyncStorage.setItem(keyFor(code), JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((x) => x.id !== id);
      const code = activeCodeRef.current;
      if (code) AsyncStorage.setItem(keyFor(code), JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearExpensesForCurrency = useCallback(async (code: string) => {
    if (!code) return;
    await AsyncStorage.removeItem(keyFor(code)).catch(() => {});
    if (activeCodeRef.current === code) setExpenses([]);
  }, []);

  const countExpensesForCurrency = useCallback(async (code: string): Promise<number> => {
    if (!code) return 0;
    try {
      const raw = await AsyncStorage.getItem(keyFor(code));
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, []);

  return {
    expenses,
    ready,
    addExpense,
    updateExpense,
    deleteExpense,
    clearExpensesForCurrency,
    countExpensesForCurrency,
  };
}

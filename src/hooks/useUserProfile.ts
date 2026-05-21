import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeGet, storeSet, storeRemove } from '../storage';
import { CURRENCIES } from '../constants';
import type { Currency } from '../store';

const FLAG = '1';
const isOn = (raw: string | null): boolean => raw === FLAG;

const LEGACY_BUDGET_KEY = '@pw/budget';
const budgetKeyFor = (code: string) => `@pw/budget:${code}`;

export function useUserProfile() {
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [budget, setBudget] = useState(0);
  const [onboarded, setOnboarded] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [hasAnyExpenses, setHasAnyExpenses] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [budgetReady, setBudgetReady] = useState(false);
  const activeCodeRef = useRef(currency.code);

  useEffect(() => {
    (async () => {
      try {
        const [n, o, s, c, img, allKeys] = await Promise.all([
          storeGet('@pw/userName'),
          storeGet('@pw/onboarded'),
          storeGet('@pw/setup'),
          storeGet('@pw/currency'),
          storeGet('@pw/profileImage'),
          AsyncStorage.getAllKeys().catch(() => [] as readonly string[]),
        ]);

        if (n) setUserName(n);
        if (c) {
          const found = CURRENCIES.find((x) => x.code === c);
          if (found) setCurrency(found);
        }
        if (img) setProfileImage(img);
        setOnboarded(isOn(o));
        setSetupDone(isOn(s));

        const expenseKeys = [...allKeys].filter(
          (k) => k === '@pw/expenses' || k.startsWith('@pw/expenses:')
        );
        for (const k of expenseKeys) {
          const raw = await AsyncStorage.getItem(k).catch(() => null);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHasAnyExpenses(true);
              break;
            }
          } catch {}
        }
      } catch {
        // use defaults
      } finally {
        setProfileReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!profileReady) return;
    activeCodeRef.current = currency.code;
    let cancelled = false;
    setBudgetReady(false);

    (async () => {
      try {
        const key = budgetKeyFor(currency.code);
        let raw = await storeGet(key);

        if (raw === null) {
          const legacy = await storeGet(LEGACY_BUDGET_KEY);
          if (legacy !== null) {
            await storeSet(key, legacy).catch(() => {});
            await storeRemove(LEGACY_BUDGET_KEY).catch(() => {});
            raw = legacy;
          }
        }

        if (!cancelled && activeCodeRef.current === currency.code) {
          setBudget(raw ? parseFloat(raw) || 0 : 0);
        }
      } catch {
        if (!cancelled && activeCodeRef.current === currency.code) setBudget(0);
      } finally {
        if (!cancelled && activeCodeRef.current === currency.code) setBudgetReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [currency.code, profileReady]);

  const saveUserName = useCallback(async (name: string) => {
    setUserName(name);
    try { await storeSet('@pw/userName', name); } catch {}
  }, []);

  const saveProfileImage = useCallback(async (uri: string | null) => {
    setProfileImage(uri);
    try {
      if (uri) await storeSet('@pw/profileImage', uri);
      else await storeRemove('@pw/profileImage');
    } catch {}
  }, []);

  const saveCurrency = useCallback(async (code: string) => {
    const found = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
    setCurrency(found);
    try { await storeSet('@pw/currency', found.code); } catch {}
  }, []);

  const saveBudget = useCallback(async (val: number) => {
    setBudget(val);
    const code = activeCodeRef.current;
    if (!code) return;
    try { await storeSet(budgetKeyFor(code), String(val)); } catch {}
  }, []);

  const clearBudgetForCurrency = useCallback(async (code: string) => {
    if (!code) return;
    try { await storeRemove(budgetKeyFor(code)); } catch {}
    if (activeCodeRef.current === code) setBudget(0);
  }, []);

  const markOnboarded = useCallback(async () => {
    setOnboarded(true);
    try { await storeSet('@pw/onboarded', FLAG); } catch {}
  }, []);

  const completeSetup = useCallback(async (name: string, currencyCode: string) => {
    const found = CURRENCIES.find((x) => x.code === currencyCode) || CURRENCIES[0];
    setUserName(name);
    setCurrency(found);
    setSetupDone(true);
    try {
      await Promise.all([
        storeSet('@pw/userName', name),
        storeSet('@pw/currency', found.code),
        storeSet('@pw/setup', FLAG),
      ]);
    } catch {}
  }, []);

  const isUserConfigured = !!userName || setupDone || hasAnyExpenses;
  const ready = profileReady && budgetReady;

  return {
    userName,
    profileImage,
    currency,
    budget,
    onboarded,
    setupDone,
    ready,
    isUserConfigured,
    saveUserName,
    saveProfileImage,
    saveCurrency,
    saveBudget,
    clearBudgetForCurrency,
    markOnboarded,
    completeSetup,
  };
}

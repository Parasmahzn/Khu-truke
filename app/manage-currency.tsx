import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { useUserProfile } from '../hooks/useUserProfile';
import { useExpenses } from '../hooks/useExpenses';
import { useBudget } from '../hooks/useBudget';
import { CURRENCIES } from '../constants';
import { useColors } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import type { Colors } from '../theme';

export default function ManageCurrencyScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { currency, saveCurrency } = useUserProfile();
  const { allExpensesRecord, clearExpensesForCurrency } = useExpenses();
  const { clearBudgetForCurrency } = useBudget();

  const counts = useMemo(
    () => Object.fromEntries(CURRENCIES.map((c) => [c.code, allExpensesRecord[c.code]?.length ?? 0])),
    [allExpensesRecord],
  );

  const onSwitchCurrency = (c: typeof CURRENCIES[number]) => {
    if (c.code === currency.code) return;
    Alert.alert(
      `Switch to ${c.code}?`,
      `Your ${currency.code} expenses and budget are saved separately and won't be lost. You'll see ${c.code} data instead — switch back anytime to pick up where you left off.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => saveCurrency(c.code) },
      ],
    );
  };

  const onClearCurrency = (c: typeof CURRENCIES[number]) => {
    const n = counts[c.code] ?? 0;
    Alert.alert(
      `Clear all ${c.code} data?`,
      `This will delete ${n} expense${n === 1 ? '' : 's'} and reset the ${c.code} budget. Other currencies are not affected. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            await clearExpensesForCurrency(c.code);
            await clearBudgetForCurrency(c.code);
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScreenHeader title="Currency" />
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={C.purple} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        <Text style={styles.sectionLabel}>SELECT CURRENCY</Text>
        <View style={styles.chipCard}>
          {CURRENCIES.map((c) => {
            const active = c.code === currency.code;
            return (
              <Pressable
                key={c.code}
                style={[styles.currencyChip, active && styles.currencyChipActive]}
                onPress={() => onSwitchCurrency(c)}
              >
                <Text style={[styles.currencyChipText, active && { color: C.onPurple }]}>
                  {c.symbol}  {c.code}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.dangerLabel]}>CLEAR DATA BY CURRENCY</Text>
        <Text style={styles.dangerHint}>
          Each currency has its own expenses and budget. Clearing a currency
          removes only that currency's data — your profile and other currencies stay intact.
        </Text>
        <View style={[styles.listCard, styles.dangerCard]}>
          {CURRENCIES.map((c, i) => {
            const n = counts[c.code] ?? 0;
            const isActive = c.code === currency.code;
            return (
              <View key={c.code} style={[styles.curRow, i < CURRENCIES.length - 1 && styles.divider]}>
                <Text style={styles.curSymbol}>{c.symbol}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.curCode}>
                    {c.code}
                    {isActive && <Text style={styles.curActive}>  · active</Text>}
                  </Text>
                  <Text style={styles.curMeta}>{n} expense{n === 1 ? '' : 's'}</Text>
                </View>
                <Pressable
                  onPress={() => onClearCurrency(c)}
                  disabled={n === 0}
                  style={[styles.clearBtn, n === 0 && styles.clearBtnDisabled]}
                >
                  <Ionicons name="trash-outline" size={13} color={n === 0 ? C.mute : C.danger} style={{ marginRight: 4 }} />
                  <Text style={[styles.clearBtnText, n === 0 && styles.clearBtnTextDisabled]}>clear</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 20, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: C.purple },
  sectionLabel: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  chipCard: {
    marginHorizontal: 20, borderWidth: 1.5, borderColor: C.ink, borderRadius: 14,
    backgroundColor: C.white, flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14,
  },
  currencyChip: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: C.ink, borderRadius: 999, backgroundColor: C.white },
  currencyChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  currencyChipText: { fontSize: 14, fontWeight: '700', color: C.ink },
  dangerLabel: { color: C.danger, marginTop: 32 },
  dangerHint: { fontSize: 11, color: C.mute, paddingHorizontal: 20, marginTop: 6, marginBottom: 4, lineHeight: 15 },
  listCard: { marginHorizontal: 20, borderWidth: 1.5, borderColor: C.ink, borderRadius: 14, backgroundColor: C.white, overflow: 'hidden' },
  dangerCard: { borderColor: C.danger, marginTop: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  curRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  curSymbol: { fontSize: 18, fontWeight: '800', color: C.ink, width: 36, textAlign: 'center' },
  curCode: { fontSize: 14, fontWeight: '700', color: C.ink },
  curActive: { fontSize: 11, fontWeight: '600', color: C.purpleDark },
  curMeta: { fontSize: 11, color: C.mute, marginTop: 2 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: C.danger, borderRadius: 999, backgroundColor: C.white },
  clearBtnDisabled: { borderColor: C.line },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: C.danger },
  clearBtnTextDisabled: { color: C.mute },
});

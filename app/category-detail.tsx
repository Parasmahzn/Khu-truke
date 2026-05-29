import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { useColors } from '../context/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';
import { useUserProfile } from '../hooks/useUserProfile';
import { sumAmount, formatSmartMoney } from '../utils/expenses';
import type { Colors } from '../theme';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses } = useExpenses();
  const { currency } = useUserProfile();

  const { category, dateFrom, dateTo } = useLocalSearchParams<{
    category: string;
    dateFrom: string;
    dateTo: string;
  }>();

  const [activePayTypes, setActivePayTypes] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const list = useMemo(() =>
    expenses
      .filter((e) =>
        e.category === category &&
        e.date.slice(0, 10) >= (dateFrom ?? '') &&
        e.date.slice(0, 10) <= (dateTo ?? '')
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, category, dateFrom, dateTo]
  );

  const payTypes = useMemo(
    () => [...new Set(list.map((e) => e.paymentType).filter(Boolean))] as string[],
    [list]
  );
  const allTags = useMemo(() => [...new Set(list.flatMap((e) => e.tags))], [list]);

  const filtered = useMemo(() =>
    list.filter((e) =>
      (activePayTypes.length === 0 || activePayTypes.includes(e.paymentType)) &&
      (activeTags.length === 0 || activeTags.some((t) => e.tags.includes(t)))
    ),
    [list, activePayTypes, activeTags]
  );

  const total = sumAmount(list);

  const togglePayType = (p: string) =>
    setActivePayTypes((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  const toggleTag = (t: string) =>
    setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const tabBarReserve = (Platform.OS === 'ios' ? 96 : 86) + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader
        title={category ?? ''}
        left={
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={28} color={C.ink} />
          </Pressable>
        }
        right={
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.purpleDark, marginLeft: 12 }}>
            -{currency.symbol}{formatSmartMoney(total)}
          </Text>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>

        {(payTypes.length > 0 || allTags.length > 0) && (
          <View style={styles.filterSection}>
            {payTypes.length > 0 && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>PAYMENT</Text>
                <View style={styles.chips}>
                  {payTypes.map((p) => {
                    const active = activePayTypes.includes(p);
                    return (
                      <Pressable
                        key={p}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => togglePayType(p)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            {allTags.length > 0 && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>TAGS</Text>
                <View style={styles.chips}>
                  {allTags.map((t) => {
                    const active = activeTags.includes(t);
                    return (
                      <Pressable
                        key={t}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => toggleTag(t)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>#{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {filtered.length === 0 ? (
          <Text style={{ color: C.mute, marginTop: 20, textAlign: 'center' }}>
            No expenses match the selected filters.
          </Text>
        ) : filtered.map((e, i) => (
          <Pressable
            key={e.id}
            style={[styles.row, i < filtered.length - 1 && styles.rowDivider]}
            onPress={() => router.push('/add-edit?id=' + e.id as any)}
          >
            <View style={styles.rowIcon}>
              <Text style={{ fontSize: 16 }}>{e.icon || '💵'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{e.note || e.category}</Text>
              <Text style={styles.rowDate}>
                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {e.paymentType ? `  ·  ${e.paymentType}` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rowAmt}>-{currency.symbol}{formatSmartMoney(e.amount)}</Text>
              {e.receipt && <Text style={{ fontSize: 10, color: C.mute, marginTop: 2 }}>📎</Text>}
            </View>
          </Pressable>
        ))}

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  filterSection: {
    marginTop: 12, marginBottom: 4,
    padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.ink,
    backgroundColor: C.white,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 3, gap: 10,
  },
  filterRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  filterLabel: { fontSize: 9, fontWeight: '700', color: C.mute, letterSpacing: 1, marginTop: 6, width: 52 },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1.5, borderColor: C.line },
  chipActive: { backgroundColor: C.purple, borderColor: C.purple },
  chipText: { fontSize: 11, fontWeight: '700', color: C.mute },
  chipTextActive: { color: C.onPurple },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.purpleSoft, borderWidth: 1.25, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  rowDate: { fontSize: 11, color: C.mute, marginTop: 2 },
  rowAmt: { fontSize: 16, fontWeight: '800', color: C.ink },
});

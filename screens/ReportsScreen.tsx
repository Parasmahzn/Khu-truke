import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import Chip from '../components/Chip';
import { useColors } from '../context/ThemeContext';
import { useAppStore } from '../store';
import { expensesInMonth, expensesOn, sumAmount, formatMoney } from '../utils/expenses';
import { MONTHS } from '../constants';
import type { Colors } from '../theme';
import { useRouter } from 'expo-router';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses, currency } = useAppStore();
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = new Date();

  const monthList = useMemo(() => expensesInMonth(expenses, year, month), [expenses, year, month]);
  const monthSpent = sumAmount(monthList);

  const prevDate = new Date(year, month - 1, 1);
  const prevList = useMemo(() => expensesInMonth(expenses, prevDate.getFullYear(), prevDate.getMonth()), [expenses]);
  const prevSpent = sumAmount(prevList);
  const deltaPct = prevSpent > 0 ? Math.round(((monthSpent - prevSpent) / prevSpent) * 100) : 0;

  const dayTotals = useMemo(() => {
    const map: Record<number, number> = {};
    monthList.forEach((x) => {
      const d = new Date(x.date).getDate();
      map[d] = (map[d] || 0) + x.amount;
    });
    return map;
  }, [monthList]);
  const maxDay = Math.max(1, ...Object.values(dayTotals));

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDow + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  const selectedList = selectedDay ? expensesOn(expenses, selectedDay) : null;
  const tabBarReserve = Platform.OS === 'ios' ? 96 : 86;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Reports" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.periodRow}>
          {['Day','Week','Month','Year'].map((p, i) => (
            <View key={p} style={[styles.period, i === 2 && styles.periodActive]}>
              <Text style={[styles.periodText, i === 2 && { color: C.onPurple }]}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.stepper}>
          <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))}>
            <Text style={styles.arrow}>←</Text>
          </Pressable>
          <Text style={styles.stepperTitle}>{MONTHS[month]} {year}</Text>
          <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))}>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.dowRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <Text key={i} style={styles.dowLabel}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={i} style={[styles.cell, { opacity: 0 }]} />;
            const total = dayTotals[day] || 0;
            const intensity = total > 0 ? total / maxDay : 0;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDay != null && selectedDay.getDate() === day && selectedDay.getMonth() === month;
            const dark = intensity > 0.5;
            return (
              <Pressable
                key={i}
                style={[
                  styles.cell,
                  {
                    backgroundColor: total > 0 ? `rgba(124,58,237,${0.15 + intensity * 0.65})` : 'transparent',
                    borderColor: isSelected ? C.purple : (isToday ? C.ink : C.line),
                    borderWidth: isSelected ? 2 : (isToday ? 1.5 : 1.25),
                  },
                ]}
                onPress={() => setSelectedDay(new Date(year, month, day))}
              >
                <Text style={[styles.cellNum, { color: dark ? C.onPurple : C.ink, fontWeight: (isToday || isSelected) ? '800' : '500' }]}>{day}</Text>
                {total > 0 && (
                  <Text style={[styles.cellAmt, { color: dark ? C.onPurple : C.purpleDark }]}>{currency.symbol}{Math.round(total)}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.totalsRow}>
          <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
            <Text style={styles.totalLabel}>MONTH TOTAL</Text>
            <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatMoney(monthSpent)}</Text>
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>VS LAST MONTH</Text>
            <Text style={styles.totalValue}>
              {deltaPct >= 0 ? '+' : ''}{deltaPct}%  {deltaPct >= 0 ? '↑' : '↓'}
            </Text>
          </View>
        </View>

        {selectedList && selectedDay && (
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={styles.dayTitle}>{selectedDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              <Text style={styles.dayTotal}>{currency.symbol}{formatMoney(sumAmount(selectedList))}</Text>
            </View>
            {selectedList.length === 0 ? (
              <Text style={{ color: C.mute, marginTop: 8 }}>No expenses that day.</Text>
            ) : selectedList.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push('/add-edit?id=' + t.id)}
                style={styles.dayRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.txCat}>{t.note || t.category}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    {(t.tags || []).slice(0, 2).map((tag, j) => <Chip key={j}>#{tag}</Chip>)}
                  </View>
                </View>
                <Text style={styles.txAmt}>{currency.symbol}{formatMoney(t.amount)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!selectedList && (
          <Text style={styles.hint}>✎  tap a day to drill in</Text>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  periodRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, gap: 6 },
  period: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 10, backgroundColor: C.white,
  },
  periodActive: {
    backgroundColor: C.purple,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 4,
  },
  periodText: { fontSize: 13, color: C.ink, fontWeight: '700' },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 18 },
  arrow: { fontSize: 20, color: C.mute, paddingHorizontal: 8 },
  stepperTitle: { fontSize: 22, fontWeight: '800', color: C.ink },
  dowRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 10, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 6, gap: 4 },
  cell: { width: `${(100 - 6 * (4 / 3.5)) / 7}%`, aspectRatio: 1, borderRadius: 8, padding: 3, justifyContent: 'space-between' },
  cellNum: { fontSize: 10 },
  cellAmt: { fontSize: 8, fontWeight: '700', alignSelf: 'flex-end' },
  totalsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16 },
  totalCard: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  totalLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2 },
  dayTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  dayTotal: { fontSize: 20, fontWeight: '800', color: C.purpleDark },
  dayRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  txCat: { fontSize: 14, fontWeight: '700', color: C.ink },
  txAmt: { fontSize: 18, fontWeight: '800', color: C.ink },
  hint: { color: C.purpleDark, fontWeight: '600', paddingHorizontal: 20, marginTop: 12, fontSize: 13 },
});

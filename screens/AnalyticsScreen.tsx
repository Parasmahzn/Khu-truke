import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import ScreenHeader from '../components/ScreenHeader';
import { useColors } from '../context/ThemeContext';
import { useAppStore } from '../store';
import { expensesInMonth, sumAmount, byCategory, formatMoney } from '../utils/expenses';
import { CATEGORY_COLORS } from '../constants';
import type { Colors } from '../theme';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses, currency } = useAppStore();
  const now = new Date();

  const monthList = useMemo(() => expensesInMonth(expenses, now.getFullYear(), now.getMonth()), [expenses]);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevList = useMemo(() => expensesInMonth(expenses, prev.getFullYear(), prev.getMonth()), [expenses]);

  const monthSpent = sumAmount(monthList);
  const prevSpent = sumAmount(prevList);

  const cats = useMemo(() => byCategory(monthList), [monthList]);
  const prevCatsMap = useMemo(() => {
    const map: Record<string, number> = {};
    byCategory(prevList).forEach((c) => { map[c.name] = c.value; });
    return map;
  }, [prevList]);

  const pieData = cats.map((c) => ({
    name: c.name,
    value: c.value,
    color: CATEGORY_COLORS[c.name] ?? C.mute,
    legendFontColor: C.ink,
    legendFontSize: 11,
  }));

  const trends = cats.slice(0, 4).map((c) => {
    const prevVal = prevCatsMap[c.name] ?? 0;
    return { name: c.name, delta: c.value - prevVal };
  });

  const tabBarReserve = Platform.OS === 'ios' ? 96 : 86;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Analytics" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.label}>SPENDING BY CATEGORY · {now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>

        <View style={styles.chartWrap}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={width - 40}
              height={200}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              chartConfig={{
                color: () => C.ink,
                labelColor: () => C.ink,
              }}
              hasLegend={true}
            />
          ) : (
            <View style={styles.empty}><Text style={{ color: C.mute }}>No expenses this month yet.</Text></View>
          )}
        </View>

        <View style={styles.totalRow}>
          <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
            <Text style={styles.totalLabel}>MONTH TOTAL</Text>
            <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatMoney(monthSpent)}</Text>
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>LAST MONTH</Text>
            <Text style={styles.totalValue}>{currency.symbol}{formatMoney(prevSpent)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>vs last month</Text>
        <View style={styles.trendGrid}>
          {trends.length === 0 && (
            <Text style={{ color: C.mute, paddingHorizontal: 20 }}>Add expenses to see trends.</Text>
          )}
          {trends.map((t) => {
            const bad = t.delta > 0;
            return (
              <View key={t.name} style={[styles.trendCard, !bad && { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.trendName}>{t.name}</Text>
                <Text style={[styles.trendValue, { color: bad ? C.ink : C.purpleDark }]}>
                  {bad ? '+' : '-'}{currency.symbol}{formatMoney(Math.abs(t.delta), false)}
                </Text>
                <Text style={styles.trendMeta}>{bad ? '↑ higher' : '↓ lower'}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.hint}>✎  tap donut segments to filter</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  label: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 10 },
  chartWrap: {
    alignItems: 'center', marginTop: 12, marginHorizontal: 20,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 16, paddingVertical: 12,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
  },
  empty: { height: 160, alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', marginTop: 14, paddingHorizontal: 20 },
  totalCard: {
    flex: 1, padding: 10, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white,
  },
  totalLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: C.ink, paddingHorizontal: 20 },
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 10, gap: 10 },
  trendCard: {
    width: '48%', padding: 12, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white,
    minHeight: 88,
  },
  trendName: { fontSize: 11, color: C.mute, fontWeight: '700' },
  trendValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  trendMeta: { fontSize: 10, color: C.mute, marginTop: 4 },
  hint: { color: C.purpleDark, fontWeight: '600', paddingHorizontal: 20, marginTop: 14, fontSize: 13 },
});

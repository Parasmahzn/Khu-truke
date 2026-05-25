import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import ScreenHeader from '../components/ScreenHeader';
import { useColors } from '../context/ThemeContext';
import { useAppStore } from '../store';
import { expensesInMonth, sumAmount, byCategory, formatMoney } from '../utils/expenses';
import { CATEGORY_COLORS } from '../constants';
import type { Colors } from '../theme';

const { width } = Dimensions.get('window');
// chartWrap has marginHorizontal:20 (width-40) + borderWidth:1.5 each side → inner = width-43
// subtract extra padding so bars/lines never touch the border
const chartWidth = width - 64;

export default function AnalyticsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses, currency } = useAppStore();
  const now = new Date();

  // ── Category / month data (existing) ─────────────────────────────
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

  // ── Daily spend (last 7 days) ─────────────────────────────────────
  const last7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        total: expenses.filter((x) => x.date.slice(0, 10) === iso).reduce((s, x) => s + x.amount, 0),
      };
    });
  }, [expenses]);

  // ── 6-month trend ─────────────────────────────────────────────────
  const last6Months = useMemo(() => (
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total: sumAmount(expensesInMonth(expenses, d.getFullYear(), d.getMonth())),
      };
    })
  ), [expenses]);

  const [selectedPoint, setSelectedPoint] = useState<{ index: number; value: number } | null>(null);

  // ── Shared chart config ───────────────────────────────────────────
  const chartConfig = useMemo(() => ({
    backgroundColor: C.white,
    backgroundGradientFrom: C.white,
    backgroundGradientTo: C.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124,58,237,${opacity})`,
    labelColor: () => C.ink,
    propsForDots: { r: '4', strokeWidth: '2', stroke: C.purple },
    propsForBackgroundLines: { strokeDasharray: '', stroke: C.line, strokeOpacity: 0.5 },
    propsForLabels: { fontSize: 9 },
  }), [C]);

  // Compact Y-axis labels: "1K" instead of "1000", no currency symbol
  const formatYLabel = (v: string) => {
    const n = +v;
    return n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`;
  };

  const tabBarReserve = Platform.OS === 'ios' ? 96 : 86;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Analytics" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Spending by category ────────────────────────────────── */}
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
              chartConfig={{ color: () => C.ink, labelColor: () => C.ink }}
              hasLegend={true}
            />
          ) : (
            <View style={styles.empty}><Text style={{ color: C.mute }}>No expenses this month yet.</Text></View>
          )}
        </View>

        {/* ── Month totals ────────────────────────────────────────── */}
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

        {/* ── Daily spending bar chart ────────────────────────────── */}
        <Text style={[styles.label, { marginTop: 20 }]}>DAILY SPENDING · LAST 7 DAYS</Text>
        <View style={styles.chartWrap}>
          {last7Days.some((d) => d.total > 0) ? (
            <BarChart
              data={{
                labels: last7Days.map((d) => d.label),
                datasets: [{ data: last7Days.map((d) => d.total || 0.01) }],
              }}
              width={chartWidth}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              showValuesOnTopOfBars
              fromZero
              withInnerLines={false}
            />
          ) : (
            <View style={styles.empty}><Text style={{ color: C.mute }}>No spend in the last 7 days.</Text></View>
          )}
        </View>

        {/* ── 6-month trend line chart ────────────────────────────── */}
        <Text style={[styles.label, { marginTop: 20 }]}>6-MONTH TREND</Text>
        <View style={styles.chartWrap}>
          {last6Months.some((m) => m.total > 0) ? (
            <>
              <LineChart
                data={{
                  labels: last6Months.map((m) => m.label),
                  datasets: [{ data: last6Months.map((m) => m.total || 0.01) }],
                }}
                width={chartWidth}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                formatYLabel={formatYLabel}
                chartConfig={chartConfig}
                bezier
                onDataPointClick={({ index, value }) => setSelectedPoint({ index, value })}
                withShadow={false}
                getDotColor={(_dataPoint: number, index: number) =>
                  selectedPoint?.index === index ? C.purple : C.purpleSoft
                }
              />
              {selectedPoint && (
                <Text style={styles.chartHint}>
                  {last6Months[selectedPoint.index]?.label}: {currency.symbol}{Math.round(selectedPoint.value).toLocaleString()}
                </Text>
              )}
            </>
          ) : (
            <View style={styles.empty}><Text style={{ color: C.mute }}>No spend in the last 6 months.</Text></View>
          )}
        </View>

        {/* ── vs last month trend cards ───────────────────────────── */}
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

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  label: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 10 },
  chartWrap: {
    alignItems: 'center', marginTop: 12, marginHorizontal: 20,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 16, paddingVertical: 12,
    overflow: 'hidden',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
  },
  empty: { height: 160, alignItems: 'center', justifyContent: 'center' },
  chartHint: { fontSize: 12, color: C.purpleDark, fontWeight: '700', marginTop: 6 },
  totalRow: { flexDirection: 'row', marginTop: 14, paddingHorizontal: 20 },
  totalCard: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  totalLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: C.ink, paddingHorizontal: 20 },
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 10, gap: 10 },
  trendCard: { width: '48%', padding: 12, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white, minHeight: 88 },
  trendName: { fontSize: 11, color: C.mute, fontWeight: '700' },
  trendValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  trendMeta: { fontSize: 10, color: C.mute, marginTop: 4 },
});

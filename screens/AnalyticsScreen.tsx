import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { useColors } from '../context/ThemeContext';
import { useAppStore } from '../store';
import { expensesInMonth, sumAmount, byCategory, formatMoney } from '../utils/expenses';
import { CHART_CATEGORY_COLORS, CHART_CUSTOM_PALETTE } from '../constants';
import CategoryPieChart from '../components/CategoryPieChart';
import DayDonutChart from '../components/DayDonutChart';
import SpendingBarChart from '../components/SpendingBarChart';
import MonthLineChart from '../components/MonthLineChart';
import type { Colors } from '../theme';

const { width } = Dimensions.get('window');
const nameHash = (s: string) => s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0);

export default function AnalyticsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { expenses, currency, customCategories } = useAppStore();
  const now = new Date();

  // ── Category / month data ─────────────────────────────────────────
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

  const colorMap = useMemo(() => {
    const map: Record<string, string> = { ...CHART_CATEGORY_COLORS };
    customCategories.forEach((cat) => { if (cat.color) map[cat.name] = cat.color; });
    return map;
  }, [customCategories]);

  const pieData = cats.map((c) => ({
    name: c.name,
    value: c.value,
    color: colorMap[c.name] ?? CHART_CUSTOM_PALETTE[nameHash(c.name) % CHART_CUSTOM_PALETTE.length],
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

  const [chartPage, setChartPage] = useState(0);
  const sliderRef = useRef<ScrollView>(null);

  const dayTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthList.forEach((x) => {
      const key = x.date.slice(0, 10);
      map[key] = (map[key] || 0) + x.amount;
    });
    return Object.entries(map)
      .map(([date, total]) => ({ day: parseInt(date.slice(8), 10), total }))
      .sort((a, b) => a.day - b.day);
  }, [monthList]);

  const tabBarReserve = (Platform.OS === 'ios' ? 96 : 86) + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Analytics" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Chart slider (category pie + day donut) ─────────────── */}
        <Text style={styles.label}>
          {chartPage === 0
            ? `SPENDING BY CATEGORY · ${now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}`
            : `SPENDING BY DAY · ${now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}`}
        </Text>
        <View style={styles.sliderCard}>
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / (width - 43));
              setChartPage(page);
            }}
          >
            {/* Page 0 — category pie chart */}
            <View style={{ width: width - 43, alignItems: 'center', paddingVertical: 12 }}>
              <CategoryPieChart data={pieData} />
            </View>

            {/* Page 1 — day-wise donut chart */}
            <View style={{ width: width - 43, alignItems: 'center', paddingVertical: 12 }}>
              <DayDonutChart dayTotals={dayTotals} />
            </View>
          </ScrollView>

          {/* Page dot indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 10, marginTop: 4 }}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  width: i === chartPage ? 16 : 6, height: 6, borderRadius: 3,
                  backgroundColor: i === chartPage ? C.purple : C.line,
                }}
              />
            ))}
          </View>
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
          <SpendingBarChart data={last7Days} />
        </View>

        {/* ── 6-month trend line chart ────────────────────────────── */}
        <Text style={[styles.label, { marginTop: 20 }]}>6-MONTH TREND</Text>
        <View style={styles.chartWrap}>
          <MonthLineChart data={last6Months} currencySymbol={currency.symbol} />
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
  sliderCard: {
    marginTop: 12, marginHorizontal: 20,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 4,
  },
  chartWrap: {
    alignItems: 'center', marginTop: 12, marginHorizontal: 20,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 16, paddingVertical: 12,
    overflow: 'hidden',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
  },
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

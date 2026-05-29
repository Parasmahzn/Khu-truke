import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { useColors } from '../../context/ThemeContext';
import { useExpenses } from '../../hooks/useExpenses';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useCategories } from '../../hooks/useCategories';
import { expensesInMonth, sumAmount, byCategory, formatMoney, formatSmartMoney } from '../../utils/expenses';
import { CHART_CATEGORY_COLORS, CHART_CUSTOM_PALETTE } from '../../constants';
import CategoryDonutChart from '../../components/CategoryDonutChart';
import DayDonutChart from '../../components/DayDonutChart';
import MonthLineChart from '../../components/MonthLineChart';
import type { Colors } from '../../theme';

const { width } = Dimensions.get('window');
const nameHash = (s: string) => s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0);

export default function AnalyticsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { expenses } = useExpenses();
  const { currency } = useUserProfile();
  const { customCategories } = useCategories();
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

  const colorMap = useMemo(() => {
    const map: Record<string, string> = { ...CHART_CATEGORY_COLORS };
    customCategories.forEach((cat) => { if (cat.color) map[cat.name] = cat.color; });
    return map;
  }, [customCategories]);

  const donutData = useMemo(() =>
    cats.map((c) => ({
      name: c.name,
      value: c.value,
      color: colorMap[c.name] ?? CHART_CUSTOM_PALETTE[nameHash(c.name) % CHART_CUSTOM_PALETTE.length],
    })),
    [cats, colorMap],
  );

  const trends = cats.slice(0, 4).map((c) => {
    const prevVal = prevCatsMap[c.name] ?? 0;
    return { name: c.name, delta: c.value - prevVal };
  });

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

  const monthLabel = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const tabBarReserve = (Platform.OS === 'ios' ? 96 : 86) + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Analytics" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        <Text style={styles.label}>
          {chartPage === 0
            ? `SPENDING BY CATEGORY · ${monthLabel}`
            : chartPage === 1
            ? `SPENDING BY DAY · ${monthLabel}`
            : '6-MONTH TREND'}
        </Text>
        <View style={styles.sliderCard}>
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / (width - 43));
              if (page !== chartPage) setChartPage(page);
            }}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / (width - 43));
              setChartPage(page);
            }}
          >
            <View style={{ width: width - 43, alignItems: 'center', paddingVertical: 12 }}>
              <CategoryDonutChart data={donutData} active={chartPage === 0} />
            </View>
            <View style={{ width: width - 43, alignItems: 'center', paddingVertical: 12 }}>
              <DayDonutChart dayTotals={dayTotals} active={chartPage === 1} month={now.toLocaleDateString('en-US', { month: 'short' })} />
            </View>
            <View style={{ width: width - 43, paddingVertical: 12 }}>
              <MonthLineChart data={last6Months} currencySymbol={currency.symbol} />
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 10, marginTop: 4 }}>
            {[0, 1, 2].map((i) => (
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

        <View style={styles.totalRow}>
          <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
            <Text style={styles.totalLabel}>MONTH TOTAL</Text>
            <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatSmartMoney(monthSpent)}</Text>
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>LAST MONTH</Text>
            <Text style={styles.totalValue}>{currency.symbol}{formatSmartMoney(prevSpent)}</Text>
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

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  label: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 10 },
  sliderCard: {
    marginTop: 12, marginHorizontal: 20,
    backgroundColor: C.paper,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 16, overflow: 'hidden',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, elevation: 4,
  },
  totalRow: { flexDirection: 'row', marginTop: 14, paddingHorizontal: 20 },
  totalCard: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  totalLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: C.ink, paddingHorizontal: 20 },
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 10, gap: 10 },
  trendCard: { width: '48%', padding: 12, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white, minHeight: 88 },
  trendName: { fontSize: 11, color: C.mute, fontWeight: '700' },
  trendValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  trendMeta: { fontSize: 10, color: C.mute, marginTop: 4 },
});

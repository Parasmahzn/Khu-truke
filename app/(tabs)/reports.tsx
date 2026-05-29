import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateData } from 'react-native-calendars';
import Calendar from '../../components/Calendar';
import ScreenHeader from '../../components/ScreenHeader';
import { useColors } from '../../context/ThemeContext';
import { useExpenses } from '../../hooks/useExpenses';
import { useUserProfile } from '../../hooks/useUserProfile';
import { expensesInMonth, expensesOn, sumAmount, formatMoney, formatSmartMoney } from '../../utils/expenses';
import type { Colors } from '../../theme';
import type { Expense } from '../../types';
import { useRouter } from 'expo-router';

type MarkedDates = Record<string, {
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  dots?: Array<{ key: string; color: string; selectedDotColor?: string }>;
}>;

type Tab = 'Day' | 'Week' | 'Month' | 'Year';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByCategory(list: Expense[]) {
  const map: Record<string, { icon: string; total: number }> = {};
  for (const e of list) {
    if (!map[e.category]) map[e.category] = { icon: e.icon || '💵', total: 0 };
    map[e.category].total += e.amount;
  }
  return Object.entries(map)
    .map(([name, { icon, total }]) => ({ name, icon, total }))
    .sort((a, b) => b.total - a.total);
}

export default function ReportsScreen() {
  const router = useRouter();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses } = useExpenses();
  const { currency } = useUserProfile();

  const today = new Date();

  const [activeTab, setActiveTab] = useState<Tab>('Month');
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDate, setDayDate] = useState<Date>(() => new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [yearNum, setYearNum] = useState<number>(() => new Date().getFullYear());

  const atDayBoundary   = toISODate(dayDate) >= toISODate(today);
  const atWeekBoundary  = toISODate(weekStart) >= toISODate(getMonday(today));
  const atYearBoundary  = yearNum >= today.getFullYear();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthList = useMemo(() => expensesInMonth(expenses, year, month), [expenses, year, month]);
  const monthSpent = sumAmount(monthList);
  const prevList = useMemo(() => {
    const pd = new Date(year, month - 1, 1);
    return expensesInMonth(expenses, pd.getFullYear(), pd.getMonth());
  }, [expenses, year, month]);
  const prevSpent = sumAmount(prevList);
  const deltaPct = prevSpent > 0 ? Math.round(((monthSpent - prevSpent) / prevSpent) * 100) : 0;

  const dayTotalsMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthList.forEach((x) => {
      const key = x.date.slice(0, 10);
      map[key] = (map[key] || 0) + x.amount;
    });
    return map;
  }, [monthList]);

  const maxDay = useMemo(() => Math.max(1, ...Object.values(dayTotalsMap)), [dayTotalsMap]);
  const selectedDayStr = selectedDay ? toISODate(selectedDay) : null;

  const markedDates = useMemo<MarkedDates>(() => {
    const result: MarkedDates = {};
    Object.entries(dayTotalsMap).forEach(([dateStr, total]) => {
      const intensity = total / maxDay;
      const alpha = Math.round((0.3 + intensity * 0.7) * 255).toString(16).padStart(2, '0');
      result[dateStr] = { dots: [{ key: 'spend', color: `#7c3aed${alpha}`, selectedDotColor: '#ffffff' }] };
    });
    if (selectedDayStr) {
      result[selectedDayStr] = {
        ...(result[selectedDayStr] ?? {}),
        selected: true, selectedColor: C.purple, selectedTextColor: C.onPurple,
      };
    }
    return result;
  }, [dayTotalsMap, maxDay, selectedDayStr, C.purple, C.onPurple]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDay(new Date(day.year, day.month - 1, day.day));
  }, []);

  const handleMonthChange = useCallback((m: DateData) => {
    const now = new Date();
    if (m.year > now.getFullYear() || (m.year === now.getFullYear() && m.month > now.getMonth() + 1)) return;
    setCursor(new Date(m.year, m.month - 1, 1));
    setSelectedDay(null);
  }, []);

  const dayList = useMemo(() => expensesOn(expenses, dayDate), [expenses, dayDate]);
  const daySpent = sumAmount(dayList);
  const dayGroups = useMemo(() => groupByCategory(dayList), [dayList]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekList = useMemo(() => {
    const s = toISODate(weekStart), e = toISODate(weekEnd);
    return expenses.filter((x) => { const d = x.date.slice(0, 10); return d >= s && d <= e; });
  }, [expenses, weekStart, weekEnd]);
  const weekSpent = sumAmount(weekList);
  const weekGroups = useMemo(() => groupByCategory(weekList), [weekList]);

  const prevWeekList = useMemo(() => {
    const s = toISODate(addDays(weekStart, -7)), e = toISODate(addDays(weekStart, -1));
    return expenses.filter((x) => { const d = x.date.slice(0, 10); return d >= s && d <= e; });
  }, [expenses, weekStart]);
  const prevWeekSpent = sumAmount(prevWeekList);
  const weekDelta = prevWeekSpent > 0 ? Math.round(((weekSpent - prevWeekSpent) / prevWeekSpent) * 100) : 0;

  const weekDayTotals = useMemo(() => {
    const map: Record<string, number> = {};
    weekList.forEach((x) => { const k = x.date.slice(0, 10); map[k] = (map[k] || 0) + x.amount; });
    return map;
  }, [weekList]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const monthGroups = useMemo(() => groupByCategory(monthList), [monthList]);
  const monthFirstDay = toISODate(new Date(year, month, 1));
  const monthLastDay = toISODate(new Date(year, month + 1, 0));

  const yearMonthTotals = useMemo(() => (
    Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: new Date(yearNum, i, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      total: sumAmount(expensesInMonth(expenses, yearNum, i)),
    }))
  ), [expenses, yearNum]);
  const yearSpent = yearMonthTotals.reduce((s, m) => s + m.total, 0);

  const tabBarReserve = (Platform.OS === 'ios' ? 96 : 86) + insets.bottom;

  const renderCatGroups = (
    groups: { name: string; icon: string; total: number }[],
    dateFrom: string,
    dateTo: string,
    emptyMsg: string,
  ) => (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      {groups.length === 0 ? (
        <Text style={{ color: C.mute, marginTop: 8 }}>{emptyMsg}</Text>
      ) : groups.map((cat, i) => (
        <Pressable
          key={cat.name}
          style={[styles.catRow, i < groups.length - 1 && styles.catDivider]}
          onPress={() => router.push(
            `/category-detail?category=${encodeURIComponent(cat.name)}&dateFrom=${dateFrom}&dateTo=${dateTo}` as any
          )}
        >
          <View style={styles.catIcon}><Text style={{ fontSize: 16 }}>{cat.icon}</Text></View>
          <Text style={styles.catName}>{cat.name}</Text>
          <Text style={styles.catTotal}>-{currency.symbol}{formatSmartMoney(cat.total)}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Reports" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        <View style={styles.periodRow}>
          {(['Day', 'Week', 'Month', 'Year'] as const).map((p) => (
            <Pressable key={p} style={[styles.period, activeTab === p && styles.periodActive]} onPress={() => setActiveTab(p)}>
              <Text style={[styles.periodText, activeTab === p && { color: C.onPurple }]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'Day' && (
          <>
            <View style={styles.stepper}>
              <Pressable onPress={() => setDayDate(addDays(dayDate, -1))}><Text style={styles.arrow}>←</Text></Pressable>
              <Text style={styles.stepperTitle}>
                {dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <Pressable disabled={atDayBoundary} onPress={() => setDayDate(addDays(dayDate, 1))}>
                <Text style={[styles.arrow, atDayBoundary && styles.arrowDisabled]}>→</Text>
              </Pressable>
            </View>
            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>DAY TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatSmartMoney(daySpent)}</Text>
              </View>
            </View>
            {renderCatGroups(dayGroups, toISODate(dayDate), toISODate(dayDate), 'No expenses on this day.')}
          </>
        )}

        {activeTab === 'Week' && (
          <>
            <View style={styles.stepper}>
              <Pressable onPress={() => { setWeekStart(addDays(weekStart, -7)); setSelectedDay(null); }}>
                <Text style={styles.arrow}>←</Text>
              </Pressable>
              <Text style={styles.stepperTitle}>{toShortDate(weekStart)} – {toShortDate(weekEnd)}</Text>
              <Pressable disabled={atWeekBoundary} onPress={() => { setWeekStart(addDays(weekStart, 7)); setSelectedDay(null); }}>
                <Text style={[styles.arrow, atWeekBoundary && styles.arrowDisabled]}>→</Text>
              </Pressable>
            </View>
            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>WEEK TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatSmartMoney(weekSpent)}</Text>
              </View>
              <View style={{ width: 10 }} />
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>VS LAST WEEK</Text>
                <Text style={styles.totalValue}>{weekDelta >= 0 ? '+' : ''}{weekDelta}%  {weekDelta >= 0 ? '↑' : '↓'}</Text>
              </View>
            </View>
            <View style={styles.weekStrip}>
              {weekDays.map((day, i) => {
                const key = toISODate(day);
                const amt = weekDayTotals[key] || 0;
                const isToday = key === toISODate(today);
                const isSel = selectedDay ? toISODate(selectedDay) === key : false;
                return (
                  <Pressable
                    key={i}
                    style={[styles.weekDayTile, isSel && { backgroundColor: C.purple, borderColor: C.purple }, !isSel && isToday && { backgroundColor: C.purpleSoft, borderColor: C.purple }]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.weekDayName, isSel && { color: C.onPurple }, !isSel && isToday && { color: C.purpleDark }]}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[styles.weekDayNum, isSel && { color: C.onPurple }, !isSel && isToday && { color: C.purpleDark }]}>
                      {day.getDate()}
                    </Text>
                    {amt > 0 && <View style={[styles.weekDayDot, isSel && { backgroundColor: C.onPurple }]} />}
                  </Pressable>
                );
              })}
            </View>
            {renderCatGroups(weekGroups, toISODate(weekStart), toISODate(weekEnd), 'No expenses this week.')}
          </>
        )}

        {activeTab === 'Month' && (
          <>
            <Calendar
              current={toISODate(cursor)}
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              enableSwipeMonths={true}
              hideExtraDays={true}
              maxDate={toISODate(today)}
              style={{ marginHorizontal: 8, marginTop: 12 }}
            />
            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>MONTH TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatSmartMoney(monthSpent)}</Text>
              </View>
              <View style={{ width: 10 }} />
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>VS LAST MONTH</Text>
                <Text style={styles.totalValue}>{deltaPct >= 0 ? '+' : ''}{deltaPct}%  {deltaPct >= 0 ? '↑' : '↓'}</Text>
              </View>
            </View>
            {renderCatGroups(monthGroups, monthFirstDay, monthLastDay, 'No expenses this month.')}
          </>
        )}

        {activeTab === 'Year' && (
          <>
            <View style={styles.stepper}>
              <Pressable onPress={() => setYearNum(yearNum - 1)}><Text style={styles.arrow}>←</Text></Pressable>
              <Text style={styles.stepperTitle}>{yearNum}</Text>
              <Pressable disabled={atYearBoundary} onPress={() => setYearNum(yearNum + 1)}>
                <Text style={[styles.arrow, atYearBoundary && styles.arrowDisabled]}>→</Text>
              </Pressable>
            </View>
            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>YEAR TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatSmartMoney(yearSpent)}</Text>
              </View>
            </View>
            <View style={styles.yearGrid}>
              {yearMonthTotals.map(({ month: m, label, total }) => {
                const isCurrent = yearNum === today.getFullYear() && m === today.getMonth();
                return (
                  <Pressable
                    key={m}
                    style={[styles.yearCell, isCurrent && { backgroundColor: C.purpleSoft }]}
                    onPress={() => { setCursor(new Date(yearNum, m, 1)); setActiveTab('Month'); setSelectedDay(null); }}
                  >
                    <Text style={styles.yearMonth}>{label}</Text>
                    <Text style={[styles.yearAmt, total === 0 && { color: C.mute }]}>
                      {total > 0 ? `${currency.symbol}${formatMoney(total, false)}` : '—'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  periodRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, gap: 6 },
  period: { flex: 1, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: C.ink, borderRadius: 10, backgroundColor: C.white },
  periodActive: { backgroundColor: C.purple, shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, elevation: 4 },
  periodText: { fontSize: 13, color: C.ink, fontWeight: '700' },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 18 },
  arrow: { fontSize: 22, color: C.mute, paddingHorizontal: 10 },
  arrowDisabled: { opacity: 0.25 },
  stepperTitle: { fontSize: 16, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  totalsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16 },
  totalCard: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  totalLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 2 },
  weekStrip: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 14, gap: 4 },
  weekDayTile: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.line },
  weekDayName: { fontSize: 9, fontWeight: '700', color: C.mute, letterSpacing: 0.5 },
  weekDayNum: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 2 },
  weekDayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.purpleDark, marginTop: 4 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 14, gap: 10 },
  yearCell: { width: '47%', padding: 12, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  yearMonth: { fontSize: 11, fontWeight: '700', color: C.mute, letterSpacing: 1 },
  yearAmt: { fontSize: 20, fontWeight: '800', color: C.ink, marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4 },
  catDivider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  catIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.purpleSoft, borderWidth: 1.25, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },
  catTotal: { fontSize: 16, fontWeight: '800', color: C.ink },
});

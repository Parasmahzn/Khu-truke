import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import ScreenHeader from '../components/ScreenHeader';
import Chip from '../components/Chip';
import { useColors } from '../context/ThemeContext';
import { useAppStore } from '../store';
import { expensesInMonth, expensesOn, sumAmount, formatMoney } from '../utils/expenses';
import type { Colors } from '../theme';
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

export default function ReportsScreen() {
  const router = useRouter();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses, currency } = useAppStore();

  const today = new Date();

  const [activeTab, setActiveTab] = useState<Tab>('Month');

  // Month tab state
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Day tab state
  const [dayDate, setDayDate] = useState<Date>(() => new Date());

  // Week tab state
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  // Year tab state
  const [yearNum, setYearNum] = useState<number>(() => new Date().getFullYear());

  // ── Future-navigation boundaries ─────────────────────────────────
  const atDayBoundary   = toISODate(dayDate) >= toISODate(today);
  const atWeekBoundary  = toISODate(weekStart) >= toISODate(getMonday(today));
  const atYearBoundary  = yearNum >= today.getFullYear();

  // ── Month tab data ────────────────────────────────────────────────
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
      result[dateStr] = {
        dots: [{ key: 'spend', color: `#7c3aed${alpha}`, selectedDotColor: '#ffffff' }],
      };
    });
    if (selectedDayStr) {
      result[selectedDayStr] = {
        ...(result[selectedDayStr] ?? {}),
        selected: true,
        selectedColor: C.purple,
        selectedTextColor: C.onPurple,
      };
    }
    return result;
  }, [dayTotalsMap, maxDay, selectedDayStr, C.purple, C.onPurple]);

  const calendarTheme = useMemo(() => ({
    backgroundColor: C.paper,
    calendarBackground: C.paper,
    textSectionTitleColor: C.mute,
    selectedDayBackgroundColor: C.purple,
    selectedDayTextColor: C.onPurple,
    todayTextColor: C.purpleDark,
    todayBackgroundColor: C.purpleSoft,
    dayTextColor: C.ink,
    textDisabledColor: C.line,
    dotColor: C.purple,
    selectedDotColor: C.onPurple,
    arrowColor: C.purple,
    monthTextColor: C.ink,
    textDayFontWeight: '500' as const,
    textMonthFontWeight: '800' as const,
    textDayHeaderFontWeight: '700' as const,
    textDayFontSize: 13,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 10,
  }), [C]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDay(new Date(day.year, day.month - 1, day.day));
    setShowAll(false);
  }, []);

  const handleMonthChange = useCallback((m: DateData) => {
    const now = new Date();
    // m.month is 1-indexed; getMonth() is 0-indexed
    if (m.year > now.getFullYear() || (m.year === now.getFullYear() && m.month > now.getMonth() + 1)) return;
    setCursor(new Date(m.year, m.month - 1, 1));
    setSelectedDay(null);
    setShowAll(false);
  }, []);

  // ── Day tab data ──────────────────────────────────────────────────
  const dayList = useMemo(() => expensesOn(expenses, dayDate), [expenses, dayDate]);
  const daySpent = sumAmount(dayList);

  // ── Week tab data ─────────────────────────────────────────────────
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekList = useMemo(() => {
    const s = toISODate(weekStart), e = toISODate(weekEnd);
    return expenses.filter((x) => { const d = x.date.slice(0, 10); return d >= s && d <= e; });
  }, [expenses, weekStart, weekEnd]);
  const weekSpent = sumAmount(weekList);

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

  // ── Year tab data ─────────────────────────────────────────────────
  const yearMonthTotals = useMemo(() => (
    Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: new Date(yearNum, i, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      total: sumAmount(expensesInMonth(expenses, yearNum, i)),
    }))
  ), [expenses, yearNum]);
  const yearSpent = yearMonthTotals.reduce((s, m) => s + m.total, 0);

  // ── Shared drill-down (Month + Week tabs) ─────────────────────────
  const selectedList = selectedDay ? expensesOn(expenses, selectedDay) : null;
  const displayedList = selectedList ? (showAll ? selectedList : selectedList.slice(0, 5)) : null;

  const tabBarReserve = (Platform.OS === 'ios' ? 96 : 86) + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Reports" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Tab bar ────────────────────────────────────────────── */}
        <View style={styles.periodRow}>
          {(['Day', 'Week', 'Month', 'Year'] as const).map((p) => (
            <Pressable
              key={p}
              style={[styles.period, activeTab === p && styles.periodActive]}
              onPress={() => setActiveTab(p)}
            >
              <Text style={[styles.periodText, activeTab === p && { color: C.onPurple }]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Day tab ────────────────────────────────────────────── */}
        {activeTab === 'Day' && (
          <>
            <View style={styles.stepper}>
              <Pressable onPress={() => setDayDate(addDays(dayDate, -1))}>
                <Text style={styles.arrow}>←</Text>
              </Pressable>
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
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatMoney(daySpent)}</Text>
              </View>
            </View>

            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
              {dayList.length === 0 ? (
                <Text style={{ color: C.mute, marginTop: 8 }}>No expenses on this day.</Text>
              ) : dayList.map((t) => (
                <Pressable key={t.id} onPress={() => router.push('/add-edit?id=' + t.id)} style={styles.dayRow}>
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
          </>
        )}

        {/* ── Week tab ───────────────────────────────────────────── */}
        {activeTab === 'Week' && (
          <>
            <View style={styles.stepper}>
              <Pressable onPress={() => { setWeekStart(addDays(weekStart, -7)); setSelectedDay(null); setShowAll(false); }}>
                <Text style={styles.arrow}>←</Text>
              </Pressable>
              <Text style={styles.stepperTitle}>{toShortDate(weekStart)} – {toShortDate(weekEnd)}</Text>
              <Pressable disabled={atWeekBoundary} onPress={() => { setWeekStart(addDays(weekStart, 7)); setSelectedDay(null); setShowAll(false); }}>
                <Text style={[styles.arrow, atWeekBoundary && styles.arrowDisabled]}>→</Text>
              </Pressable>
            </View>

            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>WEEK TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatMoney(weekSpent)}</Text>
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
                    style={[
                      styles.weekDayTile,
                      isSel && { backgroundColor: C.purple, borderColor: C.purple },
                      !isSel && isToday && { backgroundColor: C.purpleSoft, borderColor: C.purple },
                    ]}
                    onPress={() => { setSelectedDay(day); setShowAll(false); }}
                  >
                    <Text style={[styles.weekDayName, isSel && { color: C.onPurple }, !isSel && isToday && { color: C.purpleDark }]}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[styles.weekDayNum, isSel && { color: C.onPurple }, !isSel && isToday && { color: C.purpleDark }]}>
                      {day.getDate()}
                    </Text>
                    {amt > 0 && (
                      <Text style={[styles.weekDayAmt, isSel && { color: C.onPurple }]}>
                        {currency.symbol}{Math.round(amt)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {selectedList && selectedDay && (
              <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={styles.dayTitle}>{selectedDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  <Text style={styles.dayTotal}>{currency.symbol}{formatMoney(sumAmount(selectedList))}</Text>
                </View>
                {selectedList.length > 5 && !showAll && (
                  <Pressable onPress={() => setShowAll(true)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                    <Text style={{ color: C.purpleDark, fontWeight: '700', fontSize: 13 }}>
                      Show all transactions ({selectedList.length})
                    </Text>
                  </Pressable>
                )}
                {selectedList.length === 0 ? (
                  <Text style={{ color: C.mute, marginTop: 8 }}>No expenses that day.</Text>
                ) : displayedList!.map((t) => (
                  <Pressable key={t.id} onPress={() => router.push('/add-edit?id=' + t.id)} style={styles.dayRow}>
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
            {!selectedList && <Text style={styles.hint}>✎  tap a day to drill in</Text>}
          </>
        )}

        {/* ── Month tab ──────────────────────────────────────────── */}
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
              theme={calendarTheme}
              style={{ marginHorizontal: 8, marginTop: 12 }}
            />

            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>MONTH TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatMoney(monthSpent)}</Text>
              </View>
              <View style={{ width: 10 }} />
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>VS LAST MONTH</Text>
                <Text style={styles.totalValue}>{deltaPct >= 0 ? '+' : ''}{deltaPct}%  {deltaPct >= 0 ? '↑' : '↓'}</Text>
              </View>
            </View>

            {selectedList && selectedDay && (
              <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={styles.dayTitle}>{selectedDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  <Text style={styles.dayTotal}>{currency.symbol}{formatMoney(sumAmount(selectedList))}</Text>
                </View>
                {selectedList.length > 5 && !showAll && (
                  <Pressable onPress={() => setShowAll(true)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                    <Text style={{ color: C.purpleDark, fontWeight: '700', fontSize: 13 }}>
                      Show all transactions ({selectedList.length})
                    </Text>
                  </Pressable>
                )}
                {selectedList.length === 0 ? (
                  <Text style={{ color: C.mute, marginTop: 8 }}>No expenses that day.</Text>
                ) : displayedList!.map((t) => (
                  <Pressable key={t.id} onPress={() => router.push('/add-edit?id=' + t.id)} style={styles.dayRow}>
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
            {!selectedList && <Text style={styles.hint}>✎  tap a day to drill in</Text>}
          </>
        )}

        {/* ── Year tab ───────────────────────────────────────────── */}
        {activeTab === 'Year' && (
          <>
            <View style={styles.stepper}>
              <Pressable onPress={() => setYearNum(yearNum - 1)}>
                <Text style={styles.arrow}>←</Text>
              </Pressable>
              <Text style={styles.stepperTitle}>{yearNum}</Text>
              <Pressable disabled={atYearBoundary} onPress={() => setYearNum(yearNum + 1)}>
                <Text style={[styles.arrow, atYearBoundary && styles.arrowDisabled]}>→</Text>
              </Pressable>
            </View>

            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: C.purpleSoft }]}>
                <Text style={styles.totalLabel}>YEAR TOTAL</Text>
                <Text style={[styles.totalValue, { color: C.purpleDark }]}>{currency.symbol}{formatMoney(yearSpent)}</Text>
              </View>
            </View>

            <View style={styles.yearGrid}>
              {yearMonthTotals.map(({ month: m, label, total }) => {
                const isCurrent = yearNum === today.getFullYear() && m === today.getMonth();
                return (
                  <Pressable
                    key={m}
                    style={[styles.yearCell, isCurrent && { backgroundColor: C.purpleSoft }]}
                    onPress={() => { setCursor(new Date(yearNum, m, 1)); setActiveTab('Month'); setSelectedDay(null); setShowAll(false); }}
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
  arrow: { fontSize: 22, color: C.mute, paddingHorizontal: 10 },
  arrowDisabled: { opacity: 0.25 },
  stepperTitle: { fontSize: 16, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  totalsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16 },
  totalCard: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  totalLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2 },
  weekStrip: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 14, gap: 4 },
  weekDayTile: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.line },
  weekDayName: { fontSize: 9, fontWeight: '700', color: C.mute, letterSpacing: 0.5 },
  weekDayNum: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 2 },
  weekDayAmt: { fontSize: 8, fontWeight: '700', color: C.purpleDark, marginTop: 2 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 14, gap: 10 },
  yearCell: { width: '47%', padding: 12, borderWidth: 1.5, borderColor: C.ink, borderRadius: 12, backgroundColor: C.white },
  yearMonth: { fontSize: 11, fontWeight: '700', color: C.mute, letterSpacing: 1 },
  yearAmt: { fontSize: 20, fontWeight: '800', color: C.ink, marginTop: 4 },
  dayTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  dayTotal: { fontSize: 20, fontWeight: '800', color: C.purpleDark },
  dayRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  txCat: { fontSize: 14, fontWeight: '700', color: C.ink },
  txAmt: { fontSize: 18, fontWeight: '800', color: C.ink },
  hint: { color: C.purpleDark, fontWeight: '600', paddingHorizontal: 20, marginTop: 12, fontSize: 13 },
});

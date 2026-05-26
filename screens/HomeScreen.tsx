import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import { sumAmount, expensesInMonth, expensesOn, formatMoney } from '../utils/expenses';
import { useColors } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import type { Colors } from '../theme';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { expenses, budget, userName, profileImage, currency } = useAppStore();
  const firstName = userName ? userName.split(' ')[0] : 'there';
  const avatarLetter = userName ? userName[0].toUpperCase() : '?';
  const now = new Date();

  const stats = useMemo(() => {
    const monthList = expensesInMonth(expenses, now.getFullYear(), now.getMonth());
    const monthSpent = sumAmount(monthList);
    const todayList = expensesOn(expenses, now);
    const todaySpent = sumAmount(todayList);

    const dow = (now.getDay() + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - dow);
    const weekList = expenses.filter((x) => new Date(x.date) >= weekStart && new Date(x.date) <= now);
    const weekSpent = sumAmount(weekList);

    const dayAvg = now.getDate() > 0 ? monthSpent / now.getDate() : 0;
    const remaining = budget > 0 ? Math.max(0, budget - monthSpent) : 0;
    const pct = budget > 0 ? Math.min(100, (monthSpent / budget) * 100) : 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedMonthEnd = Math.round(dayAvg * daysInMonth);

    return { monthSpent, todaySpent, weekSpent, dayAvg, remaining, pct, projectedMonthEnd, daysInMonth };
  }, [expenses, budget]);

  const [showAllTx, setShowAllTx] = useState(false);
  const allSorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayedTx = showAllTx ? allSorted : allSorted.slice(0, 5);

  const dailyAvgTooltip =
    `Total spent this month ÷ ${now.getDate()} days elapsed\n` +
    `= ${currency.symbol}${formatMoney(stats.dayAvg)}/day\n\n` +
    `At this pace you'll spend ~${currency.symbol}${formatMoney(stats.projectedMonthEnd, false)} by month end.`;

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  const tabBarReserve = Platform.OS === 'ios' ? 96 : 86;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 20 }}>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.date}>{dateStr}</Text>
            <Text style={styles.greet}>Hey, {firstName} 👋</Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => router.navigate('/(tabs)/profile')}>
            {profileImage
              ? <Image source={{ uri: profileImage }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{avatarLetter}</Text>
            }
          </Pressable>
        </View>

        <View style={styles.balCard}>
          {budget > 0 ? (
            <>
              <Text style={styles.balLabel}>REMAINING THIS MONTH</Text>
              <View style={styles.balRow}>
                <Text style={styles.balCurrency}>{currency.symbol}</Text>
                <Text style={styles.balAmount}>{formatMoney(stats.remaining, false)}</Text>
                <Text style={styles.balCents}>.{(stats.remaining % 1).toFixed(2).slice(2) || '00'}</Text>
              </View>
              <Text style={styles.balSub}>of {currency.symbol}{formatMoney(budget, false)} budget</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${stats.pct}%` }]} />
              </View>
              <View style={styles.barMeta}>
                <Text style={styles.barMetaText}>spent {currency.symbol}{formatMoney(stats.monthSpent)}</Text>
                <Text style={styles.barMetaText}>{Math.round(stats.pct)}%</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.balLabel}>SPENT THIS MONTH</Text>
              <View style={styles.balRow}>
                <Text style={styles.balCurrency}>{currency.symbol}</Text>
                <Text style={styles.balAmount}>{formatMoney(stats.monthSpent, false)}</Text>
                <Text style={styles.balCents}>.{(stats.monthSpent % 1).toFixed(2).slice(2) || '00'}</Text>
              </View>
              <Text style={styles.balSub}>
                {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatCard label="TODAY" value={`${currency.symbol}${formatMoney(stats.todaySpent, false)}`} />
          <View style={{ width: 10 }} />
          <StatCard label="THIS WEEK" value={`${currency.symbol}${formatMoney(stats.weekSpent, false)}`} />
          <View style={{ width: 10 }} />
          <StatCard label="DAILY AVG" value={`${currency.symbol}${formatMoney(stats.dayAvg)}`} tooltip={dailyAvgTooltip} />
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{showAllTx ? 'All Transactions' : 'Recent'}</Text>
          <Pressable onPress={() => setShowAllTx(v => !v)}>
            <Text style={styles.seeAll}>{showAllTx ? '← less' : 'see all →'}</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {displayedTx.map((t, i) => (
            <Pressable
              key={t.id}
              onPress={() => router.push('/add-edit?id=' + t.id)}
              style={[styles.txRow, i < displayedTx.length - 1 && styles.txDivider]}
            >
              <View style={styles.txIcon}>
                <Text style={{ fontSize: 16 }}>{t.icon || '💵'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txCat}>{t.category}</Text>
                <Text style={styles.txNote}>{t.note}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txAmt}>-{currency.symbol}{formatMoney(t.amount)}</Text>
                {t.receipt ? <Text style={{ fontSize: 10, color: C.mute, marginTop: 2 }}>📎 receipt</Text> : null}
              </View>
            </Pressable>
          ))}
          {allSorted.length === 0 && (
            <Text style={{ color: C.mute, textAlign: 'center', paddingVertical: 20 }}>
              No expenses yet. Tap + to add your first.
            </Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  date: { fontSize: 11, color: C.mute, letterSpacing: 1.5, fontWeight: '700' },
  greet: { fontSize: 26, fontWeight: '800', marginTop: 2, color: C.ink },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.purpleSoft,
    borderWidth: 1.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { color: C.purpleDark, fontWeight: '800' },
  balCard: {
    marginHorizontal: 20, marginTop: 8,
    backgroundColor: C.purple, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.ink, padding: 20,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 4,
  },
  balLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  balRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  balCurrency: { color: C.onPurple, fontSize: 28, fontWeight: '700', marginRight: 2, opacity: 0.8 },
  balAmount: { color: C.onPurple, fontSize: 46, fontWeight: '800', lineHeight: 50 },
  balCents: { color: 'rgba(255,255,255,0.7)', fontSize: 28, fontWeight: '700' },
  balSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  barTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: 18, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: C.onPurple, borderRadius: 4 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  barMetaText: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16 },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: C.ink },
  seeAll: { color: C.purpleDark, fontSize: 12, fontWeight: '700' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4 },
  txDivider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  txIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.purpleSoft,
    borderWidth: 1.25, borderColor: C.ink, alignItems: 'center', justifyContent: 'center',
  },
  txCat: { fontSize: 14, fontWeight: '700', color: C.ink },
  txNote: { fontSize: 11, color: C.mute },
  txAmt: { fontSize: 18, fontWeight: '800', color: C.ink, marginLeft: 8 },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../theme';

type StatCardProps = { label: string; value: string; tint?: boolean };

export default function StatCard({ label, value, tint }: StatCardProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.card, tint && { backgroundColor: C.purpleSoft }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tint && { color: C.purpleDark }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  card: {
    flex: 1, minHeight: 62, padding: 10,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 12,
    backgroundColor: C.white,
  },
  label: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  value: { fontSize: 20, fontWeight: '800', color: C.ink, marginTop: 2 },
});

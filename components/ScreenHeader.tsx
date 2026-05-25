import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../theme';

type ScreenHeaderProps = { title: string; left?: React.ReactNode; right?: React.ReactNode };

export default function ScreenHeader({ title, left, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {left}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.underline} />
        </View>
        {right}
      </View>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: C.paper,
    zIndex: 10,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  title: { fontSize: 32, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  underline: { height: 3, width: 72, backgroundColor: C.purple, borderRadius: 2, marginTop: 4 },
});

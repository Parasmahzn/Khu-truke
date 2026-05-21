import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../ThemeContext';
import type { Colors } from '../theme';

type LogoProps = { size?: number };

export default function Logo({ size = 48 }: LogoProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={[styles.dollar, { fontSize: size * 0.55 }]}>₹</Text>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  logo: {
    backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.ink,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 4,
  },
  dollar: { color: C.onPurple, fontWeight: '900' },
});

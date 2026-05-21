import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import { useColors } from '../ThemeContext';
import type { Colors } from '../theme';

type OnboardingScreenProps = { onDone: () => void };

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.skip} onPress={onDone}>
          <Text style={styles.skipText}>skip</Text>
        </Pressable>

        <View style={styles.heroRow}>
          <Logo size={110} />
          <Text style={styles.brand}>Khu₹truke</Text>
          <View style={styles.underline} />
        </View>

        <View style={styles.illoWrap}>
          <View style={styles.illo}>
            <Text style={styles.illoEmoji}>💸</Text>
            <Text style={styles.illoLabel}>TRACK · BUDGET · GROW</Text>
          </View>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.headline}>Track every penny.{'\n'}Spend with purpose.</Text>
          <Text style={styles.sub}>Simple expense tracking.{'\n'}Smart insights. Zero fluff.</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Pressable style={styles.cta} onPress={onDone}>
          <Text style={styles.ctaText}>Get Started  →</Text>
        </Pressable>

        <Text style={styles.footer}>
          Already have an account? <Text style={styles.footerLink}>Log in</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28 },
  skip: { position: 'absolute', top: 50, right: 24, padding: 8 },
  skipText: { color: C.mute, fontSize: 13 },
  heroRow: { alignItems: 'center', marginTop: 40 },
  brand: { fontSize: 38, fontWeight: '800', marginTop: 20, color: C.ink, letterSpacing: -0.5 },
  underline: { width: 130, height: 3, backgroundColor: C.purple, marginTop: 6, borderRadius: 2 },
  illoWrap: { marginTop: 36, alignItems: 'center' },
  illo: {
    width: 240, height: 170, borderWidth: 1.5, borderColor: C.line, borderRadius: 14,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.purpleSoft,
  },
  illoEmoji: { fontSize: 64 },
  illoLabel: { fontSize: 10, color: C.purpleDark, letterSpacing: 2, marginTop: 12, fontWeight: '700' },
  copyBlock: { marginTop: 28, alignItems: 'center' },
  headline: { fontSize: 26, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 32 },
  sub: { fontSize: 13, color: C.mute, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.line },
  dotActive: { width: 22, backgroundColor: C.purple },
  cta: {
    height: 52, borderRadius: 14, backgroundColor: C.purple,
    borderWidth: 1.5, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 4,
  },
  ctaText: { color: C.onPurple, fontSize: 20, fontWeight: '800' },
  footer: { textAlign: 'center', marginTop: 14, fontSize: 12, color: C.mute },
  footerLink: { color: C.purple, fontWeight: '700' },
});

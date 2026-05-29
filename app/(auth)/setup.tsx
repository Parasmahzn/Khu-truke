import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import { useColors } from '../../context/ThemeContext';
import { RADIUS } from '../../theme';
import type { Colors } from '../../theme';
import { CURRENCIES } from '../../constants';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../../hooks/useUserProfile';
import { sanitizeUserNameInput, validateUserName } from '../../utils/validation';

export default function SetupScreen() {
  const { completeSetup } = useUserProfile();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [nameError, setNameError] = useState('');

  const submit = () => {
    const err = validateUserName(name);
    if (err) { setNameError(err); return; }
    handleDone(name.trim(), currencyCode);
  };

  const handleDone = async (n: string, code: string) => {
    await completeSetup(n, code);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={52} />

        <Text style={styles.title}>Let's get you{'\n'}set up.</Text>
        <Text style={styles.sub}>Only takes a moment.</Text>

        <Text style={styles.fieldLabel}>YOUR NAME</Text>
        <View style={[styles.inputWrap, !!nameError && styles.inputErr]}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={C.mute}
            value={name}
            onChangeText={(v) => { setName(sanitizeUserNameInput(v)); setNameError(''); }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </View>
        {nameError ? <Text style={styles.errText}>{nameError}</Text> : null}

        <Text style={[styles.fieldLabel, { marginTop: 26 }]}>CURRENCY</Text>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => {
            const active = c.code === currencyCode;
            return (
              <Pressable
                key={c.code}
                style={[styles.currencyChip, active && styles.currencyChipActive]}
                onPress={() => setCurrencyCode(c.code)}
              >
                <Text style={[styles.currencySymbol, active && styles.activeText]}>{c.symbol}</Text>
                <Text style={[styles.currencyCode, active && styles.activeText]}>{c.code}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 48 }} />

        <Pressable style={styles.cta} onPress={submit}>
          <Text style={styles.ctaText}>Let's go  →</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  inner: { flexGrow: 1, paddingHorizontal: 28 },
  title: { fontSize: 32, fontWeight: '900', color: C.ink, marginTop: 24, lineHeight: 38 },
  sub: { fontSize: 14, color: C.mute, marginTop: 6, marginBottom: 32 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.mute, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.ink, borderRadius: RADIUS.md,
    paddingHorizontal: 14, height: 54, backgroundColor: C.white,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, elevation: 3,
  },
  inputErr: { borderColor: C.danger },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: C.ink },
  errText: { fontSize: 11, color: C.danger, marginTop: 4 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  currencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: RADIUS.pill, backgroundColor: C.white,
  },
  currencyChipActive: {
    backgroundColor: C.purple, borderColor: C.purple,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, elevation: 3,
  },
  currencySymbol: { fontSize: 15, fontWeight: '700', color: C.ink },
  currencyCode: { fontSize: 12, fontWeight: '700', color: C.mute },
  activeText: { color: C.onPurple },
  cta: {
    height: 54, borderRadius: RADIUS.lg, backgroundColor: C.purple,
    borderWidth: 1.5, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 3, height: 3 }, shadowRadius: 0, elevation: 5,
  },
  ctaText: { color: C.onPurple, fontSize: 20, fontWeight: '800' },
});

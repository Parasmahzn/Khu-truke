import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Image, Modal, TextInput, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Chip from '../components/Chip';
import { useAppStore } from '../store';
import { formatMoney } from '../utils/expenses';
import { CURRENCIES } from '../constants';
import { useColors, useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import type { Colors } from '../theme';

const makeStyles = (C: Colors) => StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.purple,
    borderWidth: 1.5, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    overflow: 'visible',
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: C.ink },
  avatarText: { color: C.onPurple, fontSize: 30, fontWeight: '900' },
  editBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.purpleSoft, borderWidth: 1.5, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 6 },
  label: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 24 },
  listCard: {
    marginHorizontal: 20, marginTop: 8,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 14,
    backgroundColor: C.white, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  rowIconWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, color: C.ink },
  rowValue: { fontSize: 12, color: C.mute, marginRight: 6 },
  currencyPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.line, borderStyle: 'dashed',
  },
  currencyChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 999, backgroundColor: C.white,
  },
  currencyChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  currencyChipText: { fontSize: 13, fontWeight: '700', color: C.ink },
  budgetCard: {
    marginHorizontal: 20, marginTop: 8,
    backgroundColor: C.purpleSoft, borderWidth: 1.5, borderColor: C.ink, borderRadius: 14,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 2,
  },
  budgetAmount: { fontSize: 26, fontWeight: '900', color: C.purpleDark },
  budgetNotSet: { fontSize: 26, fontWeight: '900', color: C.mute },
  budgetSub: { fontSize: 11, color: C.mute, marginTop: 3 },
  budgetEditArrow: { fontSize: 15, fontWeight: '800', color: C.purpleDark },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.ink, padding: 20,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 3, height: 3 }, shadowRadius: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  modalHint: { fontSize: 12, color: C.mute, marginTop: 4 },
  modalAmtRow: {
    flexDirection: 'row', alignItems: 'baseline', marginTop: 16,
    borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 6,
  },
  modalSymbol: { fontSize: 28, color: C.mute, fontWeight: '700' },
  modalInput: { flex: 1, fontSize: 44, color: C.purple, fontWeight: '900', marginLeft: 4, padding: 0 },
  modalBtns: { flexDirection: 'row', gap: 8, marginTop: 18 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink },
  modalBtnGhost: { backgroundColor: C.white },
  ghostText: { color: C.ink, fontWeight: '700' },
  modalBtnPrimary: { backgroundColor: C.purple },
  primaryText: { color: C.onPurple, fontWeight: '800' },
  logout: {
    marginHorizontal: 20, marginTop: 22, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logoutText: { color: C.ink, fontSize: 16, fontWeight: '800' },
});

type RowProps = {
  icon: string;
  label: string;
  value?: string;
  right?: React.ReactNode;
  last?: boolean;
  onPress?: () => void;
  styles: ReturnType<typeof makeStyles>;
  C: Colors;
};

function Row({ icon, label, value, right, last, onPress, styles, C }: RowProps) {
  const Inner = onPress ? Pressable : View;
  return (
    <Inner onPress={onPress} style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon as any} size={18} color={C.ink} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {right ? right : (
        <>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={C.mute} />
        </>
      )}
    </Inner>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isDark, toggleDark } = useTheme();
  const { expenses, userName, profileImage, saveProfileImage, budget, saveBudget, currency, saveCurrency } = useAppStore();
  const avatarLetter = userName ? userName[0].toUpperCase() : '?';
  const [notif, setNotif] = useState(true);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState('');

  const pickImage = () => {
    const options = [
      {
        text: 'Camera', onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permission needed', 'Allow camera access to take a photo.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7 });
          if (!result.canceled) saveProfileImage(result.assets[0].uri);
        },
      },
      {
        text: 'Photo Library', onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to pick an image.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          if (!result.canceled) saveProfileImage(result.assets[0].uri);
        },
      },
      ...(profileImage ? [{
        text: 'Remove Photo', style: 'destructive' as const,
        onPress: () => saveProfileImage(null),
      }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert('Profile Photo', 'Choose a source', options);
  };

  const onExport = () => {
    const csv = ['id,date,amount,category,note,tags']
      .concat(expenses.map((x) => [
        x.id, x.date, x.amount, x.category,
        (x.note || '').replace(/,/g, ';'),
        (x.tags || []).join('|'),
      ].join(',')))
      .join('\n');
    Alert.alert('Export ready', `${expenses.length} expenses prepared as CSV (${csv.length} chars).`);
  };

  const onLogout = () => {
    Alert.alert('Go to welcome screen?', 'Your data will be kept safe.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => { router.replace('/(auth)/onboarding'); } },
    ]);
  };

  const tabBarReserve = Platform.OS === 'ios' ? 96 : 86;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        <View style={styles.avatarRow}>
          <Pressable style={styles.avatarWrap} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={C.purpleDark} />
            </View>
          </Pressable>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.name}>{userName || 'You'}</Text>
            <Chip active onPress={pickImage}>change photo</Chip>
          </View>
        </View>

        <Text style={styles.label}>MONTHLY BUDGET LIMIT</Text>
        <Pressable
          style={styles.budgetCard}
          onPress={() => { setDraftBudget(budget > 0 ? String(budget) : ''); setBudgetOpen(true); }}
        >
          <View>
            {budget > 0 ? (
              <Text style={styles.budgetAmount}>{currency.symbol}{formatMoney(budget)}</Text>
            ) : (
              <Text style={styles.budgetNotSet}>Not set</Text>
            )}
            <Text style={styles.budgetSub}>resets on the 1st · tap to {budget > 0 ? 'edit' : 'set'}</Text>
          </View>
          <Text style={styles.budgetEditArrow}>edit →</Text>
        </Pressable>

        <Text style={styles.label}>SETTINGS</Text>
        <View style={styles.listCard}>
          <Row icon="settings-outline" label="Manage categories" onPress={() => router.push('/settings')} styles={styles} C={C} />
        </View>

        <Text style={styles.label}>PREFERENCES</Text>
        <View style={styles.listCard}>
          <Row icon="cash-outline" label="Currency" value={`${currency.symbol} ${currency.code}`} onPress={() => setCurrencyOpen((v) => !v)} styles={styles} C={C} />
          {currencyOpen && (
            <View style={styles.currencyPicker}>
              {CURRENCIES.map((c) => {
                const active = c.code === currency.code;
                return (
                  <Pressable
                    key={c.code}
                    style={[styles.currencyChip, active && styles.currencyChipActive]}
                    onPress={() => { saveCurrency(c.code); setCurrencyOpen(false); }}
                  >
                    <Text style={[styles.currencyChipText, active && { color: C.onPurple }]}>
                      {c.symbol}  {c.code}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <Row
            icon="notifications-outline"
            label="Notifications"
            right={<Switch value={notif} onValueChange={setNotif} trackColor={{ true: C.purple, false: C.line }} thumbColor="#fff" />}
            styles={styles} C={C}
          />
          <Row
            icon="moon-outline"
            label="Dark mode"
            right={<Switch value={isDark} onValueChange={toggleDark} trackColor={{ true: C.purple, false: C.line }} thumbColor="#fff" />}
            styles={styles} C={C}
          />
          <Row icon="share-outline" label="Export data" value="csv · pdf" last onPress={onExport} styles={styles} C={C} />
        </View>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={C.ink} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

      </ScrollView>

      <Modal visible={budgetOpen} transparent animationType="fade" onRequestClose={() => setBudgetOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setBudgetOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Monthly Budget Limit</Text>
            <Text style={styles.modalHint}>Set to 0 to remove the limit.</Text>
            <View style={styles.modalAmtRow}>
              <Text style={styles.modalSymbol}>{currency.symbol}</Text>
              <TextInput
                value={draftBudget}
                onChangeText={(v) => setDraftBudget(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={C.mute}
                style={styles.modalInput}
                autoFocus
                selectTextOnFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setBudgetOpen(false)}>
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  const val = parseFloat(draftBudget) || 0;
                  if (val < 0 || val > 9_999_999) { Alert.alert('Invalid amount', 'Budget must be between 0 and 9,999,999.'); return; }
                  saveBudget(val);
                  setBudgetOpen(false);
                }}
              >
                <Text style={styles.primaryText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

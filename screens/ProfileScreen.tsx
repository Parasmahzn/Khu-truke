import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Image, Modal, TextInput, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import LegalModal from '../components/LegalModal';
import { useAppStore } from '../store';
import { formatMoney } from '../utils/expenses';
import { CURRENCIES, SUPPORT_EMAIL, APP_DEVELOPER, APP_VERSION, PRIVACY_POLICY_SECTIONS, TERMS_SECTIONS } from '../constants';
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
  avatarInner: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 80, height: 80 },
  avatarText: { color: C.onPurple, fontSize: 30, fontWeight: '900' },
  editBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.purpleSoft, borderWidth: 1.5, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 2 },
  savingSince: { fontSize: 12, color: C.mute, fontWeight: '600' },
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
  imageViewBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  imageViewImg: { width: '85%', aspectRatio: 1, borderRadius: 16 },
  imageViewClose: {
    position: 'absolute', top: 52, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
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
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isDark, toggleDark } = useTheme();
  const { expenses, userName, profileImage, saveProfileImage, budget, saveBudget, currency, saveCurrency, joinedAt } = useAppStore();
  const avatarLetter = userName ? userName[0].toUpperCase() : '?';
  const savingSince = joinedAt
    ? new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const [notif, setNotif] = useState(true);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState('');
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const pickImage = () => {
    if (profileImage) {
      Alert.alert('Profile Photo', 'What would you like to do?', [
        { text: 'Remove Photo', style: 'destructive', onPress: () => saveProfileImage(null) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    Alert.alert('Profile Photo', 'Choose a source', [
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
            mediaTypes: 'images' as ImagePicker.MediaType,
          });
          if (!result.canceled) saveProfileImage(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
    Alert.alert(
      'Clear all data?',
      'This will permanently delete all your expenses, budget, profile information, and app settings. This action cannot be undone.\n\nDo you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => { router.replace('/(auth)/onboarding'); } },
      ],
    );
  };

  const tabBarReserve = (Platform.OS === 'ios' ? 96 : 86) + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingBottom: tabBarReserve }}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

        <View style={styles.avatarRow}>
          <Pressable
            style={styles.avatarWrap}
            onPress={() => profileImage ? setImageViewOpen(true) : pickImage()}
          >
            <View style={styles.avatarInner}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              )}
            </View>
            <Pressable style={styles.editBadge} onPress={pickImage} hitSlop={8}>
              <Ionicons name="pencil" size={12} color={C.purpleDark} />
            </Pressable>
          </Pressable>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.name}>{userName || 'You'}</Text>
            {savingSince && (
              <Text style={styles.savingSince}>Saving since {savingSince}</Text>
            )}
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
                    onPress={() => {
                    if (c.code === currency.code) return;
                    Alert.alert(
                      `Switch to ${c.code}?`,
                      `Your ${currency.code} expenses and budget are saved separately and won't be lost. You'll see ${c.code} data instead — switch back anytime to pick up where you left off.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Switch', onPress: () => { saveCurrency(c.code); setCurrencyOpen(false); } },
                      ]
                    );
                  }}
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
            right={<Switch value={notif} onValueChange={setNotif} trackColor={{ true: C.purple, false: C.line }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />}
            styles={styles} C={C}
          />
          <Row
            icon="moon-outline"
            label="Dark mode"
            right={<Switch value={isDark} onValueChange={toggleDark} trackColor={{ true: C.purple, false: C.line }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />}
            styles={styles} C={C}
          />
          <Row icon="share-outline" label="Export data" value="csv · pdf" last onPress={onExport} styles={styles} C={C} />
        </View>

        <Text style={styles.label}>SUPPORT</Text>
        <View style={styles.listCard}>
          <Row icon="chatbubble-outline" label="Feedback" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} styles={styles} C={C} />
          <Row icon="star-outline" label="Rate App" onPress={() => Alert.alert('Rate Khu₹truke', 'Play Store listing coming soon!')} styles={styles} C={C} />
          <Row icon="bug-outline" label="Report a Bug" last onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Bug%20Report`)} styles={styles} C={C} />
        </View>

        <Text style={styles.label}>ABOUT</Text>
        <View style={styles.listCard}>
          <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => setPrivacyOpen(true)} styles={styles} C={C} />
          <Row icon="document-text-outline" label="Terms of Use" onPress={() => setTermsOpen(true)} styles={styles} C={C} />
          <Row icon="information-circle-outline" label="App Version" right={<Text style={styles.rowValue}>{APP_VERSION}</Text>} styles={styles} C={C} />
          <Row icon="person-outline" label="Developed by" right={<Text style={styles.rowValue}>{APP_DEVELOPER}</Text>} last styles={styles} C={C} />
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

      <LegalModal
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Privacy Policy"
        lastUpdated="May 25, 2026"
        sections={PRIVACY_POLICY_SECTIONS}
      />

      <LegalModal
        visible={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="Terms of Use"
        lastUpdated="May 25, 2026"
        sections={TERMS_SECTIONS}
      />

      <Modal visible={imageViewOpen} transparent animationType="fade" onRequestClose={() => setImageViewOpen(false)}>
        <Pressable style={styles.imageViewBg} onPress={() => setImageViewOpen(false)}>
          {profileImage && (
            <Image source={{ uri: profileImage }} style={styles.imageViewImg} resizeMode="contain" />
          )}
          <View style={styles.imageViewClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

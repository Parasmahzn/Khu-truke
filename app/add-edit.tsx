import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, Modal, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Logo from '../components/Logo';
import Chip from '../components/Chip';
import { useExpenses } from '../hooks/useExpenses';
import { useUserProfile } from '../hooks/useUserProfile';
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { EMOJI_SUGGESTIONS, PAYMENT_TYPES } from '../constants';
import { useColors } from '../context/ThemeContext';
import { RADIUS } from '../theme';
import type { Colors } from '../theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { sanitizeAmountInput, validateAmountField, AMOUNT_MIN } from '../utils/validation';

export default function AddEditScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { currency } = useUserProfile();
  const { customCategories, builtInCategories, addCustomCategory } = useCategories();
  const { allTags, addCustomTag } = useTags();

  const existing = id ? (expenses.find((e) => e.id === id) ?? null) : null;
  const isEdit = !!existing;

  const allCategories = [...builtInCategories, ...customCategories].filter(
    (cat, i, arr) => arr.findIndex((c) => c.name === cat.name) === i,
  );

  const [amount, setAmount] = useState(existing ? existing.amount.toFixed(2) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Groceries');
  const [icon, setIcon] = useState(existing?.icon ?? '🛒');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [receipt, setReceipt] = useState<string | null>(existing?.receipt ?? null);
  const [paymentType, setPaymentType] = useState<string>(existing?.paymentType ?? 'Cash');
  const [saving, setSaving] = useState(false);

  const [addTagOpen, setAddTagOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const tagInputRef = useRef<TextInput>(null);

  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatError, setNewCatError] = useState('');
  const nameInputRef = useRef<TextInput>(null);
  const emojiInputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);
  const [amountFocused, setAmountFocused] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      const t = setTimeout(() => amountInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, []);

  const customTags = tags.filter((t) => !allTags.includes(t));

  const pickReceipt = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow camera access to scan a receipt.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled) setReceipt(result.assets[0].uri);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to upload a receipt.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        mediaTypes: 'images' as ImagePicker.MediaType,
      });
      if (!result.canceled) setReceipt(result.assets[0].uri);
    }
  };

  const toggleTag = (t: string) =>
    setTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);

  const openAddTag = () => { setTagInput(''); setTagError(''); setAddTagOpen(true); };
  const closeAddTag = () => { setAddTagOpen(false); setTagInput(''); setTagError(''); };
  const saveTag = () => {
    const t = tagInput.trim().replace(/[^a-z0-9-]/gi, '').toLowerCase();
    if (!t) { setTagError('Enter a tag name'); return; }
    if (allTags.includes(t)) { setTagError('A tag with this name already exists'); return; }
    if (tags.includes(t)) { setTagError('Already added'); return; }
    addCustomTag(t);
    setTags((cur) => [...cur, t]);
    closeAddTag();
  };

  const displayAmount = useMemo(() => {
    if (!amount) return { whole: '0', cents: '00' };
    const [w = '0', c = ''] = amount.split('.');
    const formattedWhole = (parseInt(w, 10) || 0).toLocaleString('en-US');
    return { whole: formattedWhole, cents: (c + '00').slice(0, 2) };
  }, [amount]);

  const onSave = () => {
    if (saving) return;
    const num = parseFloat(amount);
    if (!num || num < AMOUNT_MIN) {
      Alert.alert('Amount required', 'Enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    const payload = {
      amount: num,
      note: note.trim(),
      category, icon, tags,
      receipt: receipt || null,
      date: existing?.date ?? new Date().toISOString(),
      paymentType,
    };
    if (isEdit) updateExpense(existing.id, payload);
    else addExpense(payload);
    router.back();
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteExpense(existing.id); router.back(); } },
    ]);
  };

  const saveNewCategory = () => {
    if (!newCatName.trim()) { setNewCatError('Enter a category name'); return; }
    const trimmed = newCatName.trim().toLowerCase();
    const exists = [...builtInCategories, ...customCategories].some(
      (c) => c.name.toLowerCase() === trimmed,
    );
    if (exists) { setNewCatError('A category with this name already exists'); return; }
    const emoji = newCatEmoji.trim() || '📦';
    const cat = { name: newCatName.trim(), icon: emoji };
    addCustomCategory(cat);
    setCategory(cat.name);
    setIcon(cat.icon);
    setNewCatEmoji(''); setNewCatName(''); setNewCatError('');
    setAddCatOpen(false);
  };

  const closeCatModal = () => {
    setAddCatOpen(false);
    setNewCatEmoji(''); setNewCatName(''); setNewCatError('');
  };

  const dateStr = new Date(existing?.date ?? Date.now())
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Text style={styles.cancel}>✕ cancel</Text></Pressable>
        <View style={styles.logoGroup}>
          <Logo size={44} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Expense' : 'New Expense'}</Text>
            <Text style={styles.headerDate}>{dateStr}</Text>
          </View>
        </View>
        <Pressable onPress={onSave} disabled={saving}>
          <Text style={[styles.save, saving && { opacity: 0.4 }]}>save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.amountBlock}>
          <Text style={styles.label}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>{currency.symbol}</Text>
            <Text style={styles.amountWhole}>{displayAmount.whole}</Text>
            <Text style={styles.amountCents}>.{displayAmount.cents}</Text>
          </View>
          <View style={[styles.amountUnderline, amountFocused && styles.amountUnderlineFocused]} />
          <TextInput
            ref={amountInputRef}
            value={amount}
            onChangeText={(v) => {
              const s = sanitizeAmountInput(v);
              if (validateAmountField(s)) setAmount(s);
            }}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.hiddenInput}
            contextMenuHidden={true}
            caretHidden={true}
            selectTextOnFocus={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>CATEGORY</Text>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {allCategories.map((c, i) => (
              <Pressable
                key={String(i)}
                onPress={() => { setCategory(c.name); setIcon(c.icon); }}
                style={[styles.catChip, category === c.name && styles.catChipActive]}
              >
                <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                <Text style={[styles.catName, category === c.name && styles.catNameActive]}>{c.name}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.addCatChip} onPress={() => setAddCatOpen(true)}>
              <Text style={styles.addCatIcon}>+</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PAYMENT TYPE</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setPaymentType(type)}
                style={[styles.paymentChip, paymentType === type && styles.paymentChipActive]}
              >
                <Text style={[styles.paymentChipText, paymentType === type && styles.paymentChipTextActive]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>NOTE</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was it for?"
              placeholderTextColor={C.mute}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>TAGS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
            {allTags.map((t) => (
              <Chip key={t} active={tags.includes(t)} onPress={() => toggleTag(t)}>#{t}</Chip>
            ))}
            {customTags.map((t) => (
              <Chip key={t} active onPress={() => toggleTag(t)}>#{t}</Chip>
            ))}
            <Pressable style={styles.addTagChip} onPress={openAddTag}>
              <Text style={styles.addTagIcon}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>RECEIPT</Text>
          {receipt ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receipt }} style={styles.receiptImg} resizeMode="cover" />
              <Pressable style={styles.receiptRemoveBtn} onPress={() => setReceipt(null)}>
                <Text style={styles.receiptRemoveText}>✕</Text>
              </Pressable>
              <View style={styles.receiptActionRow}>
                <Pressable style={styles.receiptActionBtn} onPress={() => pickReceipt('camera')}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                  <Text style={styles.receiptActionLabel}>RETAKE</Text>
                </Pressable>
                <View style={styles.receiptActionDivider} />
                <Pressable style={styles.receiptActionBtn} onPress={() => pickReceipt('library')}>
                  <Text style={{ fontSize: 14 }}>🖼️</Text>
                  <Text style={styles.receiptActionLabel}>REPLACE</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              <Pressable style={styles.receiptSlot} onPress={() => pickReceipt('camera')}>
                <Text style={{ fontSize: 22, color: C.purple }}>📷</Text>
                <Text style={styles.receiptLabel}>SCAN</Text>
              </Pressable>
              <Pressable style={styles.receiptSlot} onPress={() => pickReceipt('library')}>
                <Text style={{ fontSize: 22, color: C.purple }}>🖼️</Text>
                <Text style={styles.receiptLabel}>UPLOAD</Text>
              </Pressable>
            </View>
          )}
        </View>

        {isEdit && (
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete expense</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={addCatOpen} transparent animationType="fade" onRequestClose={closeCatModal}>
        <Pressable style={styles.modalBg} onPress={closeCatModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Category</Text>
            <View style={styles.newCatRow}>
              <View style={styles.emojiBox}>
                <TextInput
                  ref={emojiInputRef}
                  value={newCatEmoji}
                  onChangeText={(v) => setNewCatEmoji(v)}
                  placeholder="😀"
                  placeholderTextColor={C.mute}
                  style={styles.emojiInput}
                  maxLength={4}
                />
              </View>
              <View style={[styles.nameBox, !!newCatError && { borderColor: C.danger }]}>
                <TextInput
                  ref={nameInputRef}
                  value={newCatName}
                  onChangeText={(v) => { setNewCatName(v); setNewCatError(''); }}
                  placeholder="Category name"
                  placeholderTextColor={C.mute}
                  style={styles.nameInput}
                  returnKeyType="done"
                  onSubmitEditing={saveNewCategory}
                />
              </View>
            </View>
            {newCatError ? <Text style={styles.errText}>{newCatError}</Text> : null}

            <Text style={styles.modalSubLabel}>SUGGESTIONS</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_SUGGESTIONS.map((e) => (
                <Pressable
                  key={e}
                  style={[styles.emojiCell, newCatEmoji === e && styles.emojiCellActive]}
                  onPress={() => { setNewCatEmoji(e); nameInputRef.current?.focus(); }}
                >
                  <Text style={{ fontSize: 16 }}>{e}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[
                  styles.emojiCell, styles.emojiCellCustom,
                  newCatEmoji && !EMOJI_SUGGESTIONS.includes(newCatEmoji) && styles.emojiCellActive,
                ]}
                onPress={() => emojiInputRef.current?.focus()}
              >
                <Text style={styles.customEmojiIcon}>✎</Text>
              </Pressable>
            </View>
            <Text style={styles.customHint}>tap ✎ to type any emoji from your keyboard</Text>

            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={closeCatModal}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveNewCategory}>
                <Text style={styles.primaryBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={addTagOpen} transparent animationType="fade" onRequestClose={closeAddTag}>
        <Pressable style={styles.modalBg} onPress={closeAddTag}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Tag</Text>
            <View style={[styles.tagModalInput, !!tagError && { borderColor: C.danger }]}>
              <Text style={styles.tagModalHash}>#</Text>
              <TextInput
                ref={tagInputRef}
                value={tagInput}
                onChangeText={(v) => { setTagInput(v.replace(/[^a-z0-9-]/gi, '').toLowerCase()); setTagError(''); }}
                placeholder="tag-name"
                placeholderTextColor={C.mute}
                style={styles.tagModalTextInput}
                returnKeyType="done"
                onSubmitEditing={saveTag}
                maxLength={20}
                autoFocus
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.tagModalHint}>lowercase letters, numbers, hyphens — max 20 chars</Text>
            {tagError ? <Text style={styles.errText}>{tagError}</Text> : null}
            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={closeAddTag}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveTag}>
                <Text style={styles.primaryBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1.5, borderBottomColor: C.ink,
  },
  cancel: { color: C.mute, fontSize: 14 },
  save: { color: C.purpleDark, fontWeight: '800', fontSize: 16 },
  logoGroup: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  headerDate: { fontSize: 9, color: C.mute, letterSpacing: 1.5, marginTop: 2, fontWeight: '700' },
  amountBlock: { alignItems: 'center', paddingTop: 28, paddingBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  currencySign: { fontSize: 28, color: C.mute, fontWeight: '700' },
  amountWhole: { fontSize: 64, fontWeight: '900', color: C.purple, lineHeight: 68, letterSpacing: -1 },
  amountCents: { fontSize: 36, color: C.mute, fontWeight: '700' },
  amountUnderline: { width: 180, height: 3, backgroundColor: C.line, borderRadius: 2, marginTop: 4 },
  amountUnderlineFocused: { backgroundColor: C.purple, shadowColor: C.purple, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3 },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0, top: 0, left: 0 },
  section: { paddingHorizontal: 20, marginTop: 18 },
  label: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white,
  },
  catChipActive: { backgroundColor: C.purpleSoft, borderColor: C.purple },
  catName: { fontSize: 13, color: C.ink, fontWeight: '600' },
  catNameActive: { color: C.purpleDark, fontWeight: '800' },
  addCatChip: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.ink, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, alignSelf: 'center',
  },
  addCatIcon: { fontSize: 22, color: C.purple, lineHeight: 26, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  paymentChip: {
    paddingHorizontal: 16, height: 34, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentChipActive: { backgroundColor: C.purpleSoft, borderColor: C.purple },
  paymentChipText: { fontSize: 12, fontWeight: '600', color: C.ink },
  paymentChipTextActive: { color: C.purpleDark, fontWeight: '800' },
  inputBox: {
    marginTop: 6, borderWidth: 1.5, borderColor: C.ink, borderRadius: 10,
    paddingHorizontal: 12, height: 44, justifyContent: 'center', backgroundColor: C.white,
  },
  input: { fontSize: 14, color: C.ink },
  tagModalInput: { flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.ink, paddingHorizontal: 14, backgroundColor: C.white, marginTop: 14, gap: 4 },
  tagModalHash: { fontSize: 18, fontWeight: '800', color: C.purpleDark },
  tagModalTextInput: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  tagModalHint: { fontSize: 10, color: C.mute, marginTop: 6, fontStyle: 'italic' },
  addTagChip: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.ink, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6, alignSelf: 'flex-start',
  },
  addTagIcon: { fontSize: 18, color: C.purple, fontWeight: '700', lineHeight: 22 },
  receiptSlot: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  receiptLabel: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  receiptPreview: {
    marginTop: 8, borderRadius: 12, borderWidth: 1.5, borderColor: C.ink, overflow: 'hidden',
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 3,
  },
  receiptImg: { width: '100%', height: 200 },
  receiptRemoveBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  receiptRemoveText: { color: C.onPurple, fontWeight: '900', fontSize: 12 },
  receiptActionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white },
  receiptActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  receiptActionDivider: { width: 1, backgroundColor: C.line },
  receiptActionLabel: { fontSize: 10, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  deleteBtn: {
    marginTop: 28, marginHorizontal: 20, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.danger, alignItems: 'center', justifyContent: 'center',
  },
  deleteText: { color: C.danger, fontWeight: '700', fontSize: 15 },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%', backgroundColor: C.white, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.ink, padding: 20,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 3, height: 3 }, shadowRadius: 0,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  newCatRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  emojiBox: {
    width: 56, height: 54, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.purpleSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiInput: { fontSize: 26, textAlign: 'center', width: '100%', padding: 0, color: C.ink },
  nameBox: {
    flex: 1, height: 54, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: C.ink, paddingHorizontal: 12, justifyContent: 'center',
    backgroundColor: C.white,
  },
  nameInput: { fontSize: 16, fontWeight: '600', color: C.ink },
  errText: { fontSize: 11, color: C.danger, marginTop: 4 },
  modalSubLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: C.mute, marginTop: 16, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiCell: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiCellActive: { borderColor: C.purple, backgroundColor: C.purpleSoft },
  emojiCellCustom: { borderStyle: 'dashed', borderColor: C.ink },
  customEmojiIcon: { fontSize: 14, color: C.purple, fontWeight: '800' },
  customHint: { fontSize: 10, color: C.mute, marginTop: 8, fontStyle: 'italic' },
  modalBtns: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink },
  modalBtnGhost: { backgroundColor: C.white },
  ghostBtnText: { color: C.ink, fontWeight: '700' },
  modalBtnPrimary: { backgroundColor: C.purple },
  primaryBtnText: { color: C.onPurple, fontWeight: '800' },
});

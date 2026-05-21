import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { useAppStore } from '../store';
import type { Category } from '../store';
import { CURRENCIES, BUILT_IN_CATEGORIES, EMOJI_SUGGESTIONS } from '../constants';
import { useColors } from '../context/ThemeContext';
import { RADIUS } from '../theme';
import type { Colors } from '../theme';
export default function SettingsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const {
    customCategories, addCustomCategory, removeCustomCategory,
    currency, expenses, clearExpensesForCurrency, clearBudgetForCurrency, countExpensesForCurrency,
  } = useAppStore();

  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatError, setNewCatError] = useState('');
  const nameInputRef = useRef<TextInput>(null);
  const emojiInputRef = useRef<TextInput>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refreshCounts = useCallback(async () => {
    const entries = await Promise.all(
      CURRENCIES.map(async (c) => {
        if (c.code === currency.code) return [c.code, expenses.length] as const;
        const n = await countExpensesForCurrency(c.code);
        return [c.code, n] as const;
      })
    );
    setCounts(Object.fromEntries(entries));
  }, [currency.code, expenses.length, countExpensesForCurrency]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const onClearCurrency = (c: typeof CURRENCIES[number]) => {
    const n = counts[c.code] ?? 0;
    Alert.alert(
      `Clear all ${c.code} data?`,
      `This will delete ${n} expense${n === 1 ? '' : 's'} and reset the ${c.code} budget. Other currencies are not affected. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            await clearExpensesForCurrency(c.code);
            await clearBudgetForCurrency(c.code);
            refreshCounts();
          },
        },
      ]
    );
  };

  const saveNewCategory = () => {
    if (!newCatName.trim()) { setNewCatError('Enter a category name'); return; }
    const emoji = newCatEmoji.trim() || '📦';
    addCustomCategory({ name: newCatName.trim(), icon: emoji });
    setNewCatEmoji(''); setNewCatName(''); setNewCatError('');
    setAddCatOpen(false);
  };

  const closeCatModal = () => {
    setAddCatOpen(false);
    setNewCatEmoji(''); setNewCatName(''); setNewCatError('');
  };

  const onRemove = (cat: Category) => {
    Alert.alert(
      `Remove "${cat.name}"?`,
      'Existing expenses with this category are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeCustomCategory(cat.name) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

        <Text style={styles.sectionLabel}>BUILT-IN CATEGORIES</Text>
        <View style={styles.listCard}>
          {BUILT_IN_CATEGORIES.map((cat, i) => (
            <View key={cat.name} style={[styles.catRow, i < BUILT_IN_CATEGORIES.length - 1 && styles.catDivider]}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.builtinBadge}>
                <Text style={styles.builtinBadgeText}>built-in</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.customHeader}>
          <Text style={styles.sectionLabel}>MY CATEGORIES</Text>
          <Pressable style={styles.addBtn} onPress={() => setAddCatOpen(true)}>
            <Text style={styles.addBtnText}>+ add</Text>
          </Pressable>
        </View>
        <View style={styles.listCard}>
          {customCategories.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No custom categories yet.</Text>
            </View>
          ) : (
            customCategories.map((cat, i) => (
              <View key={cat.name} style={[styles.catRow, i < customCategories.length - 1 && styles.catDivider]}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={styles.catName}>{cat.name}</Text>
                <Pressable onPress={() => onRemove(cat)} style={styles.removeBtn}>
                  <Ionicons name="close" size={14} color={C.danger} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionLabel, styles.dangerLabel]}>CLEAR DATA BY CURRENCY</Text>
        <Text style={styles.dangerHint}>
          Each currency has its own expenses and budget. Clearing a currency
          removes only that currency's data — your profile and other currencies stay intact.
        </Text>
        <View style={[styles.listCard, styles.dangerCard]}>
          {CURRENCIES.map((c, i) => {
            const n = counts[c.code] ?? 0;
            const isActive = c.code === currency.code;
            return (
              <View key={c.code} style={[styles.curRow, i < CURRENCIES.length - 1 && styles.catDivider]}>
                <Text style={styles.curSymbol}>{c.symbol}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.curCode}>
                    {c.code}
                    {isActive && <Text style={styles.curActive}>  · active</Text>}
                  </Text>
                  <Text style={styles.curMeta}>{n} expense{n === 1 ? '' : 's'}</Text>
                </View>
                <Pressable
                  onPress={() => onClearCurrency(c)}
                  disabled={n === 0}
                  style={[styles.clearBtn, n === 0 && styles.clearBtnDisabled]}
                >
                  <Ionicons name="trash-outline" size={13} color={n === 0 ? C.mute : C.danger} style={{ marginRight: 4 }} />
                  <Text style={[styles.clearBtnText, n === 0 && styles.clearBtnTextDisabled]}>clear</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

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
                  !!newCatEmoji && !EMOJI_SUGGESTIONS.includes(newCatEmoji) && styles.emojiCellActive,
                ]}
                onPress={() => emojiInputRef.current?.focus()}
              >
                <Ionicons name="pencil" size={14} color={C.purple} />
              </Pressable>
            </View>
            <Text style={styles.customHint}>tap the pencil to type any emoji from your keyboard</Text>

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
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  sectionLabel: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingRight: 20, marginTop: 24 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, borderColor: C.purple, borderRadius: 999 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: C.purple },
  listCard: { marginHorizontal: 20, borderWidth: 1.5, borderColor: C.ink, borderRadius: 14, backgroundColor: C.white, overflow: 'hidden' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  catDivider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  catIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  catName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  builtinBadge: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.line, borderRadius: 999 },
  builtinBadgeText: { fontSize: 9, color: C.mute, fontWeight: '700', letterSpacing: 0.5 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: C.danger, alignItems: 'center', justifyContent: 'center' },
  emptyRow: { padding: 20 },
  emptyText: { color: C.mute, textAlign: 'center', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { width: '100%', backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: C.ink, padding: 20, shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 3, height: 3 }, shadowRadius: 0 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  newCatRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  emojiBox: { width: 56, height: 54, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  emojiInput: { fontSize: 26, textAlign: 'center', width: '100%', padding: 0, color: C.ink },
  nameBox: { flex: 1, height: 54, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: C.ink, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: C.white },
  nameInput: { fontSize: 16, fontWeight: '600', color: C.ink },
  errText: { fontSize: 11, color: C.danger, marginTop: 4 },
  modalSubLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: C.mute, marginTop: 16, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiCell: { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  emojiCellActive: { borderColor: C.purple, backgroundColor: C.purpleSoft },
  emojiCellCustom: { borderStyle: 'dashed', borderColor: C.ink },
  customHint: { fontSize: 10, color: C.mute, marginTop: 8, fontStyle: 'italic' },
  modalBtns: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink },
  modalBtnGhost: { backgroundColor: C.white },
  ghostBtnText: { color: C.ink, fontWeight: '700' },
  modalBtnPrimary: { backgroundColor: C.purple },
  primaryBtnText: { color: C.onPurple, fontWeight: '800' },
  dangerLabel: { color: C.danger, marginTop: 32 },
  dangerHint: { fontSize: 11, color: C.mute, paddingHorizontal: 20, marginTop: 6, marginBottom: 4, lineHeight: 15 },
  dangerCard: { borderColor: C.danger, marginTop: 8 },
  curRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  curSymbol: { fontSize: 18, fontWeight: '800', color: C.ink, width: 36, textAlign: 'center' },
  curCode: { fontSize: 14, fontWeight: '700', color: C.ink },
  curActive: { fontSize: 11, fontWeight: '600', color: C.purpleDark },
  curMeta: { fontSize: 11, color: C.mute, marginTop: 2 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: C.danger, borderRadius: 999, backgroundColor: C.white },
  clearBtnDisabled: { borderColor: C.line, backgroundColor: C.white },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: C.danger },
  clearBtnTextDisabled: { color: C.mute },
});

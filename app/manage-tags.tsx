import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { useTags } from '../hooks/useTags';
import { useColors } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import type { Colors } from '../theme';

export default function ManageTagsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { builtInTags, customTags, allTags, addCustomTag, removeCustomTag, updateCustomTag, updateBuiltInTag } = useTags();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editingBuiltIn, setEditingBuiltIn] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const sanitize = (v: string) =>
    v.replace(/[^a-z0-9-]/gi, '').toLowerCase();

  const openAdd = () => {
    setTagInput('');
    setTagError('');
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setTagInput('');
    setTagError('');
  };

  const openEdit = (tag: string, isBuiltIn = false) => {
    setEditTarget(tag);
    setEditingBuiltIn(isBuiltIn);
    setTagInput(tag);
    setTagError('');
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTarget(null);
    setEditingBuiltIn(false);
    setTagInput('');
    setTagError('');
  };

  const saveNew = () => {
    const trimmed = sanitize(tagInput.trim());
    if (!trimmed) { setTagError('Enter a tag name'); return; }
    if (allTags.includes(trimmed)) { setTagError('This tag already exists'); return; }
    addCustomTag(trimmed);
    closeAdd();
  };

  const saveEdit = () => {
    const trimmed = sanitize(tagInput.trim());
    if (!trimmed) { setTagError('Enter a tag name'); return; }
    if (trimmed !== editTarget && allTags.includes(trimmed)) {
      setTagError('This tag already exists');
      return;
    }
    if (editingBuiltIn) {
      updateBuiltInTag(editTarget!, trimmed);
    } else {
      updateCustomTag(editTarget!, trimmed);
    }
    closeEdit();
  };

  const onRemove = (tag: string) => {
    Alert.alert(
      `Remove "#${tag}"?`,
      'Existing expenses with this tag are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeCustomTag(tag) },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScreenHeader title="Manage Tags" />
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={C.purple} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        <Text style={styles.sectionLabel}>BUILT-IN TAGS</Text>
        <View style={styles.listCard}>
          {builtInTags.map((tag, i) => (
            <View key={tag} style={[styles.tagRow, i < builtInTags.length - 1 && styles.tagDivider]}>
              <Text style={styles.tagHash}>#</Text>
              <Text style={styles.tagName}>{tag}</Text>
              <View style={styles.builtinBadge}>
                <Text style={styles.builtinBadgeText}>built-in</Text>
              </View>
              <Pressable onPress={() => openEdit(tag, true)} style={styles.editBtn}>
                <Ionicons name="pencil" size={14} color={C.purpleDark} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.customHeader}>
          <Text style={styles.sectionLabel}>MY TAGS</Text>
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ add</Text>
          </Pressable>
        </View>
        <View style={styles.listCard}>
          {customTags.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No custom tags yet.</Text>
            </View>
          ) : (
            customTags.map((tag, i) => (
              <View key={tag} style={[styles.tagRow, i < customTags.length - 1 && styles.tagDivider]}>
                <Text style={styles.tagHash}>#</Text>
                <Text style={styles.tagName}>{tag}</Text>
                <Pressable onPress={() => openEdit(tag)} style={styles.editBtn}>
                  <Ionicons name="pencil" size={14} color={C.purpleDark} />
                </Pressable>
                <Pressable onPress={() => onRemove(tag)} style={styles.removeBtn}>
                  <Ionicons name="close" size={14} color={C.danger} />
                </Pressable>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Add modal */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={closeAdd}>
        <Pressable style={styles.modalBg} onPress={closeAdd}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Tag</Text>
            <View style={[styles.inputBox, !!tagError && { borderColor: C.danger }]}>
              <Text style={styles.inputHash}>#</Text>
              <TextInput
                ref={inputRef}
                value={tagInput}
                onChangeText={(v) => { setTagInput(sanitize(v)); setTagError(''); }}
                placeholder="tag-name"
                placeholderTextColor={C.mute}
                style={styles.textInput}
                returnKeyType="done"
                onSubmitEditing={saveNew}
                maxLength={20}
                autoFocus
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.hint}>lowercase letters, numbers, hyphens — max 20 chars</Text>
            {tagError ? <Text style={styles.errText}>{tagError}</Text> : null}
            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={closeAdd}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveNew}>
                <Text style={styles.primaryBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEdit}>
        <Pressable style={styles.modalBg} onPress={closeEdit}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Tag</Text>
            <View style={[styles.inputBox, !!tagError && { borderColor: C.danger }]}>
              <Text style={styles.inputHash}>#</Text>
              <TextInput
                ref={inputRef}
                value={tagInput}
                onChangeText={(v) => { setTagInput(sanitize(v)); setTagError(''); }}
                placeholder="tag-name"
                placeholderTextColor={C.mute}
                style={styles.textInput}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
                maxLength={20}
                autoFocus
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.hint}>lowercase letters, numbers, hyphens — max 20 chars</Text>
            {tagError ? <Text style={styles.errText}>{tagError}</Text> : null}
            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={closeEdit}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveEdit}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 20, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: C.purple },
  sectionLabel: { fontSize: 10, color: C.mute, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingRight: 20, marginTop: 24 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, borderColor: C.purple, borderRadius: 999 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: C.purple },
  listCard: { marginHorizontal: 20, borderWidth: 1.5, borderColor: C.ink, borderRadius: 14, backgroundColor: C.white, overflow: 'hidden' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  tagDivider: { borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  tagHash: { fontSize: 16, fontWeight: '800', color: C.purpleDark, width: 16, textAlign: 'center' },
  tagName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  builtinBadge: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.line, borderRadius: 999 },
  builtinBadgeText: { fontSize: 9, color: C.mute, fontWeight: '700', letterSpacing: 0.5 },
  editBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: C.purpleDark, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: C.danger, alignItems: 'center', justifyContent: 'center' },
  emptyRow: { padding: 20 },
  emptyText: { color: C.mute, textAlign: 'center', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { width: '100%', backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: C.ink, padding: 20, shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 3, height: 3 }, shadowRadius: 0 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.ink, paddingHorizontal: 14, backgroundColor: C.white, marginTop: 14, gap: 4 },
  inputHash: { fontSize: 18, fontWeight: '800', color: C.purpleDark },
  textInput: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  hint: { fontSize: 10, color: C.mute, marginTop: 6, fontStyle: 'italic' },
  errText: { fontSize: 11, color: C.danger, marginTop: 4 },
  modalBtns: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink },
  modalBtnGhost: { backgroundColor: C.white },
  ghostBtnText: { color: C.ink, fontWeight: '700' },
  modalBtnPrimary: { backgroundColor: C.purple },
  primaryBtnText: { color: C.onPurple, fontWeight: '800' },
});

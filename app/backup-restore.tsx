import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../components/ScreenHeader';
import { useColors } from '../context/ThemeContext';
import { useBackup } from '../hooks/useBackup';
import { useExpenses } from '../hooks/useExpenses';
import { readBackupFile } from '../utils/backup';
import type { Colors } from '../theme';
import { RADIUS, SPACING } from '../theme';

export default function BackupRestoreScreen() {
  const router = useRouter();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { exportBackup, importBackup } = useBackup();
  const { allExpensesRecord } = useExpenses();
  const [busy, setBusy] = useState(false);

  const totalCount = Object.values(allExpensesRecord).reduce((s, a) => s + a.length, 0);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const backup = await readBackupFile();
      if (!backup) { setBusy(false); return; }

      const incomingCount = Object.values(backup.state.expenses).reduce((s, a) => s + a.length, 0);
      setBusy(false);

      Alert.alert(
        'Restore backup?',
        `This will replace ALL your current data with:\n\n` +
        `• ${incomingCount} expense${incomingCount === 1 ? '' : 's'}\n` +
        `• Budgets for all currencies\n` +
        `• Profile: ${backup.state.userName}\n\n` +
        `Backup created: ${new Date(backup.createdAt).toLocaleDateString()}\n\n` +
        `This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setBusy(true);
              try {
                await importBackup(backup.state);
                Alert.alert('Restored', 'Your data has been restored successfully.');
              } catch {
                Alert.alert('Restore failed', 'Could not apply the backup. Your data is unchanged.');
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (e) {
      setBusy(false);
      Alert.alert('Invalid backup', (e as Error).message ?? 'The file could not be read.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScreenHeader title="Backup & Restore" />
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={C.purple} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: insets.bottom + 32 }}>
        <Text style={styles.sectionLabel}>EXPORT</Text>
        <View style={[styles.infoCard, { backgroundColor: C.purpleSoft }]}>
          <Text style={styles.infoText}>
            Back up all your expenses, budgets, and categories to a JSON file you can save anywhere.
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
          onPress={handleExport}
          disabled={busy}
        >
          <View style={[styles.iconWrap, { backgroundColor: C.purpleSoft }]}>
            <Ionicons name="archive-outline" size={20} color={C.purpleDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Create Backup</Text>
            <Text style={styles.rowSub}>All currencies · {totalCount} expense{totalCount === 1 ? '' : 's'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.mute} />
        </Pressable>

        <View style={{ height: SPACING.xl }} />

        <Text style={styles.sectionLabel}>IMPORT</Text>
        <View style={[styles.infoCard, { backgroundColor: '#fff0f0', borderColor: C.danger }]}>
          <Text style={[styles.infoText, { color: C.danger }]}>
            Restoring a backup will replace ALL current data. This cannot be undone.
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.actionRow, styles.dangerRow, pressed && styles.rowPressed]}
          onPress={handleImport}
          disabled={busy}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#fff0f0' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={C.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: C.danger }]}>Restore from Backup</Text>
            <Text style={styles.rowSub}>Pick a .json backup file</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.mute} />
        </Pressable>

        <View style={{ height: SPACING.xl }} />

        <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
        <View style={styles.listCard}>
          {[
            'All expenses (every currency)',
            'Monthly budgets per currency',
            'Your profile name and joined date',
            'Built-in and custom categories',
            'Profile photo (embedded in file)',
          ].map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={C.purpleDark} style={{ marginTop: 1 }} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
          <View style={[styles.bulletRow, { marginTop: SPACING.sm }]}>
            <Ionicons name="close-circle-outline" size={16} color={C.mute} style={{ marginTop: 1 }} />
            <Text style={[styles.bulletText, { color: C.mute }]}>Dark mode preference (not data)</Text>
          </View>
        </View>
      </ScrollView>

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={C.purple} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (C: Colors) =>
  StyleSheet.create({
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 20, paddingVertical: 6 },
    backText: { fontSize: 14, fontWeight: '700', color: C.purple },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: C.mute, marginBottom: SPACING.sm, marginTop: 2 },
    infoCard: { borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.line, padding: SPACING.md, marginBottom: SPACING.sm },
    infoText: { fontSize: 13, color: C.ink, lineHeight: 18 },
    actionRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      backgroundColor: C.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: C.ink,
      padding: SPACING.md, shadowColor: C.ink, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0, shadowOpacity: 1, elevation: 3,
    },
    dangerRow: { borderColor: C.danger, shadowColor: C.danger },
    rowPressed: { opacity: 0.7 },
    iconWrap: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
    rowSub: { fontSize: 12, color: C.mute, marginTop: 2 },
    listCard: { backgroundColor: C.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: C.ink, padding: SPACING.md, gap: SPACING.sm },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
    bulletText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 20 },
    busyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  });

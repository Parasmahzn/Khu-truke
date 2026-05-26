import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../theme';

type StatCardProps = { label: string; value: string; tint?: boolean; tooltip?: string };

export default function StatCard({ label, value, tint, tooltip }: StatCardProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [visible, setVisible] = useState(false);

  const labelRow = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Text style={styles.label}>{label}</Text>
      {tooltip && <Ionicons name="information-circle-outline" size={10} color={C.mute} />}
    </View>
  );

  return (
    <View style={[styles.card, tint && { backgroundColor: C.purpleSoft }]}>
      {tooltip ? (
        <Pressable onPress={() => setVisible(true)} hitSlop={6}>
          {labelRow}
        </Pressable>
      ) : labelRow}
      <Text style={[styles.value, tint && { color: C.purpleDark }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</Text>
      {tooltip && (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
            <Pressable style={styles.callout} onPress={() => {}}>
              <View style={styles.calloutHeader}>
                <Text style={styles.calloutTitle}>Daily Average</Text>
                <Pressable onPress={() => setVisible(false)} hitSlop={8}>
                  <Text style={styles.closeBtn}>×</Text>
                </Pressable>
              </View>
              <Text style={styles.calloutBody}>{tooltip}</Text>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  card: {
    flex: 1, minHeight: 62, padding: 10,
    borderWidth: 1.5, borderColor: C.ink, borderRadius: 12,
    backgroundColor: C.white,
  },
  label: { fontSize: 9, color: C.mute, letterSpacing: 1, fontWeight: '700' },
  value: { fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 2 },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  callout: {
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.ink,
    padding: 20, marginHorizontal: 32,
    shadowColor: C.ink, shadowOpacity: 1, shadowOffset: { width: 2, height: 2 }, shadowRadius: 0,
    elevation: 4,
  },
  calloutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calloutTitle: { fontSize: 15, fontWeight: '800', color: C.ink },
  closeBtn: { fontSize: 22, color: C.mute, lineHeight: 24 },
  calloutBody: { fontSize: 13, color: C.ink, lineHeight: 20 },
});

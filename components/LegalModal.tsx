import React, { useMemo } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { Colors } from '../theme';

export type LegalSection = { heading: string; body: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalModal({ visible, onClose, title, lastUpdated, sections }: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.bg}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={C.ink} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.meta}>Last updated: {lastUpdated}</Text>
            {sections.map((s, i) => (
              <React.Fragment key={i}>
                <Text style={styles.sectionHeading}>{s.heading}</Text>
                <Text style={styles.sectionBody}>{s.body}</Text>
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  bg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card:   { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderColor: C.ink, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:  { fontSize: 20, fontWeight: '800', color: C.ink },
  meta:   { fontSize: 11, color: C.mute, marginBottom: 16 },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: C.ink, marginTop: 14, marginBottom: 4 },
  sectionBody:    { fontSize: 13, color: C.ink, lineHeight: 20 },
});

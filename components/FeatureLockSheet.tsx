import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface FeatureLockSheetProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  unlockLevel: number;
}

export default function FeatureLockSheet({ visible, onClose, featureName, unlockLevel }: FeatureLockSheetProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="lock" size={44} color={theme.textMuted} />
          </View>

          <Text style={[styles.eyebrow, { color: theme.textMuted }]}>??. (LV.{unlockLevel})</Text>
          <Text style={[styles.title, { color: theme.text }]}>{featureName}</Text>

          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Questa sezione dell'Avventura si svelerà al Livello {unlockLevel}.
          </Text>

          <Text style={[styles.hint, { color: theme.textMuted }]}>
            La città cresce con chi la esplora: accumula XP con check-in ed Eco-Passi per superare la soglia.
          </Text>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>HO CAPITO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 44,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'serif',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 28,
    opacity: 0.85,
  },
  cta: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  ctaText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
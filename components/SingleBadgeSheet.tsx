import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { height } = Dimensions.get('window');

interface SingleBadgeSheetProps {
  visible: boolean;
  onClose: () => void;
  badge: any;
  theme: any;
}

export default function SingleBadgeSheet({ visible, onClose, badge, theme }: SingleBadgeSheetProps) {
  if (!badge) return null;

  const displayName = badge.name || badge.title || 'Badge Misterioso';
  const displayDesc = badge.desc || badge.actionDescription || 'Completa specifiche azioni nel mondo reale per sbloccare questo badge.';
  const isUnlocked = !!(badge.unlocked || badge.isUnlocked);
  const percent = Math.min(100, Math.max(0,
    badge.percent ?? badge.progress ??
    (badge.target ? Math.round(((badge.current ?? 0) / badge.target) * 100) : 0)
  ));
  const progressLabel = badge.current !== undefined && badge.target !== undefined
    ? `Progresso: ${typeof badge.current === 'number' ? badge.current.toFixed(badge.current % 1 === 0 ? 0 : 1) : badge.current} / ${badge.target} ${badge.unit || ''}`
    : `Progresso: ${percent}%`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.handle} />
          
          <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: badge.color + '25', borderColor: badge.color, overflow: 'hidden' }]}>
              {badge.image ? (
                <Image source={badge.image} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              ) : (
                <MaterialIcons name={badge.icon || 'star'} size={40} color={badge.color} />
              )}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{displayDesc}</Text>
            
            {!isUnlocked && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: badge.color, width: `${percent}%` }]} />
                </View>
                <Text style={{ color: theme.text, marginTop: 8, fontSize: 12 }}>
                  {progressLabel}
                </Text>
              </View>
            )}
            
            {isUnlocked && (
              <View style={[styles.unlockedBadge, { backgroundColor: badge.color + '20' }]}>
                <Text style={{ color: badge.color, fontWeight: 'bold' }}>✓ Sbloccato!</Text>
              </View>
            )}
            
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.accent }]} onPress={onClose}>
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 350,
    paddingTop: 10,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 20,
  },
  container: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '80%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  unlockedBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  closeButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

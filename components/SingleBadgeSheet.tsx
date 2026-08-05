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
            <Text style={[styles.title, { color: theme.text }]}>{badge.title || `Livello ${badge.level}`}</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Questo badge si sblocca al livello {badge.level}. 
              {badge.isUnlocked ? ' Congratulazioni, lo hai sbloccato!' : ' Continua l\'esplorazione per sbloccarlo.'}
            </Text>
            
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
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 20,
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

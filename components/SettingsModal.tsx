import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  lang: 'IT' | 'UK';
  setLang: (l: 'IT' | 'UK') => void;
  isGeofenceActive: boolean;
  toggleSensors: () => void;
}

export default function SettingsModal({
  visible,
  onClose,
  lang,
  setLang,
  isGeofenceActive,
  toggleSensors
}: SettingsModalProps) {
  const { theme } = useTheme();
  const { currentCity, setCurrentCity } = useCity();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      fontFamily: 'serif',
      textTransform: 'uppercase'
    },
    section: {
      marginBottom: 25,
      borderBottomWidth: 1,
      borderBottomColor: theme.primary + '30',
      paddingBottom: 20
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 10
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.background,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10
    },
    buttonText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500'
    },
    tipBox: {
      backgroundColor: theme.primary + '15',
      padding: 15,
      borderRadius: 12,
      marginTop: 10
    },
    tipText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 20,
      opacity: 0.8
    }
  });

  const texts = {
    IT: {
      city: 'Città Attuale',
      switchCity: 'Passa a Lecce (Demo)',
      switchTaranto: 'Passa a Taranto',
      sensors: 'Sensori Background',
      sensorsOn: 'Accesi',
      sensorsOff: 'Spenti',
      lang: 'Lingua',
      tipsTitle: 'Scopri l\'Ecosistema TSaaSI',
      tip1: '🚶 Guadagna LOTO PTI tenendo i sensori attivi mentre esplori la città.',
      tip2: '🤫 Lascia "Whisper" anonimi per aiutare i partner a migliorare (sbloccano XP bonus).',
      tip3: '🗺️ I tuoi percorsi anonimi generano Dati utili a migliorare la città (GDPR Compliant).',
      tip4: '💎 Usa i punti nei locali Premium per sbloccare i benefit Zero-Friction!'
    },
    UK: {
      city: 'Current City',
      switchCity: 'Switch to Lecce (Demo)',
      switchTaranto: 'Switch to Taranto',
      sensors: 'Background Sensors',
      sensorsOn: 'ON',
      sensorsOff: 'OFF',
      lang: 'Language',
      tipsTitle: 'Discover the TSaaSI Ecosystem',
      tip1: '🚶 Earn LOTO PTI automatically by keeping sensors active while exploring.',
      tip2: '🤫 Drop anonymous "Whispers" to help partners improve (unlocks bonus XP).',
      tip3: '🗺️ Your anonymous routes generate Data to improve the city (GDPR Compliant).',
      tip4: '💎 Use points at Premium venues to unlock Zero-Friction benefits!'
    }
  };

  const t = texts[lang];
  const cityName = currentCity === 'taranto' ? 'TARANTO' : 'LECCE';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{cityName}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* SENSORE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.sensors}</Text>
              <TouchableOpacity style={styles.buttonRow} onPress={toggleSensors}>
                <Text style={styles.buttonText}>{isGeofenceActive ? '🟢 ' + t.sensorsOn : '⚫ ' + t.sensorsOff}</Text>
                <MaterialIcons name="touch-app" size={20} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.tipBox}>
                <Text style={[styles.sectionTitle, { fontSize: 14, color: theme.primary }]}>{t.tipsTitle}</Text>
                <View style={{ gap: 8 }}>
                  <Text style={styles.tipText}>{t.tip1}</Text>
                  <Text style={styles.tipText}>{t.tip2}</Text>
                  <Text style={styles.tipText}>{t.tip3}</Text>
                  <Text style={styles.tipText}>{t.tip4}</Text>
                </View>
              </View>
            </View>

            {/* CITTÀ DEMO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.city}</Text>
              <TouchableOpacity 
                style={styles.buttonRow} 
                onPress={() => setCurrentCity(currentCity === 'taranto' ? 'lecce' : 'taranto')}
              >
                <Text style={styles.buttonText}>{currentCity === 'taranto' ? t.switchCity : t.switchTaranto}</Text>
                <MaterialIcons name="swap-horiz" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* LINGUA */}
            <View style={[styles.section, { borderBottomWidth: 0 }]}>
              <Text style={styles.sectionTitle}>{t.lang}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.buttonRow, { flex: 1, borderWidth: lang === 'IT' ? 2 : 0, borderColor: theme.primary }]} 
                  onPress={() => setLang('IT')}
                >
                  <Text style={styles.buttonText}>Italiano</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.buttonRow, { flex: 1, borderWidth: lang === 'UK' ? 2 : 0, borderColor: theme.primary }]} 
                  onPress={() => setLang('UK')}
                >
                  <Text style={styles.buttonText}>English</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


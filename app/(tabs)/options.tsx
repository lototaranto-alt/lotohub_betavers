import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/BackgroundLocationTask';

const AccordionItem = ({ title, children, icon, theme }: { title: string, children: React.ReactNode, icon: any, theme: any }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[styles.accordionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <MaterialIcons name={icon} size={24} color={theme.tint} style={{ marginRight: 15 }} />
          <Text style={[styles.accordionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <MaterialIcons name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={theme.text} />
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.accordionContent, { borderTopColor: theme.border }]}>
          {children}
        </View>
      )}
    </View>
  );
};

export default function OptionsScreen() {
  const { theme } = useTheme();
  const { currentCity, setCurrentCity } = useCity();
  const [isGeofenceActive, setIsGeofenceActive] = useState(false);
  const [lang, setLang] = useState<'IT' | 'UK'>('IT');

  const toggleSensors = async () => {
    if (!isGeofenceActive) {
      await startBackgroundLocationUpdates();
      setIsGeofenceActive(true);
      Alert.alert("Sensori Attivati", "Ora guadagnerai LOTO PTI camminando!");
    } else {
      Alert.alert("Risparmio Energetico", "I sensori in background sono stati spenti.");
      setIsGeofenceActive(false);
      await stopBackgroundLocationUpdates();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Impostazioni & Info</Text>
          <Text style={[styles.heroSubtitle, { color: theme.text }]}>Gestisci la tua esperienza L.O.T.O.</Text>
        </View>

        {/* SETTINGS SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.tint }]}>PREFERENZE</Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Sensori in Background</Text>
                <Text style={[styles.settingDesc, { color: theme.text }]}>Accumula LOTO PTI camminando ed esplorando.</Text>
              </View>
              <Switch 
                value={isGeofenceActive} 
                onValueChange={toggleSensors}
                trackColor={{ false: theme.border, true: theme.tint }}
                thumbColor={'#fff'}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Cambia Città (Demo)</Text>
                <Text style={[styles.settingDesc, { color: theme.text }]}>Attuale: {currentCity === 'taranto' ? 'Taranto' : 'Lecce'}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.tint }]}
                onPress={() => setCurrentCity(currentCity === 'taranto' ? 'lecce' : 'taranto')}
              >
                <Text style={styles.actionBtnText}>Switch</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Lingua (Language)</Text>
                <Text style={[styles.settingDesc, { color: theme.text }]}>Current: {lang === 'IT' ? 'Italiano' : 'English'}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.tint }]}
                onPress={() => setLang(lang === 'IT' ? 'UK' : 'IT')}
              >
                <Text style={styles.actionBtnText}>{lang === 'IT' ? 'EN' : 'IT'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* INFO SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.tint }]}>SCOPRI TSaaSI</Text>
          
          <AccordionItem title="Come funziona il sistema LOTO?" icon="eco" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>🚶 Punti Automatici:</Text> Tieni i sensori attivi mentre esplori la città per generare impatto positivo e accumulare LOTO PTI.
            </Text>
            <Text style={[styles.bodyText, { color: theme.text, marginTop: 10 }]}>
              <Text style={{ fontWeight: 'bold' }}>🤫 Whisper:</Text> Lascia recensioni anonime nelle vicinanze per aiutare i locali. Sbloccherai XP extra!
            </Text>
            <Text style={[styles.bodyText, { color: theme.text, marginTop: 10 }]}>
              <Text style={{ fontWeight: 'bold' }}>💎 Partner Premium:</Text> Usa i tuoi punti come lasciapassare (Zero-Friction) per accedere ad aree ed eventi esclusivi nei locali aderenti.
            </Text>
          </AccordionItem>

          <AccordionItem title="Privacy e Dati (DaaS)" icon="security" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.text }]}>
              La tua privacy è sacra. I percorsi generati dai sensori vengono inviati ai server in formato 100% anonimo e aggregato (GDPR Compliant). 
              Le Heatmap generate aiutano le città a prevenire il sovraffollamento turistico e migliorare la vivibilità.
            </Text>
          </AccordionItem>

          <AccordionItem title="Proprietà Intellettuale" icon="gavel" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.text }]}>
              L'algoritmo di Smart Routing è tutelato da segreto industriale e si basa sul "Triangolo della Verità": geofencing, cinematica (max 20 km/h) e OCR per le validazioni.
            </Text>
            <Text style={[styles.bodyText, { color: theme.text, marginTop: 10, fontSize: 12, opacity: 0.5 }]}>
              LOTO Ecosystem™ - LOTO Core Design System - Dati Geospaziali & Flow Management Algorithm: Proprietary
            </Text>
          </AccordionItem>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 100
  },
  heroSection: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  heroSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  settingCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  accordionContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accordionContent: {
    padding: 15,
    borderTopWidth: 1,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  }
});

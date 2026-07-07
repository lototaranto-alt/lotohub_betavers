import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Animated, Image, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/BackgroundLocationTask';
import CivicDashboard from '../../components/CivicDashboard';

const AccordionItem = ({ title, children, icon, theme, expanded, onPress }: { title: string, children: React.ReactNode, icon: any, theme: any, expanded?: boolean, onPress?: () => void }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = expanded !== undefined ? expanded : localExpanded;
  const handlePress = onPress ? onPress : () => setLocalExpanded(!localExpanded);

  return (
    <View style={[styles.accordionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <MaterialIcons name={icon} size={24} color={theme.primary} style={{ marginRight: 15 }} />
          <Text style={[styles.accordionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <MaterialIcons name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={theme.text} />
      </TouchableOpacity>
      {isExpanded && (
        <View style={[styles.accordionContent, { borderTopColor: theme.border }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const ModalMenuItem = ({ title, children, icon, theme }: { title: string, children: React.ReactNode, icon: any, theme: any }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={[styles.accordionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.accordionHeader}>
          <View style={styles.headerLeft}>
            <MaterialIcons name={icon} size={24} color={theme.primary} style={{ marginRight: 15 }} />
            <Text style={[styles.accordionTitle, { color: theme.text }]}>{title}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.text} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {children}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};


export default function OptionsScreen() {
  const { theme } = useTheme();
  const { currentCity, setCurrentCity } = useCity();
  const [isGeofenceActive, setIsGeofenceActive] = useState(false);
  const [lang, setLang] = useState<'IT' | 'UK'>('IT');
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Quando lo schermo torna visibile, chiudi tutte le tendine
      setActiveAccordion(null);
    }, [])
  );

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
          <View style={{ flex: 1, paddingRight: 10, justifyContent: 'flex-start' }}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Impostazioni & Info</Text>
            <Text style={[styles.heroSubtitle, { color: theme.text, fontSize: 13, lineHeight: 18, marginTop: 6 }]}>
              Gestisci la tua esperienza{"\n"}L.O.T.O.
            </Text>
          </View>
          <Animated.View style={{ opacity: fadeAnim, justifyContent: 'flex-start', paddingTop: 5 }}>
            <Image 
              source={require('../../assets/images/logo-LOTO.png')} 
              style={{ width: 80, height: 80, resizeMode: 'contain', borderRadius: 12 }} 
            />
          </Animated.View>
        </View>

        {/* MENU SECTIONS */}
        <View style={styles.section}>
          
          {/* 1. OPZIONI (RIMANE ACCORDION) */}
          <AccordionItem 
            title="Impostazioni" 
            icon="settings" 
            theme={theme}
            expanded={activeAccordion === 'settings'}
            onPress={() => setActiveAccordion(activeAccordion === 'settings' ? null : 'settings')}
          >
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Sensori in Background</Text>
                  <Text style={[styles.settingDesc, { color: theme.text }]}>Accumula LOTO PTI camminando ed esplorando.</Text>
                </View>
                <Switch 
                  value={isGeofenceActive} 
                  onValueChange={toggleSensors}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={'#fff'}
                />
              </View>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextGroup}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Cambia Città (Demo)</Text>
                  <Text style={[styles.settingDesc, { color: theme.text }]}>Attuale: {currentCity === 'taranto' ? 'Taranto' : 'Lecce'}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setCurrentCity(currentCity === 'taranto' ? 'lecce' : 'taranto')}
                >
                  <Text style={styles.actionBtnText}>Switch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AccordionItem>

          {/* 2. ALTRE SCHEDE (DIVENTANO MODAL FULL SCREEN) */}
          <ModalMenuItem title="Segnalazioni Civiche" icon="campaign" theme={theme}>
            <CivicDashboard />
          </ModalMenuItem>

        </View>

        {/* INFO SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>FILOSOFIA L.O.T.O.</Text>
          
          <AccordionItem 
            title="Come funziona l'ecosistema?" 
            icon="eco" 
            theme={theme}
            expanded={activeAccordion === 'eco'}
            onPress={() => setActiveAccordion(activeAccordion === 'eco' ? null : 'eco')}
          >
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

          <AccordionItem 
            title="Privacy e Dati (DaaS)" 
            icon="security" 
            theme={theme}
            expanded={activeAccordion === 'privacy'}
            onPress={() => setActiveAccordion(activeAccordion === 'privacy' ? null : 'privacy')}
          >
            <Text style={[styles.bodyText, { color: theme.text }]}>
              La tua privacy è sacra. I percorsi generati dai sensori vengono inviati ai server in formato 100% anonimo e aggregato (GDPR Compliant). 
              Le Heatmap generate aiutano le città a prevenire il sovraffollamento turistico e migliorare la vivibilità.
            </Text>
          </AccordionItem>

          <AccordionItem 
            title="Proprietà Intellettuale" 
            icon="gavel" 
            theme={theme}
            expanded={activeAccordion === 'ip'}
            onPress={() => setActiveAccordion(activeAccordion === 'ip' ? null : 'ip')}
          >
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
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
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
    marginBottom: 16,
    borderRadius: 16,
    padding: 15,
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
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1 },
  closeBtn: { padding: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif' },
  accordionContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden'
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  accordionContent: {
    padding: 16,
    borderTopWidth: 1
  },
  menuPlaceholder: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  }
});


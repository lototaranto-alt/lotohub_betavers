import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Animated, Image, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/BackgroundLocationTask';
import CivicDashboard from '../../components/CivicDashboard';
import { supabase } from '../../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useTenant } from '../../context/TenantContext';

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
  const { civicModule } = useFeatureFlags();
  const { setTenantManually } = useTenant();
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

  const handleResetDemo = async () => {
    Alert.alert(
      "Reset Demo App",
      "Sei sicuro di voler riavviare l'app da zero? L'identità locale verrà cancellata e ripartirai come un nuovo utente.",
      [
        { text: "Annulla", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            await AsyncStorage.clear();
            Alert.alert("Reset Completato", "Riavvia l'app per ottenere un nuovo LOTO Pass.");
          }
        }
      ]
    );
  };

  const handleNukeDbData = async () => {
    Alert.alert(
      'ATTENZIONE DEVASTANTE',
      'Vuoi eliminare fisicamente dal database tutti i log, itinerari e transazioni generati da TE? (Le tabelle e gli altri utenti rimarranno intatti). L\'operazione è irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Distruggi Dati', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Nessun utente autenticato");

              // Elimina dati generati dall'utente (Rispettando RLS)
              await supabase.from('itineraries').delete().eq('user_id', user.id);
              await supabase.from('user_transactions').delete().eq('user_id', user.id);
              await supabase.from('user_badges').delete().eq('user_id', user.id);
              // resetta il profilo
              await supabase.from('profiles').update({ total_xp: 0, total_tokens: 0, total_co2: 0 }).eq('id', user.id);

              Alert.alert('Database Ripulito', 'Tutti i dati utente generati sono stati azzerati con successo.');
            } catch (e: any) {
              Alert.alert('Errore DB', e.message);
            }
          }
        }
      ]
    );
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


          {/* COMUNITÀ */}
          <ModalMenuItem title="Comunità" icon="groups" theme={theme}>
            <View style={{ padding: 10 }}>
              <Text style={{ color: theme.text, fontSize: 16, marginBottom: 15 }}>
                La mappa delle scoperte. Ogni passo lascia una traccia, non un punteggio.
              </Text>
              <View style={{ height: 200, backgroundColor: theme.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                <MaterialIcons name="public" size={48} color={theme.primary} style={{ opacity: 0.5 }} />
                <Text style={{ color: theme.text, marginTop: 10, opacity: 0.6 }}>Comunità in crescita...</Text>
              </View>
            </View>
          </ModalMenuItem>

          {/* 
            [NOTA DI SVILUPPO - FASE 4: Whitelabel]
            SEGNALAZIONI CIVICHE (Condizionale)
            Questo blocco viene renderizzato SOLO se il Tenant (Comune) ha acquistato
            il modulo civico (civicModule === true). In caso contrario (es. borgo-test),
            l'intera funzionalità scompare, garantendo un'app "Lean" e focalizzata
            solo sui servizi acquistati (es. turismo/gamification).
          */}
          {civicModule && (
            <ModalMenuItem title="Segnalazioni Civiche" icon="campaign" theme={theme}>
              <CivicDashboard />
            </ModalMenuItem>
          )}

          {/* BOUTIQUE SKIN E TEMI */}
          <ModalMenuItem title="Boutique Stili" icon="palette" theme={theme}>
            <View style={{ padding: 20 }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <MaterialIcons name="color-lens" size={60} color={theme.accent} />
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: 'bold', marginTop: 10 }}>Personalizza L.O.T.O.</Text>
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 10 }}>
                  Usa i tuoi Token PTI per sbloccare skin esclusive e cambiare radicalmente l'aspetto della tua app.
                </Text>
              </View>

              {/* SKIN: Minimalista Moderno */}
              <View style={{ backgroundColor: theme.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* SWATCH COLORATO */}
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#E2E8F0', marginRight: 15, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' }}>
                      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
                      <View style={{ flex: 1, backgroundColor: '#94A3B8' }} />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Minimalista Moderno</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>Proposta #2 - Pulito e glaciale</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>150 PTI</Text>
                  </View>
                </View>
              </View>

              {/* SKIN: Brutalista Industriale */}
              <View style={{ backgroundColor: theme.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* SWATCH COLORATO */}
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#1E293B', marginRight: 15, borderWidth: 1, borderColor: '#F97316', overflow: 'hidden' }}>
                      <View style={{ flex: 1, backgroundColor: '#0F172A' }} />
                      <View style={{ flex: 1, backgroundColor: '#F97316' }} />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Brutalista Industriale</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>Proposta #4 - Blocchi materici</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>150 PTI</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: theme.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Oro di Taranto</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>Proposta #1 - Eleganza pura</Text>
                  </View>
                  <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Sbloccato</Text>
                  </View>
                </View>
              </View>
            </View>
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
          {/* DEBUG MENU MULTI-TENANT (Per la Fase 4) */}
          {__DEV__ && (
            <AccordionItem 
              title="[DEBUG] Switch Tenant" 
              icon="developer-mode" 
              theme={theme}
              expanded={activeAccordion === 'debug'}
              onPress={() => setActiveAccordion(activeAccordion === 'debug' ? null : 'debug')}
            >
              <View style={{ padding: 15 }}>
                <Text style={{ color: theme.text, marginBottom: 10 }}>Usa questi bottoni per simulare l'onboarding in un altro comune (Task 11):</Text>
                
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: theme.primary, marginBottom: 10 }]}
                  onPress={() => setTenantManually('taranto')}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>🏙️ Carica "Taranto" (Civic ON)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#2E8B57', marginBottom: 20 }]} // Colore di borgo-test
                  onPress={() => setTenantManually('borgo-test')}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>🏡 Carica "Borgo Antico" (Civic OFF)</Text>
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 15 }} />
                
                <Text style={{ color: theme.text, marginBottom: 10, fontWeight: 'bold' }}>Funzioni Interne:</Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingLabel, { color: theme.text, fontSize: 14 }]}>Sensori in Background</Text>
                  </View>
                  <Switch 
                    value={isGeofenceActive} 
                    onValueChange={toggleSensors}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={'#fff'}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.settingRow, { marginTop: 15 }]}
                  onPress={handleResetDemo}
                  activeOpacity={0.8}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingLabel, { color: '#FF9500', fontSize: 14 }]}>1. Distruggi Sessione Locale (Logout)</Text>
                  </View>
                  <MaterialIcons name="logout" size={24} color="#FF9500" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.settingRow, { marginTop: 15 }]}
                  onPress={handleNukeDbData}
                  activeOpacity={0.8}
                >
                  <View style={styles.settingTextGroup}>
                    <Text style={[styles.settingLabel, { color: '#FF3B30', fontSize: 14 }]}>2. Azzera Progresso su Database</Text>
                  </View>
                  <MaterialIcons name="delete-forever" size={24} color="#FF3B30" />
                </TouchableOpacity>

              </View>
            </AccordionItem>
          )}

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


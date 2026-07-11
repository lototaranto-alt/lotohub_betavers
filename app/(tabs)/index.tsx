import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, ImageBackground, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated, Easing, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import { injectPoisMock } from '../../utils/mockInjector';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/BackgroundLocationTask';
import { ThemeProvider as AppThemeProvider } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import MobilityWizard from '../../components/MobilityWizard';
import ProfileModal from '../../components/ProfileModal';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import TouristBaptismModal from '../../components/TouristBaptismModal';
import XpToast from '../../components/XpToast';
import TipsBoutiqueSheet from '../../components/TipsBoutiqueSheet';
import PoiCard from '../../components/PoiCard';
import BreathingLeaf from '../../components/BreathingLeaf';
import { calculateDistance } from '../../utils/haversine';
import { useMobility } from '../../context/MobilityContext';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
const { width, height } = Dimensions.get('window');



// --- NUOVA PALETTE ECO-BOUTIQUE ---

const DICTIONARY = {
  IT: {
    hello: 'Ciao',
    guest: 'Ospite Loto',
    impactTitle: 'IL TUO IMPATTO ECO-SOSTENIBILE',
    co2Lab: 'Kg CO₂ Evitata',
    ptsLab: 'LOTO PTI',
    ticker: '🍃 COMMUNITY TARANTO OGGI: 1.240 Litri risparmiati • 45kg Plastica • 12kg CO₂',
    btnCheckin: 'Check-in',
    btnEvents: 'Eventi',
    btnMap: 'Mappa',
    sectionSpots: 'METE CONSIGLIATE',
    recommended: '✨ CONSIGLIATO: BONUS +10 PTI',
    scanBtn: 'SCANSIONA SCONTRINO',
    checkinAction: 'CHECK-IN (+15 XP)',
    userBadge: 'Utente Loto',
    modalCo2: 'CO2 Evitata',
    modalPlast: 'Plastica Ridotta',
    modalTok: 'Token Accumulati',
    modalDev: 'DEV TOOLS 🛠️ (Modalità Super User)',
    levelGold: 'EROE DEL MARE',
    levelSilver: 'CUSTODE DELLA CITTÀ',
    levelBronze: 'ECO-NAVIGATORE',
    refillBadge: '🚰 STAZIONE REFILL: BONUS IDRICO',
    crowdWarning: '🔴 META MOLTO AFFOLLATA',
    btnAlternative: 'VEDI ALTERNATIVA CONSIGLIATA',
    btnUnlockStory: 'SBLOCCA STORIA (+30 XP)'
  },
  UK: {
    hello: 'Hello',
    guest: 'Loto Guest',
    impactTitle: 'YOUR ECO-SUSTAINABLE IMPACT',
    co2Lab: 'Kg CO₂ avoided',
    ptsLab: 'LOTO PTS',
    ticker: '🍃 TARANTO COMMUNITY TODAY: 1.240 Liters saved • 45kg Plastic • 12kg CO₂',
    btnCheckin: 'Check-in',
    btnEvents: 'Events',
    btnMap: 'Map',
    sectionSpots: 'RECOMMENDED SPOTS',
    recommended: '✨ RECOMMENDED: +10 PTS BONUS',
    scanBtn: 'SCAN RECEIPT',
    checkinAction: 'CHECK-IN (+15 XP)',
    userBadge: 'Loto User',
    modalCo2: 'CO2 Avoided',
    modalPlast: 'Plastic Reduced',
    modalTok: 'Tokens Earned',
    modalDev: 'DEV TOOLS 🛠️ (Super User Mode)',
    levelGold: 'SEA HERO',
    levelSilver: 'CITY GUARDIAN',
    levelBronze: 'ECO-NAVIGATOR',
    refillBadge: '🚰 REFILL STATION: WATER BONUS',
    crowdWarning: '🔴 VERY CROWDED DESTINATION',
    btnAlternative: 'SEE RECOMMENDED ALTERNATIVE',
    btnUnlockStory: 'UNLOCK STORY (+30 XP)'
  }
};


const getMobilityPillStyle = (type: string) => {
  switch (type) {
    case 'dolce':
      return {
        bg: '#ECFDF5', // Sfondo verde leggero
        text: '#10B981', // Testo verde
        label: '🌱 Dolce',
      };
    case 'pubblica':
      return {
        bg: '#F0F9FF', // Sfondo blu leggero
        text: '#0a7ea4', // Testo blu
        label: '🚌 Pubblica',
      };
    case 'privata':
      return {
        bg: '#F1F5F9', // Sfondo grigio leggero
        text: '#4B5563', // Testo grigio
        label: '🚗 Privata',
      };
    default:
      return {
        bg: '#F1F5F9',
        text: '#64748B',
        label: '',
      };
  }
};

export default function VetrinaScreen() {
  const { currentTenant } = useTenant();
  const { theme, isElite } = useTheme();
  const { currentCity, setCurrentCity } = useCity();
  const styles = getStyles(theme);
  const { mobilityType, forceReopenWizard } = useMobility();
  const [pois, setPois] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userItineraries, setUserItineraries] = useState<any[]>([]);

  // --- STATO TRIANGOLO DELLA VERITÀ (INTEGRALE) ---
  const [isMotorized, setIsMotorized] = useState(false);
  const lastSample = useRef<{ coords: Location.LocationObjectCoords; timestamp: number } | null>(null);
  const KINEMATIC_TIMER_MS = 60000;
  const SPEED_LIMIT_KMS = 20 / 3.6;



  // STATI LOGICI
  const [lang, setLang] = useState<'IT' | 'UK'>('IT');
  const [isTipsVisible, setIsTipsVisible] = useState(false);
  const sparkleAnim = useRef(new Animated.Value(1)).current;
  const [isExpModalVisible, setIsExpModalVisible] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<{ [key: string]: string }>({});
  
  // STATI SPRINT B (Bottom Sheet e Accordion)
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('recommended');

  const [isBaptismVisible, setIsBaptismVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ xpAmount: 0, message: '' });

  const t = DICTIONARY[lang];
  const tickerText = currentTenant?.localization?.onboarding_subtitle || t.ticker;

  const getLevelInfo = (tokens: number) => {
    if (tokens >= 500) return { title: t.levelGold, badge: require('../../assets/images/badge_gold_1775676641737.png'), color: theme.accent, stemma: 'workspace-premium' as any };
    if (tokens >= 100) return { title: t.levelSilver, badge: require('../../assets/images/badge_silver_1775675392322.png'), color: theme.primary, stemma: 'security' as any };
    return { title: t.levelBronze, badge: require('../../assets/images/badge_bronze_1775675369793.png'), color: theme.secondary, stemma: 'sailing' as any };
  };

  useEffect(() => {
    caricaDati();
    const interval = setInterval(() => avviaFiltroCinematico(), KINEMATIC_TIMER_MS);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const caricaDati = async () => {
    try {
      const { data: poiData, error } = await supabase.rpc('get_pois');
      if (error) {
        console.log("ERRORE RPC get_pois:", error);
      }
      if (poiData) {
        // --- INIEZIONE MOCK DATI PROFESSIONALE TRAMITE HELPER ---
        const processedPois = injectPoisMock(poiData);
        setPois(processedPois);
      }

      let combinedItineraries: any[] = [];

      const localItinStr = await AsyncStorage.getItem('loto_diary');
      if (localItinStr) {
        combinedItineraries = JSON.parse(localItinStr);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
          const { data: trans } = await supabase.from('impact_transactions').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(20);
          if (trans) setUserTransactions(trans);
          
          // Fetch itinerari
          const { data: itinData } = await supabase.rpc('get_user_itineraries');
          if(itinData) {
            combinedItineraries = [...combinedItineraries, ...itinData];
          }
        }
      }

      setUserItineraries(combinedItineraries);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
          setUserLocation(loc);
        });
      }

      // Check per prompt GPS automatico e gentile
      const hasSeenPrompt = await AsyncStorage.getItem('loto_gps_prompt_seen');
      if (!hasSeenPrompt && userProfile?.flow_role !== 'LOTO Partner') {
        setTimeout(() => {
          promptGentleGps();
        }, 1500); // Ritardo leggero per non sovrapporsi al wizard
      }

    } catch (e) {
      console.log("Errore caricaDati:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apri il modale di battesimo se il caricamento  finito, c' un profilo ma non ha un nickname
    if (!loading && userProfile && !userProfile.nickname) {
      setIsBaptismVisible(true);
    }
  }, [loading, userProfile]);



  const avviaFiltroCinematico = async () => {
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    if (lastSample.current) {
      const distance = getDistance(
        lastSample.current.coords.latitude,
        lastSample.current.coords.longitude,
        current.coords.latitude,
        current.coords.longitude
      );
      const timeDiff = (current.timestamp - lastSample.current.timestamp) / 1000;
      const velocity = distance / timeDiff;

      setIsMotorized(velocity > SPEED_LIMIT_KMS);
    }
    lastSample.current = { coords: current.coords, timestamp: current.timestamp };
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const [isGeofenceActive, setIsGeofenceActive] = useState(false);

  const promptGentleGps = async () => {
    if (!isGeofenceActive) {
      await AsyncStorage.setItem('loto_gps_prompt_seen', 'true');
      Alert.alert(
        "Ottieni il massimo da L.O.T.O.",
        "Vuoi attivare la localizzazione in background? Ti permetterà di guadagnare LOTO PTI camminando per la città in automatico e sbloccare i Whisper. Puoi spegnerli in qualsiasi momento dalle Impostazioni.",
        [
          { text: "Non ora", style: "cancel" },
          { 
            text: "Attiva", 
            onPress: async () => {
              await startBackgroundLocationUpdates();
              setIsGeofenceActive(true);
            }
          }
        ]
      );
    }
  };

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

  const executeScan = async (poi: any) => {
    if (isMotorized) {
      Alert.alert("Velocità Elevata", "L'uso di mezzi motorizzati sospende l'erogazione di XP mobilità.");
      return;
    }

    const dist = userLocation ? getDistance(userLocation.coords.latitude, userLocation.coords.longitude, poi.latitude, poi.longitude) : 999;

    if (dist > (poi.checkin_radius || 50)) {
      const { data: pings } = await supabase
        .from('location_pings')
        .select('*')
        .eq('poi_id', poi.id)
        .gte('created_at', new Date(Date.now() - 12 * 3600 * 1000).toISOString())
        .limit(1);

      if (!pings || pings.length === 0) {
        Alert.alert("Troppo Lontano", "Spostati verso il partner o attendi segnale GPS stabile.");
        return;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const receiptHash = `${today}_${poi.p_iva}_15.00`;

    const { data: existing } = await supabase.from('impact_transactions').select('id').eq('receipt_hash', receiptHash).single();
    if (existing) {
      Alert.alert("Errore", "Scontrino già registrato.");
      return;
    }

    const multiplier = userProfile?.party_size || 1;
    const { error } = await supabase.rpc('process_esg_impact', {
      user_id: userProfile.id,
      p_co2: 0.5 * multiplier,
      p_liters: 5 * multiplier,
      p_tokens: 50,
      p_xp: 50,
      p_takeaway: false,
      p_party_size: multiplier
    });

    if (error) {
      Alert.alert("Errore", "Impossibile completare la scansione.");
    } else {
      Alert.alert("Successo!", "Impatto registrato.");
      caricaDati();
    }
  };

  const handleAction = async (poi: any) => {
    if (poi.category === 'partner') {
      executeScan(poi);
      return;
    }
    setSelectedPoi(poi);
    setIsSheetVisible(true);
  };

  const handleCheckIn = async (poi: any) => {
    if (!userProfile) return Alert.alert("Errore", "Profilo non trovato");

    // Simulazione del Modello Ibrido (Sensore Urbano)
    const simulatedBleDevices = Math.floor(Math.random() * 15) + 1; // Proxy per la densità
    const isGolden = (userProfile?.total_tokens || 0) >= 100;
    const xp = isGolden ? 30 : 15;

    const payload = {
      poi_id: poi.id,
      session_id: 'anonymous-or-auth-session',
      nfc_token: 'MOCK_NFC_123',
      ble_devices_count: simulatedBleDevices,
      lat: userLocation?.coords.latitude || 40.47,
      lng: userLocation?.coords.longitude || 17.24,
      xp_awarded: xp,
      tenant_id: 'taranto'
    };

    const { error } = await supabase.from('scans').insert(payload);
    
    if (error) {
      Alert.alert("Errore", "Impossibile registrare il check-in");
    } else {
      const msg = isGolden 
        ? `Hai sbloccato la storia segreta di ${poi.name}.\n(Indotto: ${simulatedBleDevices} pax)` 
        : `Benvenuto a ${poi.name}.\n(Indotto: ${simulatedBleDevices} pax)`;
      
      setToastData({ xpAmount: xp, message: msg });
      setToastVisible(true);
      
      setIsSheetVisible(false);
      caricaDati();
    }
  };

  const trovaAlternativa = (poiAffollato: any) => {
    Alert.alert(
      "Capacità Massima Raggiunta",
      `Il luogo ${poiAffollato.name} è attualmente sovraffollato. Il protocollo LOTO ti invia alla mappa per esplorare opzioni sicure e guadagnare più punti!`,
      [
        { text: "Resta qui", style: "cancel" },
        { text: "Apri Mappa", onPress: () => router.push('/map') }
      ]
    );
  };
  const renderHeader = () => {
    const isPartner = userProfile?.flow_role === 'LOTO Partner';
    const showCompleteProfileWarning = userProfile && userProfile.profile_completed === false;

    return (
      <View style={styles.headerContainer}>

        {/* 1. HEADER 'SYMMETRY' */}
        <View style={styles.topBar}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={styles.hubTitleSymmetry}>{isPartner ? 'RETE ACCOGLIENZA' : 'L.O.T.O. HUB'}</Text>
            <Text style={{ color: theme.primary, fontSize: 15, fontFamily: 'serif', fontStyle: 'italic', letterSpacing: 1, marginTop: 2, opacity: 0.9 }}>
              {currentCity === 'taranto' ? 'Taranto' : 'Lecce'}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => setLang(lang === 'IT' ? 'UK' : 'IT')} style={styles.languageIconWrapper}>
            <MaterialIcons name="language" size={24} color={theme.text} />
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{lang}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {isPartner ? (
          // ==============================
          // DASHBOARD PARTNER (NO GAMIFICATION)
          // ==============================
          <>
            <View style={[styles.prestigePill, { backgroundColor: theme.text }]}>
              <MaterialIcons name="storefront" size={48} color={theme.accent} />
              <View style={styles.prestigeCenterCol}>
                <Text style={[styles.prestigeTierTitle, { color: '#FFF' }]} numberOfLines={1} adjustsFontSizeToFit>{userProfile?.nickname || 'Host'}</Text>
                <View style={styles.prestigeBadgeRow}>
                  <View style={[styles.prestigePillBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.prestigePillBadgeText, { color: '#FFF' }]}>Custode Locale</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={{
                backgroundColor: '#25D366', 
                padding: 20, 
                borderRadius: 16, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center',
                marginHorizontal: 10,
                marginTop: 20,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.2,
                shadowRadius: 4
              }}
              onPress={() => Linking.openURL('whatsapp://send?phone=393330000000&text=Ciao%20L.O.T.O.%20Concierge,%20ho%20bisogno%20di%20assistenza')}
            >
              <MaterialIcons name="chat" size={28} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>WhatsApp Concierge</Text>
            </TouchableOpacity>

            {/* DEMO MOCK: DOUBLE GPS HANDSHAKE */}
            <TouchableOpacity 
              style={{
                backgroundColor: theme.surface, 
                padding: 15, 
                borderRadius: 12, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center',
                marginHorizontal: 10,
                marginTop: 15,
                borderWidth: 1,
                borderColor: theme.border
              }}
              onPress={() => {
                Alert.alert(
                  "Double GPS Handshake (Simulazione)",
                  "📍 Coordinate Attuali: 40.471, 17.243\n\nSto incrociando le tue coordinate con quelle registrate dall'Operatore L.O.T.O. al momento dell'installazione del Tag NFC...\n\n✅ MATCH COMPLETATO!\nDeviazione: 4.2 metri.\nIl Nodo Civico è stato attivato in sicurezza. Zero-Spoofing garantito.",
                  [{ text: "OK", style: "default" }]
                );
              }}
            >
              <MaterialIcons name="security" size={20} color={theme.accent} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 14 }}>Simula Attivazione Nodo (Demo)</Text>
            </TouchableOpacity>
          </>
        ) : (
          // ==============================
          // DASHBOARD TURISTA (GAMIFICATION)
          // ==============================
          <>
            <View style={[styles.prestigePill, isElite && { backgroundColor: 'transparent', borderColor: '#00F0FF', borderWidth: 1 }]}>
              {/* SX: Stemma Tier */}
              <MaterialIcons name={levelInfo.stemma || 'emoji-events'} size={48} color={theme.accent} />

              {/* Centro: Testo */}
              <View style={styles.prestigeCenterCol}>
                <Text style={styles.prestigeTierTitle} numberOfLines={1} adjustsFontSizeToFit>{levelInfo.title}</Text>
                <View style={styles.prestigeBadgeRow}>
                  {isElite && (
                    <View style={[styles.prestigePillBadge, { backgroundColor: theme.text, flexDirection: 'row', alignItems: 'center' }]}>
                      <MaterialIcons name="star" size={10} color={theme.accent} style={{ marginRight: 4 }} />
                      <Text style={[styles.prestigePillBadgeText, { color: theme.accent }]}>ELITE</Text>
                    </View>
                  )}
                  {showCompleteProfileWarning ? (
                    <TouchableOpacity 
                      style={[styles.prestigePillBadge, { backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }]}
                      onPress={() => router.push('/profile')}
                    >
                      <MaterialIcons name="warning" size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={[styles.prestigePillBadgeText, { color: '#FFF' }]}>PROFILO ANONIMO</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.prestigePillBadge, userProfile?.flow_role === 'Flash Cruiser' && { backgroundColor: theme.accent }]}>
                      <Text style={[styles.prestigePillBadgeText, userProfile?.flow_role === 'Flash Cruiser' && { color: '#FFF' }]}>
                        {userProfile?.flow_role || 'LOTO Explorer'}
                      </Text>
                    </View>
                  )}
                  
                  {!isPartner && mobilityType && !showCompleteProfileWarning && (
                    <TouchableOpacity
                      onPress={forceReopenWizard}
                      activeOpacity={0.8}
                      style={[
                        styles.mobilityPillHeader,
                        { backgroundColor: getMobilityPillStyle(mobilityType).bg }
                      ]}
                    >
                      <Text
                        style={[
                          styles.mobilityPillText,
                          { color: getMobilityPillStyle(mobilityType).text }
                        ]}
                      >
                        {getMobilityPillStyle(mobilityType).label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* DX: Avatar */}
              <TouchableOpacity style={[styles.avatarCirclePill, { backgroundColor: levelInfo.color }]} onPress={() => setIsExpModalVisible(true)}>
                <Text style={styles.avatarInitialPill}>{userProfile?.nickname ? userProfile.nickname[0].toUpperCase() : 'L'}</Text>
              </TouchableOpacity>
            </View>

            {/* 3. IMPACT CARD '3 ARCHI' */}
            <View style={styles.archesSection}>
              <Text style={styles.archesMainTitle}>{t.impactTitle}</Text>
              <View style={styles.archesContainer}>
                <View style={[styles.impactArch, isElite ? { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1 } : { backgroundColor: theme.primary }]}>
                  <MaterialIcons name="eco" size={24} color={isElite ? theme.primary : "#FFF"} style={{ marginBottom: 10 }} />
                  <Text style={[styles.archVal, isElite && { color: theme.primary }]}>{userProfile?.total_co2?.toFixed(1) ?? '0.0'}</Text>
                  <Text style={[styles.archLabel, isElite && { color: theme.textMuted }]}>{t.co2Lab}</Text>
                </View>
                <View style={[styles.impactArch, isElite ? { backgroundColor: 'transparent', borderColor: '#00F0FF', borderWidth: 1 } : { backgroundColor: theme.secondary }]}>
                  <MaterialIcons name="nfc" size={24} color={isElite ? '#00F0FF' : "#FFF"} style={{ marginBottom: 10 }} />
                  <Text style={[styles.archVal, isElite && { color: '#00F0FF' }]}>{userProfile?.nfc_scans_count ?? 0}</Text>
                  <Text style={[styles.archLabel, isElite && { color: theme.textMuted }]}>Indizi Trovati</Text>
                </View>
                <View style={[styles.impactArch, isElite ? { backgroundColor: 'transparent', borderColor: '#FF00FF', borderWidth: 1 } : { backgroundColor: theme.accent }]}>
                  <MaterialIcons name="toll" size={24} color={isElite ? '#FF00FF' : "#FFF"} style={{ marginBottom: 10 }} />
                  <Text style={[styles.archVal, isElite && { color: '#FF00FF' }]}>{userProfile?.total_tokens ?? 0}</Text>
                  <Text style={[styles.archLabel, isElite && { color: theme.textMuted }]}>{t.ptsLab}</Text>
                </View>
              </View>
            </View>

          </>
        )}
      <View style={[styles.tickerBar, isElite && { backgroundColor: 'transparent', borderColor: '#FF00FF', borderWidth: 1 }]}>
        <Text style={[styles.tickerText, isElite && { color: '#00F0FF' }]}>
          {tickerText}
        </Text>
      </View>

      {/* 5. SWITCHBOARD HUB (Le 3 Sfere) */}
      <View style={styles.switchboard}>
        <TouchableOpacity style={styles.hubBtn} onPress={() => router.push('/explore')}>
          <View style={[styles.hubIconCircle, isElite ? { backgroundColor: '#111827', borderColor: '#00F0FF', borderWidth: 2 } : { backgroundColor: theme.primary }]}>
            <MaterialIcons name="search" size={isElite ? 28 : 24} color={isElite ? '#00F0FF' : "#FFF"} />
          </View>
          <Text style={[styles.hubBtnText, isElite && { color: '#00F0FF' }]}>ESPLORA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.hubBtn, styles.hubBtnCenter]} onPress={() => router.push('/map')}>
          <View style={[styles.hubIconCircle, isElite ? { backgroundColor: '#111827', borderColor: '#10B981', borderWidth: 2 } : { backgroundColor: theme.secondary }]}>
            <MaterialIcons name="map" size={isElite ? 28 : 24} color={isElite ? '#10B981' : "#FFF"} />
          </View>
          <Text style={[styles.hubBtnText, { color: isElite ? '#10B981' : theme.secondary }]}>MAPPA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hubBtn} onPress={() => router.push('/events')}>
          <View style={[styles.hubIconCircle, isElite ? { backgroundColor: '#111827', borderColor: '#FF00FF', borderWidth: 2 } : { backgroundColor: theme.primary }]}>
            <MaterialIcons name="event" size={isElite ? 28 : 24} color={isElite ? '#FF00FF' : "#FFF"} />
          </View>
          <Text style={[styles.hubBtnText, isElite && { color: '#FF00FF' }]}>EVENTI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  if (loading) return <BreathingLeaf fullScreen message="Sintonizzazione LOTO..." />;

  const userTokens = userProfile?.total_tokens ?? 0;
  const userXp = userProfile?.total_xp ?? 0;
  const levelInfo = getLevelInfo(userXp);

  const accordionSections = [
    { id: 'recommended', title: 'Mete Consigliate', data: pois.filter(p => p.is_recommended) },
    { id: 'free', title: 'Culturali', data: pois.filter(p => p.category === 'free' && !p.is_recommended) },
    { id: 'partner', title: 'B2B Partner', data: pois.filter(p => p.category === 'partner') },
    { id: 'secret', title: 'Secret', data: pois.filter(p => p.category === 'secret') }
  ].filter(s => s.data.length > 0);

  const renderAccordionSection = ({ item }: { item: any }) => {
    const isOpen = openAccordion === item.id;
    return (
      <View style={{ marginBottom: 15 }}>
        <TouchableOpacity 
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOpen ? theme.primary : '#FFF', padding: 20, borderRadius: 15, marginHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}
          onPress={() => setOpenAccordion(isOpen ? null : item.id)}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: isOpen ? '#FFF' : theme.text, fontFamily: 'serif' }}>{item.title}</Text>
          <MaterialIcons name={isOpen ? "expand-less" : "expand-more"} size={24} color={isOpen ? "#FFF" : "#64748B"} />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={{ marginTop: 10 }}>
            {item.data.map((poi: any) => (
              <View key={poi.id}>
                <PoiCard 
                  item={poi} 
                  userLocation={userLocation} 
                  userProfile={userProfile} 
                  onAction={handleCheckIn} 
                  onAlternative={trovaAlternativa} 
                  onPress={(p) => {
                    setSelectedPoi(p);
                    setIsSheetVisible(true);
                  }}
                  t={t} 
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const ContentWrapper: any = isElite ? View : ImageBackground;
  const wrapperProps = isElite 
    ? { style: { flex: 1, backgroundColor: theme.background } } 
    : { source: require('../../assets/images/eco_bg.png'), style: { flex: 1 }, resizeMode: 'cover' as any };

  return (
    <ContentWrapper {...wrapperProps}>
      <SafeAreaView style={[styles.container, isElite && { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isElite ? "light-content" : "dark-content"} />
        <FlatList
          data={accordionSections}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={renderAccordionSection}
        />

        {isMotorized && (
          <View style={styles.motorizedToast}>
            <Text style={styles.motorizedToastText}>🚌 MODO MOTORIZZATO ATTIVO</Text>
          </View>
        )}


        {/* MODALE SCHEDA EXP (PROFILO AVATAR PREMIUM) ESTRATTO */}
        <ProfileModal
          visible={isExpModalVisible}
          onClose={() => setIsExpModalVisible(false)}
          userProfile={userProfile}
          userXp={userXp}
          levelInfo={levelInfo}
          userItineraries={userItineraries}
          userTransactions={userTransactions}
          theme={theme}
          t={t}
          setUserProfile={setUserProfile}
          onDeleteItinerary={async (id) => {
            const localItinStr = await AsyncStorage.getItem('loto_diary');
            if (localItinStr) {
              const localItin = JSON.parse(localItinStr).filter((i: any) => i.id !== id);
              await AsyncStorage.setItem('loto_diary', JSON.stringify(localItin));
            }
            setUserItineraries(prev => prev.filter(i => i.id !== id));
          }}
        />

        <TouristBaptismModal
          visible={isBaptismVisible}
          onClose={() => setIsBaptismVisible(false)}
          userProfile={userProfile}
          onNicknameSaved={(nickname) => {
            setUserProfile((prev: any) => ({ ...prev, nickname }));
          }}
        />

        <XpToast
          visible={toastVisible}
          xpAmount={toastData.xpAmount}
          message={toastData.message}
          onHide={() => setToastVisible(false)}
        />

        {/* BOTTOM SHEET SPRINT B */}
        <PoiDetailSheet
          visible={isSheetVisible}
          poi={selectedPoi}
          onClose={() => setIsSheetVisible(false)}
          onCheckIn={handleCheckIn}
        />

      {/* BOTTONE TIPS BOUTIQUE ANIMATO */}
      <Animated.View style={{ position: 'absolute', bottom: 30, left: 20, transform: [{ scale: sparkleAnim }] }}>
        <TouchableOpacity 
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, elevation: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
          onPress={() => setIsTipsVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
        </TouchableOpacity>
      </Animated.View>

      <TipsBoutiqueSheet visible={isTipsVisible} onClose={() => setIsTipsVisible(false)} />

      </SafeAreaView>
    </ContentWrapper>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(253, 248, 242, 0.75)' },
  headerContainer: { paddingBottom: 15 },

  // HEADER SYMMETRY
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 25, paddingTop: 35, paddingBottom: 5, alignItems: 'center' },
  hubTitleSymmetry: { fontSize: 40, fontWeight: '900', color: theme.text, fontFamily: 'serif', letterSpacing: 0.5, lineHeight: 44, includeFontPadding: false, textAlignVertical: 'center' },
  languageIconWrapper: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: theme.secondary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  langBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: theme.text, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8 },
  langBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  mobilityPillHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  mobilityPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // RETTANGOLO PRESTIGE
  prestigePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, marginTop: 5, marginBottom: 15, marginRight: 25, paddingVertical: 16, paddingLeft: 6, paddingRight: 10, borderTopRightRadius: 50, borderBottomRightRadius: 50, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  prestigeCenterCol: { flex: 1, marginLeft: 8, marginRight: 8, justifyContent: 'center', alignItems: 'flex-start' },
  prestigeTierTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', fontFamily: 'serif', marginBottom: 3, textAlign: 'left' },
  prestigeBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  prestigePillBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  prestigePillBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  avatarCirclePill: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', marginLeft: 5, marginRight: 2 },
  avatarInitialPill: { color: '#FFF', fontWeight: 'bold', fontSize: 22, fontFamily: 'serif' },

  // IMPACT CARD '3 ARCHI'
  archesSection: { marginHorizontal: 20, marginBottom: 15 },
  archesMainTitle: { color: theme.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'serif', textAlign: 'center', marginBottom: 10 },
  archesContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  impactArch: { flex: 1, alignItems: 'center', paddingTop: 20, paddingBottom: 25, borderTopLeftRadius: 80, borderTopRightRadius: 80, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, elevation: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  archVal: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  archLabel: { color: '#FFF', fontSize: 10, opacity: 0.9, textAlign: 'center', marginTop: 4, fontWeight: '500' },

  // COMMUNITY TICKER
  tickerBar: { backgroundColor: theme.text, paddingVertical: 10, marginHorizontal: 20, borderRadius: 15, marginBottom: 10 },
  tickerText: { color: theme.accent, fontSize: 11, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.5 },

  // SWITCHBOARD
  switchboard: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, justifyContent: 'space-between', alignItems: 'center' },
  hubBtn: { alignItems: 'center', flex: 1 },
  hubBtnCenter: { transform: [{ translateY: 0 }] },
  hubIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  hubBtnText: { color: theme.text, fontWeight: 'bold', fontSize: 11, marginTop: 8, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', marginLeft: 25, marginBottom: 15, color: theme.text },

  // POI CARD HARMONIOUS
  poiCardHarmonious: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 30, overflow: 'hidden', elevation: 6, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.06)' },

  poiImageContainer: { width: '100%', height: 180 },
  poiImageHarmonious: { width: '100%', height: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  recommendedBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: theme.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recommendedText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  poiInfoHarmonious: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  poiNameHarmonious: { fontSize: 22, fontWeight: 'bold', color: theme.text, fontFamily: 'serif' },
  poiDistHarmonious: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  btnActionHarmonious: { borderRadius: 20, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  btnActionTextHarmonious: { color: '#FFF', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 },

  motorizedToast: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: "#D94A4A", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  motorizedToastText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 28, 30, 0.6)', justifyContent: 'center', alignItems: 'center' },
  closeExpModal: { marginTop: 25, backgroundColor: '#FFF', padding: 15, borderRadius: 30, elevation: 5 },
  expCardBoutique: { width: '85%', height: 310, backgroundColor: theme.background, borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: theme.accent, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  crownIcon: { width: 110, height: 110 },
  badgeMedalContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  expNameBoutique: { fontSize: 24, fontWeight: '900', color: theme.text, fontFamily: 'serif', marginTop: 10 },
  expTitleBoutique: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  modalStatsRowBoutique: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 0.5, borderColor: '#C9C4B8', elevation: 2 },
  modalStat: { alignItems: 'center', flex: 1 },
  mStatValBoutique: { fontSize: 18, fontWeight: 'bold' },
  mStatLab: { fontSize: 9, color: '#64748B', marginTop: 5, textTransform: 'uppercase', fontWeight: 'bold' }
});

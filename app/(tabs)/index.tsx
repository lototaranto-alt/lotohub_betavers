import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Dimensions, FlatList, Image, ImageBackground, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated, Easing, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/BackgroundLocationTask';
import { ThemeProvider as AppThemeProvider } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import { getLevelProgress } from '../../utils/levelUtils';
import MobilityWizard from '../../components/MobilityWizard';
import ProfileModal from '../../components/ProfileModal';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import BadgeCollectionModal from '../../components/BadgeCollectionModal';
import GameAchievementsSheet from '../../components/GameAchievementsSheet';
import ScannedPoisSheet from '../../components/ScannedPoisSheet';
import SingleBadgeSheet from '../../components/SingleBadgeSheet';
import TouristBaptismModal from '../../components/TouristBaptismModal';
import XpToast from '../../components/XpToast';
import TipsBoutiqueSheet from '../../components/TipsBoutiqueSheet';
import PoiCard from '../../components/PoiCard';
import BreathingLeaf from '../../components/BreathingLeaf';
import ImpactStatsModal from '../../components/ImpactStatsModal';
import VaultModal from '../../components/VaultModal';
import { calculateDistance, calculateDistanceRaw } from '../../utils/haversine';
import { useMobility } from '../../context/MobilityContext';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import { useScanner } from './_layout';
const { width, height } = Dimensions.get('window');



// --- NUOVA PALETTE ECO-BOUTIQUE ---

const DICTIONARY = {
  IT: {
    hello: 'Ciao',
    guest: 'ESPLORATORE',
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
  const { mobilityType, forceReopenWizard, saveMobilityChoice } = useMobility();
  const [pois, setPois] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userItineraries, setUserItineraries] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any>(null);

  // --- STATO TRIANGOLO DELLA VERITÀ (INTEGRALE) ---
  const [isMotorized, setIsMotorized] = useState(false);
  const lastSample = useRef<{ coords: Location.LocationObjectCoords; timestamp: number } | null>(null);
  const KINEMATIC_TIMER_MS = 60000;
  const SPEED_LIMIT_KMS = 20 / 3.6;



  // STATI LOGICI
  const [lang, setLang] = useState<'IT' | 'UK'>('IT');
  const [isTipsVisible, setIsTipsVisible] = useState(false);
  const sparkleAnim = useRef(new Animated.Value(1)).current;
  const [tipsAnim] = useState(new Animated.Value(1));
  const [liveFeedIndex, setLiveFeedIndex] = useState(0);
  const [liveFeeds, setLiveFeeds] = useState<string[]>([
    "Un ESPLORATORE ha scoperto un nuovo POI!",
    "La community ha raggiunto 120kg di CO2 risparmiata oggi!"
  ]);

  useEffect(() => {
    const fetchLiveFeed = async () => {
      try {
        const { data } = await supabase.from('profiles').select('nickname, level').limit(10);
        if (data && data.length > 0) {
          const feedTypes = ['scan', 'badge', 'level', 'report'];
          const builtFeed = data.map((p, i) => {
            const type = feedTypes[i % feedTypes.length];
            const name = p.nickname || 'Un ESPLORATORE';
            if (type === 'scan') return `${name} ha scoperto un nuovo POI!`;
            if (type === 'badge') return `${name} ha sbloccato il badge Sentinella`;
            if (type === 'level') return `${name} ha raggiunto il Livello ${p.level || 2}`;
            return `${name} ha inviato una segnalazione civica`;
          });
          setLiveFeeds(builtFeed);
        }
      } catch(e) {}
    };
    fetchLiveFeed();

    const interval = setInterval(() => {
      setLiveFeedIndex((prev) => (prev + 1) % liveFeeds.length);
    }, 8000); // Cambia ogni 8 secondi per dare senso di vita
    return () => clearInterval(interval);
  }, [liveFeeds.length]);
  const [isExpModalVisible, setIsExpModalVisible] = useState(false); // --- NUOVI STATI GAMIFICATION ---
  const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);
  const [isImpactModalVisible, setIsImpactModalVisible] = useState(false);
  const [isVaultModalVisible, setIsVaultModalVisible] = useState(false);
  const [isGameAchievementsVisible, setIsGameAchievementsVisible] = useState(false);
  const [isScannedPoisVisible, setIsScannedPoisVisible] = useState(false);
  const [isSingleBadgeVisible, setIsSingleBadgeVisible] = useState(false);
  const [selectedBadgeData, setSelectedBadgeData] = useState<any>(null);
  
  // --- STATI SHEET ---
  const [isHomeMobilitySheetVisible, setIsHomeMobilitySheetVisible] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<{ [key: string]: string }>({});
  
  // STATI SPRINT B (Bottom Sheet e Accordion)
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('recommended');

  const [isBaptismVisible, setIsBaptismVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ xpAmount: 0, message: '' });
  const [localXpFallback, setLocalXpFallback] = useState(0);
  const [localTokensFallback, setLocalTokensFallback] = useState(0);
  const [localPoisFallback, setLocalPoisFallback] = useState(0);

  const t = DICTIONARY[lang];
  const tickerText = currentTenant?.localization?.onboarding_subtitle || t.ticker;

  const getLevelInfo = (tokens: number) => {
    if (tokens >= 500) return { title: "EROE DEL MARE", badge: require('../../assets/images/badge_gold_1775676641737.png'), color: theme.accent, stemma: 'workspace-premium' as any };
    if (tokens >= 100) return { title: "ESPLORATORE", badge: require('../../assets/images/badge_silver_1775675392322.png'), color: theme.primary, stemma: 'security' as any };
    return { title: "TURISTA OCCASIONALE", badge: require('../../assets/images/badge_bronze_1775675369793.png'), color: theme.secondary, stemma: 'sailing' as any };
  };

  // Ricarica i dati dinamicamente ogni volta che si torna sulla Home (es. dopo una scansione NFC)
  useFocusEffect(
    useCallback(() => {
      // Legge eventuali valori accumulati localmente per la resilienza offline
      AsyncStorage.multiGet(['loto_fallback_xp', 'loto_fallback_tokens', 'loto_fallback_pois']).then(values => {
        values.forEach(([key, value]) => {
          if (value) {
            if (key === 'loto_fallback_xp') setLocalXpFallback(parseInt(value));
            if (key === 'loto_fallback_tokens') setLocalTokensFallback(parseInt(value));
            if (key === 'loto_fallback_pois') setLocalPoisFallback(parseInt(value));
          }
        });
      });
      caricaDati();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => avviaFiltroCinematico(), KINEMATIC_TIMER_MS);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  // --- LOGICA LEVEL UP & TIPS ---
  const [prevXp, setPrevXp] = useState(0);
  useEffect(() => {
    if (userProfile && userProfile.total_xp !== undefined) {
      const currentXp = userProfile.total_xp;
      if (prevXp > 0 && currentXp > prevXp) {
        const oldLevel = Math.floor(prevXp / 100);
        const newLevel = Math.floor(currentXp / 100);
        if (newLevel > oldLevel) {
          // LEVEL UP! Mostra i Tips per 3 minuti
          setIsTipsVisible(true);
          setTimeout(() => {
            setIsTipsVisible(false);
          }, 3 * 60 * 1000); // 3 minuti
        }
      }
      setPrevXp(currentXp);
    }
  }, [userProfile?.total_xp]);

  const caricaDati = async () => {
    try {
      let fetchedPois: any[] = [];
      const { data: poiData, error } = await supabase.rpc('get_pois');
      if (error) {
        console.log("ERRORE RPC get_pois:", error);
      }
      if (poiData) {
        fetchedPois = poiData;
        setPois(fetchedPois);
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

          // Fetch user badges
          const { data: badges } = await supabase
            .from('user_badges')
            .select('*, badges(*)')
            .eq('user_id', user.id);
          if (badges) setUserBadges(badges);
        }
      }

      setUserItineraries(combinedItineraries);

      // Fetch Ticker Community
      const { data: cStats } = await supabase.from('vw_collective_impact').select('*').single();
      if (cStats) setCommunityStats(cStats);

      // Ritardiamo le richieste di localizzazione di 13.3s per coprire l'intera durata del carosello (4 clip x 3.3s)
      setTimeout(async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
            setUserLocation(loc);
            
            // HAPTICS QUANDO CI SI AVVICINA A UN P.O.I. (< 50 METRI)
            if (fetchedPois && fetchedPois.length > 0) {
              for (const poi of fetchedPois) {
                if (poi.latitude && poi.longitude) {
                  const dist = calculateDistanceRaw(loc.coords.latitude, loc.coords.longitude, poi.latitude, poi.longitude);
                  if (dist < 50) {
                    // Vibrazione leggera per indicare prossimità
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    break; // Una vibrazione è sufficiente
                  }
                }
              }
            }
          }).catch(err => {
            console.log("Errore in watchPositionAsync (es. GPS spento):", err);
          });
        }
        } catch (err) {
          console.log("Errore richiesta permessi GPS (possibile GPS di sistema disattivato):", err);
        }

        // Check per prompt GPS automatico e gentile in background
        const hasSeenPrompt = await AsyncStorage.getItem('loto_gps_prompt_seen');
        if (!hasSeenPrompt && userProfile?.flow_role !== 'LOTO Partner') {
          setTimeout(() => {
            promptGentleGps();
          }, 1500); // Questo 1500ms parte DOPO i 12000ms iniziali
        }
      }, 13300);

      // LOGICA TIPS HAPTICS
      let totalXp = 0;
      if (user) {
         const { data: prof } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
         if (prof) totalXp = prof.total_xp || 0;
      }
      
      // Il bottone Tips ora vibra sempre, per ricordare le funzioni nascoste (come richiesto)
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        Animated.sequence([
          Animated.timing(tipsAnim, { toValue: 1.5, duration: 300, useNativeDriver: true }),
          Animated.timing(tipsAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
          Animated.spring(tipsAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
        ]).start();
      }, 1500);

    } catch (e) {
      console.log("Errore caricaDati:", e);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    // Apri il modale di battesimo se il caricamento  finito, c' un profilo ma non ha un nickname
    if (!loading && userProfile && !userProfile.nickname) {
      setIsBaptismVisible(true);
    }
  }, [loading, userProfile]);



  const avviaFiltroCinematico = async () => {
    try {
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
    } catch (e) {
      console.log("Filtro Cinematico bypassato (GPS spento)");
    }
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
              try {
                await startBackgroundLocationUpdates();
                setIsGeofenceActive(true);
              } catch (e) {
                console.log("Location BG non autorizzata", e);
              }
            }
          }
        ]
      );
    }
  };

  const toggleSensors = async () => {
    if (!isGeofenceActive) {
      try {
        await startBackgroundLocationUpdates();
        setIsGeofenceActive(true);
        Alert.alert("Sensori Attivati", "Ora guadagnerai LOTO PTI camminando!");
      } catch (e) {
        console.log("Errore sensori", e);
        Alert.alert("Errore", "Impossibile attivare i sensori. Verifica i permessi.");
      }
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Feedback 'avvicinamento'
    if (poi.category === 'partner') {
      executeScan(poi);
      return;
    }
    setSelectedPoi(poi);
    setIsSheetVisible(true);
  };

  const handleCheckIn = async (poi: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSheetVisible(false);
    
    // Inoltra il POI reale selezionato al vero flusso NFC simulato
    setTimeout(() => {
      router.push(`/p/${poi.id}`);
    }, 300);
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

  const { openScanner } = useScanner();

  const renderHeader = () => {
    const nextLevelXp = levelInfo.title === t.levelBronze ? 100 : (levelInfo.title === t.levelSilver ? 500 : 1000);
    const progressPerc = Math.min(100, Math.max(0, (userXp / nextLevelXp) * 100));
    const isPartner = userProfile?.flow_role === 'LOTO Partner';

    const mobilityConfig = getMobilityPillStyle(mobilityType || 'dolce');
    const isLevel5OrAbove = levelProgress.currentLevel >= 5;

    // Catalogo dei 5 badge mostrati nella Prestige Card
    const cardBadges = [
      { 
        id: 'badge_first_scan', name: 'Battesimo', icon: 'location-on', color: '#2ECC71', 
        unlocked: userBadges.some(b => (b.badge_id || b.id) === 'badge_first_scan') || (userProfile?.pois_discovered || 0) > 0,
        actionDescription: 'Scansiona il tuo primo POI (fontanella o punto d\'ombra) per iniziare a mappare la città.',
        progress: Math.min(100, (userProfile?.pois_discovered || 0) * 100)
      },
      { 
        id: 'badge_civic_3', name: 'Sentinella', icon: 'security', color: '#2196F3', 
        unlocked: userBadges.some(b => (b.badge_id || b.id) === 'badge_civic_3'),
        actionDescription: 'Partecipa a 3 eventi civici (es. Raccolta Rifiuti Plasticaqqua).',
        progress: userBadges.some(b => (b.badge_id || b.id) === 'badge_civic_3') ? 100 : 0
      },
      { 
        id: 'badge_eco_5kg', name: 'Eco-Sostenitore', icon: 'eco', color: '#4CAF50', 
        unlocked: userBadges.some(b => (b.badge_id || b.id) === 'badge_eco_5kg') || mobilityType === 'dolce',
        actionDescription: 'Mantieni uno stile di mobilità dolce (bici/piedi) per 5 giorni consecutivi.',
        progress: mobilityType === 'dolce' ? 100 : 20
      },
      { 
        id: 'badge_marathon_3', name: 'Maratoneta', icon: 'directions-run', color: '#FF9800', 
        unlocked: userBadges.some(b => (b.badge_id || b.id) === 'badge_marathon_3') || (userProfile?.itineraries_count || 0) >= 3,
        actionDescription: 'Completa 3 Itinerari consigliati da LOTO.',
        progress: Math.min(100, Math.round(((userProfile?.itineraries_count || 0) / 3) * 100))
      },
      { 
        id: 'badge_level_5', name: 'Cittadino Attivo', icon: 'stars', color: '#FFD700', 
        unlocked: isLevel5OrAbove,
        actionDescription: 'Raggiungi il Livello 5 accumulando punti esperienza per la città.',
        progress: Math.min(100, Math.round(((levelProgress.currentLevel) / 5) * 100))
      }
    ];

    return (
      <View style={{ paddingBottom: 10 }}>
        
        {/* --- 1. HEADER BOUTIQUE --- */}
        <View style={{ alignItems: 'center', marginBottom: 15, marginTop: 30 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 48, color: '#1A3621', letterSpacing: 3, textAlign: 'center' }}>
            L.O.T.O. HUB
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MaterialIcons name="eco" size={18} color="#BCA37F" />
            <Text style={{ fontFamily: 'Raleway_400Regular', fontSize: 18, color: '#6A5638', marginHorizontal: 12, letterSpacing: 1 }}>
              Co - ExpErience Engine
            </Text>
            <MaterialIcons name="eco" size={18} color="#BCA37F" />
          </View>
        </View>

        {/* --- PRESTIGE CARD COMPATTA --- */}
        <View style={{ backgroundColor: '#2D4A22', borderRadius: 20, padding: 15, marginHorizontal: 20, marginBottom: 15, elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Left Side: Info & XP */}
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 11, color: '#D4AF37', letterSpacing: 1, marginBottom: 2 }}>
                BENTORNATO, TARANTO
              </Text>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: '#FFF', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 }} numberOfLines={1}>
                {userProfile?.nickname || t.guest}
              </Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <TouchableOpacity 
                  onPress={() => setIsGameAchievementsVisible(true)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                >
                  <MaterialIcons name={levelProgress.stemma as any} size={12} color={levelProgress.color} style={{ marginRight: 4 }} />
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{levelProgress.levelTitle}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setIsHomeMobilitySheetVisible(true)}
                  style={{ backgroundColor: '#E2F0D9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                >
                  <MaterialIcons 
                    name={mobilityType === 'pubblica' ? 'directions-bus' : mobilityType === 'privata' ? 'local-taxi' : 'pedal-bike'} 
                    size={10} 
                    color="#2E7D32" 
                    style={{ marginRight: 2 }} 
                  />
                  <Text style={{ color: '#2E7D32', fontSize: 9, fontWeight: 'bold' }}>
                    {mobilityType === 'pubblica' ? 'MEZZI PUBBLICI' : mobilityType === 'privata' ? 'AUTO PRIVATA' : 'MOB. DOLCE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* XP Bar inside Card */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                  <View style={{ width: `${levelProgress.percent}%`, height: '100%', backgroundColor: levelProgress.color || '#D4AF37', borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>{Math.floor(userXp)} / {levelProgress.nextXp} XP</Text>
              </View>

            </View>

            {/* Right Side: Avatar Circle */}
            <TouchableOpacity onPress={() => setIsExpModalVisible(true)} activeOpacity={0.8} style={{ alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B5F31', borderWidth: levelProgress.currentLevel >= 5 ? 3 : 2, borderColor: levelProgress.currentLevel >= 5 ? '#D4AF37' : 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', elevation: levelProgress.currentLevel >= 5 ? 10 : 4, shadowColor: levelProgress.currentLevel >= 5 ? '#D4AF37' : '#000' }}>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: '#FFF' }}>
                  {(userProfile?.nickname || 'ESPLORATORE')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ backgroundColor: '#FDFBF7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: levelProgress.color || '#D4AF37', marginTop: -8, elevation: 5 }}>
                <Text style={{ color: '#333', fontSize: 8, fontWeight: 'bold' }}>LIVELLO {levelProgress.currentLevel}</Text>
              </View>
            </TouchableOpacity>

          </View>

          {/* Badges Row (5 Milestone con Anello di Progressione - Cliccabili per Collezione) */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 10 }}>
            {cardBadges.map((badge, idx) => {
              if (badge.unlocked) {
                return (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => { setSelectedBadgeData(badge); setIsSingleBadgeVisible(true); }}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: badge.color + '25', borderWidth: 2.5, borderColor: badge.color, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <MaterialIcons name={badge.icon as any} size={20} color={badge.color} />
                  </TouchableOpacity>
                );
              } else {
                return (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => { setSelectedBadgeData(badge); setIsSingleBadgeVisible(true); }}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <MaterialIcons name="lock" size={16} color="rgba(255,255,255,0.35)" />
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>

        {/* --- 4 QUADRANT GRID --- */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 }}>
          
          {/* 1. Clues Found */}
          <TouchableOpacity 
            onPress={() => setIsScannedPoisVisible(true)}
            activeOpacity={0.9}
            style={{ width: '48%', backgroundColor: '#2D4A22', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4 }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Indizi Trovati</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="search" size={24} color="#D4AF37" />
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', marginLeft: 10 }}>
                {Math.max(userProfile?.pois_discovered || 0, localPoisFallback)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 2. LOTO PTI + CO2 */}
          <TouchableOpacity 
            onPress={() => setIsImpactModalVisible(true)}
            activeOpacity={0.9} 
            style={{ width: '48%', backgroundColor: '#476537', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4 }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Impatto & Punti</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialIcons name="eco" size={12} color="#2ECC71" style={{marginRight: 4}} />
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' }}>
                    {userProfile?.total_co2?.toFixed(1) ?? '0.0'} kg
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="toll" size={12} color="#D4AF37" style={{marginRight: 4}} />
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' }}>
                    {Math.max(userProfile?.total_tokens || 0, localTokensFallback)} PTI
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 3. Vault Multimediale */}
          <TouchableOpacity 
            onPress={() => setIsVaultModalVisible(true)}
            activeOpacity={0.9}
            style={{ width: '48%', backgroundColor: '#D6734E', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4 }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Memoria LOTO</Text>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Audioguide & Foto</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="photo-library" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 9, marginLeft: 5 }}>Sbloccati: {Math.floor((userProfile?.pois_discovered || 0) * 1.5)}</Text>
            </View>
          </TouchableOpacity>

          {/* 4. Achievements */}
          <TouchableOpacity 
            onPress={() => setIsBadgeModalVisible(true)}
            activeOpacity={0.9}
            style={{ width: '48%', backgroundColor: '#DFAB55', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4 }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Traguardi</Text>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>{levelInfo.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="emoji-events" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 9, marginLeft: 5 }}>{userBadges.length} Badge Sbloccati</Text>
            </View>
            <Text style={{ color: '#FFF', fontSize: 9, marginTop: 8, fontWeight: 'bold' }}>Sfida attiva: Sfida Mappatura Civica</Text>
          </TouchableOpacity>

        </View>

        {/* --- LIVE COMMUNITY FEED --- */}
        <View style={{ backgroundColor: theme.surface, marginHorizontal: 20, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', elevation: 4, marginBottom: 15, borderWidth: 1, borderColor: '#D4AF37' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(71,101,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <MaterialIcons name="rss-feed" size={16} color="#476537" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 10, fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.5 }}>LIVE FEED CITTADINO</Text>
            <Text style={{ color: theme.textMuted, fontSize: 10, lineHeight: 12 }} numberOfLines={1}>
              {liveFeeds[liveFeedIndex]}
            </Text>
          </View>
        </View>


      </View>
    );
  };

  // Rimossa BreathingLeaf iniziale come richiesto

  const userTokens = userProfile?.total_tokens ?? 0;
  // OFFLINE FALLBACK: Scegliamo il valore più alto tra il DB (se esiste) e la memoria locale
  const userXp = Math.max(userProfile?.total_xp ?? 0, localXpFallback);
  const levelProgress = getLevelProgress(userXp, theme);
  const levelInfo = { title: levelProgress.levelTitle, stemma: levelProgress.stemma, color: levelProgress.color };

  const getDynamicPois = () => {
    // Ordina tutti i POI per distanza
    const sorted = [...pois].sort((a, b) => {
      const distA = userLocation ? calculateDistanceRaw(userLocation.coords.latitude, userLocation.coords.longitude, a.latitude, a.longitude) : 0;
      const distB = userLocation ? calculateDistanceRaw(userLocation.coords.latitude, userLocation.coords.longitude, b.latitude, b.longitude) : 0;
      return distA - distB;
    });

    return [
      { id: 'recommended', title: 'Mete Consigliate ✨', data: sorted.filter(p => p.is_recommended) },
      { id: 'free', title: 'Culturali 🏛️', data: sorted.filter(p => p.category === 'free' && !p.is_recommended) },
      { id: 'partner', title: 'Boutique & Partner 🛍️', data: sorted.filter(p => p.category === 'partner') },
      { id: 'secret', title: 'Mete Segrete 🤫', data: sorted.filter(p => p.category === 'secret') }
    ].filter(s => s.data.length > 0);
  };

  const renderShelf = ({ item }: { item: any }) => {
    return (
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', color: theme.text }}>
            {item.title}
          </Text>
          {item.id === 'recommended' && (
            <Animated.View style={{ transform: [{ scale: tipsAnim }] }}>
              <TouchableOpacity onPress={() => setIsTipsVisible(true)} style={{ backgroundColor: '#FDFBF7', padding: 6, borderRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#D4AF37' }}>
                <MaterialIcons name="tips-and-updates" size={20} color="#D4AF37" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={item.data}
          keyExtractor={poi => poi.id}
          renderItem={({ item: poi }) => (
            <View style={{ width: 280, marginRight: -5 }}>
              <PoiCard 
                item={poi} 
                userLocation={userLocation} 
                userProfile={userProfile} 
                onAction={handleAction} 
                onAlternative={trovaAlternativa}
                onPress={() => {
                  setSelectedPoi(poi);
                  setIsSheetVisible(true);
                }}
                t={t} 
              />
            </View>
          )}
          contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
        />
      </View>
    );
  };

  const ContentWrapper: any = ImageBackground;
  const wrapperProps = { source: require('../../assets/images/loto_bg.jpg'), style: { flex: 1, backgroundColor: '#F8FAF5' }, imageStyle: { opacity: 1 } };

  return (
    <ContentWrapper {...wrapperProps}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FlatList
          data={getDynamicPois()} // Scaffali Netflix
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 180 }}
          renderItem={renderShelf}
          showsVerticalScrollIndicator={false}
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
          userTokens={Math.max(userProfile?.total_tokens || 0, localTokensFallback)}
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

        {/* MODALE IMPATTO E PUNTI (DAL QUADRANTE 2) */}
        <ImpactStatsModal
          visible={isImpactModalVisible}
          onClose={() => setIsImpactModalVisible(false)}
          userProfile={userProfile}
          userTransactions={userTransactions}
          userTokens={Math.max(userProfile?.total_tokens || 0, localTokensFallback)}
          theme={theme}
        />

        <VaultModal
          visible={isVaultModalVisible}
          onClose={() => setIsVaultModalVisible(false)}
          userProfile={userProfile}
          theme={theme}
        />

        <SingleBadgeSheet
          visible={isSingleBadgeVisible}
          onClose={() => setIsSingleBadgeVisible(false)}
          badge={selectedBadgeData}
          theme={theme}
        />

        <ScannedPoisSheet
          visible={isScannedPoisVisible}
          onClose={() => setIsScannedPoisVisible(false)}
          scannedPois={pois.slice(0, Math.max(userProfile?.pois_discovered || 0, localPoisFallback))}
          theme={theme}
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

      {/* BOTTONE TIPS ELIMINATO: spostato nell'header */}

      <TipsBoutiqueSheet visible={isTipsVisible} onClose={() => setIsTipsVisible(false)} />

      <BadgeCollectionModal
        visible={isBadgeModalVisible}
        onClose={() => setIsBadgeModalVisible(false)}
        userBadges={userBadges}
        userProfile={userProfile}
        theme={theme}
        onAction={(action) => {
          setIsBadgeModalVisible(false);
          // Handle badge actions here (e.g. navigation)
        }}
      />

      <GameAchievementsSheet
        visible={isGameAchievementsVisible}
        onClose={() => setIsGameAchievementsVisible(false)}
        userXp={userXp}
        userBadges={userBadges}
        theme={theme}
        onOpenBadgeCollection={() => {
          setIsGameAchievementsVisible(false);
          setTimeout(() => setIsBadgeModalVisible(true), 300);
        }}
      />

      {/* MODALE SCELTA MOBILITA RAPIDA DALLA HOME */}
        <Modal visible={isHomeMobilitySheetVisible} transparent animationType="slide">
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setIsHomeMobilitySheetVisible(false)}>
            <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, paddingBottom: 40 }}>
              <View style={{ width: 40, height: 5, backgroundColor: theme.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 20, fontFamily: 'PlayfairDisplay_700Bold' }}>Come ti stai muovendo?</Text>
              
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: mobilityType === 'dolce' ? theme.primary + '15' : 'transparent', marginBottom: 10, borderWidth: mobilityType === 'dolce' ? 1 : 0, borderColor: theme.primary }}
                onPress={() => { saveMobilityChoice('dolce', 2); setIsHomeMobilitySheetVisible(false); }}
              >
                <MaterialIcons name="pedal-bike" size={24} color={mobilityType === 'dolce' ? theme.primary : theme.text} style={{ marginRight: 15 }} />
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: mobilityType === 'dolce' ? theme.primary : theme.text }}>Mobilità Dolce</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Bici, Monopattino, Piedi (Miglior Impatto)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: mobilityType === 'pubblica' ? theme.primary + '15' : 'transparent', marginBottom: 10, borderWidth: mobilityType === 'pubblica' ? 1 : 0, borderColor: theme.primary }}
                onPress={() => { saveMobilityChoice('pubblica', 10); setIsHomeMobilitySheetVisible(false); }}
              >
                <MaterialIcons name="directions-bus" size={24} color={mobilityType === 'pubblica' ? theme.primary : theme.text} style={{ marginRight: 15 }} />
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: mobilityType === 'pubblica' ? theme.primary : theme.text }}>Mezzi Pubblici</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Autobus, Treni (Impatto Medio)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: mobilityType === 'privata' ? theme.primary + '15' : 'transparent', borderWidth: mobilityType === 'privata' ? 1 : 0, borderColor: theme.primary }}
                onPress={() => { saveMobilityChoice('privata', 30); setIsHomeMobilitySheetVisible(false); }}
              >
                <MaterialIcons name="local-taxi" size={24} color={mobilityType === 'privata' ? theme.primary : theme.text} style={{ marginRight: 15 }} />
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: mobilityType === 'privata' ? theme.primary : theme.text }}>Auto Privata</Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Macchina, Moto (Impatto Alto)</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </ContentWrapper>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(253, 248, 242, 0.75)' },
  headerContainer: { paddingBottom: 15 },

  // HEADER SYMMETRY
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 25, paddingTop: 35, paddingBottom: 5, alignItems: 'center' },
  hubTitleSymmetry: { fontSize: 40, fontWeight: '900', color: theme.text, fontFamily: 'PlayfairDisplay_700Bold', letterSpacing: 0.5, lineHeight: 44, includeFontPadding: false, textAlignVertical: 'center' },
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
  prestigeTierTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 3, textAlign: 'left' },
  prestigeBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  prestigePillBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  prestigePillBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  avatarCirclePill: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', marginLeft: 5, marginRight: 2 },
  avatarInitialPill: { color: '#FFF', fontWeight: 'bold', fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold' },

  // IMPACT CARD '3 ARCHI'
  archesSection: { marginHorizontal: 20, marginBottom: 15 },
  archesMainTitle: { color: theme.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'PlayfairDisplay_700Bold', textAlign: 'center', marginBottom: 10 },
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

  sectionTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', marginLeft: 25, marginBottom: 15, color: theme.text },

  // POI CARD HARMONIOUS
  poiCardHarmonious: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 30, overflow: 'hidden', elevation: 6, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.06)' },

  poiImageContainer: { width: '100%', height: 180 },
  poiImageHarmonious: { width: '100%', height: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  recommendedBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: theme.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recommendedText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  poiInfoHarmonious: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  poiNameHarmonious: { fontSize: 22, fontWeight: 'bold', color: theme.text, fontFamily: 'PlayfairDisplay_700Bold' },
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
  expNameBoutique: { fontSize: 24, fontWeight: '900', color: theme.text, fontFamily: 'PlayfairDisplay_700Bold', marginTop: 10 },
  expTitleBoutique: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  modalStatsRowBoutique: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 0.5, borderColor: '#C9C4B8', elevation: 2 },
  modalStat: { alignItems: 'center', flex: 1 },
  mStatValBoutique: { fontSize: 18, fontWeight: 'bold' },
  mStatLab: { fontSize: 9, color: '#64748B', marginTop: 5, textTransform: 'uppercase', fontWeight: 'bold' }
});

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Dimensions, DeviceEventEmitter, FlatList, Image, ImageBackground, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated, Easing, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../utils/BackgroundLocationTask';
import { ThemeProvider as AppThemeProvider } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import { calculateLevel, getAvatarFrameStyle, EVENTS_UNLOCK_LEVEL } from '../../utils/levelUtils';
import MobilityWizard from '../../components/MobilityWizard';
import ProfileModal from '../../components/ProfileModal';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import TraguardiModal from '../../components/TraguardiModal';
import GameAchievementsSheet from '../../components/GameAchievementsSheet';
import ScannedPoisSheet from '../../components/ScannedPoisSheet';
import SingleBadgeSheet from '../../components/SingleBadgeSheet';
import TouristBaptismModal from '../../components/TouristBaptismModal';
import XpToast from '../../components/XpToast';
import LiveFeedBanner from '../../components/LiveFeedBanner';
import TipsBoutiqueSheet from '../../components/TipsBoutiqueSheet';
import PoiTrophyPassport from '../../components/PoiTrophyPassport';
import PoiCard from '../../components/PoiCard';
import BreathingLeaf from '../../components/BreathingLeaf';
import FioreIconaRituale from '../../components/FioreIconaRituale';

import ImpactStatsModal from '../../components/ImpactStatsModal';
import VaultModal from '../../components/VaultModal';
import { calculateDistance, calculateDistanceRaw } from '../../utils/haversine';
import { ensureEarnedBadges } from '../../utils/badgeAssignment';
import { useMobility } from '../../context/MobilityContext';
import { useGamification } from '../../context/GamificationContext';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import i18n from '../../locales/i18n';

import { useScanner } from './_layout';
const { width, height } = Dimensions.get('window');



// --- NUOVA PALETTE ECO-BOUTIQUE ---

const DICTIONARY = {
  IT: {
    hello: 'Ciao',
    guest: 'VIAGGIATORE',
    impactTitle: 'IL TUO IMPATTO ECO-SOSTENIBILE',
    co2Lab: 'Kg CO2 Evitata',
    ptsLab: 'LOTO PTI',
    ticker: 'ðŸƒ COMMUNITY TARANTO OGGI: 1.240 Litri risparmiati • 45kg Plastica • 12kg CO2',
    btnCheckin: 'Check-in',
    btnEvents: 'Eventi',
    btnMap: 'Mappa',
    sectionSpots: 'METE CONSIGLIATE',
    recommended: 'âœ¨ ✨ CONSIGLIATO: BONUS +10 PTI',
    scanBtn: 'SCANSIONA SCONTRINO',
    checkinAction: 'CHECK-IN (+15 XP)',
    userBadge: 'Utente Loto',
    modalCo2: 'CO2 Evitata',
    modalPlast: 'Plastica Ridotta',
    modalTok: 'Token Accumulati',
    modalDev: 'DEV TOOLS ðŸ› ï¸ (Modalità Super User)',
    levelGold: 'EROE DEL MARE',
    levelSilver: 'CUSTODE DELLA CITTÀ',
    levelBronze: 'ECO-NAVIGATORE',
    refillBadge: 'ðŸš° 💧 STAZIONE REFILL: BONUS IDRICO',
    crowdWarning: 'ðŸ”´ 🔥 META MOLTO AFFOLLATA',
    btnAlternative: 'VEDI ALTERNATIVA CONSIGLIATA',
    btnUnlockStory: 'SBLOCCA STORIA (+30 XP)'
  },
  UK: {
    hello: 'Hello',
    guest: 'Loto Guest',
    impactTitle: 'YOUR ECO-SUSTAINABLE IMPACT',
    co2Lab: 'Kg COâ‚‚ avoided',
    ptsLab: 'LOTO PTS',
    ticker: 'ðŸƒ TARANTO COMMUNITY TODAY: 1.240 Liters saved • 45kg Plastic • 12kg CO2',
    btnCheckin: 'Check-in',
    btnEvents: 'Events',
    btnMap: 'Map',
    sectionSpots: 'RECOMMENDED SPOTS',
    recommended: 'âœ¨ ✨ RECOMMENDED: +10 PTS BONUS',
    scanBtn: 'SCAN RECEIPT',
    checkinAction: 'CHECK-IN (+15 XP)',
    userBadge: 'Loto User',
    modalCo2: 'CO2 Avoided',
    modalPlast: 'Plastic Reduced',
    modalTok: 'Tokens Earned',
    modalDev: 'DEV TOOLS ðŸ› ï¸ (Super User Mode)',
    levelGold: 'SEA HERO',
    levelSilver: 'CITY GUARDIAN',
    levelBronze: 'ECO-NAVIGATOR',
    refillBadge: 'ðŸš° REFILL STATION: WATER BONUS',
    crowdWarning: 'ðŸ”´ VERY CROWDED DESTINATION',
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
        label: 'ðŸŒ± Dolce',
      };
    case 'pubblica':
      return {
        bg: '#F0F9FF', // Sfondo blu leggero
        text: '#0a7ea4', // Testo blu
        label: 'ðŸšŒ Pubblica',
      };
    case 'privata':
      return {
        bg: '#F1F5F9', // Sfondo grigio leggero
        text: '#4B5563', // Testo grigio
        label: 'ðŸš— Privata',
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
  const { mobilityType, forceReopenWizard, saveMobilityChoice, isAccessibleMode } = useMobility();
  const [pois, setPois] = useState<any[]>([]);
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Sincronizzazione posizione live per calcolo distanze nelle card POI Home ---
  useEffect(() => {
    let sub: any;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const last = await Location.getLastKnownPositionAsync();
      if (last) setUserLocation(last);
      sub = await Location.watchPositionAsync({ distanceInterval: 20 }, (loc) => {
        setUserLocation(loc);
      });
    })();
    return () => { if (sub) sub.remove(); };
  }, []);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userItineraries, setUserItineraries] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

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
    "Un VIAGGIATORE ha scoperto un nuovo POI!",
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
            const name = p.nickname || 'Un VIAGGIATORE';
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
  const [profileInitialTab, setProfileInitialTab] = useState<'identity' | 'squad' | 'diario'>('identity'); // F4: tab di apertura dell'L.O.T.O. HUB (fiore → Diario)
  const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);
  const [isImpactModalVisible, setIsImpactModalVisible] = useState(false);
  const [isVaultModalVisible, setIsVaultModalVisible] = useState(false);
  const [isGameAchievementsVisible, setIsGameAchievementsVisible] = useState(false);
  const [isScannedPoisVisible, setIsScannedPoisVisible] = useState(false);
  const [isSingleBadgeVisible, setIsSingleBadgeVisible] = useState(false);
  const [selectedBadgeData, setSelectedBadgeData] = useState<any>(null);
  const [checkinsToday, setCheckinsToday] = useState(0); // F4 Fiore 3 Petali: check-in di oggi
  
  // --- STATI SHEET ---
  const [isHomeMobilitySheetVisible, setIsHomeMobilitySheetVisible] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<{ [key: string]: string }>({});
  
  // STATI SPRINT B (Bottom Sheet e Accordion)
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [activeVaultPoiId, setActiveVaultPoiId] = useState<string | null>(null);
  const [trophyPoi, setTrophyPoi] = useState<any | null>(null);

  const lastNotifiedDistance = useRef(0);

  const distanceScaleAnim = useRef(new Animated.Value(1)).current;
  const pushRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Carica il totale salvato all'avvio
    AsyncStorage.getItem('@sincro_avventura_meters').then(stored => {
      if (stored) {
        gamification.setDistanceToday(parseInt(stored, 10));
      }
    });

    // 2. Ascolta gli incrementi live dal motore di EcoPassi
    const subscription = DeviceEventEmitter.addListener('onDistanceIncrement', (event) => {
      gamification.setDistanceToday(event.total);
      
      // Animazione "battito/spinta"
      Animated.sequence([
        Animated.timing(distanceScaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(distanceScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      
      if (event.total - lastNotifiedDistance.current >= 1000) {
        lastNotifiedDistance.current = event.total;
        const km = (event.total * 0.7) / 1000;
        // triggerStepMilestoneNotification(km);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('recommended');

  const [isBaptismVisible, setIsBaptismVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ xpAmount: 0, message: '' });

  // Store gamification SSOT: tutti i contatori della Home leggono qui (no copie locali disconnesse)
  const gamification = useGamification();
  const localParams = useLocalSearchParams();

  const t = DICTIONARY[lang];
  const tickerText = currentTenant?.localization?.onboarding_subtitle || t.ticker;

  // Ricarica i dati dinamicamente ogni volta che si torna sulla Home (es. dopo una scansione NFC)
  useFocusEffect(
    useCallback(() => {
      caricaDati();
    }, [])
  );

  // G18: la carta REVEAL del Diario (LV6) richiama qui con il segnale openDiary
  useEffect(() => {
    if (localParams.openDiary === '1') {
      setProfileInitialTab('diario');
      setIsExpModalVisible(true);
      router.setParams({ openDiary: undefined });
    }
  }, [localParams.openDiary]);

  useEffect(() => {
    if (currentTenant?.id) {
      supabase.from('profiles')
        .select('nickname')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => {
          if (data) setRecentUsers(data);
        });
    }
  }, [currentTenant]);

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
        const oldLevel = calculateLevel(prevXp);
        const newLevel = calculateLevel(currentXp);
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

  const fetchCheckinsToday = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('user_pois')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .gte('visited_at', startToday.toISOString());
      if (!error && count !== null) setCheckinsToday(count);
    } catch (e) {
      console.log('Errore conteggio check-in di oggi:', e);
    }
  };

  const loadTransactions = async (profileId: string) => {
    const [impactRes, gpsRes] = await Promise.all([
      supabase.from('impact_transactions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
      supabase.from('user_pois').select('*').eq('profile_id', profileId).order('visited_at', { ascending: false }).limit(20),
    ]);
    const gpsTx: any[] = (gpsRes.data || []).map((g: any) => ({
      id: `gps_${g.id}`,
      poi_id: g.poi_id,
      action_type: 'Check-in GPS',
      created_at: g.visited_at,
      co2_saved: g.co2_saved || 0,
      liters_saved: 0,
      tokens_earned: 0,
      xp_earned: g.xp_awarded || 0,
      profile_id: profileId,
    }));
    setUserTransactions([...(impactRes.data || []), ...gpsTx].sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const caricaDati = async () => {
    try {
      let fetchedPois: any[] = [];
      const { data: poiData, error } = await supabase
        .from('vw_pois_frontend')
        .select('*')
        .eq('tenant_id', currentTenant?.slug || 'taranto')
        .eq('is_active', true)
        .not('lat', 'is', null);

      if (error) {
        console.log("ERRORE RPC get_pois:", error);
      }
      if (poiData) {
        fetchedPois = poiData;
        setPois(fetchedPois.map(p => ({ ...p, latitude: p.latitude || p.lat, longitude: p.longitude || p.lng })));
      }

      // Fetch Eventi Pubblici
      const todayISO = new Date().toISOString();
      const { data: evData } = await supabase
        .from('events')
        .select('*')
        .eq('event_type', 'web_public')
        .gte('start_time', todayISO)
        .order('start_time', { ascending: true })
        .limit(10);
      if (evData) {
        setPublicEvents(evData);
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
          fetchCheckinsToday();
          loadTransactions(user.id);
          
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

          // Sistema badge VIVO: assegna i badge con requisiti reali già soddisfatti
          const newlyAssigned = await ensureEarnedBadges(supabase, profile, badges);
          if (newlyAssigned.length > 0) {
            const { data: refreshed } = await supabase
              .from('user_badges')
              .select('*, badges(*)')
              .eq('user_id', user.id);
            if (refreshed) setUserBadges(refreshed);
          }

          // Sincronizza lo Store Gamification (SSOT): niente calcoli o copie locali disconnesse
          const [[, fbXp], [, fbTok], [, fbPois]] = await AsyncStorage.multiGet(['loto_fallback_xp', 'loto_fallback_tokens', 'loto_fallback_pois']);
          gamification.syncProfile(profile, {
            badges: badges || [],
            fallbackXp: fbXp ? parseInt(fbXp) : 0,
            fallbackTokens: fbTok ? parseInt(fbTok) : 0,
            fallbackPois: fbPois ? parseInt(fbPois) : 0,
          });
        }
      }

      setUserItineraries(combinedItineraries);

      // Fetch Ticker Community
      const { data: cStats } = await supabase.from('vw_collective_impact').select('*').single();
      if (cStats) setCommunityStats(cStats);

      

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

  // Refresh LEGGERO dello Store Gamification: aggiorna XP/livello/badge/transazioni
  // senza rifare il caricamento completo della Home (transizione fluida dopo check-in).
  const refreshGamification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [[, fbXp], [, fbTok], [, fbPois]] = await AsyncStorage.multiGet(['loto_fallback_xp', 'loto_fallback_tokens', 'loto_fallback_pois']);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profile) return;
      setUserProfile(profile);
      fetchCheckinsToday();
      loadTransactions(user.id);
      const { data: badges } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id);
      if (badges) setUserBadges(badges);
      const newlyAssigned = await ensureEarnedBadges(supabase, profile, badges);
      if (newlyAssigned.length > 0) {
        const { data: refreshed } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id);
        if (refreshed) setUserBadges(refreshed);
      }
      gamification.syncProfile(profile, {
        badges: badges || [],
        fallbackXp: fbXp ? parseInt(fbXp) : 0,
        fallbackTokens: fbTok ? parseInt(fbTok) : 0,
        fallbackPois: fbPois ? parseInt(fbPois) : 0,
      });
    } catch (e) {
      console.log("Errore refreshGamification:", e);
    }
  };

  useEffect(() => {
    // Apri il modale di battesimo se il caricamento è finito, c'è un profilo ma non ha un nickname
    if (!loading && userProfile && !userProfile.nickname) {
      // setIsBaptismVisible(true); // DISABILITATO PER ZERO-PII: l'app rimane 100% anonima
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

  ;

  const toggleSensors = async () => {
    if (!isGeofenceActive) {
      try {
        // await startBackgroundLocationUpdates(); // Spostato al toggle manuale
        setIsGeofenceActive(true);
        // Alert rimosso per evitare spam UI
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
    
    // Aggiornamento LEGGERO dello Store Gamification (niente reload brutale della Home)
    refreshGamification();

    // Dopo mezzo secondo, appare in trionfo la Scheda Trofeo
    setTimeout(() => {
      setTrophyPoi(poi);
    }, 400);
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
    const isPartner = userProfile?.flow_role === 'LOTO Partner';

    const mobilityConfig = getMobilityPillStyle(mobilityType || 'dolce');

    return (
      <View style={{ paddingBottom: 10 }}>
        
        {/* --- 1. HEADER BOUTIQUE (logo abbellito ridimensionato + sottotitolo con foglioline) --- */}
        <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 15, paddingHorizontal: 20 }}>
          <Image
            source={require('../../assets/images/loto_map_logo_orizzontale_con_foglioline.png')}
            style={{ width: '100%', maxWidth: 196, aspectRatio: 2.333, resizeMode: 'contain' }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <MaterialIcons name="eco" size={18} color="#BCA37F" />
            <Text style={{ fontFamily: 'Raleway_400Regular', fontSize: 18, color: '#6A5638', marginHorizontal: 12, letterSpacing: 1 }}>
              Co-ExpErience
            </Text>
            <MaterialIcons name="eco" size={18} color="#BCA37F" />
          </View>
        </View>

        {/* --- PRESTIGE CARD COMPATTA --- */}
        <View style={{ backgroundColor: '#2D4A22', borderRadius: 20, padding: 15, marginHorizontal: 20, marginBottom: 15, elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }}>
          
{/* Fiore di Oggi: icona-rituale della barra verde, apre il Diario di Bordo (F4/P.S.) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { setProfileInitialTab('diario'); setIsExpModalVisible(true); }}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 5,
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: '#3B5F31', borderWidth: 1, borderColor: '#D4AF37',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 6, elevation: 6,
              }}
            >
              <FioreIconaRituale size={20} color="#D4AF37" />
            </TouchableOpacity>

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

              {/* XP Bar inside Card: progresso REALE verso il prossimo livello + contatore numerico XP */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                  <View style={{ width: `${levelProgress.percent}%`, height: '100%', backgroundColor: levelProgress.color || '#D4AF37', borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>
                  {Math.floor(gamification.xp)} / {levelProgress.nextXp} XP
                </Text>
              </View>

            </View>

            {/* Right Side: Avatar Circle (cornice SSOT getAvatarFrameStyle, avanza a ogni livello) */}
            <TouchableOpacity onPress={() => { setProfileInitialTab('identity'); setIsExpModalVisible(true); }} activeOpacity={0.8} style={{ alignItems: 'center', marginRight: 44 }}>
              <View style={[{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B5F31', justifyContent: 'center', alignItems: 'center', transform: [{ translateY: -5 }] }, getAvatarFrameStyle(levelProgress.currentLevel)]}>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: '#FFF' }}>
                  {(userProfile?.nickname || 'VIAGGIATORE')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ backgroundColor: '#FDFBF7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: levelProgress.color || '#D4AF37', marginTop: 2, elevation: 5 }}>
                <Text style={{ color: '#333', fontSize: 8, fontWeight: 'bold' }}>{i18n.t('levelPrefix')} {levelProgress.currentLevel}</Text>
              </View>
            </TouchableOpacity>

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
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{i18n.t('dashboardClues')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="search" size={24} color="#D4AF37" />
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', marginLeft: 10 }}>
                {gamification.poisDiscovered}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 2. LOTO PTI + CO2 + PASSI */}
          <TouchableOpacity 
            onPress={() => setIsImpactModalVisible(true)}
            activeOpacity={0.9} 
            style={{ width: '48%', backgroundColor: '#476537', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4 }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{i18n.t('dashboardImpact')}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Animated.View style={{ transform: [
                      { scale: distanceScaleAnim },
                      { translateX: pushRotateAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }
                    ] }}>
                    <MaterialIcons name="route" size={12} color="#FFF" style={{marginRight: 4}} />
                  </Animated.View>
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' }}>
                    {gamification.distanceToday > 1000 ? (gamification.distanceToday/1000).toFixed(1) + ' Km' : gamification.distanceToday + ' m'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialIcons name="eco" size={12} color="#2ECC71" style={{marginRight: 4}} />
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' }}>
                    {(gamification.co2 ?? 0).toFixed(1)} kg
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="toll" size={12} color="#D4AF37" style={{marginRight: 4}} />
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' }}>
                    {gamification.tokens} PTI
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
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{i18n.t('dashboardArchive')}</Text>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>{i18n.t('dashboardDocs')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="photo-library" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 9, marginLeft: 5 }}>{i18n.t('dashboardExplore')}</Text>
            </View>
          </TouchableOpacity>

          {/* 4. Achievements */}
          <TouchableOpacity 
            onPress={() => setIsBadgeModalVisible(true)}
            activeOpacity={0.9}
            style={{ width: '48%', backgroundColor: '#DFAB55', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4 }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{i18n.t('dashboardMilestones')}</Text>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>{gamification.levelTitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="emoji-events" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 9, marginLeft: 5 }}>{gamification.badgesCount} {i18n.t('dashboardBadges')}</Text>
            </View>
            <Text style={{ color: '#FFF', fontSize: 9, marginTop: 8, fontWeight: 'bold' }}>{i18n.t('dashboardChallenge')}</Text>
          </TouchableOpacity>

        </View>

        {/* --- LIVE COMMUNITY FEED --- */}
        <LiveFeedBanner pois={pois} />


      </View>
    );
  };

  // Rimossa BreathingLeaf iniziale come richiesto
  // Tutti i contatori derivano dallo STORE GAMIFICATION (SSOT via calculateLevel/getLevelProgress)
  const userTokens = gamification.tokens;
  const userXp = gamification.xp;
  const levelProgress = gamification.levelProgress;
  const levelInfo = { title: levelProgress.levelTitle, stemma: levelProgress.stemma, color: levelProgress.color, level: levelProgress.currentLevel };

  const getDynamicPois = () => {
    // Ordina tutti i POI per distanza
    const sorted = [...pois].sort((a, b) => {
      const distA = userLocation ? calculateDistanceRaw(userLocation.coords.latitude, userLocation.coords.longitude, a.latitude || a.lat, a.longitude || a.lng) : 0;
      const distB = userLocation ? calculateDistanceRaw(userLocation.coords.latitude, userLocation.coords.longitude, b.latitude || b.lat, b.longitude || b.lng) : 0;
      return distA - distB;
    });

    return [
      { id: 'recommended', title: 'Mete Consigliate', icon: 'explore', data: sorted.filter(p => p.is_recommended) },
      { id: 'free', icon: 'account-balance', title: 'Culturali', data: sorted.filter(p => (p.category === 'free' || p.category === 'museum' || p.category === 'attraction' || p.category === 'monument' || p.category === 'park') && !p.is_recommended) },
      { id: 'partner', icon: 'storefront', title: 'Boutique & Partner', data: sorted.filter(p => p.category === 'partner') },
      { id: 'secret', icon: 'vpn-key', title: 'Mete Segrete', data: sorted.filter(p => p.category === 'secret') },

    ];
  };

  const renderShelf = ({ item }: { item: any }) => {
    return (
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {item.icon && <MaterialIcons name={item.icon} size={22} color={theme.text} style={{ marginRight: 8 }} />}
              <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', color: theme.text }}>
                {item.title}
              </Text>
            </View>
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
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
               <Text style={{ color: theme.textMuted, fontStyle: 'italic' }}>{i18n.t('noSpots')}</Text>
            </View>
          }
          contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
        />
      </View>
    );
  };


  const renderEventsFooter = () => {
    if (!publicEvents || publicEvents.length === 0) return null;
    
    const isEventsUnlocked = levelProgress.currentLevel >= EVENTS_UNLOCK_LEVEL;
    
    return (
      <View style={{ marginBottom: 40, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', color: theme.text }}>
            Eventi Pubblici 📅
          </Text>
          {!isEventsUnlocked && (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textMuted }}>{i18n.t('unlockLv2')}</Text>
            </View>
          )}
        </View>
        <View style={{ opacity: isEventsUnlocked ? 1 : 0.4 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={publicEvents}
            keyExtractor={ev => ev.id}
            scrollEnabled={isEventsUnlocked}
            renderItem={({ item: ev }) => (
              <View style={{ width: 280, marginRight: -5 }}>
                <TouchableOpacity 
                  onPress={() => {
                    if (isEventsUnlocked && ev.url) {
                      Linking.openURL(ev.url).catch(() => console.log("Impossibile aprire URL:", ev.url));
                    }
                  }}
                  activeOpacity={0.9}
                  style={{ 
                    backgroundColor: theme.surface, 
                    padding: 20, 
                    borderRadius: 15, 
                    marginHorizontal: 10, 
                    borderWidth: 1, 
                    borderColor: isEventsUnlocked ? '#D4AF37' : theme.border,
                    shadowColor: isEventsUnlocked ? '#D4AF37' : 'transparent',
                    shadowOpacity: isEventsUnlocked ? 0.3 : 0,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 }
                  }}>
                  {!isEventsUnlocked && (
                     <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 15 }}>
                       <MaterialIcons name="lock" size={32} color={theme.textMuted} />
                     </View>
                  )}
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.text }}>{ev.title}</Text>
                  <Text style={{ fontSize: 12, color: theme.primary, marginTop: 5, fontWeight: 'bold' }}>{new Date(ev.start_time).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 13, color: theme.text, marginTop: 10, lineHeight: 20 }} numberOfLines={4}>{ev.description}</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
          />
        </View>
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
          ListFooterComponent={renderEventsFooter}
        />

        {isMotorized && (
          <View style={styles.motorizedToast}>
            <Text style={styles.motorizedToastText}>ðŸšŒ MODO MOTORIZZATO ATTIVO</Text>
          </View>
        )}


        {/* MODALE SCHEDA EXP (PROFILO AVATAR PREMIUM) ESTRATTO */}
        <ProfileModal
          visible={isExpModalVisible}
          onClose={() => setIsExpModalVisible(false)}
          userProfile={userProfile}
          userXp={userXp}
          levelInfo={levelInfo}
          userTokens={userTokens}
          theme={theme}
          setUserProfile={setUserProfile}
          initialTab={profileInitialTab}
          distanceToday={gamification.distanceToday || 0}
          co2Kg={gamification.co2 ?? 0}
          checkinsToday={checkinsToday}
        />

        {/* MODALE IMPATTO E PUNTI (DAL QUADRANTE 2) */}
        <ImpactStatsModal
          visible={isImpactModalVisible}
          onClose={() => setIsImpactModalVisible(false)}
          userProfile={userProfile}
          userTransactions={userTransactions}
          userTokens={userTokens}
          theme={theme}
          distanceToday={gamification.distanceToday}
          isAccessibleMode={isAccessibleMode}
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
          scannedPois={pois.filter(p => userTransactions.some(t => t.poi_id === p.id))}
          theme={theme}
          onSelectPoi={(poi) => setTrophyPoi(poi)}
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

        <PoiTrophyPassport
          visible={trophyPoi !== null}
          poi={trophyPoi}
          userLevel={levelProgress.currentLevel}
          onClose={() => setTrophyPoi(null)}
        />

      {/* BOTTONE TIPS ELIMINATO: spostato nell'header */}

      <TipsBoutiqueSheet visible={isTipsVisible} onClose={() => setIsTipsVisible(false)} />

      <TraguardiModal
        visible={isBadgeModalVisible}
        onClose={() => setIsBadgeModalVisible(false)}
        userBadges={userBadges}
        userProfile={userProfile}
        userXp={userXp}
        theme={theme}
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



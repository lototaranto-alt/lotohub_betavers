import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from 'react-native';
import { supabase } from '../../utils/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

// --- ASSET ORIGINALI (PRESERVATI) ---
const WIZARD_ASSETS = [
  require('../../assets/images/intro_explore_1775676666618.png'),
  require('../../assets/images/intro_protect_1775676688994.png'),
  require('../../assets/images/intro_earn_1775676711707.png'),
];

// --- NUOVA PALETTE ECO-BOUTIQUE ---
const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDF8F2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
  // VECCHI COLORI (per retrocompatibilità)
  VERDE: '#4A5D23',
  BLU: '#0056D2',
  ORO: '#D96C4A',
  ROSSO: '#D94A4A',
  BLU_SCURO: '#0F172A',
  GRIGIO: '#64748B',
  BG: '#FFFFFF',
  TEXT_LIGHT: '#64748B',
  CARD_BG: '#F8FAFC'
};

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

const getPOIImage = (name: string) => {
  try {
    if (name.includes('Castello')) return require('../../assets/images/castello-evento.png');
    if (name.includes('Fontana') || name.includes('Piazza Fontana')) return require('../../assets/images/fontana.jpg');
    if (name.includes('MArTA') || name.includes('LOTO')) return require('../../assets/images/logo-LOTO.png');
    return null;
  } catch (e) {
    return null;
  }
};

export default function VetrinaScreen() {
  const [pois, setPois] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);

  // --- STATO TRIANGOLO DELLA VERITÀ (INTEGRALE) ---
  const [isMotorized, setIsMotorized] = useState(false);
  const lastSample = useRef<{ coords: Location.LocationObjectCoords; timestamp: number } | null>(null);
  const KINEMATIC_TIMER_MS = 60000;
  const SPEED_LIMIT_KMS = 20 / 3.6;

  // Wizard
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [updatingWizard, setUpdatingWizard] = useState(false);
  const [nickname, setNickname] = useState('');
  const [persona, setPersona] = useState('Standard');
  const [partySize, setPartySize] = useState('1');

  // STATI LOGICI
  const [lang, setLang] = useState<'IT' | 'UK'>('IT');
  const [isExpModalVisible, setIsExpModalVisible] = useState(false);

  const t = DICTIONARY[lang];

  const getLevelInfo = (tokens: number) => {
    if (tokens >= 500) return { title: t.levelGold, badge: require('../../assets/images/badge_gold_1775676641737.png'), color: LOTO_PALETTE.SABBIA_DORATA, stemma: 'workspace-premium' as any };
    if (tokens >= 100) return { title: t.levelSilver, badge: require('../../assets/images/badge_silver_1775675392322.png'), color: LOTO_PALETTE.VERDE_OLIVA, stemma: 'security' as any };
    return { title: t.levelBronze, badge: require('../../assets/images/badge_bronze_1775675369793.png'), color: LOTO_PALETTE.TERRACOTTA, stemma: 'sailing' as any };
  };

  useEffect(() => {
    caricaDati();
    const interval = setInterval(() => avviaFiltroCinematico(), KINEMATIC_TIMER_MS);
    return () => clearInterval(interval);
  }, []);

  const caricaDati = async () => {
    try {
      const { data: poiData } = await supabase.rpc('get_pois');
      if (poiData) setPois(poiData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
          if (!profile.onboarding_completed) setShowWizard(true);
        }
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
          setUserLocation(loc);
        });
      }
    } catch (e) {
      console.log("Errore caricaDati:", e);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAction = (poi: any) => {
    if (poi.category === 'partner') {
      executeScan(poi);
    } else {
      const isGolden = (userProfile?.total_tokens || 0) >= 100;
      Alert.alert("Check-in", isGolden ? `Hai sbloccato la storia di ${poi.name}. +30 XP!` : `Benvenuto a ${poi.name}. +15 XP`);
    }
  };

  const trovaAlternativa = (poiAffollato: any) => {
    if (!userLocation) {
      Alert.alert("GPS Richiesto", "Attiva il GPS per calcolare l'alternativa.");
      return;
    }
    
    let alternativi = pois.filter(p => p.id !== poiAffollato.id && p.category !== 'partner' && (p.crowd_level || 0) < 80);
    
    if (alternativi.length === 0) {
      Alert.alert("Nessuna Alternativa", "Tutte le mete sono attualmente sature.");
      return;
    }

    alternativi.sort((a, b) => {
      const distA = getDistance(userLocation.coords.latitude, userLocation.coords.longitude, a.latitude, a.longitude);
      const distB = getDistance(userLocation.coords.latitude, userLocation.coords.longitude, b.latitude, b.longitude);
      return distA - distB;
    });

    const best = alternativi[0];
    const distBest = Math.round(getDistance(userLocation.coords.latitude, userLocation.coords.longitude, best.latitude, best.longitude));
    
    Alert.alert(
      "LOTO Core Suggerisce!", 
      `Evita la folla! Visita ${best.name} a soli ${distBest}m da te. In questo momento non c'è coda ed è tranquillo.`
    );
  };

  const completaWizard = async () => {
    if (!nickname.trim()) {
      Alert.alert("Attenzione", "Inserisci un nickname per completare il profilo.");
      return;
    }

    setUpdatingWizard(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      // AGGIORNAMENTO PERSISTENTE SU SUPABASE
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          nickname: nickname.trim(),
          user_persona: persona,
          party_size: parseInt(partySize, 10) || 1
        })
        .eq('id', user.id);
      if (error) throw error;
      setShowWizard(false);
      caricaDati();
    } catch (error) {
      Alert.alert("Errore", "Impossibile salvare l'onboarding.");
    } finally {
      setUpdatingWizard(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      
      {/* 1. HEADER 'SYMMETRY' */}
      <View style={styles.topBar}>
        <Text style={styles.hubTitleSymmetry}>L.O.T.O. HUB</Text>
        <TouchableOpacity onPress={() => setLang(lang === 'IT' ? 'UK' : 'IT')} style={styles.languageIconWrapper}>
          <MaterialIcons name="language" size={24} color={LOTO_PALETTE.EBANO} />
          <View style={styles.langBadge}><Text style={styles.langBadgeText}>{lang}</Text></View>
        </TouchableOpacity>
      </View>

      {/* 2. IL RETTANGOLO 'PRESTIGE' (Pillola Tier) */}
      <View style={styles.prestigePill}>
        {/* SX: Stemma Tier */}
        <MaterialIcons name={levelInfo.stemma || 'emoji-events'} size={60} color={LOTO_PALETTE.SABBIA_DORATA} />
        
        {/* Centro: Testo */}
        <View style={styles.prestigeCenterCol}>
          <Text style={styles.prestigeTierTitle}>{levelInfo.title}</Text>
          <View style={styles.prestigeBadgeRow}>
            <View style={styles.prestigePillBadge}><Text style={styles.prestigePillBadgeText}>{userProfile?.persona || 'Ospite Loto'}</Text></View>
            <View style={[styles.prestigePillBadge, {backgroundColor: '#FFF'}]}><Text style={[styles.prestigePillBadgeText, {color: LOTO_PALETTE.VERDE_OLIVA}]}>Partner</Text></View>
          </View>
        </View>

        {/* DX: Avatar */}
        <TouchableOpacity style={styles.avatarCirclePill} onPress={() => setIsExpModalVisible(true)}>
          <Text style={styles.avatarInitialPill}>{userProfile?.nickname ? userProfile.nickname[0].toUpperCase() : 'L'}</Text>
        </TouchableOpacity>
      </View>

      {/* 3. IMPACT CARD '3 ARCHI' (Core ESG) */}
      <View style={styles.archesSection}>
        <Text style={styles.archesMainTitle}>{t.impactTitle}</Text>
        <View style={styles.archesContainer}>
          <View style={[styles.impactArch, {backgroundColor: LOTO_PALETTE.VERDE_OLIVA}]}>
             <MaterialIcons name="eco" size={24} color="#FFF" style={{marginBottom: 10}}/>
             <Text style={styles.archVal}>{userProfile?.total_co2?.toFixed(1) || '0.5'}</Text>
             <Text style={styles.archLabel}>{t.co2Lab}</Text>
          </View>
          <View style={[styles.impactArch, {backgroundColor: '#0056D2'}]}>
             <MaterialIcons name="water-drop" size={24} color="#FFF" style={{marginBottom: 10}}/>
             <Text style={styles.archVal}>12</Text>
             <Text style={styles.archLabel}>Refill (Litri)</Text>
          </View>
          <View style={[styles.impactArch, {backgroundColor: LOTO_PALETTE.SABBIA_DORATA}]}>
             <MaterialIcons name="toll" size={24} color="#FFF" style={{marginBottom: 10}}/>
             <Text style={styles.archVal}>{userProfile?.total_tokens || 120}</Text>
             <Text style={styles.archLabel}>{t.ptsLab}</Text>
          </View>
        </View>
      </View>

      {/* 4. TICKER COMMUNITY */}
      <View style={styles.tickerBar}>
        <Text style={styles.tickerText}>
          {t.ticker}
        </Text>
      </View>

      {/* 5. SWITCHBOARD HUB (I 3 TASTI CENTRALI: Esplora, Mappa, Eventi) */}
      <View style={styles.switchboard}>
        <TouchableOpacity style={styles.hubBtn}>
          <View style={styles.hubIconCircle}><MaterialIcons name="search" size={24} color="#FFF" /></View>
          <Text style={styles.hubBtnText}>{t.btnCheckin}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.hubBtn, styles.hubBtnCenter]}>
          <View style={[styles.hubIconCircle, {backgroundColor: LOTO_PALETTE.TERRACOTTA}]}><MaterialIcons name="map" size={24} color="#FFF" /></View>
          <Text style={[styles.hubBtnText, {color: LOTO_PALETTE.TERRACOTTA}]}>{t.btnMap}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.hubBtn}>
          <View style={styles.hubIconCircle}><MaterialIcons name="event" size={24} color="#FFF" /></View>
          <Text style={styles.hubBtnText}>{t.btnEvents}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t.sectionSpots}</Text>
    </View>
  );

  const renderPOI = ({ item }: { item: any }) => {
    const img = getPOIImage(item.name);
    const isCrowded = (item.crowd_level || 0) >= 80;
    const hasWater = item.has_water === true;
    const userTokens = userProfile?.total_tokens || 0;
    const canUnlockStory = userTokens >= 100 && item.category !== 'partner';

    return (
      <View style={[styles.poiCardHarmonious, isCrowded && {borderWidth: 1, borderColor: LOTO_PALETTE.TERRACOTTA}]}>
        <View style={styles.poiImageContainer}>
           {img ? <Image source={img} style={styles.poiImageHarmonious} /> : <View style={[styles.poiImageHarmonious, {backgroundColor: '#E2E8F0'}]} />}
           <View style={styles.recommendedBadge}>
             <Text style={styles.recommendedText}>✨ BONUS +10 PTI</Text>
           </View>
        </View>
        
        <View style={styles.poiInfoHarmonious}>
          <Text style={styles.poiNameHarmonious}>{item.name}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
            <MaterialIcons name="place" size={14} color={LOTO_PALETTE.VERDE_OLIVA} />
            <Text style={styles.poiDistHarmonious}> {(item.checkin_radius || 800)}m • <Text style={{color: LOTO_PALETTE.TERRACOTTA}}>{isCrowded ? 'Affollato' : 'Normal Crowd'}</Text></Text>
          </View>
          
          {isCrowded ? (
            <View style={{marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={{color: LOTO_PALETTE.TERRACOTTA, fontWeight: 'bold', fontSize: 11}}>{t.crowdWarning} ({(item.crowd_level || 85)}%)</Text>
              <TouchableOpacity
                style={[styles.btnActionHarmonious, { backgroundColor: LOTO_PALETTE.TERRACOTTA }]}
                onPress={() => trovaAlternativa(item)}
              >
                <Text style={styles.btnActionTextHarmonious}>{t.btnAlternative}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              {hasWater ? <Text style={{color: '#0056D2', fontWeight: 'bold', fontSize: 11}}>{t.refillBadge}</Text> : <View />}
              <TouchableOpacity
                style={[styles.btnActionHarmonious, { backgroundColor: item.category === 'partner' ? '#0056D2' : (canUnlockStory ? LOTO_PALETTE.SABBIA_DORATA : LOTO_PALETTE.VERDE_OLIVA) }]}
                onPress={() => handleAction(item)}
              >
                <Text style={styles.btnActionTextHarmonious}>
                  {item.category === 'partner' ? t.scanBtn : (canUnlockStory ? t.btnUnlockStory : t.checkinAction)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={LOTO_PALETTE.VERDE} />;

  const userTokens = userProfile?.total_tokens || 0;
  const levelInfo = getLevelInfo(userTokens);

  return (
    <ImageBackground source={require('../../assets/images/eco_bg.png')} style={{flex: 1}} resizeMode="cover">
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={pois}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={renderPOI}
      />

      {isMotorized && (
        <View style={styles.motorizedToast}>
          <Text style={styles.motorizedToastText}>🚌 MODO MOTORIZZATO ATTIVO</Text>
        </View>
      )}

      {/* MODALE WIZARD (PRESERVATA) */}
      <Modal visible={showWizard} transparent animationType="fade">
        <View style={styles.wizardOverlay}>
          <SafeAreaView style={styles.wizardContainer}>
            {wizardStep < 3 ? (
              <>
                <Image source={WIZARD_ASSETS[wizardStep]} style={styles.wizardImg} resizeMode="contain" />
                <TouchableOpacity style={styles.btnNext} onPress={() => setWizardStep(wizardStep + 1)}>
                  <Text style={styles.btnNextText}>AVANTI</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', paddingHorizontal: 20 }}>
                <Text style={styles.formTitle}>Benvenuto in Hub</Text>
                <Text style={styles.formSubtitle}>Crea il tuo profilo di impatto.</Text>

                <Text style={styles.label}>Nickname</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Come vuoi farti chiamare?"
                  value={nickname}
                  onChangeText={setNickname}
                />

                <Text style={styles.label}>Badge Esploratore</Text>
                <View style={styles.badgeRow}>
                  {['Standard', 'Senior', '♿'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.badgeOption, persona === p && styles.badgeOptionActive]}
                      onPress={() => setPersona(p)}
                    >
                      <Text style={[styles.badgeOptionText, persona === p && styles.badgeOptionTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Gruppo (Numero persone in viaggio)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={partySize}
                  onChangeText={setPartySize}
                />

                <TouchableOpacity style={styles.btnNext} onPress={completaWizard} disabled={updatingWizard}>
                  <Text style={styles.btnNextText}>{updatingWizard ? 'SALVATAGGIO...' : 'ENTRA IN LOTO'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* MODALE SCHEDA EXP (EROE DEL MARE) */}
      <Modal visible={isExpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.expCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsExpModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={LOTO_PALETTE.ROSSO} />
            </TouchableOpacity>
            
            <Image source={levelInfo.badge} style={styles.crownIcon} />
            <Text style={styles.expName}>{userProfile?.nickname || t.guest}</Text>
            <Text style={[styles.expTitle, { color: levelInfo.color }]}>{levelInfo.title} ({userTokens} XP)</Text>

            <View style={styles.modalStatsRow}>
              <View style={styles.modalStat}>
                <Text style={styles.mStatVal}>{userProfile?.total_co2?.toFixed(2) || '0.25'} kg</Text>
                <Text style={styles.mStatLab}>{t.modalCo2}</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.mStatVal, {color: '#0056D2'}]}>12.0 L</Text>
                <Text style={styles.mStatLab}>{t.modalPlast}</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={[styles.mStatVal, {color: '#D96C4A'}]}>{userProfile?.total_tokens || 120} T</Text>
                <Text style={styles.mStatLab}>{t.modalTok}</Text>
              </View>
            </View>

            <View style={styles.devTools}>
              <Text style={styles.devTitle}>{t.modalDev}</Text>
              <View style={styles.devBtnRow}>
                <TouchableOpacity style={[styles.devBtn, {backgroundColor: '#E0F2FE'}]}>
                  <Text style={styles.devBtnText}>🚀 BOOST XP</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.devBtn, {backgroundColor: '#FCE7F3'}]}
                   onPress={() => { setIsExpModalVisible(false); setShowWizard(true); }}
                >
                  <Text style={styles.devBtnText}>🔄 WIZARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.devBtn, {backgroundColor: '#000'}]}>
                  <Text style={[styles.devBtnText, {color: '#FFF'}]}>🚀 HARD RESET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(253, 248, 242, 0.75)' },
  headerContainer: { paddingBottom: 15 },
  
  // HEADER SYMMETRY
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 40, paddingBottom: 15, alignItems: 'center' },
  hubTitleSymmetry: { fontSize: 26, fontWeight: '900', color: LOTO_PALETTE.EBANO, fontFamily: 'serif', letterSpacing: 2 },
  languageIconWrapper: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: LOTO_PALETTE.TERRACOTTA, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  langBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: LOTO_PALETTE.EBANO, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8 },
  langBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  // RETTANGOLO PRESTIGE
  prestigePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: LOTO_PALETTE.VERDE_OLIVA, marginTop: 10, marginBottom: 25, marginRight: 25, paddingVertical: 20, paddingHorizontal: 20, borderTopRightRadius: 50, borderBottomRightRadius: 50, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  prestigeCenterCol: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  prestigeTierTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', fontFamily: 'serif', marginBottom: 5 },
  prestigeBadgeRow: { flexDirection: 'row' },
  prestigePillBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  prestigePillBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  avatarCirclePill: { width: 66, height: 66, borderRadius: 33, backgroundColor: LOTO_PALETTE.CREMA, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: LOTO_PALETTE.SABBIA_DORATA, marginLeft: 10 },
  avatarInitialPill: { color: LOTO_PALETTE.EBANO, fontWeight: 'bold', fontSize: 24, fontFamily: 'serif' },

  // IMPACT CARD '3 ARCHI'
  archesSection: { marginHorizontal: 20, marginBottom: 25 },
  archesMainTitle: { color: LOTO_PALETTE.EBANO, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'serif', textAlign: 'center', marginBottom: 15 },
  archesContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  impactArch: { flex: 1, alignItems: 'center', paddingTop: 25, paddingBottom: 55, borderTopLeftRadius: 80, borderTopRightRadius: 80, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, elevation: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  archVal: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  archLabel: { color: '#FFF', fontSize: 10, opacity: 0.9, textAlign: 'center', marginTop: 4, fontWeight: '500' },

  // COMMUNITY TICKER
  tickerBar: { backgroundColor: LOTO_PALETTE.EBANO, paddingVertical: 14, marginHorizontal: 20, borderRadius: 15, marginBottom: 20 },
  tickerText: { color: LOTO_PALETTE.SABBIA_DORATA, fontSize: 11, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.5 },
  
  // SWITCHBOARD
  switchboard: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 25, justifyContent: 'space-between', alignItems: 'center' },
  hubBtn: { alignItems: 'center', flex: 1 },
  hubBtnCenter: { transform: [{translateY: 0}] },
  hubIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: LOTO_PALETTE.VERDE_OLIVA, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  hubBtnText: { color: LOTO_PALETTE.EBANO, fontWeight: 'bold', fontSize: 11, marginTop: 10, textTransform: 'uppercase' },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', marginLeft: 25, marginBottom: 15, color: LOTO_PALETTE.EBANO },
  
  // POI CARD HARMONIOUS
  poiCardHarmonious: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 30, overflow: 'hidden', elevation: 6, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.06)' },
  poiImageContainer: { width: '100%', height: 180 },
  poiImageHarmonious: { width: '100%', height: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  recommendedBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: LOTO_PALETTE.TERRACOTTA, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recommendedText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  poiInfoHarmonious: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  poiNameHarmonious: { fontSize: 22, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, fontFamily: 'serif' },
  poiDistHarmonious: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  btnActionHarmonious: { borderRadius: 20, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  btnActionTextHarmonious: { color: '#FFF', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 },
  wizardOverlay: { flex: 1, backgroundColor: '#FFF' },
  wizardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  wizardImg: { width: width * 0.9, height: height * 0.6 },
  btnNext: { backgroundColor: LOTO_PALETTE.VERDE, paddingVertical: 18, paddingHorizontal: 60, borderRadius: 30, marginTop: 20, alignItems: 'center' },
  btnNextText: { color: '#FFF', fontWeight: 'bold' },
  formTitle: { fontSize: 28, fontWeight: '900', marginBottom: 5, color: LOTO_PALETTE.BLU_SCURO, textAlign: 'center', marginTop: 30 },
  formSubtitle: { fontSize: 16, color: LOTO_PALETTE.GRIGIO, textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: LOTO_PALETTE.GRIGIO, marginTop: 15 },
  input: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 10, fontSize: 16, color: LOTO_PALETTE.BLU_SCURO },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badgeOption: { flex: 1, padding: 15, backgroundColor: '#F1F5F9', borderRadius: 10, marginHorizontal: 5, alignItems: 'center' },
  badgeOptionActive: { backgroundColor: LOTO_PALETTE.VERDE },
  badgeOptionText: { fontSize: 12, fontWeight: 'bold', color: LOTO_PALETTE.GRIGIO },
  badgeOptionTextActive: { color: '#FFF' },
  motorizedToast: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: LOTO_PALETTE.ROSSO, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  motorizedToastText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  expCard: { width: '90%', backgroundColor: '#FFFEEA', borderRadius: 30, padding: 30, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end', position: 'absolute', top: 20, right: 20 },
  crownIcon: { width: 150, height: 150, marginBottom: 10 },
  expName: { fontSize: 28, fontWeight: 'bold', color: LOTO_PALETTE.BLU_SCURO },
  expTitle: { fontSize: 16, fontWeight: 'bold', color: '#64748B', marginBottom: 30 },
  modalStatsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20 },
  modalStat: { alignItems: 'center', flex: 1 },
  mStatVal: { fontSize: 18, fontWeight: 'bold', color: LOTO_PALETTE.VERDE },
  mStatLab: { fontSize: 9, color: '#94A3B8', marginTop: 5 },
  devTools: { width: '100%', alignItems: 'center', marginTop: 10 },
  devTitle: { fontSize: 12, fontWeight: 'bold', color: '#D96C4A', marginBottom: 10 },
  devBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  devBtn: { flex: 1, marginHorizontal: 3, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  devBtnText: { fontSize: 9, fontWeight: 'bold', color: LOTO_PALETTE.BLU_SCURO }
});
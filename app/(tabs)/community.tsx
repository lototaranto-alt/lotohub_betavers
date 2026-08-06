import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, LayoutAnimation, UIManager, Platform, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import EmptyStateCard from '../../components/EmptyStateCard';
import { supabase } from '../../utils/supabase';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CivicReportSheet } from '../../components/CivicReportSheet';
import * as Location from 'expo-location';
import { calculateLevel } from '../../utils/levelUtils';
import PlasticaqquaEventSheet from '../../components/PlasticaqquaEventSheet';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HorizontalShelf = ({ title, data, renderItem, theme, onHeaderPress }: any) => {
  return (
    <View style={styles.shelfContainer}>
      <TouchableOpacity 
        style={[styles.shelfHeader, { borderBottomColor: theme.border }]} 
        onPress={onHeaderPress}
        disabled={!onHeaderPress}
      >
        <Text style={[styles.shelfTitle, { color: theme.text }]}>{title}</Text>
        {onHeaderPress && <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />}
      </TouchableOpacity>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.shelfScrollContent}
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {data && data.length > 0 ? (
          data.map((item: any, index: number) => renderItem(item, index))
        ) : (
          <EmptyStateCard 
            icon="eco" 
            title={`Nessun ${title}`} 
            subtitle="I dati dal server non sono ancora disponibili. Ripassa più tardi!" 
            theme={theme} 
          />
        )}
      </ScrollView>
    </View>
  );
};

// Nuovo Componente Stile Pokemon GO
const ChallengeAccordion = ({ challenge, isOpen, onToggle, theme }: any) => {
  return (
    <View style={[styles.challengeBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.challengeHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name={challenge.icon || 'stars'} size={24} color={challenge.color || theme.primary} style={{ marginRight: 12 }} />
          <View>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text }}>{challenge.title}</Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{challenge.progressText}</Text>
          </View>
        </View>
        <MaterialIcons name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={theme.textMuted} />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.challengeBody}>
          {challenge.tasks.map((task: any, idx: number) => (
            <View key={idx} style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>{task.desc}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${task.total > 0 ? (task.current / task.total) * 100 : 0}%`, height: '100%', backgroundColor: challenge.color || theme.primary }} />
                </View>
                <Text style={{ fontSize: 10, color: theme.textMuted, marginLeft: 10, fontWeight: 'bold', minWidth: 30, textAlign: 'right' }}>
                  {task.current}/{task.total}
                </Text>
                <MaterialIcons name={task.rewardIcon || 'emoji-events'} size={20} color="#D4AF37" style={{ marginLeft: 10 }} />
              </View>
            </View>
          ))}
          <TouchableOpacity style={[styles.rewardBtn, { backgroundColor: challenge.color || theme.primary }]}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>RISCATTA ESPERIENZA</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function CommunityScreen() {
  const { theme } = useTheme();

  const [eventiData, setEventiData] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any>(null);
  const [reportsData, setReportsData] = useState<any[]>([]);
  
  const [userLevel, setUserLevel] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReportSheetVisible, setIsReportSheetVisible] = useState(false);
  const [isEventSheetVisible, setIsEventSheetVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);

  // Stato per l'Accordion delle Sfide
  const [openChallengeId, setOpenChallengeId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUser = async () => {
        let dbXp = 0;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
          if (profile) dbXp = profile.total_xp || 0;
        }
        let localXp = 0;
        try {
          const fallbackStr = await AsyncStorage.getItem('loto_fallback_xp');
          if (fallbackStr) localXp = parseInt(fallbackStr);
        } catch(e) {}
        const effectiveXp = Math.max(dbXp, localXp);
        setUserLevel(calculateLevel(effectiveXp));
      };
      fetchUser();
    }, [])
  );

  React.useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('tenant_events').select('*').order('event_date', { ascending: true });
      if (data) setEventiData(data);
    };
    const fetchStats = async () => {
      const { data } = await supabase.from('vw_collective_impact').select('*').single();
      if (data) setCommunityStats(data);
    };
    const fetchReports = async () => {
      const { data } = await supabase.from('civic_reports').select('*').order('created_at', { ascending: false }).limit(5);
      if (data) setReportsData(data);
    };
    const fetchLoc = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc);
      }
    };
    fetchEvents();
    fetchStats();
    fetchReports();
    fetchLoc();
  }, []);

  // Nessun Mock per gli Eventi: passiamo direttamente i dati
  const displayEvents = eventiData;

  // 3 Contatori Fissi per Impatto, se non ci sono dati mettiamo 0
  const classificheData = [
    { id: 1, name: 'PTI Generati', rank: communityStats?.total_pti_generated || 0, icon: 'eco' },
    { id: 2, name: 'Kg CO₂ Evitata', rank: communityStats?.total_co2_saved || 0, icon: 'cloud' },
    { id: 3, name: 'Check-in Totali', rank: communityStats?.total_checkins || 0, icon: 'location-on' },
  ];

  // Gusci grafici per le Sfide Community (Progresso a 0 o in layout puro)
  const uiShellChallenges = [
    {
      id: 'ch_civica',
      title: 'Mappatura Civica della Settimana',
      progressText: 'Stato: 0/3 completate',
      icon: 'map',
      color: '#2196F3',
      tasks: [
        { desc: 'Esplora 5 Punti di Interesse Storici', current: 0, total: 5, rewardIcon: 'auto-awesome' },
        { desc: 'Invia 1 Segnalazione Civica Valida', current: 0, total: 1, rewardIcon: 'report' },
        { desc: 'Effettua 3 Check-in presso Fontanelle', current: 0, total: 3, rewardIcon: 'water-drop' }
      ]
    },
    {
      id: 'ch_eco',
      title: 'Sfida Mobilità Sostenibile',
      progressText: 'Stato: In Attesa di Dati',
      icon: 'pedal-bike',
      color: '#4CAF50',
      tasks: [
        { desc: 'Mantieni Mobilità Dolce per 2 giorni', current: 0, total: 2, rewardIcon: 'eco' }
      ]
    }
  ];

  const handleToggleChallenge = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenChallengeId(openChallengeId === id ? null : id);
  };

  const renderEvento = (item: any, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} 
      activeOpacity={0.8}
      onPress={() => {
        Alert.alert('Evento Selezionato', `Stai per visualizzare i dettagli di: ${item.title}`);
      }}
    >
      <View style={[styles.cardIconBox, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2ECC71' }]}>
        <MaterialIcons name="stars" size={28} color="#2ECC71" />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
        {item.date ? item.date : (item.event_date ? new Date(item.event_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : 'Prossimamente')}
      </Text>
    </TouchableOpacity>
  );

  const renderClassifica = (item: any, index: number) => (
    <View key={index} style={[styles.card, { flex: 1, padding: 10, marginHorizontal: 4, backgroundColor: theme.surface, borderColor: theme.border, elevation: 0 }]}>
      <View style={[styles.cardIconBox, { backgroundColor: '#D4AF37', width: 40, height: 40, borderRadius: 20 }]}>
        <MaterialIcons name={item.icon} size={20} color="#FFF" />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16 }]} numberOfLines={1}>{item.rank}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.textMuted, fontSize: 9 }]}>{item.name}</Text>
    </View>
  );

  const getReportIcon = (cat: string) => {
    switch (cat) {
      case 'barrier': return 'accessible';
      case 'degradation': return 'broken-image';
      case 'lighting': return 'lightbulb';
      default: return 'report-problem';
    }
  };

  const renderReport = (item: any, index: number) => (
    <TouchableOpacity key={index} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, width: 150 }]} activeOpacity={0.8}>
      <View style={[styles.cardIconBox, { backgroundColor: item.status === 'confirmed' ? '#4CAF50' : '#FF9800' }]}>
        <MaterialIcons name={getReportIcon(item.category)} size={24} color="#FFF" />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.category.toUpperCase()}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (userLevel < 1) {
    return (
      <ImageBackground source={require('../../assets/images/elite_bg.png')} style={{ flex: 1, backgroundColor: theme.background }} imageStyle={{ opacity: 0.15 }}>
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={styles.lockedBox}>
            <MaterialIcons name="lock" size={80} color="rgba(0,0,0,0.15)" />
            <Text style={{ fontSize: 26, fontWeight: 'bold', fontFamily: 'serif', marginTop: 20, color: theme.text }}>
              Sezione Bloccata
            </Text>
            <Text style={{ textAlign: 'center', marginTop: 15, color: '#475569', lineHeight: 22, fontSize: 15 }}>
              Raggiungi il Livello 2 per sbloccare l'accesso agli Eventi.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/elite_bg.png')} style={{ flex: 1, backgroundColor: theme.background }} imageStyle={{ opacity: 0.15 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Community</Text>
          <Text style={styles.headerSubtitle}>Eventi e Impatto Collettivo</Text>
        </View>

        {/* Pulsante Invia Segnalazione Flottante o in Header */}
        <TouchableOpacity 
          style={styles.newReportBtn}
          onPress={() => setIsReportSheetVisible(true)}
          activeOpacity={0.9}
        >
          <MaterialIcons name="add-alert" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, fontFamily: 'serif' }}>Nuova Segnalazione Civica</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          
          <HorizontalShelf 
            title="Eventi Locali" 
            data={displayEvents} 
            renderItem={renderEvento} 
            theme={theme} 
            onHeaderPress={() => {
              if (displayEvents.length > 4) {
                 Alert.alert('Tutti gli eventi', 'Apertura scheda estesa eventi.');
              }
            }} 
          />
          
          <View style={[styles.shelfContainer, { marginBottom: 20 }]}>
             <View style={[styles.shelfHeader, { borderBottomWidth: 0, paddingBottom: 5 }]}>
               <Text style={[styles.shelfTitle, { color: theme.text }]}>Impatto della Città</Text>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 15 }}>
               {classificheData.map((item, index) => renderClassifica(item, index))}
             </View>
          </View>
          
          <HorizontalShelf title="Segnalazioni Recenti" data={reportsData} renderItem={renderReport} theme={theme} />

          {/* Sfide della Community (Pokémon GO style) */}
          <View style={styles.shelfContainer}>
             <View style={[styles.shelfHeader, { borderBottomWidth: 0, paddingBottom: 5 }]}>
               <Text style={[styles.shelfTitle, { color: theme.text }]}>Sfide della Community</Text>
             </View>
             <View style={{ paddingHorizontal: 20 }}>
               {uiShellChallenges.map((challenge) => (
                 <ChallengeAccordion 
                   key={challenge.id} 
                   challenge={challenge} 
                   isOpen={openChallengeId === challenge.id} 
                   onToggle={() => handleToggleChallenge(challenge.id)} 
                   theme={theme} 
                 />
               ))}
             </View>
          </View>

        </ScrollView>
        
        <CivicReportSheet 
          visible={isReportSheetVisible}
          onClose={() => setIsReportSheetVisible(false)}
          userId={userId || ''}
          initialLocation={userLocation ? { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude } : { lat: 40.47, lng: 17.24 }}
        />

        <PlasticaqquaEventSheet
           visible={isEventSheetVisible}
           onClose={() => setIsEventSheetVisible(false)}
           onCheckInEvent={() => {
             setIsEventSheetVisible(false);
           }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  headerTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'serif' },
  headerSubtitle: { fontSize: 14, color: '#475569', marginTop: 5, fontFamily: 'serif', fontStyle: 'italic', textShadowColor: 'rgba(255, 255, 255, 0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  
  newReportBtn: { backgroundColor: '#D4AF37', marginHorizontal: 20, marginBottom: 15, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  
  lockedBox: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 30, borderRadius: 24, marginHorizontal: 25, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },

  shelfContainer: { marginBottom: 20 },
  shelfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  shelfTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif' },
  shelfScrollContent: { paddingHorizontal: 20, paddingTop: 15, gap: 15 },
  
  card: { width: 130, padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  cardIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  cardSubtitle: { fontSize: 10, textAlign: 'center' },

  // Challenge Accordion Styles
  challengeBox: { borderRadius: 12, borderWidth: 1, marginBottom: 15, overflow: 'hidden' },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  challengeBody: { padding: 15, paddingTop: 5, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  rewardBtn: { paddingVertical: 12, borderRadius: 20, alignItems: 'center', marginTop: 10, elevation: 2 }
});

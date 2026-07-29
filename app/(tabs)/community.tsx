import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import EmptyStateCard from '../../components/EmptyStateCard';
import { supabase } from '../../utils/supabase';
import { useFocusEffect } from 'expo-router';
import { mockEvents } from '../../utils/mockEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CivicReportSheet } from '../../components/CivicReportSheet';
import * as Location from 'expo-location';

// Componente Scaffale (Netflix-style)
const HorizontalShelf = ({ title, data, renderItem, theme }: any) => {
  return (
    <View style={styles.shelfContainer}>
      <View style={[styles.shelfHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.shelfTitle, { color: theme.text }]}>{title}</Text>
        <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfScrollContent}>
        {data.length > 0 ? (
          data.map((item: any, index: number) => renderItem(item, index))
        ) : (
          <EmptyStateCard 
            icon="event-busy" 
            title={`Nessun ${title}`} 
            subtitle="Le sfide della community sono attualmente in pausa. Torna presto!" 
            theme={theme} 
          />
        )}
      </ScrollView>
    </View>
  );
};

export default function CommunityScreen() {
  const { theme } = useTheme();

  const [eventiData, setEventiData] = React.useState<any[]>([]);
  const [communityStats, setCommunityStats] = React.useState<any>(null);
  const [reportsData, setReportsData] = React.useState<any[]>([]);
  const [userLevel, setUserLevel] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isReportSheetVisible, setIsReportSheetVisible] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<any>(null);

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
        
        // Sincronizzazione con il Fallback Offline (come in index.tsx)
        let localXp = 0;
        try {
          const fallbackStr = await AsyncStorage.getItem('loto_fallback_xp');
          if (fallbackStr) localXp = parseInt(fallbackStr);
        } catch(e) {}
        
        const effectiveXp = Math.max(dbXp, localXp);
        setUserLevel(Math.floor(effectiveXp / 100));
      };
      fetchUser();
    }, [])
  );

  React.useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
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

  const fallbackEvents = [
    { id: 1, title: 'Pulizia Spiaggia', event_date: '2026-07-28T10:00:00Z', event_type: 'eco' },
    { id: 2, title: 'Mostra Diffusa', event_date: '2026-07-30T10:00:00Z', event_type: 'explore' },
    { id: 3, title: 'Mercato Agricolo', event_date: '2026-08-05T10:00:00Z', event_type: 'local-drink' },
  ];
  const displayEvents = eventiData.length > 0 ? eventiData : fallbackEvents;

  const fallbackStats = [
    { id: 1, name: 'PTI Generati', rank: '2.450', icon: 'eco' },
    { id: 2, name: 'Kg CO₂ Evitata', rank: '12', icon: 'cloud' },
    { id: 3, name: 'Check-in Totali', rank: '342', icon: 'location-on' },
  ];

  const classificheData = communityStats ? [
    { id: 1, name: 'PTI Generati', rank: communityStats.total_pti_generated || 0, icon: 'eco' },
    { id: 2, name: 'Kg CO₂ Evitata', rank: communityStats.total_co2_saved || 0, icon: 'cloud' },
    { id: 3, name: 'Check-in Totali', rank: communityStats.total_checkins || 0, icon: 'location-on' },
  ] : fallbackStats;

  const renderEvento = (item: any, index: number) => (
    <TouchableOpacity key={index} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} activeOpacity={0.8}>
      <View style={[styles.cardIconBox, { backgroundColor: theme.primary }]}>
        <MaterialIcons name={item.event_type || item.icon || 'event'} size={24} color="#FFF" />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
        {item.date ? item.date : (item.event_date ? new Date(item.event_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : 'Prossimamente')}
      </Text>
    </TouchableOpacity>
  );

  const renderClassifica = (item: any, index: number) => (
    <TouchableOpacity key={index} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} activeOpacity={0.8}>
      <View style={[styles.cardIconBox, { backgroundColor: '#D4AF37' }]}>
        <MaterialIcons name={item.icon} size={24} color="#FFF" />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text, fontSize: 18 }]} numberOfLines={1}>{item.rank}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>{item.name}</Text>
    </TouchableOpacity>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <MaterialIcons name="how-to-reg" size={14} color={theme.primary} />
        <Text style={{ fontSize: 10, color: theme.textMuted, marginLeft: 4 }}>{item.verified_count} verifiche</Text>
      </View>
    </TouchableOpacity>
  );

  if (userLevel < 5) {
    return (
      <ImageBackground source={require('../../assets/images/loto_bg.jpg')} style={{ flex: 1, backgroundColor: '#F8FAF5' }} imageStyle={{ opacity: 1 }}>
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: 30, borderRadius: 24, marginHorizontal: 25, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
            <MaterialIcons name="lock" size={80} color="rgba(0,0,0,0.15)" />
            <Text style={{ fontSize: 26, fontWeight: 'bold', fontFamily: 'serif', marginTop: 20, color: theme.text }}>
              Sezione Bloccata
            </Text>
            <Text style={{ textAlign: 'center', marginTop: 15, color: '#475569', lineHeight: 22, fontSize: 15 }}>
              Continua ad esplorare e raggiungi il <Text style={{fontWeight: 'bold', color: theme.primary}}>Livello 5</Text> per sbloccare l'accesso alla Community, alle classifiche globali e agli eventi collettivi.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/loto_bg.jpg')} style={{ flex: 1, backgroundColor: '#F8FAF5' }} imageStyle={{ opacity: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Community</Text>
          <Text style={styles.headerSubtitle}>Eventi e Impatto Collettivo</Text>
        </View>

        {/* Pulsante Invia Segnalazione Flottante o in Header */}
        <TouchableOpacity 
          style={{ backgroundColor: '#D4AF37', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 3 }}
          onPress={() => setIsReportSheetVisible(true)}
          activeOpacity={0.9}
        >
          <MaterialIcons name="add-alert" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, fontFamily: 'serif' }}>Nuova Segnalazione Civica</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <HorizontalShelf title="Eventi Locali" data={displayEvents} renderItem={renderEvento} theme={theme} />
          <HorizontalShelf title="Impatto della Città" data={classificheData} renderItem={renderClassifica} theme={theme} />
          {reportsData.length > 0 && (
            <HorizontalShelf title="Segnalazioni Recenti" data={reportsData} renderItem={renderReport} theme={theme} />
          )}
          <HorizontalShelf title="Sfide della Settimana" data={mockEvents} renderItem={renderEvento} theme={theme} />
        </ScrollView>
        
        <CivicReportSheet 
          visible={isReportSheetVisible}
          onClose={() => setIsReportSheetVisible(false)}
          userId={userId || ''}
          initialLocation={userLocation ? { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude } : { lat: 40.47, lng: 17.24 }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginTop: 45, marginBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'serif' },
  headerSubtitle: { fontSize: 14, color: '#475569', marginTop: 5, fontFamily: 'serif', fontStyle: 'italic', textShadowColor: 'rgba(255, 255, 255, 0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  
  shelfContainer: { marginBottom: 30 },
  shelfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  shelfTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif' },
  shelfScrollContent: { paddingHorizontal: 20, paddingTop: 15, gap: 15 },
  
  card: { width: 130, padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', elevation: 2 },
  cardIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  cardSubtitle: { fontSize: 10, textAlign: 'center' },
  
  emptyShelf: { width: 200, height: 100, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});

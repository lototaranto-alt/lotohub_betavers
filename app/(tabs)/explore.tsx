import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { supabase } from '@/utils/supabase';
import PoiDetailSheet from '@/components/PoiDetailSheet';
import { calculateDistance } from '@/utils/haversine';

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDF8F2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
};

// Questa pagina ospiterà la directory completa disaccoppiata dalla Home
export default function ExploreScreen() {
  const [pois, setPois] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'free' | 'partner' | 'secret'>('free');

  // SPRINT B States
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);

  useEffect(() => {
    fetchPois();
    fetchUserAndLocation();
  }, []);

  const fetchUserAndLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) setUserProfile(profile);
    }
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (loc) => {
        setUserLocation(loc);
      });
    }
  };

  const fetchPois = async () => {
    // get_pois() restituisce l'intera directory, non solo quelli consigliati
    const { data } = await supabase.rpc('get_pois');
    if (data) setPois(data);
  };

  const filteredPois = pois.filter(p => p.category === activeTab);

  const handleBookPoi = async (poi: any, partySize: number) => {
    if (!userProfile) return Alert.alert("Errore", "Profilo non trovato");
    const { data, error } = await supabase.rpc('book_poi_visit', { p_user_id: userProfile.id, p_poi_id: poi.id, p_party_size: partySize });
    if (!error && data) {
      setBookedSessions(prev => ({ ...prev, [poi.id]: data }));
      Alert.alert("Prenotato!", "Hai riservato i tuoi posti. Raggiungi il luogo!");
    }
  };

  const handleValidatePoi = async (poi: any) => {
    const sessionId = bookedSessions[poi.id];
    if (!sessionId) return;
    const accuracy = userLocation?.coords.accuracy || 999;
    
    if (accuracy < 15) {
      await supabase.rpc('validate_checkin', { p_session_id: sessionId, p_validation_confidence: 'GPS_SILENT' });
      Alert.alert("Check-in Convalidato", "Benvenuto a " + poi.name);
      setBookedSessions(prev => { const n = {...prev}; delete n[poi.id]; return n; });
      setIsSheetVisible(false);
    } else {
      Alert.alert(
        "Segnale GPS Debole",
        "Scansiona il QR all'ingresso per convalidare in modo sicuro.",
        [
          { text: "Annulla", style: "cancel" },
          { 
            text: "Scansiona QR", 
            onPress: async () => {
              await supabase.rpc('validate_checkin', { p_session_id: sessionId, p_validation_confidence: 'QR_FORCED' });
              Alert.alert("QR Convalidato!", "Presenza verificata!");
              setBookedSessions(prev => { const n = {...prev}; delete n[poi.id]; return n; });
              setIsSheetVisible(false);
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Esplora L.O.T.O.</Text>
      <Text style={styles.subtitle}>La directory completa e filtrabile del territorio.</Text>
      
      {/* 3-TAB FILTER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'free' && { backgroundColor: LOTO_PALETTE.VERDE_OLIVA }]} 
          onPress={() => setActiveTab('free')}
        >
          <Text style={[styles.tabText, activeTab === 'free' && { color: '#FFF' }]}>Culturali</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'partner' && { backgroundColor: LOTO_PALETTE.EBANO }]} 
          onPress={() => setActiveTab('partner')}
        >
          <Text style={[styles.tabText, activeTab === 'partner' && { color: '#FFF' }]}>Partner</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'secret' && { backgroundColor: LOTO_PALETTE.SABBIA_DORATA }]} 
          onPress={() => setActiveTab('secret')}
        >
          <Text style={[styles.tabText, activeTab === 'secret' && { color: '#FFF' }]}>Secret</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPois}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => {
              setSelectedPoi(item);
              setIsSheetVisible(true);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.poiName}>{item.name}</Text>
              <Text style={styles.poiCat}>{item.category === 'free' ? 'Accesso Libero' : (item.category === 'partner' ? 'B2B Partner' : 'Storia Segreta')}</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                <MaterialIcons name="place" size={12} color="#64748B" /> {userLocation && item.latitude && item.longitude ? calculateDistance(userLocation.coords.latitude, userLocation.coords.longitude, item.latitude, item.longitude) : 'Calcolo...'}
              </Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{item.xp_reward || 15} XP</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <PoiDetailSheet
        visible={isSheetVisible}
        poi={selectedPoi}
        onClose={() => setIsSheetVisible(false)}
        onBook={handleBookPoi}
        onValidate={handleValidatePoi}
        isBooked={selectedPoi ? !!bookedSessions[selectedPoi.id] : false}
        initialPartySize={userProfile?.party_size || 1}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LOTO_PALETTE.CREMA },
  title: { fontSize: 28, fontWeight: '900', fontFamily: 'serif', color: LOTO_PALETTE.EBANO, marginLeft: 20, marginTop: 30 },
  subtitle: { fontSize: 13, color: '#64748B', marginLeft: 20, marginBottom: 20 },
  
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#E2E8F0', borderRadius: 25, padding: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
  tabText: { fontSize: 11, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 0.5, borderColor: '#C9C4B8' },
  poiName: { fontSize: 18, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, fontFamily: 'serif' },
  poiCat: { fontSize: 11, color: LOTO_PALETTE.TERRACOTTA, marginTop: 5, textTransform: 'uppercase', fontWeight: 'bold' },
  
  xpBadge: { backgroundColor: 'rgba(217, 160, 91, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15 },
  xpText: { color: LOTO_PALETTE.SABBIA_DORATA, fontWeight: '900', fontSize: 12 }
});

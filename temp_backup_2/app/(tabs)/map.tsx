import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Caricamento sicuro di Mapbox per prevenire crash in Expo Go
let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps').default;
} catch (e) {
  // Il modulo nativo non è disponibile (Expo Go)
}

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { supabase } from '@/utils/supabase';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { MAP_CONFIG } from '@/constants/MapConfig';

// --- COSTANTI DI DESIGN ---
const LOTO_PALETTE = {
  GREEN: '#4A5D23',     // FREE (15 XP)
  BLUE: '#0056D2',      // PARTNER (50 XP)
  GOLD: '#D96C4A',      // SECRET (100 XP)
  BG: '#FFFFFF',
  TEXT: '#1A1A1A',
  SLATE: '#1E293B'
};

interface LotoPOI {
  id: string;
  name: string;
  category: 'free' | 'partner' | 'secret';
  latitude: number;
  longitude: number;
  xp_reward: number;
  is_visited: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MIN_Y = SCREEN_HEIGHT;
const SHEET_MAX_Y = SCREEN_HEIGHT * 0.65;

export default function MapScreen() {
  const [pois, setPois] = useState<LotoPOI[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<LotoPOI | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'free' | 'partner' | 'secret'>('all');
  const [userProfile, setUserProfile] = useState<any>(null);

  const camera = useRef<any>(null);
  const sheetY = useSharedValue(SHEET_MIN_Y);
  
  const isNativeModuleAvailable = !!Mapbox?.MapView;

  useEffect(() => {
    if (isNativeModuleAvailable && Mapbox) {
      Mapbox.setAccessToken(MAP_CONFIG.ACCESS_TOKEN);
    }
    
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Loto ha bisogno della tua posizione per i check-in.');
        return;
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (location) => setUserLocation(location)
      );

      fetchPois();
      fetchProfile();
    })();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
      }
    } catch (e) {
      console.log("Error fetching profile:", e);
    }
  };

  const fetchPois = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_pois_with_status', { 
        p_profile_id: user.id 
      });

      if (error) throw error;
      
      const formattedPois = data.map((p: any) => ({
        ...p,
        coordinates: { latitude: p.latitude, longitude: p.longitude }
      }));
      
      setPois(formattedPois);
    } catch (error) {
      console.error('Error fetching POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onMarkerPress = (event: any) => {
    const feature = event.features[0];
    if (!feature) return;
    const poi = pois.find(p => p.id === feature.properties.id);
    if (!poi) return;
    setSelectedPoi(poi);
    camera.current?.setCamera({
      centerCoordinate: [poi.coordinates.longitude, poi.coordinates.latitude],
      zoomLevel: 16,
      animationDuration: 1000,
    });
    sheetY.value = withSpring(SHEET_MAX_Y);
  };

  const closeSheet = () => {
    sheetY.value = withSpring(SHEET_MIN_Y);
    setSelectedPoi(null);
  };

  const canCheckIn = useMemo(() => {
    if (!selectedPoi || !userLocation) return false;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(selectedPoi.coordinates.latitude - userLocation.coords.latitude);
    const dLon = toRad(selectedPoi.coordinates.longitude - userLocation.coords.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(userLocation.coords.latitude)) * Math.cos(toRad(selectedPoi.coordinates.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) <= 50;
  }, [selectedPoi, userLocation]);

  const handleCheckIn = async () => {
    if (!selectedPoi) return;
    setCheckingIn(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('user_pois').insert([{ profile_id: user.id, poi_id: selectedPoi.id }]);
      if (error) throw error;
      Alert.alert('Successo! 🎉', `Check-in effettuato in ${selectedPoi.name}.`);
      fetchPois();
      closeSheet();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile completare il check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const filteredPois = useMemo(() => {
    if (activeTab === 'all') return pois;
    return pois.filter(p => p.category === activeTab);
  }, [pois, activeTab]);

  if (!isNativeModuleAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <MaterialIcons name="map" size={100} color="#4A5D23" style={{ opacity: 0.3 }} />
        <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 20 }}>LOTO MAP</Text>
        <Text style={{ color: '#64748B', textAlign: 'center', paddingHorizontal: 40, marginTop: 10 }}>
          Visualizzazione Mappa limitata in Expo Go. Sblocca la mappa interattiva con una build nativa.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={LOTO_PALETTE.GREEN} style={{ flex: 1 }} />
      ) : (
        <Mapbox.MapView style={styles.map} styleURL={MAP_CONFIG.STYLE_URL} logoEnabled={false} attributionEnabled={false} onPress={closeSheet}>
          <Mapbox.Camera ref={camera} zoomLevel={MAP_CONFIG.ZOOM.initial} centerCoordinate={[MAP_CONFIG.CENTER.longitude, MAP_CONFIG.CENTER.latitude]} />
          <Mapbox.ShapeSource id="poiSource" shape={{ type: 'FeatureCollection', features: pois.map(p => ({ type: 'Feature', id: p.id, geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] }, properties: { id: p.id, name: p.name, category: p.category } })) }} onPress={onMarkerPress}>
            <Mapbox.SymbolLayer id="poiLabels" style={{ iconImage: 'marker', iconSize: 0.8 }} />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>
      )}
      <Animated.View style={[styles.bottomSheet, animatedSheetStyle]}>
        <View style={styles.sheetHeader}><View style={styles.sheetHandle} /></View>
        {selectedPoi && (
          <View style={styles.sheetContent}>
            <Text style={styles.poiName}>{selectedPoi.name}</Text>
            <TouchableOpacity disabled={!canCheckIn || checkingIn} style={[styles.checkInBtn, !canCheckIn && styles.checkInBtnDisabled]} onPress={handleCheckIn}>
              <Text style={styles.checkInText}>{canCheckIn ? 'CHECK-IN' : 'TROPPO LONTANO'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  previewContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  previewHeader: { padding: 30, paddingTop: 60 },
  previewTag: { color: '#FFF', opacity: 0.7, fontSize: 10, fontWeight: 'bold' },
  previewTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  previewSubtitle: { color: '#FFF', opacity: 0.8, fontSize: 14 },
  filterContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF' },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#F1F5F9' },
  filterBtnActive: { backgroundColor: LOTO_PALETTE.GREEN },
  filterBtnText: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  filterBtnTextActive: { color: '#FFF' },
  poiCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  cardInfo: { marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  xpValue: { color: '#F59E0B', fontWeight: 'bold' },
  cardAction: { borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 10 },
  cardActionText: { color: LOTO_PALETTE.GREEN, fontWeight: 'bold', textAlign: 'center' },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  sheetHeader: { alignItems: 'center', marginBottom: 20 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3 },
  sheetContent: { alignItems: 'center' },
  poiName: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  checkInBtn: { backgroundColor: LOTO_PALETTE.GREEN, padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  checkInBtnDisabled: { backgroundColor: '#CBD5E1' },
  checkInText: { color: '#FFF', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  buildBtn: { backgroundColor: LOTO_PALETTE.GREEN, padding: 15, borderRadius: 10, alignItems: 'center' },
  buildBtnText: { color: '#FFF', fontWeight: 'bold' }
});

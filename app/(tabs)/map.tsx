import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { startBackgroundTracking, stopBackgroundTracking } from '../../utils/SincroAvventura';

import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobility } from '../../context/MobilityContext';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import RouteSummarySheet from '../../components/RouteSummarySheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import UserAvatar from '../../components/MapCursor';
import Constants from 'expo-constants';

// Inizializza Mapbox con la chiave pubblica
try {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || 'pk.eyJ1IjoibG90b2h1YiIsImEiOiJjbW5yOGY4bXYwMTliMnNzNG84c2YwbXFqIn0.wUjhbriAWqmuGh0tn-zHtw');
} catch(e) {}

const { width, height } = Dimensions.get('window');
const INITIAL_COORDS = [17.234050, 40.472850];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { currentTenant } = useTenant();
  const { theme } = useTheme();
  const { isAccessibleMode, toggleAccessibleMode } = useMobility();

  const [pois, setPois] = useState<any[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const cameraRef = useRef<any>(null);

  const handleRequestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setHasLocationPermission(true);
      try {
        const loc = await Location.getCurrentPositionAsync({});
        cameraRef.current?.setCamera({
          centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      } catch (e) {
        console.warn("Location error:", e);
      }
    } else {
      Alert.alert("Permessi Negati", "Impossibile accedere al GPS. Attiva i permessi dalle impostazioni del telefono.");
    }
  };

  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [heatScores, setHeatScores] = useState<Record<string, number>>({});
  
  // UI States
  
  const [routePois, setRoutePois] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState('monument');
  const [heatmapOn, setHeatmapOn] = useState(true);


  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setUserId(session.user.id);
    });
  }, []);

  // [MODIFICA UX] Il pedometro NON si avvia più in automatico all'apertura della mappa
  // Verrà spostato in un trigger manuale (es. Onboarding Tips) per azzerare la frizione.
  useEffect(() => {
    // Sincro-Avventura rimossa dall'auto-avvio
  }, [isAccessibleMode, userId]);


    const [isLayerDropdownOpen, setIsLayerDropdownOpen] = useState(false);
  const [eventsEverToggled, setEventsEverToggled] = useState(false);

    const layers = [
    { id: 'tutti', title: 'Tutti', icon: 'layers' },
    { id: 'monument', title: 'Monumenti', icon: 'account-balance' },
    { id: 'museum', title: 'Musei', icon: 'museum' },
    { id: 'park', title: 'Parchi', icon: 'park' },
    { id: 'fountain', title: 'Fontane', icon: 'water-drop' },
    { id: 'attraction', title: 'Attrazioni', icon: 'local-activity' }
  ];
  const [eventsOn, setEventsOn] = useState(false);
  const [isRouteSheetOpen, setIsRouteSheetOpen] = useState(false);
  const [userXp, setUserXp] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('loto_fallback_xp').then(val => {
      if (val) setUserXp(parseInt(val, 10));
    });
  }, []);


  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') setHasLocationPermission(true);
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      const fetchPois = async () => {
        if (!currentTenant?.slug) return;
        
        const { data: poisData } = await supabase
          .from('vw_pois_frontend')
          .select('*')
          .eq('tenant_id', currentTenant.slug)
          .eq('is_active', true)
          .not('lat', 'is', null)
          .neq('layer_name', 'nodo_civico')
          .neq('category', 'concierge');
          
        if (isActive && poisData) {
          setPois(poisData);
          
          const initialHeat: Record<string, number> = {};
          poisData.forEach(p => { initialHeat[p.id] = 10; });
          setHeatScores(initialHeat);
        }
      };

      fetchPois();

      const realtimeSubscription = supabase
        .channel('public:user_pois')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_pois' },
          (payload) => {
            const poiId = payload.new.poi_id;
            setHeatScores(prev => ({
              ...prev,
              [poiId]: (prev[poiId] || 10) + 15
            }));
          }
        )
        .subscribe();
      
      return () => {
        isActive = false;
        supabase.removeChannel(realtimeSubscription);
      };
    }, [currentTenant])
  );

  const filteredPois = pois.filter(poi => {
    if (poi.category === 'fountain') return true; // Sempre visibili
    if (activeLayer !== 'tutti' && poi.category !== activeLayer) return false;
    return true;
  });

  const poiGeoJSON = {
    type: 'FeatureCollection',
    features: filteredPois.map(poi => ({
      type: 'Feature',
      id: poi.id,
      properties: {
        id: poi.id,
        name: poi.name,
        heat: heatScores[poi.id] || 10,
      },
      geometry: {
        type: 'Point',
        coordinates: [poi.lng, poi.lat],
      },
    })),
  };

  return (
    <SafeAreaView style={styles.container}>
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={Mapbox.StyleURL.Light}
        logoEnabled={true} // Obbligatorio per Policy TOS Mapbox
        attributionEnabled={true} // Obbligatorio per Policy TOS Mapbox
        onPress={() => { setSelectedPoi(null); setIsLayerDropdownOpen(false); }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={14.5}
          centerCoordinate={hasLocationPermission ? undefined : (currentTenant ? [currentTenant.centerLng || 17.24, currentTenant.centerLat || 40.47] : INITIAL_COORDS)}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* Cursore Utente (Modern v10 API) - Reso condizionale per evitare crash prima dei permessi */}
        {hasLocationPermission && (
          <Mapbox.LocationPuck 
            puckBearingEnabled 
            puckBearing="heading" 
            pulsing={{ isEnabled: true, color: theme.primary }}
          />
        )}

        <Mapbox.ShapeSource 
          id="pois-source" 
          shape={poiGeoJSON as any}
          onPress={(e: any) => {
             const feature = e.features[0];
             const clickedPoi = pois.find(p => p.id === feature.properties.id);
             if (clickedPoi) setSelectedPoi(clickedPoi);
             setIsLayerDropdownOpen(false);
          }}
        >
          {heatmapOn ? (
            <Mapbox.CircleLayer
              id="pois-heat-halo"
              style={{
                circleRadius: [
                  'interpolate', ['linear'], ['get', 'heat'],
                  10, 15,
                  100, 45 
                ],
                circleColor: theme.primary,
                circleOpacity: [
                  'interpolate', ['linear'], ['get', 'heat'],
                  10, 0.2,
                  100, 0.6
                ],
                circlePitchAlignment: 'map',
              }}
            />
          ) : <></>}
          <Mapbox.SymbolLayer
            id="pois-core"
            style={{
              iconImage: [
                'match',
                ['get', 'category'],
                'park', 'park-15',
                'fountain', 'drinking-water-15',
                'museum', 'museum-15',
                'monument', 'monument-15',
                'marker-15'
              ],
              iconSize: 1.5,
              iconAllowOverlap: true,
              textField: ['get', 'name'],
              textSize: 10,
              textOffset: [0, 1.2],
              textAnchor: 'top',
              textColor: theme.text,
              textHaloColor: theme.surface,
              textHaloWidth: 2
            }}
          />
                  {eventsOn ? (
            <Mapbox.SymbolLayer
              id="events-layer"
              style={{
                iconImage: 'star-15', // Icona stella (Maki)
                iconSize: 1.8,
                iconColor: '#10B981', // Verde Smeraldo (L.O.T.O. Eventi)
                iconAllowOverlap: true,
                textField: ['get', 'name'],
                textSize: 11,
                textOffset: [0, 1.5],
                textAnchor: 'top',
                textColor: '#10B981',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 2
              }}
              filter={['==', 'category', 'event']} // Mostra solo se  un evento
            />
          ) : <></>}
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* TOP FILTERS (Floating Bar) */}
      
      <View style={styles.floatingBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floatingBarScroll}>
          
          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: heatmapOn ? '#E63946' : theme.border, backgroundColor: heatmapOn ? 'rgba(230, 57, 70, 0.1)' : 'transparent', paddingHorizontal: 12 }]}
            onPress={() => { setHeatmapOn(!heatmapOn); setIsLayerDropdownOpen(false); }}
          >
            <MaterialIcons name="local-fire-department" size={16} color={heatmapOn ? '#E63946' : theme.primary} />
            <Text style={[styles.pillText, { color: heatmapOn ? '#E63946' : theme.text }]} numberOfLines={1}>DensitÃ </Text>
          </TouchableOpacity>
          
          <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 8 }} />

          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: theme.border, paddingHorizontal: 12 }]}
            onPress={() => setIsLayerDropdownOpen(!isLayerDropdownOpen)}
          >
            <MaterialIcons name="place" size={14} color={theme.primary} />
            <Text style={[styles.pillText, { color: theme.text, maxWidth: 100 }]} numberOfLines={1}>
              {layers.find(l => l.id === activeLayer)?.title || 'Tutti i P.O.I.'}
            </Text>
            <MaterialIcons name={isLayerDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={16} color={theme.text} />
          </TouchableOpacity>

          <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 8 }} />

          {userXp >= 30 && (
<TouchableOpacity 
            style={[styles.pillBtn, { borderColor: eventsOn ? '#10B981' : theme.border, backgroundColor: eventsOn ? 'rgba(16, 185, 129, 0.1)' : 'transparent', paddingHorizontal: 12 }]}
            onPress={() => { setEventsOn(!eventsOn); setEventsEverToggled(true); setIsLayerDropdownOpen(false); }}
          >
            <MaterialIcons name="event" size={14} color={eventsOn ? '#10B981' : theme.primary} />
            <Text style={[styles.pillText, { color: eventsOn ? '#10B981' : theme.text }]} numberOfLines={1}>Eventi</Text>
          </TouchableOpacity>
)}

        </ScrollView>
      </View>

      {/* DROPDOWN LAYER POI */}
      {isLayerDropdownOpen && (
        <View style={[styles.dropdownContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {layers.map(layer => (
            <TouchableOpacity 
              key={layer.id} 
              style={[styles.dropdownItem, activeLayer === layer.id && { backgroundColor: theme.primary + '1A' }]}
              onPress={() => {
                setActiveLayer(layer.id);
                setIsLayerDropdownOpen(false);
              }}
            >
              <MaterialIcons name={layer.icon as any} size={20} color={activeLayer === layer.id ? theme.primary : theme.text} />
              <Text style={[styles.dropdownItemText, { color: activeLayer === layer.id ? theme.primary : theme.text }]}>{layer.title}</Text>
              {activeLayer === layer.id && <MaterialIcons name="check" size={18} color={theme.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          ))}
        </View>
      )}


      {/* FAB GROUP (Bottom Right) */}
      <View style={{ position: 'absolute', bottom: 85 + insets.bottom, right: 20, alignItems: 'flex-end' }}>
        
        {/* FAB 1: AccessibilitÃ  */}
        <TouchableOpacity 
          style={[styles.fabCircle, isAccessibleMode && { backgroundColor: theme.primary }]}
          onPress={() => toggleAccessibleMode()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="accessible" size={20} color={isAccessibleMode ? theme.background : theme.text} />
        </TouchableOpacity>

        
        {/* FAB 2: Posizione Utente */}
        <TouchableOpacity 
          style={styles.fabCircle}
          onPress={handleRequestLocation}
          activeOpacity={0.8}
        >
          <MaterialIcons name="my-location" size={20} color={hasLocationPermission ? theme.primary : theme.text} />
        </TouchableOpacity>

        {/* FAB 3: Crea Percorso / Itinerario */}
        {userXp >= 30 && (
<TouchableOpacity 
          style={[styles.fabCircle, { backgroundColor: routePois.length > 0 ? theme.primary : theme.surface }]}
          onPress={() => {
            // Qui andrÃ  la logica per aprire la bottom sheet dell'itinerario
            console.log('Apri Itinerario');
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="explore" size={20} color={routePois.length > 0 ? '#FFF' : theme.text} />
          {routePois.length > 0 && (
            <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: theme.accent, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{routePois.length}</Text>
            </View>
          )}
        </TouchableOpacity>
)}

      </View>

      <PoiDetailSheet
        visible={!!selectedPoi}
        onClose={() => setSelectedPoi(null)}
        poi={selectedPoi}
        onCheckIn={() => {}}
        
      />
      <RouteSummarySheet
        visible={isRouteSheetOpen}
        onClose={() => setIsRouteSheetOpen(false)}
        
        
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  floatingBarWrapper: { 
    position: 'absolute', 
    top: Constants.statusBarHeight + 10, 
    left: 10, 
    right: 10, 
    paddingBottom: 10, 
    paddingHorizontal: 10, 
    zIndex: 10, 
    elevation: 5 
  },
  
  floatingBarScroll: { paddingRight: 20, alignItems: 'center' },
  dropdownContainer: {
    position: 'absolute',
    top: Constants.statusBarHeight + 60,
    left: 10,
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 5,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },

  pillBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  pillText: { fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  fabCircle: { 
    backgroundColor: '#FFF', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: {width: 0, height: 3}, 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.05)' 
  }
});


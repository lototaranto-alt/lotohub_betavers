import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import { useFocusEffect } from 'expo-router';
import UserAvatar from '../../components/MapCursor';
import Constants from 'expo-constants';

// Inizializza Mapbox con la chiave pubblica
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || 'pk.eyJ1IjoibG90b2h1YiIsImEiOiJjbW5yOGY4bXYwMTliMnNzNG84c2YwbXFqIn0.wUjhbriAWqmuGh0tn-zHtw');

const { width, height } = Dimensions.get('window');
const INITIAL_COORDS = [17.234050, 40.472850];

export default function MapScreen() {
  const { currentTenant } = useTenant();
  const { theme } = useTheme();

  const [pois, setPois] = useState<any[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [heatScores, setHeatScores] = useState<Record<string, number>>({});
  
  // UI States
  const [accessibilityOn, setAccessibilityOn] = useState(false);
  const [routePois, setRoutePois] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState('tutti');
  const [heatmapOn, setHeatmapOn] = useState(false);

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
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
          .not('latitude', 'is', null)
          .neq('layer_name', 'nodo_civico');
          
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

  const poiGeoJSON = {
    type: 'FeatureCollection',
    features: pois.map(poi => ({
      type: 'Feature',
      id: poi.id,
      properties: {
        id: poi.id,
        name: poi.name,
        heat: heatScores[poi.id] || 10,
      },
      geometry: {
        type: 'Point',
        coordinates: [poi.longitude, poi.latitude],
      },
    })),
  };

  return (
    <SafeAreaView style={styles.container}>
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={() => setSelectedPoi(null)}
      >
        <Mapbox.Camera
          zoomLevel={14.5}
          centerCoordinate={INITIAL_COORDS}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* Cursore Utente Personalizzato */}
        <Mapbox.UserLocation visible={true} showsUserHeadingIndicator={false}>
          <Mapbox.SymbolLayer id="user-hidden" style={{ iconOpacity: 0 }} />
          <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
             {/* Import e utilizzo fatto inline per compatibilità o tramite componente esterno, qui lo facciamo tramite MarkerView al posto di SymbolLayer se necessario, ma UserLocation accetta children come views in Mapbox */}
             <UserAvatar mode="standard" />
          </View>
        </Mapbox.UserLocation>

        <Mapbox.ShapeSource 
          id="pois-source" 
          shape={poiGeoJSON as any}
          onPress={(e: any) => {
             const feature = e.features[0];
             const clickedPoi = pois.find(p => p.id === feature.properties.id);
             if (clickedPoi) setSelectedPoi(clickedPoi);
          }}
        >
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
          <Mapbox.CircleLayer
            id="pois-core"
            style={{
              circleRadius: 8,
              circleColor: theme.text,
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* TOP FILTERS (Floating Bar) */}
      <View style={styles.floatingBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floatingBarScroll}>
          
          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: heatmapOn ? '#E63946' : theme.border, backgroundColor: heatmapOn ? 'rgba(230, 57, 70, 0.1)' : 'transparent', paddingHorizontal: 12 }]}
            onPress={() => setHeatmapOn(!heatmapOn)}
          >
            <MaterialIcons name="local-fire-department" size={16} color={heatmapOn ? '#E63946' : theme.primary} />
            <Text style={[styles.pillText, { color: heatmapOn ? '#E63946' : theme.text }]} numberOfLines={1}>Densità</Text>
          </TouchableOpacity>
          
          <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 8 }} />

          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: theme.border, paddingHorizontal: 12 }]}
            onPress={() => setActiveLayer(activeLayer === 'tutti' ? 'culturali' : 'tutti')}
          >
            <MaterialIcons name="place" size={14} color={theme.primary} />
            <Text style={[styles.pillText, { color: theme.text }]} numberOfLines={1}>
              {activeLayer === 'tutti' ? 'Tutti i P.O.I.' : 'Culturali'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* FAB GROUP (Bottom Right) */}
      <View style={{ position: 'absolute', bottom: 25, right: 20, alignItems: 'flex-end' }}>
        
        {/* FAB 1: Accessibilità */}
        <TouchableOpacity 
          style={[styles.fabCircle, accessibilityOn && { backgroundColor: theme.primary }]}
          onPress={() => setAccessibilityOn(!accessibilityOn)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="accessible" size={20} color={accessibilityOn ? theme.background : theme.text} />
        </TouchableOpacity>

        {/* FAB 3: Crea Percorso / Itinerario */}
        <TouchableOpacity 
          style={[styles.fabCircle, { backgroundColor: routePois.length > 0 ? theme.primary : theme.surface }]}
          onPress={() => {
            // Qui andrà la logica per aprire la bottom sheet dell'itinerario
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

      </View>

      <PoiDetailSheet
        visible={!!selectedPoi}
        onClose={() => setSelectedPoi(null)}
        poi={selectedPoi}
        onNavigate={() => {}}
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

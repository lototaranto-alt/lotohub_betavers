import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { supabase } from '../../utils/supabase';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import { useFocusEffect } from 'expo-router';
import UserAvatar from '../../components/MapCursor';

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

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>LIVE MAP</Text>
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
  header: {
    position: 'absolute', top: 50, left: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 15,
    borderRadius: 20, alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif' },
});

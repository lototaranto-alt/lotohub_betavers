import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// ==========================================
// MAPBOX SHELL COMPONENT
// Questo file è disaccoppiato da index.tsx
// Preparato per @rnmapbox/maps (Development Build)
// ==========================================

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDF8F2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
};

export default function MapScreen() {
  const [hasMapbox, setHasMapbox] = useState(false);
  const [mobilityFilter, setMobilityFilter] = useState('walking'); // walking, bike, bus, driver
  const [accessibilityOn, setAccessibilityOn] = useState(false);
  const [activeLayer, setActiveLayer] = useState('all');

  const layers = [
    { id: 'all', title: 'Tutti', icon: 'public' },
    { id: 'free', title: 'Culturali', icon: 'account-balance' },
    { id: 'partner', title: 'Partner', icon: 'storefront' },
    { id: 'secret', title: 'Secret', icon: 'vpn-key' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      {/* FLOATING PILL BAR (Layer Filter) */}
      <View style={styles.floatingBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floatingBarScroll}>
          {layers.map(layer => (
            <TouchableOpacity 
              key={layer.id} 
              style={[styles.pillBtn, activeLayer === layer.id && styles.pillBtnActive]}
              onPress={() => setActiveLayer(layer.id)}
            >
              <MaterialIcons name={layer.icon as any} size={16} color={activeLayer === layer.id ? '#FFF' : LOTO_PALETTE.VERDE_OLIVA} />
              <Text style={[styles.pillText, activeLayer === layer.id && styles.pillTextActive]}>{layer.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {hasMapbox ? (
        <View style={styles.mapContainer}>
          {/* Il component Mapbox.MapView verrà iniettato qui */}
          <Text style={styles.mockMapText}>Mappa Attiva (In attesa di Mapbox)</Text>
          
          {/* MAP SIDEBAR: Mobility & Accessibility */}
          <View style={styles.sidebar}>
            
            {/* Accessibility Toggle */}
            <TouchableOpacity 
              style={[styles.sidebarBtn, accessibilityOn && styles.sidebarBtnActive]} 
              onPress={() => setAccessibilityOn(!accessibilityOn)}
            >
              <MaterialIcons name="accessible" size={24} color={accessibilityOn ? '#FFF' : LOTO_PALETTE.EBANO} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Mobility: Bike */}
            <TouchableOpacity 
              style={[styles.sidebarBtn, mobilityFilter === 'bike' && styles.sidebarBtnActive]} 
              onPress={() => setMobilityFilter('bike')}
            >
              <MaterialIcons name="pedal-bike" size={24} color={mobilityFilter === 'bike' ? '#FFF' : LOTO_PALETTE.EBANO} />
            </TouchableOpacity>

            {/* Mobility: Bus */}
            <TouchableOpacity 
              style={[styles.sidebarBtn, mobilityFilter === 'bus' && styles.sidebarBtnActive]} 
              onPress={() => setMobilityFilter('bus')}
            >
              <MaterialIcons name="directions-bus" size={24} color={mobilityFilter === 'bus' ? '#FFF' : LOTO_PALETTE.EBANO} />
            </TouchableOpacity>

            {/* Mobility: Partner Drivers */}
            <TouchableOpacity 
              style={[styles.sidebarBtn, mobilityFilter === 'driver' && styles.sidebarBtnActive]} 
              onPress={() => setMobilityFilter('driver')}
            >
              <MaterialIcons name="local-taxi" size={24} color={mobilityFilter === 'driver' ? '#FFF' : LOTO_PALETTE.EBANO} />
            </TouchableOpacity>

          </View>

        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <MaterialIcons name="map" size={100} color="#C9C4B8" style={{ opacity: 0.5 }} />
          <Text style={styles.placeholderTitle}>LOTO MAP ENGINE</Text>
          <Text style={styles.placeholderText}>
            L'infrastruttura geografica è pronta per la Development Build. Inserire il modulo nativo @rnmapbox/maps qui dentro per attivare il Layer.
          </Text>
          <TouchableOpacity style={styles.demoBtn} onPress={() => setHasMapbox(true)}>
            <Text style={styles.demoBtnText}>Attiva (Mockup Sidebar)</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF2' },
  mapContainer: { flex: 1, backgroundColor: '#F0EBE1', justifyContent: 'center', alignItems: 'center' },
  mockMapText: { color: LOTO_PALETTE.EBANO, fontSize: 18, fontFamily: 'serif', opacity: 0.3 },
  sidebar: { position: 'absolute', right: 20, top: 100, backgroundColor: 'rgba(253, 248, 242, 0.9)', padding: 10, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:5}, shadowOpacity: 0.15, shadowRadius: 10, borderWidth: 0.5, borderColor: '#C9C4B8', alignItems: 'center' },
  sidebarBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginVertical: 5 },
  sidebarBtnActive: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, elevation: 3 },
  divider: { width: 30, height: 1, backgroundColor: '#C9C4B8', marginVertical: 10 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  placeholderTitle: { fontSize: 24, fontWeight: '900', color: LOTO_PALETTE.EBANO, fontFamily: 'serif', marginTop: 20 },
  placeholderText: { textAlign: 'center', color: '#64748B', marginTop: 10, lineHeight: 22 },
  demoBtn: { marginTop: 30, padding: 15, backgroundColor: LOTO_PALETTE.VERDE_OLIVA, borderRadius: 20 },
  demoBtnText: { color: '#FFF', fontWeight: 'bold' },
  floatingBarWrapper: { position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10 },
  floatingBarScroll: { paddingHorizontal: 20, paddingVertical: 10 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(253, 248, 242, 0.95)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 5, borderWidth: 0.5, borderColor: '#E2E8F0', marginRight: 10 },
  pillBtnActive: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, borderColor: LOTO_PALETTE.VERDE_OLIVA },
  pillText: { marginLeft: 6, fontSize: 13, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  pillTextActive: { color: '#FFF' }
});

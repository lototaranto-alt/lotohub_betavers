import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, ScrollView, ImageBackground, Animated, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { useMobility } from '../../context/MobilityContext';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouteBuilder } from '../../context/RouteContext';
import { supabase } from '../../utils/supabase';
import * as Linking from 'expo-linking';
import { injectPoisMock } from '../../utils/mockInjector';
import PoiDetailSheet from '../../components/PoiDetailSheet';
import EventDetailSheet from '../../components/EventDetailSheet';
import RouteSummarySheet from '../../components/RouteSummarySheet';
import { mockEvents } from '../../utils/mockEvents';

const { width, height } = Dimensions.get('window');

// Bounding box (approssimativo) di Taranto Città Vecchia per il Mockup
const MAP_BOUNDS = {
  north: 40.485,
  south: 40.460,
  west: 17.220,
  east: 17.255
};

export default function MapScreen() {
  const { mobilityType, saveMobilityChoice } = useMobility();
  const { currentTenant } = useTenant();
  const { theme } = useTheme();

  const [pois, setPois] = useState<any[]>([]);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState('free'); // Filtro categoria default a Culturali
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local toggles that were in the original map sidebar
  const [accessibilityOn, setAccessibilityOn] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(true);
  
  // Eventi Community
  const [eventsOn, setEventsOn] = useState(false);
  const [eventsEverToggled, setEventsEverToggled] = useState(false);
  const [isLayerDropdownOpen, setIsLayerDropdownOpen] = useState(false);

  
  // Route Builder
  const { routePois, routeEvents, routeName, addPoiToRoute, removePoiFromRoute, isPoiInRoute, isEventInRoute, addEventToRoute, removeEventFromRoute, isRouteActive, setIsRouteActive, clearRoute } = useRouteBuilder();
  const [isRouteSheetVisible, setIsRouteSheetVisible] = useState(false);

  // Animazione menu mobilità
  const [isMobilityExpanded, setIsMobilityExpanded] = useState(false);
  const mobilityWidth = useRef(new Animated.Value(48)).current; // 48 è la larghezza di base del cerchio

  const toggleMobilityMenu = () => {
    setIsMobilityExpanded(!isMobilityExpanded);
    Animated.timing(mobilityWidth, {
      toValue: isMobilityExpanded ? 48 : 160,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  const getMobilityIcon = (type: string) => {
    if (type === 'pubblica') return 'directions-bus';
    if (type === 'privata') return 'local-taxi';
    return 'pedal-bike'; // Dolce
  };

  const scrollVerticalRef = React.useRef<ScrollView>(null);
  const scrollHorizontalRef = React.useRef<ScrollView>(null);

  const layers = [
    { id: 'all', title: 'Tutti', icon: 'public' },
    { id: 'free', title: 'Culturali', icon: 'account-balance' },
    { id: 'partner', title: 'Partner', icon: 'storefront' },
    { id: 'secret', title: 'Secret', icon: 'vpn-key' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;
      
      console.log(`[Map] Fetching data for tenant: ${currentTenant.id}`);
      
      // Fetch POIs using the Frontend View to get decoded lat/lng from PostGIS coords
      const { data: poisData, error: poisError } = await supabase
        .from('vw_pois_frontend')
        .select('*')
        .eq('tenant_id', currentTenant.slug)
        .eq('is_active', true);
        
      if (!poisError && poisData) {
        // Applichiamo il simulatore per iniettare Diseducation e Mena Mena Mè
        const finalPois = injectPoisMock(poisData);
        setPois(finalPois);
      } else if (poisError) {
        console.error("[Map] Errore fetch POI:", poisError);
      }

      // Fetch Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('active_tenant_events')
        .select('*')
        .eq('tenant_id', currentTenant.id);
        
      if (!eventsError && eventsData && eventsData.length > 0) {
        setActiveEvents(eventsData);
      } else {
        // Fallback MOCK per demo
        setActiveEvents(mockEvents);
      }
      setIsLoading(false);
      
      // Auto-centra la mappa all'avvio (fix per lo zoom "out piccolo")
      setTimeout(() => {
        if (scrollHorizontalRef.current && scrollVerticalRef.current) {
          scrollHorizontalRef.current.scrollTo({ x: width / 2, animated: false });
          scrollVerticalRef.current.scrollTo({ y: height * 0.1, animated: false });
        }
      }, 100);
    };
    fetchData();
  }, [currentTenant]);

  // Listener per Deferred Deep Linking
  useEffect(() => {
    if (pois.length === 0) return;

    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      if (parsed.path && parsed.path.startsWith('p/')) {
        const poiId = parsed.path.split('/')[1];
        const poi = pois.find(p => p.id === poiId);
        
        if (poi && scrollVerticalRef.current && scrollHorizontalRef.current) {
          // Calcoliamo la posizione approssimativa X e Y basandoci sulle percentuali 
          // width: width * 2, height: height * 1.2 (come in styles.mapImage)
          const coords = getPinCoordinates(poi.lat, poi.lng);
          const xPercent = parseFloat(coords.left as string) / 100;
          const yPercent = parseFloat(coords.top as string) / 100;
          
          const targetX = (width * 2 * xPercent) - (width / 2);
          const targetY = (height * 1.2 * yPercent) - (height / 2);
          
          scrollHorizontalRef.current.scrollTo({ x: Math.max(0, targetX), animated: true });
          scrollVerticalRef.current.scrollTo({ y: Math.max(0, targetY), animated: true });
          
          console.log('[Deep Linking] Zoom eseguito su:', poi.name);
          // L'utente aveva chiesto "manteniamo solo lo zoom senza aprire scheda ingombrabte"
          // Quindi NON facciamo setSelectedPoi(poi)
        }
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    
    return () => subscription.remove();
  }, [pois]);

  const getPinCoordinates = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
    const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
    return { 
      left: `${Math.max(5, Math.min(x, 95))}%` as any, 
      top: `${Math.max(5, Math.min(y, 95))}%` as any
    };
  };

  const getPosition = (lat: number, lng: number) => getPinCoordinates(lat, lng);

  const getFilteredPois = () => {
    return pois.filter(poi => {
      // Filtro Layer Categoria
      if (activeLayer === 'free' && poi.category !== 'free') return false;
      if (activeLayer === 'partner' && poi.category !== 'partner') return false;
      if (activeLayer === 'secret' && poi.type !== 'secret') return false;
      
      // Esempio logica accessibilità (se attivata)
      if (accessibilityOn && poi.difficulty_score > 30) return false;

      return true;
    });
  };

  const filteredPois = getFilteredPois();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Route Active Banner OVERLAY */}
      {isRouteActive && (
        <View style={[styles.activeRouteBanner, { backgroundColor: theme.primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="navigation" size={24} color="#FFF" />
            <Text style={styles.activeRouteText}>{routeName}</Text>
          </View>
          <TouchableOpacity onPress={() => { setIsRouteActive(false); clearRoute(); }} style={styles.stopRouteBtn}>
            <Text style={styles.stopRouteBtnText}>Termina</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FLOATING PILL BAR (Layer Filter) */}
      <View style={[styles.floatingBarWrapper, { backgroundColor: theme.background, zIndex: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Heatmap Toggle */}
          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: heatmapOn ? '#E63946' : theme.border, backgroundColor: heatmapOn ? 'rgba(230, 57, 70, 0.1)' : 'transparent', flex: 1, paddingHorizontal: 2, justifyContent: 'center' }]}
            onPress={() => setHeatmapOn(!heatmapOn)}
          >
            <MaterialIcons name="local-fire-department" size={16} color={heatmapOn ? '#E63946' : theme.primary} />
            <Text style={[styles.pillText, { color: heatmapOn ? '#E63946' : theme.text, fontWeight: 'bold', fontSize: 11 }]} numberOfLines={1}>Densità Folla</Text>
          </TouchableOpacity>
          
          <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 2 }} />

          {/* Filtro POI (Dropdown Trigger) */}
          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: theme.border, flex: 1, paddingHorizontal: 2, justifyContent: 'center' }]}
            onPress={() => setIsLayerDropdownOpen(!isLayerDropdownOpen)}
          >
            <MaterialIcons name="place" size={14} color={theme.primary} />
            <Text style={[styles.pillText, { color: theme.text, fontWeight: 'bold' }]} numberOfLines={1}>
              {layers.find(l => l.id === activeLayer)?.title || 'Punti'}
            </Text>
            <MaterialIcons name={isLayerDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 2 }} />

          {/* Toggle Eventi Community */}
          <TouchableOpacity 
            style={[styles.pillBtn, { borderColor: eventsOn ? '#10B981' : theme.border, backgroundColor: eventsOn ? 'rgba(16, 185, 129, 0.1)' : 'transparent', flex: 1, paddingHorizontal: 2, justifyContent: 'center', marginRight: 0 }]}
            onPress={() => {
              setEventsOn(!eventsOn);
              setEventsEverToggled(true);
            }}
          >
            <MaterialIcons name="event" size={14} color={eventsOn ? '#10B981' : theme.primary} />
            <Text style={[styles.pillText, { color: eventsOn ? '#10B981' : theme.text, fontWeight: 'bold' }]} numberOfLines={1}>Eventi</Text>
          </TouchableOpacity>

        </View>
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

      {/* MAP MOCKUP INTERATTIVO */}
      <View style={styles.mapContainer}>
        <ScrollView ref={scrollVerticalRef} maximumZoomScale={3} minimumZoomScale={1} centerContent showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
          <ScrollView 
            ref={scrollHorizontalRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ImageBackground 
              source={require('../../assets/images/map_bg.png')} 
              style={styles.mapImage} 
              resizeMode="cover"
            >
              {/* LOADING OVERLAY NON DISTRUTTIVO */}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.primary }]}>Sincronizzazione P.O.I...</Text>
                </View>
              )}
                {/* RENDER EVENTI COMMUNITY */}
                {eventsOn && activeEvents.map(ev => {
                  const lat = ev.lat || ev.geojson_boundary?.coordinates?.[1] || 40.4735;
                  const lng = ev.lng || ev.geojson_boundary?.coordinates?.[0] || 17.2340;
                  const pos = getPosition(lat, lng);
                  const inRoute = isEventInRoute(ev.id);
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      style={[styles.pin, pos, { zIndex: 95 }]}
                      onPress={() => setSelectedEvent(ev)}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <View style={[styles.pinDot, { 
                          backgroundColor: inRoute ? theme.accent : '#10B981',
                          borderColor: '#FFF',
                          width: 28, height: 28, borderRadius: 14,
                          transform: [{ scale: inRoute ? 1.2 : 1 }]
                        }]}>
                          <MaterialIcons name="star" size={16} color="#FFF" />
                        </View>
                        <View style={[styles.pinLabel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <Text style={[styles.pinLabelText, { color: theme.text }]} numberOfLines={1}>{ev.title}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* RENDER HEATMAP */}
                {heatmapOn && filteredPois.map(poi => {
                  const coords = getPinCoordinates(poi.lat, poi.lng);
                  const crowd = poi.crowd_level || 20;
                  const isHighDensity = crowd > 70;
                  const isMediumDensity = crowd > 35 && crowd <= 70;
                  const heatColor = isHighDensity ? 'rgba(230, 57, 70, 0.45)' : isMediumDensity ? 'rgba(244, 162, 97, 0.4)' : 'rgba(42, 157, 143, 0.35)';
                  const heatSize = isHighDensity ? 140 : isMediumDensity ? 90 : 60;
                  return (
                    <View 
                      key={`heat-${poi.id}`} 
                      style={[
                        { position: 'absolute', width: heatSize, height: heatSize, borderRadius: heatSize/2, backgroundColor: heatColor, marginLeft: -(heatSize/2)+8, marginTop: -(heatSize/2)+8 },
                        coords
                      ]} 
                    />
                  );
                })}

                {/* RENDER PINS */}
                {filteredPois.map(poi => {
                  const pos = getPinCoordinates(poi.lat, poi.lng);
                  const isSelected = selectedPoi?.id === poi.id;
                  const inRoute = isPoiInRoute(poi.id);
                  return (
                    <TouchableOpacity
                      key={poi.id}
                      style={[styles.pin, pos, { zIndex: isSelected ? 100 : inRoute ? 90 : 10 }]}
                      onPress={() => setSelectedPoi(poi)}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <View style={[styles.pinDot, { 
                          backgroundColor: inRoute ? theme.accent : isSelected ? theme.primary : '#FFF',
                          borderColor: inRoute ? '#FFF' : theme.primary,
                          transform: [{ scale: isSelected ? 1.3 : inRoute ? 1.2 : 1 }]
                        }]}>
                          {inRoute && <MaterialIcons name="check" size={12} color="#FFF" />}
                          {isSelected && !inRoute && <MaterialIcons name="place" size={14} color="#FFF" />}
                        </View>
                        <View style={[styles.pinLabel, { backgroundColor: isSelected ? theme.surface : 'rgba(0,0,0,0.6)', borderColor: isSelected ? theme.border : 'transparent' }]}>
                          <Text style={[styles.pinLabelText, { color: isSelected ? theme.text : '#FFF' }]} numberOfLines={1}>{poi.name}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ImageBackground>
          </ScrollView>
        </ScrollView>
        
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

          {/* FAB 2: Mobilità (Espandibile a sinistra) */}
          <Animated.View style={[styles.fabPill, { width: mobilityWidth, backgroundColor: theme.surface }]}>
            {isMobilityExpanded ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', flex: 1, paddingHorizontal: 5 }}>
                <TouchableOpacity onPress={() => { saveMobilityChoice('dolce', 2); toggleMobilityMenu(); }}>
                  <MaterialIcons name="pedal-bike" size={20} color={mobilityType === 'dolce' ? theme.primary : theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { saveMobilityChoice('pubblica', 10); toggleMobilityMenu(); }}>
                  <MaterialIcons name="directions-bus" size={20} color={mobilityType === 'pubblica' ? theme.primary : theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { saveMobilityChoice('privata', 30); toggleMobilityMenu(); }}>
                  <MaterialIcons name="local-taxi" size={20} color={mobilityType === 'privata' ? theme.primary : theme.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={toggleMobilityMenu}>
                <MaterialIcons name={getMobilityIcon(mobilityType || 'dolce')} size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* FAB 3: Crea Percorso */}
          <TouchableOpacity 
            style={[styles.fabCircle, { backgroundColor: routePois.length > 0 ? theme.primary : theme.surface }]}
            onPress={() => {
              setIsRouteSheetVisible(true);
              if (!eventsEverToggled) {
                setEventsOn(true);
                setEventsEverToggled(true);
              }
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

      </View>

      {/* SCHEDE DETTAGLIO */}
      <PoiDetailSheet 
        poi={selectedPoi} 
        visible={!!selectedPoi} 
        onClose={() => setSelectedPoi(null)} 
        onCheckIn={(poi) => console.log('Check-in in', poi)}
      />

      <EventDetailSheet
        event={selectedEvent}
        visible={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* RIEPILOGO PERCORSO */}
      <RouteSummarySheet 
        visible={isRouteSheetVisible} 
        onClose={() => setIsRouteSheetVisible(false)} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeRouteBanner: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    zIndex: 40,
    elevation: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  activeRouteText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stopRouteBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stopRouteBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold'
  },
  container: { flex: 1 },
  floatingBarWrapper: { paddingTop: Constants.statusBarHeight + 10, paddingBottom: 10, paddingHorizontal: 10, zIndex: 10, elevation: 5 },
  floatingBarScroll: { paddingRight: 20 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  dropdownContainer: { position: 'absolute', top: Constants.statusBarHeight + 60, left: 130, zIndex: 30, borderRadius: 12, borderWidth: 1, elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 10, paddingVertical: 5, minWidth: 160 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  dropdownItemText: { fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  mapContainer: { flex: 1, overflow: 'hidden', backgroundColor: '#e0e0e0', position: 'relative' },
  mapImage: { width: width * 2, height: height * 1.2, position: 'relative' },
  pin: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 100, marginLeft: -50, marginTop: -15 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5, justifyContent: 'center', alignItems: 'center' },
  pinLabel: { fontSize: 10, fontWeight: '900', color: '#FFF', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  pinLabelText: { fontSize: 10, fontWeight: 'bold' },
  fabCircle: { backgroundColor: '#FFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.2, shadowRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  fabPill: { backgroundColor: '#FFF', height: 44, borderRadius: 22, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.2, shadowRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' }
});

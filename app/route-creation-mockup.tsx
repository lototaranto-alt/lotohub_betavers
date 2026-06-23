import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Dimensions, Modal, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from './../utils/supabase';

const { width } = Dimensions.get('window');

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDF8F2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
  GRIGIO_CHIARO: '#F1F5F9',
  TESTO_MUTED: '#64748B',
};

interface POI {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude?: number;
  longitude?: number;
}

const FALLBACK_POIS: POI[] = [
  { id: '1', name: 'Castello Aragonese', category: 'free', description: 'Fortezza storica affacciata sul canale navigabile' },
  { id: '2', name: 'Museo MArTA', category: 'free', description: 'Museo Archeologico Nazionale con i famosi Ori di Taranto' },
  { id: '3', name: 'Piazza Fontana Refill', category: 'secret', description: 'Stazione idrica pubblica per abbattere la plastica' },
  { id: '4', name: 'Lungomare Vittorio Emanuele', category: 'free', description: 'Passeggiata panoramica a basso impatto acustico' },
  { id: '5', name: 'LOTO Bio-Bottega', category: 'partner', description: 'Negozio partner con cibi biologici a km 0' },
];

export default function RouteCreationMockupScreen() {
  const [routeTitle, setRouteTitle] = useState('Il Mio Percorso Eco-Culturale');
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<POI[]>([FALLBACK_POIS[0], FALLBACK_POIS[2]]); // Pre-populate with 2 spots
  const [mobility, setMobility] = useState<'walk' | 'bike' | 'bus'>('walk');
  const [loading, setLoading] = useState(true);
  
  // Modals & Banners
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase.rpc('get_pois');
        if (error) {
          console.log("RPC get_pois returned warning/error:", error.message);
        }
        if (data && data.length > 0) {
          setPois(data);
        } else {
          setPois(FALLBACK_POIS);
        }
      } catch (err) {
        console.log("Using fallback POIs due to RPC error:", err);
        setPois(FALLBACK_POIS);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSpot = (poi: POI) => {
    if (selectedSpots.some(s => s.id === poi.id)) {
      setSelectedSpots(selectedSpots.filter(s => s.id !== poi.id));
    } else {
      setSelectedSpots([...selectedSpots, poi]);
    }
  };

  const getPoiIcon = (category: string) => {
    switch (category) {
      case 'partner':
        return 'storefront';
      case 'secret':
        return 'water-drop';
      default:
        return 'museum';
    }
  };

  // Point metrics calculation
  const getPointsInfo = () => {
    const basePti = selectedSpots.length * 10;
    let mobilityPti = 0;
    if (mobility === 'walk' || mobility === 'bike') {
      mobilityPti = selectedSpots.length * 15;
    } else if (mobility === 'bus') {
      mobilityPti = selectedSpots.length * 8;
    }
    const totalPti = basePti + mobilityPti;
    const co2Saved = selectedSpots.length * (mobility === 'bus' ? 0.06 : 0.12);
    
    return {
      base: basePti,
      mobility: mobilityPti,
      total: totalPti,
      co2: co2Saved.toFixed(2),
    };
  };

  const stats = getPointsInfo();

  const handleSaveAndShare = async () => {
    setIsSaving(true);
    try {
      // Chiama RPC per salvare nel DB
      const { data, error } = await supabase.rpc('create_itinerary', {
        p_title: routeTitle || 'Il Mio Percorso',
        p_pois: selectedSpots,
        p_mobility: mobility
      });
      if (error) throw error;
      
      // Apri la modale di condivisione
      setShareModalVisible(true);
    } catch (err: any) {
      console.log('Errore salvataggio itinerario:', err.message);
      alert('Non è stato possibile salvare l\'itinerario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareOption = (platform: string) => {
    setShareModalVisible(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      // Ritorna alla home dopo 2 secondi
      setTimeout(() => router.push('/(tabs)'), 2000);
    }, 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={LOTO_PALETTE.EBANO} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuovo Itinerario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* INPUT TITOLO PERCORSO */}
        <View style={styles.inputCard}>
          <Text style={styles.sectionTitleLabel}>NOME DEL PERCORSO</Text>
          <TextInput
            style={styles.textInput}
            value={routeTitle}
            onChangeText={setRouteTitle}
            placeholder="Es: Passeggiata dei Due Mari"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* TIMELINE DELLO STATO DEL PERCORSO */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardHeaderTitle}>IL TUO ITINERARIO</Text>
          
          {selectedSpots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="map" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nessuna tappa selezionata. Tocca i punti sottostanti per comporre il tuo percorso.</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {selectedSpots.map((spot, index) => {
                const isLast = index === selectedSpots.length - 1;
                return (
                  <View key={spot.id} style={styles.timelineItem}>
                    {/* Linea e Indicatore */}
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineIndicator, { backgroundColor: LOTO_PALETTE.VERDE_OLIVA }]}>
                        <MaterialIcons name={getPoiIcon(spot.category) as any} size={14} color="#FFF" />
                      </View>
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    
                    {/* Info Spot */}
                    <View style={styles.timelineRight}>
                      <View style={styles.spotRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.spotName}>{spot.name}</Text>
                          <Text style={styles.spotDesc} numberOfLines={1}>{spot.description}</Text>
                        </View>
                        <TouchableOpacity style={styles.removeSpotButton} onPress={() => toggleSpot(spot)}>
                          <MaterialIcons name="close" size={16} color={LOTO_PALETTE.TESTO_MUTED} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* SCEGLI MOBILITA */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardHeaderTitle}>METODO DI VIAGGIO</Text>
          <Text style={styles.mobilitySubtitle}>Usa mobilità attiva o pubblica per moltiplicare i tuoi LOTO PTI.</Text>
          
          <View style={styles.mobilityRow}>
            <TouchableOpacity 
              style={[styles.mobilityBtn, mobility === 'walk' && styles.mobilityBtnActive]} 
              onPress={() => setMobility('walk')}
            >
              <MaterialIcons name="directions-walk" size={24} color={mobility === 'walk' ? '#FFF' : LOTO_PALETTE.VERDE_OLIVA} />
              <Text style={[styles.mobilityText, mobility === 'walk' && styles.mobilityTextActive]}>A Piedi</Text>
              <Text style={[styles.mobilityBonus, mobility === 'walk' && styles.mobilityBonusActive]}>+15 PTI/Tappa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mobilityBtn, mobility === 'bike' && styles.mobilityBtnActive]} 
              onPress={() => setMobility('bike')}
            >
              <MaterialIcons name="directions-bike" size={24} color={mobility === 'bike' ? '#FFF' : LOTO_PALETTE.VERDE_OLIVA} />
              <Text style={[styles.mobilityText, mobility === 'bike' && styles.mobilityTextActive]}>Bici</Text>
              <Text style={[styles.mobilityBonus, mobility === 'bike' && styles.mobilityBonusActive]}>+15 PTI/Tappa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mobilityBtn, mobility === 'bus' && styles.mobilityBtnActive]} 
              onPress={() => setMobility('bus')}
            >
              <MaterialIcons name="directions-bus" size={24} color={mobility === 'bus' ? '#FFF' : LOTO_PALETTE.VERDE_OLIVA} />
              <Text style={[styles.mobilityText, mobility === 'bus' && styles.mobilityTextActive]}>Bus / Treno</Text>
              <Text style={[styles.mobilityBonus, mobility === 'bus' && styles.mobilityBonusActive]}>+8 PTI/Tappa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PREVIEW DEI PUNTI (SIMILE ALLE SCHEDE PUNTI ATTUALI) */}
        <View style={styles.pointsBoutiqueCard}>
          <View style={styles.pointsCrownContainer}>
            <MaterialIcons name="workspace-premium" size={32} color={LOTO_PALETTE.SABBIA_DORATA} />
            <Text style={styles.pointsCardTitle}>IMPATTO ESTIMATO</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{stats.total} PTI</Text>
              <Text style={styles.statLab}>Accumulo Stimato</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{stats.co2} kg</Text>
              <Text style={styles.statLab}>CO₂ Risparmiata</Text>
            </View>
          </View>

          <View style={styles.ecoBadgeRow}>
            <MaterialIcons name="eco" size={14} color={LOTO_PALETTE.VERDE_OLIVA} />
            <Text style={styles.ecoBadgeText}>
              {mobility === 'walk' || mobility === 'bike' ? 'Viaggio a emissioni zero garantito' : 'Ridotto impatto carbonio'}
            </Text>
          </View>
        </View>

        {/* SELECTOR DEI SITI DISPONIBILI (METE DI TARANTO) */}
        <View style={styles.spotsSelectorContainer}>
          <Text style={styles.sectionTitle}>SELEZIONA LE METE DA AGGIUNGERE</Text>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={LOTO_PALETTE.VERDE_OLIVA} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPois}>
              {pois.map((poi) => {
                const isSelected = selectedSpots.some(s => s.id === poi.id);
                return (
                  <TouchableOpacity
                    key={poi.id}
                    style={[styles.poiSelectorCard, isSelected && styles.poiSelectorCardSelected]}
                    onPress={() => toggleSpot(poi)}
                  >
                    <View style={styles.poiSelectorHeader}>
                      <MaterialIcons 
                        name={getPoiIcon(poi.category) as any} 
                        size={20} 
                        color={isSelected ? '#FFF' : LOTO_PALETTE.TERRACOTTA} 
                      />
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={18} color="#FFF" />
                      )}
                    </View>
                    <Text style={[styles.poiSelectorName, isSelected && styles.poiSelectorTextActive]}>{poi.name}</Text>
                    <Text 
                      style={[styles.poiSelectorDesc, isSelected && styles.poiSelectorTextActiveMuted]}
                      numberOfLines={2}
                    >
                      {poi.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* SALVA E CONDIVIDI ACTION */}
        <TouchableOpacity 
          style={[styles.saveShareBtn, (selectedSpots.length === 0 || isSaving) && { opacity: 0.6 }]}
          disabled={selectedSpots.length === 0 || isSaving}
          onPress={handleSaveAndShare}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
          ) : (
            <MaterialIcons name="save" size={20} color="#FFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.saveShareBtnText}>SALVA ITINERARIO E CONDIVIDI</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODALE DI CONDIVISIONE SOCIAL (MOCKUP) */}
      <Modal visible={shareModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.socialModalContent}>
            
            {/* INTESTAZIONE E CHIUDI */}
            <View style={styles.socialHeader}>
              <Text style={styles.socialModalTitle}>Condividi il tuo Itinerario</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)} style={styles.closeSocialBtn}>
                <MaterialIcons name="close" size={20} color={LOTO_PALETTE.EBANO} />
              </TouchableOpacity>
            </View>

            {/* ANTEPRIMA DELLA SCHEDA INSTAGRAM (DESIGN EXTREMELY PREMIUM) */}
            <View style={styles.socialCardPoster}>
              <Image 
                source={require('../assets/images/eco_bg.png')} 
                style={StyleSheet.absoluteFillObject} 
                resizeMode="cover"
              />
              <View style={styles.posterOverlay} />
              
              {/* Contenuto Poster */}
              <View style={styles.posterContent}>
                <View style={styles.posterHeader}>
                  <View style={styles.logoBadgeContainer}>
                    <Text style={styles.logoText}>LOTO</Text>
                    <Text style={styles.logoSubtitle}>Eco-Guide Taranto</Text>
                  </View>
                  <View style={styles.posterBadge}>
                    <MaterialIcons name="eco" size={14} color="#FFF" />
                    <Text style={styles.posterBadgeText}>GREEN ROUTE</Text>
                  </View>
                </View>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.posterTitle} numberOfLines={2}>&ldquo;{routeTitle}&rdquo;</Text>
                  <Text style={styles.posterAuthor}>Itinerario creato da me con L.O.T.O.</Text>
                  
                  {/* Tappe elenco */}
                  <View style={styles.posterSpotsList}>
                    {selectedSpots.slice(0, 3).map((spot, i) => (
                      <View key={spot.id} style={styles.posterSpotItem}>
                        <MaterialIcons name="place" size={14} color={LOTO_PALETTE.SABBIA_DORATA} />
                        <Text style={styles.posterSpotText} numberOfLines={1}>{spot.name}</Text>
                      </View>
                    ))}
                    {selectedSpots.length > 3 && (
                      <Text style={styles.posterSpotExtra}>+ altri {selectedSpots.length - 3} luoghi ecologici</Text>
                    )}
                  </View>
                </View>

                {/* Footer Poster */}
                <View style={styles.posterFooter}>
                  <View>
                    <Text style={styles.posterStatVal}>{stats.total} PTI</Text>
                    <Text style={styles.posterStatLab}>RISPARMIATI</Text>
                  </View>
                  <View style={styles.posterDivider} />
                  <View>
                    <Text style={styles.posterStatVal}>{stats.co2} KG</Text>
                    <Text style={styles.posterStatLab}>CO₂ EVITATA</Text>
                  </View>
                  <View style={styles.posterDivider} />
                  <View style={styles.qrCodeMock}>
                    <MaterialIcons name="qr-code-2" size={36} color={LOTO_PALETTE.EBANO} />
                  </View>
                </View>
              </View>
            </View>

            {/* SELEZIONE SOCIAL NETWORK */}
            <Text style={styles.chooseSocialLabel}>SELEZIONA DOVE CONDIVIDERE</Text>
            
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialAppBtn} onPress={() => handleShareOption('instagram')}>
                <View style={[styles.socialIconCircle, { backgroundColor: '#E1306C' }]}>
                  <MaterialIcons name="camera-alt" size={22} color="#FFF" />
                </View>
                <Text style={styles.socialAppName}>Stories</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialAppBtn} onPress={() => handleShareOption('whatsapp')}>
                <View style={[styles.socialIconCircle, { backgroundColor: '#25D366' }]}>
                  <MaterialIcons name="chat" size={22} color="#FFF" />
                </View>
                <Text style={styles.socialAppName}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialAppBtn} onPress={() => handleShareOption('telegram')}>
                <View style={[styles.socialIconCircle, { backgroundColor: '#0088cc' }]}>
                  <MaterialIcons name="send" size={20} color="#FFF" style={{ marginRight: 2 }} />
                </View>
                <Text style={styles.socialAppName}>Telegram</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* TOAST SUCCESS (BANNER DI RISCONTRO PUNTI XP SIMULATO) */}
      {showSuccessToast && (
        <View style={styles.successToast}>
          <MaterialIcons name="check-circle" size={22} color="#FFF" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.successToastTitle}>Condivisione Completata!</Text>
            <Text style={styles.successToastDesc}>Hai guadagnato +15 XP per la diffusione green! 🍃</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: LOTO_PALETTE.EBANO,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  sectionTitleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: LOTO_PALETTE.TERRACOTTA,
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: LOTO_PALETTE.EBANO,
    borderBottomWidth: 1.5,
    borderColor: LOTO_PALETTE.TERRACOTTA,
    paddingVertical: 6,
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 22,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
    letterSpacing: 1.2,
    marginBottom: 15,
    fontFamily: 'serif',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 10,
  },
  emptyText: {
    fontSize: 12,
    color: LOTO_PALETTE.TESTO_MUTED,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  timelineContainer: {
    paddingLeft: 10,
    paddingVertical: 5,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 30,
  },
  timelineIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    bottom: -10,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 15,
    paddingBottom: 20,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LOTO_PALETTE.CREMA,
    padding: 12,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#E2DDCF',
  },
  spotName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
  },
  spotDesc: {
    fontSize: 11,
    color: LOTO_PALETTE.TESTO_MUTED,
    marginTop: 2,
  },
  removeSpotButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  mobilitySubtitle: {
    fontSize: 12,
    color: LOTO_PALETTE.TESTO_MUTED,
    marginBottom: 15,
    lineHeight: 16,
  },
  mobilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  mobilityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobilityBtnActive: {
    backgroundColor: LOTO_PALETTE.VERDE_OLIVA,
    borderColor: LOTO_PALETTE.VERDE_OLIVA,
    elevation: 3,
  },
  mobilityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
    marginTop: 6,
  },
  mobilityTextActive: {
    color: '#FFF',
  },
  mobilityBonus: {
    fontSize: 9,
    fontWeight: '700',
    color: LOTO_PALETTE.VERDE_OLIVA,
    marginTop: 4,
  },
  mobilityBonusActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  pointsBoutiqueCard: {
    backgroundColor: LOTO_PALETTE.CREMA,
    borderRadius: 25,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LOTO_PALETTE.SABBIA_DORATA,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  pointsCrownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pointsCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
    letterSpacing: 1.5,
    marginLeft: 8,
    fontFamily: 'serif',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E2DDCF',
    marginBottom: 15,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2DDCF',
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
  },
  statLab: {
    fontSize: 10,
    color: LOTO_PALETTE.TESTO_MUTED,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  ecoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(95, 113, 61, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ecoBadgeText: {
    fontSize: 11,
    color: LOTO_PALETTE.VERDE_OLIVA,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  spotsSelectorContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: LOTO_PALETTE.EBANO,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  horizontalPois: {
    paddingRight: 20,
    gap: 12,
  },
  poiSelectorCard: {
    width: width * 0.45,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  poiSelectorCardSelected: {
    backgroundColor: LOTO_PALETTE.TERRACOTTA,
    borderColor: LOTO_PALETTE.TERRACOTTA,
    elevation: 4,
  },
  poiSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  poiSelectorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
    marginBottom: 4,
  },
  poiSelectorDesc: {
    fontSize: 11,
    color: LOTO_PALETTE.TESTO_MUTED,
    lineHeight: 14,
  },
  poiSelectorTextActive: {
    color: '#FFF',
  },
  poiSelectorTextActiveMuted: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  saveShareBtn: {
    backgroundColor: LOTO_PALETTE.EBANO,
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  saveShareBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 28, 30, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialModalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  socialHeader: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  socialModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
    fontFamily: 'serif',
  },
  closeSocialBtn: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
  },
  socialCardPoster: {
    width: '100%',
    height: 360,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 5,
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 28, 30, 0.65)',
  },
  posterContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 22,
    justifyContent: 'space-between',
  },
  posterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoBadgeContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'serif',
  },
  logoSubtitle: {
    color: LOTO_PALETTE.SABBIA_DORATA,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: -2,
  },
  posterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LOTO_PALETTE.VERDE_OLIVA,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  posterBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  posterTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 5,
  },
  posterAuthor: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 20,
  },
  posterSpotsList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  posterSpotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  posterSpotText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  posterSpotExtra: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  posterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingTop: 15,
  },
  posterStatVal: {
    color: LOTO_PALETTE.SABBIA_DORATA,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  posterStatLab: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  posterDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  qrCodeMock: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseSocialLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: LOTO_PALETTE.TESTO_MUTED,
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  socialAppBtn: {
    alignItems: 'center',
    flex: 1,
  },
  socialIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginBottom: 8,
  },
  socialAppName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
  },
  successToast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: LOTO_PALETTE.VERDE_OLIVA,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  successToastTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  successToastDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
  },
});

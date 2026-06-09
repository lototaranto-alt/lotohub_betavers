import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, Alert, Linking, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// LOTO_PALETTE definita qua per semplicità, ma in un progetto reale verrebbe importata
const LOTO_PALETTE = {
  VERDE_OLIVA: '#6B8E23',
  TERRACOTTA: '#E07A5F',
  EBANO: '#3D405B',
  SABBIA_DORATA: '#D9A05B',
  CREMA: '#F4F1DE',
};

const { height } = Dimensions.get('window');

type PoiDetailSheetProps = {
  visible: boolean;
  poi: any | null;
  onClose: () => void;
  onBook: (poi: any, partySize: number) => void;
  onValidate: (poi: any) => void;
  isBooked: boolean;
  initialPartySize: number;
};

export default function PoiDetailSheet({ visible, poi, onClose, onBook, onValidate, isBooked, initialPartySize }: PoiDetailSheetProps) {
  const [partySize, setPartySize] = useState(initialPartySize || 1);
  const [mobilityMode, setMobilityMode] = useState<'mezzo_proprio' | 'loto_mobility' | null>(null);

  if (!poi) return null;

  const isZTL = poi.name.toLowerCase().includes('castel') || poi.name.toLowerCase().includes('duomo');
  const hasParkingSuggestion = !!poi.recommended_parking_id;

  const handleNavigate = (type: 'driving' | 'walking' | 'transit' | 'bicycling', isParking: boolean = false) => {
    // Coordinate fittizie per il parcheggio se isParking è vero, altrimenti coordinate del POI
    const destLat = isParking ? 40.4720 : poi.latitude;
    const destLng = isParking ? 17.2285 : poi.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${type}`;
    Linking.openURL(url).catch(err => console.error("Impossibile aprire le mappe", err));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. Header Image */}
            <View style={styles.imageContainer}>
              <View style={[styles.imagePlaceholder, { backgroundColor: poi.category === 'partner' ? LOTO_PALETTE.EBANO : LOTO_PALETTE.VERDE_OLIVA }]}>
                <MaterialIcons name={poi.category === 'partner' ? "store" : "account-balance"} size={48} color="#FFF" />
              </View>
              <View style={styles.closeBtn}>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Header Info */}
            <View style={styles.infoSection}>
              <Text style={styles.title}>{poi.name}</Text>
              <Text style={styles.subtitle}>{poi.category === 'free' ? 'Accesso Libero' : (poi.category === 'partner' ? 'B2B Partner' : 'Storia Segreta')}</Text>
              
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>+{poi.xp_reward || 15} XP</Text>
                </View>
                {poi.has_water && (
                  <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.badgeText, { color: '#0284C7' }]}>Refill Idrico</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 3. IL BIVIO DECISIONALE & IL PATTO */}
            <View style={styles.actionSection}>
              
              {isBooked ? (
                // STATO: PRENOTATO
                <View style={styles.bookedContainer}>
                  <MaterialIcons name="check-circle" size={48} color={LOTO_PALETTE.VERDE_OLIVA} style={{ alignSelf: 'center', marginBottom: 10 }} />
                  <Text style={styles.bookedTitle}>Prenotazione Attiva</Text>
                  <Text style={styles.bookedSub}>Hai riservato i tuoi posti. Raggiungi il luogo per sbloccare i punti.</Text>
                  
                  <TouchableOpacity style={styles.mainBtn} onPress={() => onValidate(poi)}>
                    <Text style={styles.mainBtnText}>Convalida Arrivo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // STATO: DA PRENOTARE
                <>
                  <Text style={styles.sectionTitle}>Conferma Ospiti</Text>
                  <View style={styles.partySelector}>
                    <TouchableOpacity style={styles.partyBtn} onPress={() => setPartySize(Math.max(1, partySize - 1))}>
                      <MaterialIcons name="remove" size={20} color={LOTO_PALETTE.EBANO} />
                    </TouchableOpacity>
                    <Text style={styles.partyText}>{partySize} {partySize > 1 ? 'Persone' : 'Persona'}</Text>
                    <TouchableOpacity style={styles.partyBtn} onPress={() => setPartySize(partySize + 1)}>
                      <MaterialIcons name="add" size={20} color={LOTO_PALETTE.EBANO} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionTitle}>Come raggiungerai la destinazione?</Text>
                  <View style={styles.bivioContainer}>
                    <TouchableOpacity 
                      style={[styles.bivioBtn, mobilityMode === 'mezzo_proprio' && styles.bivioBtnActive]}
                      onPress={() => setMobilityMode('mezzo_proprio')}
                    >
                      <MaterialIcons name="directions-car" size={24} color={mobilityMode === 'mezzo_proprio' ? '#FFF' : '#64748B'} />
                      <Text style={[styles.bivioText, mobilityMode === 'mezzo_proprio' && { color: '#FFF' }]}>Mezzo Proprio</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.bivioBtn, mobilityMode === 'loto_mobility' && styles.bivioBtnActive]}
                      onPress={() => setMobilityMode('loto_mobility')}
                    >
                      <MaterialIcons name="directions-walk" size={24} color={mobilityMode === 'loto_mobility' ? '#FFF' : '#64748B'} />
                      <Text style={[styles.bivioText, mobilityMode === 'loto_mobility' && { color: '#FFF' }]}>Proposte L.O.T.O.</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ESPANSIONE BIVIO */}
                  {mobilityMode === 'mezzo_proprio' && hasParkingSuggestion && (
                    <View style={styles.governanceCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <MaterialIcons name="local-parking" size={20} color={LOTO_PALETTE.SABBIA_DORATA} />
                        <Text style={styles.governanceTitle}>Suggerimento Sosta Strategica</Text>
                      </View>
                      <Text style={styles.governanceText}>
                        La zona intorno a {poi.name} è a traffico limitato o congestionata. Parcheggia comodamente a "Park Porto Antico" e guadagna <Text style={{fontWeight: 'bold', color: LOTO_PALETTE.SABBIA_DORATA}}>+10 PTI</Text>.
                      </Text>
                      <TouchableOpacity style={styles.navParkingBtn} onPress={() => handleNavigate('driving', true)}>
                        <MaterialIcons name="navigation" size={16} color="#FFF" style={{ marginRight: 5 }} />
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Naviga al Parcheggio</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {mobilityMode === 'loto_mobility' && (
                    <View style={styles.mobilityRow}>
                      <TouchableOpacity style={styles.mobilityItem} onPress={() => handleNavigate('walking')}>
                        <MaterialIcons name="directions-walk" size={24} color={LOTO_PALETTE.VERDE_OLIVA} />
                        <Text style={styles.mobilityLabel}>15 min</Text>
                        <Text style={styles.mobilityBonus}>+5 XP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mobilityItem} onPress={() => handleNavigate('bicycling')}>
                        <MaterialIcons name="directions-bike" size={24} color={LOTO_PALETTE.VERDE_OLIVA} />
                        <Text style={styles.mobilityLabel}>6 min</Text>
                        <Text style={styles.mobilityBonus}>+10 XP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mobilityItem} onPress={() => handleNavigate('transit')}>
                        <MaterialIcons name="directions-bus" size={24} color={LOTO_PALETTE.VERDE_OLIVA} />
                        <Text style={styles.mobilityLabel}>Bus 1/2</Text>
                        <Text style={styles.mobilityBonus}>-1.2kg CO₂</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.mainBtn, (!mobilityMode) && { opacity: 0.5 }]} 
                    disabled={!mobilityMode}
                    onPress={() => onBook(poi, partySize)}
                  >
                    <Text style={styles.mainBtnText}>Prenota Visita</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    height: height * 0.85,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  imageContainer: { width: '100%', height: 200, position: 'relative' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 5 },
  infoSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 26, fontWeight: '900', fontFamily: 'serif', color: LOTO_PALETTE.EBANO },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  badgesRow: { flexDirection: 'row', marginTop: 12 },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  actionSection: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, marginBottom: 15, marginTop: 10 },
  partySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 15, padding: 10, marginBottom: 20 },
  partyBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  partyText: { fontSize: 16, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  bivioContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  bivioBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 15, marginHorizontal: 5 },
  bivioBtnActive: { backgroundColor: LOTO_PALETTE.EBANO },
  bivioText: { marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  governanceCard: { backgroundColor: 'rgba(217, 160, 91, 0.1)', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(217, 160, 91, 0.3)' },
  governanceTitle: { fontSize: 14, fontWeight: 'bold', color: LOTO_PALETTE.SABBIA_DORATA, marginLeft: 5 },
  governanceText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 15 },
  navParkingBtn: { backgroundColor: LOTO_PALETTE.SABBIA_DORATA, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10 },
  mobilityRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15 },
  mobilityItem: { alignItems: 'center' },
  mobilityLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 5 },
  mobilityBonus: { fontSize: 11, color: LOTO_PALETTE.VERDE_OLIVA, fontWeight: 'bold' },
  mainBtn: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bookedContainer: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, alignItems: 'center', marginVertical: 20 },
  bookedTitle: { fontSize: 18, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  bookedSub: { textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 5, marginBottom: 15 }
});

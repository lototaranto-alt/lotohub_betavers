import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Alert, ProgressBarAndroid } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

type BadgeCollectionModalProps = {
  visible: boolean;
  onClose: () => void;
  userBadges: any[];
  userProfile?: any;
  theme: any;
  onAction?: (actionType: string) => void;
};

// Catalogo Ufficiale dei Badge LOTO (Allineato ad azioni reali dell'ecosistema)
const ALL_BADGES_CATALOG = [
  { 
    id: 'badge_first_scan', 
    name: 'Battesimo del Loto', 
    icon: 'location-on', 
    desc: 'Effettua il tuo primo check-in o scansione NFC in un Luogo o Monumento LOTO.', 
    actionLabel: 'Vai alla Mappa', 
    actionType: 'map',
    target: 1, 
    unit: 'POI',
    metricKey: 'pois_discovered',
    color: '#2ECC71' 
  },
  { 
    id: 'badge_civic_3', 
    name: 'Sentinella Civica', 
    icon: 'security', 
    desc: 'Invia almeno 3 segnalazioni civiche con geolocalizzazione per preservare il decoro urbano.', 
    actionLabel: 'Fai Segnalazione', 
    actionType: 'report',
    target: 3, 
    unit: 'Segnalazioni',
    metricKey: 'reports_count',
    color: '#2196F3' 
  },
  { 
    id: 'badge_eco_5kg', 
    name: 'Eco-Sostenitore', 
    icon: 'eco', 
    desc: 'Risparmia 5.0 kg di CO₂ muovendoti a piedi, in bici o con mezzi sostenibili.', 
    actionLabel: 'Monitora CO₂', 
    actionType: 'co2',
    target: 5.0, 
    unit: 'kg CO₂',
    metricKey: 'total_co2',
    color: '#4CAF50' 
  },
  { 
    id: 'badge_marathon_3', 
    name: 'Maratoneta Jonico', 
    icon: 'directions-run', 
    desc: 'Completa 3 itinerari culturali integrali tra i vicoli e i monumenti della città.', 
    actionLabel: 'Scegli Itinerario', 
    actionType: 'itinerary',
    target: 3, 
    unit: 'Itinerari',
    metricKey: 'itineraries_count',
    color: '#FF9800' 
  },
  { 
    id: 'badge_level_5', 
    name: 'Custode Urbano (Liv. 5)', 
    icon: 'stars', 
    desc: 'Raggiungi il Livello 5 accumulando esperienza civica e sblocca il Rango Argento.', 
    actionLabel: 'Vedi Diario XP', 
    actionType: 'profile',
    target: 5, 
    unit: 'Livello',
    metricKey: 'level',
    color: '#D4AF37' 
  },
  { 
    id: 'badge_partner', 
    name: 'Amico delle Botteghe', 
    icon: 'storefront', 
    desc: 'Visita e sostieni le botteghe artigiane e le boutique partner del territorio.', 
    actionLabel: 'Vedi Botteghe', 
    actionType: 'boutiques',
    target: 2, 
    unit: 'Check-in',
    metricKey: 'partner_checkins',
    color: '#9B59B6' 
  },
];

export default function BadgeCollectionModal({ visible, onClose, userBadges, userProfile, theme, onAction }: BadgeCollectionModalProps) {
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  // Otteniamo la lista degli ID sbloccati dall'utente (dai dati reali del database o calcolati)
  const unlockedIds = userBadges.map(ub => ub.badge_type || ub.badge_id || ub.id);

  // Calcola il progresso numerico reale per ciascun badge
  const getBadgeProgress = (badge: any) => {
    let current = 0;
    if (badge.metricKey === 'pois_discovered') {
      current = userProfile?.pois_discovered || (unlockedIds.includes(badge.id) ? 1 : 0);
    } else if (badge.metricKey === 'total_co2') {
      current = userProfile?.total_co2 || 0;
    } else if (badge.metricKey === 'level') {
      current = userProfile?.level || 1;
    } else if (badge.metricKey === 'reports_count') {
      current = userProfile?.reports_count || (unlockedIds.includes(badge.id) ? 3 : 0);
    } else if (badge.metricKey === 'itineraries_count') {
      current = userProfile?.itineraries_count || (unlockedIds.includes(badge.id) ? 3 : 0);
    } else {
      current = unlockedIds.includes(badge.id) ? badge.target : 0;
    }

    const isCompleted = current >= badge.target || unlockedIds.includes(badge.id);
    const percent = Math.min(100, Math.round((current / badge.target) * 100));
    return { current, isCompleted, percent };
  };

  const handleActionClick = (badge: any) => {
    setSelectedBadge(null);
    onClose();
    if (onAction) {
      onAction(badge.actionType);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* AREA TOUCH ESTERNA PER CHIUSURA IMMEDIATA (TAP ESTERNO) */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.sheet, { backgroundColor: '#FDFBF7' }]}>
          
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="military-tech" size={26} color="#D4AF37" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.title}>Distintivi & Missioni Territorio</Text>
                <Text style={styles.subtitle}>Obiettivi sbloccati: {ALL_BADGES_CATALOG.filter(b => getBadgeProgress(b).isCompleted).length} su {ALL_BADGES_CATALOG.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={22} color="#1A3621" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.introText}>
            Ogni distintivo si ottiene compiendo azioni reali nel territorio e contribuisce all'impatto della comunità LOTO.
          </Text>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {ALL_BADGES_CATALOG.map((badge, idx) => {
              const { current, isCompleted, percent } = getBadgeProgress(badge);
              const badgeColor = badge.color || '#2D4A22';

              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.badgeItem, { 
                    backgroundColor: isCompleted ? '#FFF' : 'rgba(0,0,0,0.02)',
                    borderColor: isCompleted ? badgeColor : 'rgba(0,0,0,0.08)',
                  }]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.badgeIconWrap, { backgroundColor: isCompleted ? badgeColor + '18' : '#F0ECE1' }]}>
                    <MaterialIcons 
                      name={badge.icon as any} 
                      size={28} 
                      color={isCompleted ? badgeColor : '#A0AAB2'} 
                    />
                  </View>
                  
                  <Text style={[styles.badgeName, { color: isCompleted ? '#1A3621' : '#6A5638' }]} numberOfLines={2}>
                    {badge.name}
                  </Text>

                  {/* Barra di Progresso Reale */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: isCompleted ? badgeColor : '#D4AF37' }]} />
                  </View>

                  <Text style={styles.progressText}>
                    {isCompleted ? '✓ Completato' : `${typeof current === 'number' ? current.toFixed(current % 1 === 0 ? 0 : 1) : current}/${badge.target} ${badge.unit}`}
                  </Text>

                  <View style={[styles.statusPill, { backgroundColor: isCompleted ? badgeColor : '#E0DCD3' }]}>
                    <Text style={[styles.statusText, { color: isCompleted ? '#FFF' : '#6A5638' }]}>
                      {isCompleted ? 'SBLOCCATO' : `${percent}%`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>
      </View>

      {/* DETTAGLIO BADGE MODAL INTERNO */}
      {selectedBadge && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
          <View style={styles.detailOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSelectedBadge(null)} />
            
            <View style={styles.detailBox}>
              
              <View style={[styles.detailIconWrap, { backgroundColor: (selectedBadge.color || '#2D4A22') + '20' }]}>
                 <MaterialIcons name={selectedBadge.icon as any} size={44} color={selectedBadge.color || '#2D4A22'} />
              </View>
              
              <Text style={styles.detailTitle}>{selectedBadge.name}</Text>
              
              <View style={styles.reqPill}>
                <MaterialIcons name="flag" size={14} color="#2D4A22" />
                <Text style={styles.reqText}>
                  Obiettivo: {selectedBadge.target} {selectedBadge.unit}
                </Text>
              </View>
              
              <Text style={styles.detailDesc}>{selectedBadge.desc}</Text>
              
              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.actionBtnCancel} onPress={() => setSelectedBadge(null)}>
                  <Text style={styles.actionBtnCancelText}>Chiudi</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtnConfirm, { backgroundColor: selectedBadge.color || '#2D4A22' }]} 
                  onPress={() => handleActionClick(selectedBadge)}
                >
                  <Text style={styles.actionBtnConfirmText}>
                    {getBadgeProgress(selectedBadge).isCompleted ? 'Mostra nel Diario' : selectedBadge.actionLabel}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { maxHeight: height * 0.85, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  handle: { width: 44, height: 5, backgroundColor: '#D5CBB9', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D4A22', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif', color: '#1A3621' },
  subtitle: { fontSize: 12, color: '#6A5638', fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  introText: { color: '#6A5638', fontSize: 12, lineHeight: 18, marginBottom: 16, paddingHorizontal: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', paddingBottom: 30 },
  badgeItem: { width: '48%', borderRadius: 18, borderWidth: 1.5, padding: 12, alignItems: 'center', elevation: 2, marginBottom: 6 },
  badgeIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  badgeName: { fontSize: 12, fontWeight: 'bold', fontFamily: 'serif', textAlign: 'center', minHeight: 32 },
  progressContainer: { width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, color: '#6A5638', marginTop: 4, fontWeight: '600' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  statusText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  
  // Dettaglio Modal
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailBox: { width: '100%', maxWidth: 360, backgroundColor: '#FDFBF7', borderRadius: 24, padding: 25, alignItems: 'center', elevation: 10, borderWidth: 1, borderColor: '#D5CBB9' },
  detailIconWrap: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', color: '#1A3621', marginBottom: 8, textAlign: 'center' },
  reqPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F0E4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 15 },
  reqText: { fontSize: 11, color: '#2D4A22', marginLeft: 6, fontWeight: 'bold' },
  detailDesc: { textAlign: 'center', color: '#6A5638', fontSize: 13, lineHeight: 20, marginBottom: 25 },
  detailActions: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#EFECE6' },
  actionBtnCancelText: { fontWeight: 'bold', fontSize: 13, color: '#6A5638' },
  actionBtnConfirm: { flex: 1.4, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  actionBtnConfirmText: { fontWeight: 'bold', fontSize: 13, color: '#FFF' }
});

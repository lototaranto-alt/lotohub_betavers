import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

type BadgeCollectionModalProps = {
  visible: boolean;
  onClose: () => void;
  userBadges: any[];
  theme: any;
};

// Mock di tutti i badge possibili per la demo
const ALL_BADGES_MOCK = [
  { id: 'eco_warrior', name: 'Eco Warrior', icon: 'eco', desc: 'Hai risparmiato i tuoi primi 10kg di CO2 usando la mobilità dolce.', req: '10kg CO2 Evitata' },
  { id: 'pioniere', name: 'Pioniere', icon: 'explore', desc: 'Hai esplorato 5 zone segrete della città vecchia.', req: '5 P.O.I. Segreti' },
  { id: 'custode', name: 'Custode', icon: 'security', desc: 'Hai completato il livello di Onboarding del Nodo Civico.', req: 'Onboarding completato' },
  { id: 'social_hub', name: 'Social Hub', icon: 'groups', desc: 'Hai partecipato a 3 eventi della community in un mese.', req: '3 Eventi Community' },
  { id: 'maratoneta', name: 'Maratoneta', icon: 'directions-run', desc: 'Hai percorso oltre 50km a piedi nei percorsi LOTO.', req: '50km percorsi a piedi' },
  { id: 'storico', name: 'Storico', icon: 'account-balance', desc: 'Hai ascoltato per intero 5 audioguide culturali.', req: '5 Audioguide completate' },
  { id: 'notturno', name: 'Gufo Notturno', icon: 'nights-stay', desc: 'Hai scoperto 3 P.O.I. dopo la mezzanotte.', req: '3 P.O.I. scoperti di notte' },
  { id: 'green_eater', name: 'Green Eater', icon: 'restaurant', desc: 'Hai visitato 5 partner F&B sostenibili.', req: '5 Partner F&B' },
];

export default function BadgeCollectionModal({ visible, onClose, userBadges, theme }: BadgeCollectionModalProps) {
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  // Otteniamo la lista degli ID sbloccati dall'utente. Se il DB è vuoto, simuliamo lo sblocco dei primi 3
  const unlockedIds = userBadges.length > 0 
    ? userBadges.map(ub => ub.badges?.id || ub.badge_id)
    : ['eco_warrior', 'pioniere', 'custode'];

  const handleEquip = () => {
    Alert.alert("Equipaggiato!", `Il badge ${selectedBadge?.name} ora è in vetrina.`, [{ text: 'Chiudi', onPress: () => setSelectedBadge(null) }]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Collezione Badge</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>Tutti i traguardi sbloccabili in città. Clicca per i dettagli.</Text>

          <ScrollView contentContainerStyle={styles.grid}>
            {ALL_BADGES_MOCK.map((badge, idx) => {
              const isUnlocked = unlockedIds.includes(badge.id);
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.badgeItem, { 
                    backgroundColor: isUnlocked ? theme.surface : 'rgba(0,0,0,0.05)',
                    borderColor: isUnlocked ? theme.primary : theme.border,
                    borderStyle: isUnlocked ? 'solid' : 'dashed'
                  }]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons 
                    name={badge.icon as any} 
                    size={32} 
                    color={isUnlocked ? theme.primary : '#A0AEC0'} 
                    style={{ opacity: isUnlocked ? 1 : 0.5 }}
                  />
                  <Text style={[styles.badgeName, { color: isUnlocked ? theme.text : '#A0AEC0' }]} numberOfLines={1}>
                    {isUnlocked ? badge.name : '???'}
                  </Text>
                  {!isUnlocked && (
                    <MaterialIcons name="lock" size={12} color="#A0AEC0" style={{ position: 'absolute', top: 5, right: 5 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>
      </View>

      {/* DETTAGLIO BADGE MODAL INTERNO */}
      {selectedBadge && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.detailOverlay}>
            <View style={[styles.detailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              
              <View style={[styles.detailIconWrap, { backgroundColor: theme.primary }]}>
                 <MaterialIcons name={selectedBadge.icon as any} size={50} color="#FFF" />
              </View>
              
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedBadge.name}</Text>
              
              <View style={styles.reqPill}>
                <MaterialIcons name="flag" size={14} color="#64748B" />
                <Text style={styles.reqText}>{selectedBadge.req}</Text>
              </View>
              
              <Text style={styles.detailDesc}>{selectedBadge.desc}</Text>
              
              <View style={styles.detailActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.border }]} onPress={() => setSelectedBadge(null)}>
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Chiudi</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: theme.primary, opacity: unlockedIds.includes(selectedBadge.id) ? 1 : 0.5 }]} 
                  onPress={unlockedIds.includes(selectedBadge.id) ? handleEquip : () => Alert.alert("Bloccato", "Devi prima completare i requisiti per ottenere questo badge.")}
                >
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>
                    {unlockedIds.includes(selectedBadge.id) ? 'Metti in Vetrina' : 'Bloccato'}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { height: height * 0.85, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', fontFamily: 'serif' },
  closeBtn: { padding: 5 },
  subtitle: { color: '#64748B', fontSize: 14, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' },
  badgeItem: { width: '30%', aspectRatio: 1, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  badgeName: { fontSize: 10, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  // Dettaglio Modal
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  detailBox: { width: '85%', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1 },
  detailIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  detailTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'serif', marginBottom: 10 },
  reqPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 15 },
  reqText: { fontSize: 12, color: '#64748B', marginLeft: 5, fontWeight: 'bold' },
  detailDesc: { textAlign: 'center', color: '#475569', lineHeight: 22, marginBottom: 25 },
  detailActions: { flexDirection: 'row', gap: 10, width: '100%' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 }
});

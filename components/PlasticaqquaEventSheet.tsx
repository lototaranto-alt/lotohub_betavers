import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

interface PlasticaqquaEventSheetProps {
  visible: boolean;
  onClose: () => void;
  onCheckInEvent: () => void;
}

export default function PlasticaqquaEventSheet({ visible, onClose, onCheckInEvent }: PlasticaqquaEventSheetProps) {
  const { theme } = useTheme();
  
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.handle} />
          
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* INTESTAZIONE EVENTO */}
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                <MaterialIcons name="event" size={16} color="#2196F3" />
                <Text style={[styles.badgeText, { color: '#2196F3' }]}>INIZIATIVA SPECIALE</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Raccolta Rifiuti Volontaria</Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="place" size={16} color={theme.textMuted} />
                <Text style={[styles.locationText, { color: theme.textMuted }]}>Lido Azzurro, Via Calata Saraceno</Text>
              </View>
              <View style={styles.locationRow}>
                <MaterialIcons name="schedule" size={16} color={theme.textMuted} />
                <Text style={[styles.locationText, { color: theme.textMuted }]}>Oggi, ore 16:30</Text>
              </View>
            </View>

            {/* PARTNER / ORGANIZZATORI */}
            <View style={styles.partnerContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Organizzato da</Text>
              <View style={styles.partnerList}>
                <Text style={[styles.partnerName, { color: theme.text }]}>• Plasticaqqua Taranto A.p.s.</Text>
                <Text style={[styles.partnerName, { color: theme.text }]}>• Associazione Noi&Voi</Text>
                <Text style={[styles.partnerName, { color: theme.text }]}>• Coord. Cittadino Lido Azzurro</Text>
              </View>
            </View>

            {/* CONTATORI REPORTISTICA LIVE */}
            <View style={styles.statsContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Impatto Stimato (Live)</Text>
              
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <MaterialIcons name="group" size={28} color="#2196F3" />
                  <Text style={[styles.statValue, { color: theme.text }]}>23</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Partecipanti</Text>
                </View>
                
                <View style={[styles.statBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <MaterialIcons name="eco" size={28} color="#4CAF50" />
                  <Text style={[styles.statValue, { color: theme.text }]}>38</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Azioni Civiche</Text>
                </View>
              </View>
              <Text style={[styles.statsSubtitle, { color: theme.textMuted }]}>Unisciti per far salire i contatori comunitari!</Text>
            </View>

            {/* DESCRIZIONE */}
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionText, { color: theme.text }]}>
                La raccolta volontaria nasce per pulire la spiaggia del Lido Azzurro. La tua partecipazione attiva sbloccherà il badge "Sentinella".
              </Text>
            </View>
          </ScrollView>

          {/* CALL TO ACTION */}
          <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.checkInBtn, { backgroundColor: theme.primary }]} 
              onPress={onCheckInEvent}
            >
              <MaterialIcons name="check-circle" size={20} color={theme.background} style={{ marginRight: 8 }} />
              <Text style={[styles.checkInBtnText, { color: theme.background }]}>Conferma Partecipazione</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, height: height * 0.85, paddingTop: 10, elevation: 20 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#CCC', alignSelf: 'center', marginBottom: 20 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  header: { marginBottom: 25 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 10, lineHeight: 32 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  locationText: { fontSize: 14, marginLeft: 6 },
  partnerContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 12 },
  partnerList: { paddingLeft: 5 },
  partnerName: { fontSize: 15, marginBottom: 4 },
  statsContainer: { marginBottom: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  statBox: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 15, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  statsSubtitle: { fontSize: 12, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  descriptionContainer: { marginBottom: 30 },
  descriptionText: { fontSize: 15, lineHeight: 24 },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1 },
  checkInBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 15, elevation: 4 },
  checkInBtnText: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface ProfileModalProps {
  pois?: any[];
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  userXp: number;
  levelInfo: any;
  userItineraries: any[];
  userTransactions: any[];
  userTokens: number;
  theme: any;
  t: any;
  setUserProfile: (profile: any) => void;
  onDeleteItinerary?: (id: string) => void;
}

export default function ProfileModal({ visible, onClose, userProfile, userXp, levelInfo, userTokens, theme, setUserProfile }: ProfileModalProps) {
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(userProfile?.nickname || 'ESPLORATORE');
  const [userBadges, setUserBadges] = useState<string[]>([]);

  React.useEffect(() => {
    if (visible && userProfile?.id) {
      const fetchBadges = async () => {
        const { data } = await supabase.from('user_badges').select('badge_type').eq('user_id', userProfile.id);
        if (data) setUserBadges(data.map(b => b.badge_type));
      };
      fetchBadges();
      setEditingNickname(false);
    }
  }, [visible, userProfile?.id]);

  const salvaNickname = async () => {
    if (!tempNickname.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ nickname: tempNickname }).eq('id', user.id);
      setUserProfile((prev: any) => ({ ...prev, nickname: tempNickname }));
    }
    setEditingNickname(false);
  };

  const badgeDefinitions = [
    { id: 'badge_first_scan', icon: 'location-on', title: 'Battesimo', desc: 'Primo check-in effettuato', color: '#2ECC71' },
    { id: 'sentinella', icon: 'visibility', title: 'Sentinella', desc: 'Scoperte 3 aree verdi', color: '#4CAF50' },
    { id: 'esploratore', icon: 'explore', title: 'Esploratore Urbano', desc: 'Sbloccati 5 POI segreti', color: '#2196F3' },
    { id: 'attivo', icon: 'security', title: 'Cittadino Attivo', desc: 'Segnalato un problema civico', color: '#FF9800' },
    { id: 'eco', icon: 'eco', title: 'Anima Green', desc: 'Risparmiati 10kg di CO2', color: '#F44336' },
    { id: 'faro', icon: 'wb-incandescent', title: 'Guida Locale', desc: 'Completati 3 itinerari', color: '#FFEB3B' }
  ];

  // Calculate strict 1 to 5 rank based on level
  const computedLevel = levelInfo?.level || 1;
  const currentRank = Math.min(5, Math.floor(computedLevel / 10) + 1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* === SEZIONE 1: LA GERARCHIA (RANK) === */}
            <View style={styles.rankSection}>
              <View style={[styles.rankMedalContainer, { borderColor: levelInfo.color || '#D4AF37' }]}>
                <MaterialIcons name={levelInfo.stemma || 'stars'} size={50} color={levelInfo.color || '#D4AF37'} />
              </View>
              
              <View style={styles.nameRow}>
                {editingNickname ? (
                  <TextInput 
                    style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.accent }]} 
                    value={tempNickname} 
                    onChangeText={setTempNickname} 
                    autoFocus 
                    onSubmitEditing={salvaNickname} 
                  />
                ) : (
                  <Text style={[styles.nickname, { color: theme.text }]}>{userProfile?.nickname || 'ESPLORATORE'}</Text>
                )}
                <TouchableOpacity onPress={() => editingNickname ? salvaNickname() : setEditingNickname(true)} style={{ marginLeft: 10 }}>
                  <MaterialIcons name={editingNickname ? "check" : "edit"} size={20} color={theme.accent} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.rankTitle, { color: levelInfo.color || '#D4AF37' }]}>
                RANK {currentRank} • {levelInfo.title || 'Turista Curioso'}
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{userXp}</Text>
                  <Text style={styles.statLabel}>XP Totali</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{userTokens}</Text>
                  <Text style={styles.statLabel}>PTI LOTO</Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* === SEZIONE 2: GLI OBIETTIVI (BADGES) === */}
            <View style={styles.badgesSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>OBIETTIVI & MEDAGLIE D'ONORE</Text>
              <Text style={styles.sectionSubtitle}>Le tue imprese e il tuo impatto sul territorio.</Text>

              <View style={styles.badgesGrid}>
                {badgeDefinitions.map((b) => {
                  const isUnlocked = userBadges.includes(b.id);
                  return (
                    <View key={b.id} style={styles.badgeWrapper}>
                      <View style={[
                        styles.badgeCircle, 
                        { 
                          borderColor: isUnlocked ? b.color : 'rgba(150,150,150,0.3)',
                          backgroundColor: isUnlocked ? 'rgba(255,255,255,0.05)' : 'transparent',
                          opacity: isUnlocked ? 1 : 0.4
                        }
                      ]}>
                        <MaterialIcons name={b.icon as any} size={28} color={isUnlocked ? b.color : '#888'} />
                      </View>
                      <Text style={[styles.badgeTitle, { color: isUnlocked ? theme.text : '#888' }]}>{b.title}</Text>
                      <Text style={styles.badgeDesc} numberOfLines={2}>{b.desc}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%', height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, elevation: 20 },
  closeBtn: { alignSelf: 'flex-end', padding: 10, zIndex: 10 },
  
  rankSection: { alignItems: 'center', marginTop: 10 },
  rankMedalContainer: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nickname: { fontSize: 26, fontWeight: '900', fontFamily: 'serif', textTransform: 'uppercase' },
  nameInput: { fontSize: 26, fontWeight: 'bold', minWidth: 150, textAlign: 'center' },
  rankTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 30 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', fontFamily: 'serif' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase' },
  
  divider: { height: 1, width: '100%', marginVertical: 30, opacity: 0.5 },
  
  badgesSection: { paddingHorizontal: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  sectionSubtitle: { fontSize: 12, color: '#888', marginBottom: 25 },
  
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeWrapper: { width: '47%', alignItems: 'center', marginBottom: 25, padding: 10, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 15 },
  badgeCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  badgeTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  badgeDesc: { fontSize: 10, color: '#888', textAlign: 'center' }
});

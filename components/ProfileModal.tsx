import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';
import { getAvatarFrameStyle } from '../utils/levelUtils';
import QRCode from 'react-native-qrcode-svg';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  userXp: number;
  levelInfo: any;
  userTokens: number;
  theme: any;
  setUserProfile: (profile: any) => void;
}

export default function ProfileModal({ visible, onClose, userProfile, userXp, levelInfo, userTokens, theme, setUserProfile }: ProfileModalProps) {
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(userProfile?.nickname || 'ESPLORATORE');
  const [activeTab, setActiveTab] = useState<'identity' | 'squad'>('identity');

  React.useEffect(() => {
    if (visible && userProfile?.id) {
      setEditingNickname(false);
      setTempNickname(userProfile.nickname || 'ESPLORATORE');
      setActiveTab('identity');
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

  const computedLevel = levelInfo?.level || 1;
  const currentRank = Math.min(5, Math.floor(computedLevel / 10) + 1);
  const avatarStyle = getAvatarFrameStyle(computedLevel);

  // Generiamo un payload anonimo per la squadra
  const squadPayload = `loto-squad:${userProfile?.id || 'guest'}`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>L.O.T.O. HUB</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={[styles.tabBar, { borderColor: theme.border }]}>
            <TouchableOpacity style={[styles.tab, activeTab === 'identity' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('identity')}>
              <Text style={[styles.tabText, { color: activeTab === 'identity' ? theme.accent : theme.textMuted }]}>IDENTITÀ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'squad' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setActiveTab('squad')}>
              <Text style={[styles.tabText, { color: activeTab === 'squad' ? theme.accent : theme.textMuted }]}>CO-EXPERIENCE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* === TAB 1: IDENTITÀ (AVATAR EVOLUTIVO) === */}
            {activeTab === 'identity' && (
              <View style={styles.rankSection}>
                <View style={[styles.rankMedalContainer, { backgroundColor: theme.surface }, avatarStyle]}>
                  <MaterialIcons name={levelInfo.stemma || 'stars'} size={50} color={avatarStyle.borderColor || levelInfo.color || '#D4AF37'} />
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
                
                <Text style={[styles.rankTitle, { color: avatarStyle.borderColor || '#D4AF37' }]}>
                  RANK {currentRank}   {levelInfo.title || 'Turista Curioso'}
                </Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{userXp}</Text>
                    <Text style={styles.statLabel}>XP Totali</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{computedLevel}</Text>
                    <Text style={styles.statLabel}>Livello</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{userTokens}</Text>
                    <Text style={styles.statLabel}>PTI LOTO</Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: theme.textMuted }]}>
                  Il tuo Avatar evolve con te. Avanza di livello accumulando XP per sbloccare le cornici delle pietre preziose e dominare la gerarchia cittadina.
                </Text>
              </View>
            )}

            {/* === TAB 2: CO-EXPERIENCE (LOTO SQUAD) === */}
            {activeTab === 'squad' && (
              <View style={styles.squadSection}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={squadPayload}
                    size={200}
                    color="#1A3621"
                    backgroundColor="#F8FAF5"
                  />
                </View>
                <Text style={[styles.squadTitle, { color: theme.text }]}>Sincronia di Squadra</Text>
                <Text style={[styles.squadDesc, { color: theme.textMuted }]}>
                  Fai scansionare questo LOTO Pass temporaneo a un altro utente. Esplorando assieme e facendo check-in sugli stessi punti di interesse, guadagnerete entrambi il Bonus Sincronia (+10% XP).
                </Text>

                <TouchableOpacity style={[styles.scanBtn, { backgroundColor: theme.primary }]}>
                  <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.scanBtnText}>Scansiona un amico</Text>
                </TouchableOpacity>

                <View style={styles.privacyNote}>
                  <MaterialIcons name="shield" size={12} color={theme.textMuted} />
                  <Text style={[styles.privacyText, { color: theme.textMuted }]}>Zero PII: la sincronia è 100% anonima e dura 24 ore.</Text>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%', height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 0, elevation: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' },
  closeBtn: { padding: 5 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  
  rankSection: { alignItems: 'center', marginTop: 10, paddingHorizontal: 20 },
  rankMedalContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nickname: { fontSize: 26, fontWeight: '900', fontFamily: 'serif', textTransform: 'uppercase' },
  nameInput: { fontSize: 26, fontWeight: 'bold', minWidth: 150, textAlign: 'center' },
  rankTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 30, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', fontFamily: 'serif' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  
  description: { marginTop: 30, textAlign: 'center', fontSize: 13, lineHeight: 20 },

  // SQUAD SECTION
  squadSection: { alignItems: 'center', paddingHorizontal: 30, marginTop: 10 },
  qrWrapper: { padding: 15, backgroundColor: '#FFF', borderRadius: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 25, borderWidth: 1, borderColor: '#E0E0E0' },
  squadTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 10 },
  squadDesc: { textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 30 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, elevation: 3 },
  scanBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  privacyNote: { flexDirection: 'row', alignItems: 'center', marginTop: 25, opacity: 0.8 },
  privacyText: { fontSize: 11, marginLeft: 5 }
});

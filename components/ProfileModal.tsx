import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';

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

  React.useEffect(() => {
    if (visible && userProfile?.id) {
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
            
            {/* === SEZIONE UNICA: LA GERARCHIA (RANK) === */}
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
                RANK {currentRank}   {levelInfo.title || 'Turista Curioso'}
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

              <Text style={[styles.description, { color: theme.textMuted }]}>
                Questa è la tua Identità L.O.T.O Ufficiale. Avanza di livello accumulando XP sul campo per sbloccare i gradi successivi della gerarchia cittadina.
              </Text>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%', height: '70%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, elevation: 20 },
  closeBtn: { alignSelf: 'flex-end', padding: 10, zIndex: 10 },
  
  rankSection: { alignItems: 'center', marginTop: 10 },
  rankMedalContainer: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nickname: { fontSize: 26, fontWeight: '900', fontFamily: 'serif', textTransform: 'uppercase' },
  nameInput: { fontSize: 26, fontWeight: 'bold', minWidth: 150, textAlign: 'center' },
  rankTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 30, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', fontFamily: 'serif' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  
  description: { marginTop: 30, paddingHorizontal: 20, textAlign: 'center', fontSize: 13, lineHeight: 20 }
});

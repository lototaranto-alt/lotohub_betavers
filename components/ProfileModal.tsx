import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';
import { getAvatarFrameStyle, CO_EXPERIENCE_UNLOCK_LEVEL } from '../utils/levelUtils';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Alert } from 'react-native';

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
  const [tempNickname, setTempNickname] = useState(userProfile?.nickname || 'VIAGGIATORE');
  const [activeTab, setActiveTab] = useState<'identity' | 'squad'>('identity');
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  React.useEffect(() => {
    if (visible && userProfile?.id) {
      setEditingNickname(false);
      setTempNickname(userProfile.nickname || 'VIAGGIATORE');
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

  
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    if (data.startsWith('loto-squad:')) {
      const leaderId = data.replace('loto-squad:', '');
      try {
        const { error } = await supabase.rpc('join_squad', { p_leader_id: leaderId });
        if (error) throw error;
        Alert.alert("Sincronia Riuscita", "Sei entrato in modalità Co-Experience!");
      } catch (e: any) {
        Alert.alert("Errore Sincronia", e.message || "Impossibile unire la squadra.");
      }
    } else {
      Alert.alert("Errore", "QR Code non valido per L.O.T.O. Squad.");
    }
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
<TouchableOpacity style={[styles.tab, activeTab === 'squad' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => { if (computedLevel >= CO_EXPERIENCE_UNLOCK_LEVEL) setActiveTab('squad'); else alert(`Sblocca gli Eco-Passi al Livello ${CO_EXPERIENCE_UNLOCK_LEVEL}!`); }}>
              <Text style={[styles.tabText, { color: activeTab === 'squad' ? theme.accent : theme.textMuted }]}>{computedLevel >= CO_EXPERIENCE_UNLOCK_LEVEL ? 'CO-EXPERIENCE' : `??? (LV.${CO_EXPERIENCE_UNLOCK_LEVEL})`}</Text>
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
                    <Text style={[styles.nickname, { color: theme.text }]}>{userProfile?.nickname || 'VIAGGIATORE'}</Text>
                  )}
                  <TouchableOpacity onPress={() => editingNickname ? salvaNickname() : setEditingNickname(true)} style={{ marginLeft: 10 }}>
                    <MaterialIcons name={editingNickname ? "check" : "edit"} size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.rankTitle, { color: avatarStyle.borderColor || '#D4AF37' }]}>
                  RANK {currentRank}   {levelInfo.title || 'Turista Occasionale'}
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
                
                {computedLevel < CO_EXPERIENCE_UNLOCK_LEVEL ? (
                  <View style={{ alignItems: 'center', padding: 20, marginTop: 40 }}>
                    <MaterialIcons name="lock" size={60} color={theme.textMuted} />
                    <Text style={[styles.squadTitle, { color: theme.text, marginTop: 20 }]}>Sincronia Bloccata</Text>
                    <Text style={[styles.squadDesc, { color: theme.textMuted }]}>
                      La Co-Experience è un privilegio riservato ai Cittadini di L.O.T.O. Raggiungi il Livello {CO_EXPERIENCE_UNLOCK_LEVEL} per sbloccare la sincronizzazione di gruppo e moltiplicare i tuoi Punti.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.squadTitle, { color: theme.text }]}>Sincronia di Squadra</Text>

                <Text style={[styles.squadDesc, { color: theme.textMuted }]}>
                  Fai scansionare questo LOTO Pass temporaneo a un altro utente. Esplorando assieme e facendo check-in sugli stessi punti di interesse, guadagnerete entrambi il Bonus Sincronia (+10% XP).
                </Text>

                
                {!isScanning ? (
                  <TouchableOpacity 
                    style={[styles.scanBtn, { backgroundColor: theme.primary }]}
                    onPress={async () => {
                      if (!permission?.granted) await requestPermission();
                      setIsScanning(true);
                    }}
                  >
                    <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.scanBtnText}>Scansiona un amico</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 250, height: 250, borderRadius: 20, overflow: 'hidden', marginTop: 20 }}>
                    <CameraView
                      style={{ flex: 1 }}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                      onBarcodeScanned={handleBarCodeScanned}
                    />
                    <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 }} onPress={() => setIsScanning(false)}>
                      <MaterialIcons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}


                <View style={styles.privacyNote}>
                  <MaterialIcons name="shield" size={12} color={theme.textMuted} />
                  <Text style={[styles.privacyText, { color: theme.textMuted }]}>Zero PII: la sincronia è 100% anonima e dura 2 ore.</Text>
                </View>
                  </>
                )}
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

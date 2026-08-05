import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, FlatList, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import LotoPassBackupModal from './LotoPassBackupModal';
import LotoPassRecoveryScanner from './LotoPassRecoveryScanner';

const { width } = Dimensions.get('window');

interface ProfileModalProps {
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

export default function ProfileModal({ visible, onClose, userProfile, userXp, levelInfo, userItineraries, userTransactions, userTokens, theme, t, setUserProfile, onDeleteItinerary }: ProfileModalProps) {
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useState<'badges' | 'itineraries'>('badges');
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(userProfile?.nickname || 'ESPLORATORE');
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  React.useEffect(() => {
    if (visible && userProfile?.id) {
      const fetchBadges = async () => {
        const { data } = await supabase.from('user_badges').select('badge_type').eq('user_id', userProfile.id);
        if (data) setUserBadges(data.map(b => b.badge_type));
      };
      fetchBadges();
      // Resetta gli stati del diario all'apertura per un'esperienza ordinata
      setExpandedCard(null);
      setActiveProfileSection('badges');
      setEditingNickname(false);
    }
  }, [visible, userProfile?.id]);

  const salvaNickname = async () => {
    if (!tempNickname.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ nickname: tempNickname }).eq('id', user.id);
      setUserProfile({ ...userProfile, nickname: tempNickname });
    }
    setEditingNickname(false);
  };

  const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
    expCardBoutique: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
      padding: 20,
    },
    badgeMedalContainer: {
      width: 90, height: 90, borderRadius: 45, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background
    },
    expNameBoutique: { fontSize: 24, fontWeight: '900', color: theme.text, marginTop: 15, fontFamily: 'serif' },
    expTitleBoutique: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    mStatValBoutique: { fontWeight: '900', fontFamily: 'serif' },
    mStatLab: { color: theme.textMuted, fontWeight: '600', marginTop: 5 },
    closeExpModal: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 20, elevation: 5 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15 },
    badgeSticker: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.background, margin: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    tabHeaderContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 10 },
    tabHeaderBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  });

  const badgeDefinitions = [
    { id: 'sentinella', icon: 'visibility', title: 'Osservatore Civico', track: 'Impegno', color: '#4CAF50' },
    { id: 'esploratore', icon: 'explore', title: 'Esploratore Urbano', track: 'Impegno', color: '#2196F3' },
    { id: 'attivo', icon: 'security', title: 'Cittadino Attivo', track: 'Impegno', color: '#FF9800' },
    { id: 'faro', icon: 'wb-incandescent', title: 'Guida Locale', track: 'Impegno', color: '#FFEB3B' },
    { id: 'custode', icon: 'account-balance', title: 'Custode della Città', track: 'Impegno', color: '#9C27B0' },
    { id: 'eco', icon: 'record-voice-over', title: 'Voce Risonante', track: 'Impatto', color: '#F44336' },
    { id: 'forgiatore', icon: 'handyman', title: 'Risolutore', track: 'Impatto', color: '#795548' },
    { id: 'eroe', icon: 'military-tech', title: 'Artefice del Cambiamento', track: 'Impatto', color: '#FFD700' }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={{ height: expandedCard ? 500 : 400, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.8} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: width * 0.1, alignItems: 'center' }}>
            
            {/* CARD 1: ID Card (Solo Identità e Livello) */}
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => setExpandedCard(expandedCard === 'profile' ? null : 'profile')}
              style={[styles.expCardBoutique, { width: width * 0.75, marginHorizontal: width * 0.025, justifyContent: expandedCard === 'profile' ? 'flex-start' : 'center', paddingVertical: expandedCard === 'profile' ? 20 : 35, height: expandedCard === 'profile' ? 320 : 310 }]}
            >
              {expandedCard !== 'profile' && (
                <View style={{ position: 'absolute', top: 20, right: 20 }}>
                  <TouchableOpacity onPress={() => { setTempNickname(userProfile?.nickname || 'ESPLORATORE'); setEditingNickname(!editingNickname); }} style={{ padding: 5 }}>
                    <MaterialIcons name={editingNickname ? "check" : "edit"} size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={[styles.badgeMedalContainer, { width: expandedCard === 'profile' ? 90 : 70, height: expandedCard === 'profile' ? 90 : 70, borderRadius: expandedCard === 'profile' ? 45 : 35, borderColor: levelInfo.color, marginBottom: expandedCard === 'profile' ? 10 : 0 }]}>
                <MaterialIcons name={levelInfo.stemma} size={expandedCard === 'profile' ? 40 : 34} color={levelInfo.color} />
              </View>
              
              <View style={{ alignItems: 'center', width: '100%' }}>
                {editingNickname ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput style={{ borderBottomWidth: 1, borderBottomColor: theme.accent, fontSize: 24, fontWeight: 'bold', color: theme.text, textAlign: 'center', minWidth: 150 }} value={tempNickname} onChangeText={setTempNickname} autoFocus onSubmitEditing={salvaNickname} />
                  </View>
                ) : (
                  <Text style={[styles.expNameBoutique, expandedCard === 'profile' && { fontSize: 20 }]}>{userProfile?.nickname || 'ESPLORATORE'}</Text>
                )}
                <Text style={[styles.expTitleBoutique, { color: levelInfo.color, marginBottom: 0, fontSize: expandedCard === 'profile' ? 14 : 16 }]}>{levelInfo.title} ({userXp} XP)</Text>
              </View>
              
              {expandedCard !== 'profile' && (
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 5, marginTop: 15 }}>Continua a esplorare per salire di livello.</Text>
              )}

              {expandedCard === 'profile' && (
                <View style={{ marginTop: 25, width: '100%', paddingHorizontal: 15 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textMuted, marginBottom: 10, textTransform: 'uppercase' }}>Sicurezza Account Anonimo</Text>
                  
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
                    onPress={() => setShowBackupModal(true)}
                  >
                    <MaterialIcons name="qr-code" size={20} color={theme.text} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>Salva LOTO Pass</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>Crea il QR Code di backup</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
                    onPress={() => setShowRecoveryModal(true)}
                  >
                    <MaterialIcons name="restore" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>Recupera Profilo</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>Inquadra un QR salvato</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            {/* LE CARD CO2 E PTI SONO STATE RIMOSSE (ora gestite in Home) */}
            {/* CARD 2: MAPPA LOCALE (Stile Boutique con POI divisi) */}
            <View 
              style={[styles.expCardBoutique, { width: width * 0.75, marginHorizontal: width * 0.025, paddingVertical: 25, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }]}
            >
               <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(214, 115, 78, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
                 <MaterialIcons name="map" size={36} color="#D6734E" />
               </View>
               <Text style={[styles.mStatValBoutique, { color: theme.text, fontSize: 24 }]}>Mappa Locale</Text>
               <Text style={[styles.mStatLab, { color: theme.textMuted, marginBottom: 20 }]}>Esplora il territorio</Text>
               
               {/* Griglia P.O.I. Divisi */}
               <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, width: '100%', marginBottom: 20 }}>
                 <View style={{ alignItems: 'center' }}>
                   <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2ECC71' }}>12</Text>
                   <Text style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase' }}>Natura</Text>
                 </View>
                 <View style={{ alignItems: 'center' }}>
                   <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3498DB' }}>8</Text>
                   <Text style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase' }}>Cultura</Text>
                 </View>
                 <View style={{ alignItems: 'center' }}>
                   <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E67E22' }}>5</Text>
                   <Text style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase' }}>Partner</Text>
                 </View>
                 <View style={{ alignItems: 'center' }}>
                   <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#9B59B6' }}>3</Text>
                   <Text style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase' }}>Segreti</Text>
                 </View>
               </View>
               
               <TouchableOpacity 
                 style={{ backgroundColor: '#D6734E', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 2 }}
                 onPress={() => {
                   onClose();
                   router.push('/map');
                 }}
               >
                 <MaterialIcons name="explore" size={16} color="#FFF" style={{ marginRight: 6 }} />
                 <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>APRI MAPPA</Text>
               </TouchableOpacity>
            </View>

          </ScrollView>
          
          <TouchableOpacity style={styles.closeExpModal} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {showBackupModal && (
        <LotoPassBackupModal visible={showBackupModal} onClose={() => setShowBackupModal(false)} userUuid={userProfile?.id} theme={theme} />
      )}
      
      {showRecoveryModal && (
        <LotoPassRecoveryScanner visible={showRecoveryModal} onClose={() => setShowRecoveryModal(false)} theme={theme} />
      )}
    </Modal>
  );
}

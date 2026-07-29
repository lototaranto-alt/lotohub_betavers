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
  const [tempNickname, setTempNickname] = useState(userProfile?.nickname || '');
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
              {!userProfile?.nickname && expandedCard !== 'profile' && (
                <View style={{ position: 'absolute', top: 20, right: 20 }}>
                  <TouchableOpacity onPress={() => { setTempNickname(userProfile?.nickname || ''); setEditingNickname(!editingNickname); }} style={{ padding: 5 }}>
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
                  <Text style={[styles.expNameBoutique, expandedCard === 'profile' && { fontSize: 20 }]}>{userProfile?.nickname || (userProfile?.email ? 'Inserisci Nome' : 'Utente Anonimo')}</Text>
                )}
                <Text style={[styles.expTitleBoutique, { color: levelInfo.color, marginBottom: 0, fontSize: expandedCard === 'profile' ? 14 : 16 }]}>{levelInfo.title} ({userXp} XP)</Text>
              </View>
              
              {expandedCard !== 'profile' && (
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 5, marginTop: 15 }}>Continua a esplorare per salire di livello.</Text>
              )}
            </TouchableOpacity>

            {/* CARD 2: CO2 Counter */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setExpandedCard(expandedCard === 'co2' ? null : 'co2')}
              style={[styles.expCardBoutique, { width: width * 0.75, marginHorizontal: width * 0.025, justifyContent: expandedCard === 'co2' ? 'flex-start' : 'center', height: expandedCard === 'co2' ? 450 : 310 }]}
            >
               <MaterialIcons name="eco" size={expandedCard === 'co2' ? 40 : 60} color={theme.primary} style={{marginBottom: expandedCard === 'co2' ? 10 : 20}} />
               <Text style={[styles.mStatValBoutique, { fontSize: expandedCard === 'co2' ? 24 : 32, color: theme.primary }]}>{userProfile?.total_co2?.toFixed(2) ?? '0.00'} kg</Text>
               <Text style={[styles.mStatLab, { fontSize: 14 }]}>CO₂ Risparmiata</Text>
               
               {expandedCard === 'co2' && (
                 <View style={{ flex: 1, width: '100%', marginTop: 20 }}>
                   <Text style={{fontSize:12, fontWeight:'bold', color: theme.text, marginBottom:10, alignSelf:'flex-start'}}>CRONOLOGIA IMPATTO</Text>
                   {userTransactions.filter(tx => tx.co2_saved > 0).length === 0 ? (
                     <Text style={{fontSize:12, color: theme.textMuted, textAlign:'center', marginTop:20}}>Nessuna attività registrata.</Text>
                   ) : (
                     <FlatList
                       data={userTransactions.filter(tx => tx.co2_saved > 0)}
                       keyExtractor={item => item.id}
                       showsVerticalScrollIndicator={false}
                       renderItem={({item}) => (
                         <View style={{flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor: theme.border, paddingVertical:10}}>
                           <View>
                             <Text style={{fontSize:12, fontWeight:'bold', color: theme.text}}>{item.action_type || 'Attività Eco'}</Text>
                             <Text style={{fontSize:10, color: theme.textMuted}}>{new Date(item.created_at).toLocaleDateString()}</Text>
                           </View>
                           <Text style={{fontSize:14, fontWeight:'bold', color: theme.primary}}>+{item.co2_saved.toFixed(1)} kg</Text>
                         </View>
                       )}
                     />
                   )}
                 </View>
               )}
            </TouchableOpacity>

            {/* CARD 3: PTI Counter */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setExpandedCard(expandedCard === 'pts' ? null : 'pts')}
              style={[styles.expCardBoutique, { width: width * 0.75, marginHorizontal: width * 0.025, justifyContent: expandedCard === 'pts' ? 'flex-start' : 'center', height: expandedCard === 'pts' ? 450 : 310 }]}
            >
               <MaterialIcons name="toll" size={expandedCard === 'pts' ? 40 : 60} color={theme.accent} style={{marginBottom: expandedCard === 'pts' ? 10 : 20}} />
               <Text style={[styles.mStatValBoutique, { fontSize: expandedCard === 'pts' ? 24 : 32, color: theme.accent }]}>{userTokens} PTI</Text>
               <Text style={[styles.mStatLab, { fontSize: 14 }]}>LOTO Tokens</Text>

               {expandedCard === 'pts' && (
                 <View style={{ flex: 1, width: '100%', marginTop: 20 }}>
                   <Text style={{fontSize:12, fontWeight:'bold', color: theme.text, marginBottom:10, alignSelf:'flex-start'}}>CRONOLOGIA GUADAGNI</Text>
                   {userTransactions.filter(tx => tx.tokens_earned > 0).length === 0 ? (
                     <Text style={{fontSize:12, color: theme.textMuted, textAlign:'center', marginTop:20}}>Nessun LOTO PTI accumulato.</Text>
                   ) : (
                     <FlatList
                       data={userTransactions.filter(tx => tx.tokens_earned > 0)}
                       keyExtractor={item => item.id}
                       showsVerticalScrollIndicator={false}
                       renderItem={({item}) => (
                         <View style={{flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor: theme.border, paddingVertical:10}}>
                           <View>
                             <Text style={{fontSize:12, fontWeight:'bold', color: theme.text}}>{item.action_type || 'Bonus LOTO'}</Text>
                             <Text style={{fontSize:10, color: theme.textMuted}}>{new Date(item.created_at).toLocaleDateString()}</Text>
                           </View>
                           <Text style={{fontSize:14, fontWeight:'bold', color: theme.accent}}>+{item.tokens_earned} PTI</Text>
                         </View>
                       )}
                     />
                   )}
                 </View>
               )}
            </TouchableOpacity>



          </ScrollView>
          
          <TouchableOpacity style={styles.closeExpModal} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

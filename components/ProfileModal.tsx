import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, FlatList, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  userXp: number;
  levelInfo: any;
  userItineraries: any[];
  userTransactions: any[];
  theme: any;
  t: any;
  setUserProfile: (profile: any) => void;
}

export default function ProfileModal({ visible, onClose, userProfile, userXp, levelInfo, userItineraries, userTransactions, theme, t, setUserProfile }: ProfileModalProps) {
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(userProfile?.nickname || '');

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
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={{ height: expandedCard ? 500 : 400, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.8} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: width * 0.1, alignItems: 'center' }}>
            
            {/* CARD 1: Badge Profilo & I Miei Itinerari */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setExpandedCard(expandedCard === 'profile' ? null : 'profile')}
              style={[styles.expCardBoutique, { width: width * 0.75, marginHorizontal: width * 0.025, justifyContent: expandedCard === 'profile' ? 'flex-start' : 'center', paddingVertical: expandedCard === 'profile' ? 20 : 35, height: expandedCard === 'profile' ? 450 : 310 }]}
            >
              {!userProfile?.nickname && expandedCard !== 'profile' && (
                <View style={{ position: 'absolute', top: 20, right: 20 }}>
                  <TouchableOpacity onPress={() => { setTempNickname(userProfile?.nickname || ''); setEditingNickname(!editingNickname); }} style={{ padding: 5 }}>
                    <MaterialIcons name={editingNickname ? "check" : "edit"} size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.badgeMedalContainer, { borderColor: levelInfo.color, marginBottom: expandedCard === 'profile' ? 10 : 0 }]}>
                <MaterialIcons name={levelInfo.stemma} size={expandedCard === 'profile' ? 40 : 54} color={levelInfo.color} />
              </View>
              <View style={{ alignItems: 'center', width: '100%' }}>
                {editingNickname ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={{ borderBottomWidth: 1, borderBottomColor: theme.accent, fontSize: 24, fontWeight: 'bold', color: theme.text, textAlign: 'center', minWidth: 150 }}
                      value={tempNickname}
                      onChangeText={setTempNickname}
                      autoFocus
                      onSubmitEditing={salvaNickname}
                    />
                  </View>
                ) : (
                  <Text style={[styles.expNameBoutique, expandedCard === 'profile' && { fontSize: 20 }]}>{userProfile?.nickname || t.guest}</Text>
                )}
                <Text style={[styles.expTitleBoutique, { color: levelInfo.color, marginBottom: 0, fontSize: expandedCard === 'profile' ? 14 : 16 }]}>{levelInfo.title} ({userXp} XP)</Text>
              </View>
              
              {expandedCard !== 'profile' && (
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 5, marginTop: 15 }}>Continua a esplorare per salire di livello.</Text>
              )}

              {expandedCard === 'profile' && (
                <View style={{ flex: 1, width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 15 }}>
                  <Text style={{fontSize:12, fontWeight:'bold', color: theme.text, marginBottom:10, alignSelf:'flex-start'}}>I MIEI ITINERARI</Text>
                  {userItineraries.length === 0 ? (
                    <Text style={{fontSize:12, color: theme.textMuted, textAlign:'center', marginTop:20}}>Nessun itinerario salvato. Creane uno per riempire questa sezione!</Text>
                  ) : (
                    <FlatList
                      data={userItineraries}
                      keyExtractor={item => item.id}
                      showsVerticalScrollIndicator={false}
                      renderItem={({item}) => (
                        <View style={{borderBottomWidth:1, borderBottomColor: theme.border, paddingVertical:12}}>
                          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <View style={{ flex: 1 }}>
                              <Text style={{fontSize:14, fontWeight:'bold', color: theme.text}} numberOfLines={1}>{item.title}</Text>
                              <View style={{flexDirection:'row', marginTop: 4}}>
                                <Text style={{fontSize:11, color: theme.accent, fontWeight: 'bold'}}>{item.potential_xp} PTI potenziali</Text>
                                <Text style={{fontSize:11, color: theme.textMuted, marginLeft: 10}}>{new Date(item.created_at).toLocaleDateString()}</Text>
                              </View>
                            </View>
                            <TouchableOpacity 
                              style={{ backgroundColor: theme.text, padding: 8, borderRadius: 12, marginLeft: 10 }}
                              onPress={() => {
                                 Alert.alert('Condividi Itinerario', `Condivisione di "${item.title}" in arrivo!`);
                              }}
                            >
                              <MaterialIcons name="share" size={16} color={theme.background} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    />
                  )}
                  
                  <TouchableOpacity
                    style={{ backgroundColor: theme.text, padding: 12, borderRadius: 12, marginTop: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                    onPress={() => { onClose(); router.push('/upgrade'); }}
                  >
                    <MaterialIcons name="workspace-premium" size={20} color={theme.accent} style={{ marginRight: 8 }} />
                    <Text style={{ color: theme.background, fontWeight: 'bold' }}>Gestisci Piano LOTO</Text>
                  </TouchableOpacity>
                </View>
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
               <Text style={[styles.mStatValBoutique, { fontSize: expandedCard === 'pts' ? 24 : 32, color: theme.accent }]}>{userProfile?.total_tokens ?? 0} PTI</Text>
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

            {/* CARD 4: Crea Percorso */}
            <View style={[styles.expCardBoutique, { width: width * 0.75, marginHorizontal: width * 0.025, paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }]}>
              <Image source={require('../assets/images/route_creation_flat.png')} style={{ width: '100%', height: 140 }} resizeMode="cover" />
              <View style={{ flex: 1, padding: 20, justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.mStatValBoutique, { fontSize: 22, color: theme.text, textAlign: 'center', marginBottom: 6 }]}>Crea Percorso</Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 5 }}>Disegna itinerari personali, scegli mobilità ecologiche e condividili sui social per guadagnare punti.</Text>
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: theme.secondary, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 25, flexDirection: 'row', alignItems: 'center', marginTop: 10, elevation: 2 }}
                  onPress={() => {
                    onClose();
                    router.push('/route-creation-mockup');
                  }}
                >
                  <MaterialIcons name="add-circle-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>INIZIA ORA</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
          
          <TouchableOpacity style={styles.closeExpModal} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, Alert, Linking, Dimensions, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { LruCacheManager } from '../utils/LruCacheManager';
import { OfflineQueueManager } from '../utils/OfflineQueueManager';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
  CREMA: '#FDF8F2',
};

const { height } = Dimensions.get('window');

type PoiDetailSheetProps = {
  visible: boolean;
  poi: any | null;
  onClose: () => void;
  onBook: (poi: any, partySize: number) => void;
  onValidate: (poi: any) => void;
  isBooked: boolean;
  initialPartySize: number;
};

export default function PoiDetailSheet({ visible, poi, onClose, onBook, onValidate, isBooked, initialPartySize }: PoiDetailSheetProps) {
  const router = useRouter();
  const { theme, isElite } = useTheme();
  
  const [partySize, setPartySize] = useState(initialPartySize || 1);
  const [mobilityMode, setMobilityMode] = useState<'mezzo_proprio' | 'loto_mobility' | null>(null);
  
  // Stati per la gestione del Vault Multimediale
  const [vaultMedia, setVaultMedia] = useState<any[]>([]);
  const [mediaStatus, setMediaStatus] = useState<{[key: string]: 'locked' | 'downloading' | 'ready' | 'queued'}>({});
  const [premiumMockVisible, setPremiumMockVisible] = useState(false);

  useEffect(() => {
    if (visible && poi) {
      caricaMediaVault();
    }
  }, [visible, poi]);

  const caricaMediaVault = async () => {
    try {
      console.log('[PoiDetailSheet] Caricamento media vault per POI:', poi.name);
      
      // Query su Supabase per estrarre i media del POI
      const { data, error } = await supabase
        .from('media_vault')
        .select('*')
        .eq('poi_id', poi.id);

      if (error) {
        console.log('[PoiDetailSheet] Errore lettura media_vault:', error.message);
        return;
      }

      if (data) {
        // --- MOCK INJECTION BINDING ---
        let finalData = [...data];
        if (poi.media && poi.media.length > 0) {
          const mockMediaIds = poi.media.map((m: any) => m.id);
          finalData = finalData.filter((d: any) => !mockMediaIds.includes(d.id));
          finalData = [...finalData, ...poi.media];
        }
        
        setVaultMedia(finalData);
        
        const statusMap: {[key: string]: 'locked' | 'downloading' | 'ready' | 'queued'} = {};
        const { data: { user } } = await supabase.auth.getUser();

        // Storico degli sblocchi dell'utente
        const { data: unlockedData } = user ? await supabase
          .from('user_unlocked_media')
          .select('media_id')
          .eq('profile_id', user.id) : { data: null };

        const unlockedIds = unlockedData ? unlockedData.map((u: any) => u.media_id) : [];

        // Coda offline
        const offlineQueue = await OfflineQueueManager.getQueue();
        const queuedIds = offlineQueue.map(item => item.mediaId);

        for (const media of finalData) {
          const fileName = media.media_path?.split('/').pop() || `${media.id}.mp4`;
          const exists = await LruCacheManager.fileExists(fileName);
          
          if (exists) {
            statusMap[media.id] = 'ready';
          } else if (queuedIds.includes(media.id)) {
            statusMap[media.id] = 'queued';
          } else if (unlockedIds.includes(media.id)) {
            // Già sbloccato su server, ma non scaricato localmente (es. dopo reinstallazione)
            statusMap[media.id] = 'locked';
            const netState = await NetInfo.fetch();
            if (netState.isConnected) {
              // Avvia download automatico
              handleDownloadMedia(media);
            }
          } else {
            statusMap[media.id] = 'locked';
          }
        }
        setMediaStatus(statusMap);
      }
    } catch (e) {
      console.error('[PoiDetailSheet] Errore in caricaMediaVault:', e);
    }
  };

  const handleDownloadMedia = async (media: any) => {
    try {
      setMediaStatus(prev => ({ ...prev, [media.id]: 'downloading' }));
      
      const { data: signedData, error } = await supabase
        .storage
        .from('loto-vault')
        .createSignedUrl(media.media_path, 900);

      if (error || !signedData?.signedUrl) {
        console.error('[PoiDetailSheet] Errore signed URL:', error?.message);
        setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
        return;
      }

      const fileName = media.media_path.split('/').pop() || `${media.id}.mp4`;
      const localPath = await LruCacheManager.downloadFile(signedData.signedUrl, fileName);

      if (localPath) {
        setMediaStatus(prev => ({ ...prev, [media.id]: 'ready' }));
      } else {
        setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
      }
    } catch (err) {
      console.error('[PoiDetailSheet] Errore download background:', err);
      setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
    }
  };

  const handleUnlockMedia = async (media: any) => {
    const netState = await NetInfo.fetch();

    if (!netState.isConnected) {
      Alert.alert(
        "Modalità Offline",
        `Non hai connessione internet. Vuoi prenotare lo sblocco di "${media.title}" per ${media.loto_cost} LOTO PTI? I contenuti si scaricheranno appena ritrovi la rete.`,
        [
          { text: "Annulla", style: "cancel" },
          { 
            text: "Prenota", 
            onPress: async () => {
              await OfflineQueueManager.enqueueUnlock(media.id, media.loto_cost, poi.name);
              setMediaStatus(prev => ({ ...prev, [media.id]: 'queued' }));
              Alert.alert("Sblocco Prenotato", "Sblocco registrato in locale. Il file si scaricherà in background quando tornerai online.");
            }
          }
        ]
      );
      return;
    }

    try {
      if (media.id === 'm3') {
        setMediaStatus(prev => ({ ...prev, [media.id]: 'downloading' }));
        setTimeout(() => {
          setMediaStatus(prev => ({ ...prev, [media.id]: 'ready' }));
          Alert.alert("Successo!", `Hai decifrato il tag NFC e ottenuto l'accesso all'Archivio!`);
        }, 1500);
        return;
      }

      setMediaStatus(prev => ({ ...prev, [media.id]: 'downloading' }));
      const { data, error } = await supabase.rpc('sblocca_media', {
        p_media_id: media.id
      });

      if (error) {
        Alert.alert("Errore", error.message);
        setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
        return;
      }

      const res = data as any;
      const success = res[0]?.unlocked;
      const mediaPath = res[0]?.media_path;
      const msg = res[0]?.message;

      if (success) {
        const { data: signedData, error: storageError } = await supabase
          .storage
          .from('loto-vault')
          .createSignedUrl(mediaPath, 900);

        if (storageError || !signedData?.signedUrl) {
          Alert.alert("Errore", "Impossibile caricare il file multimediale dal server.");
          setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
          return;
        }

        const fileName = mediaPath.split('/').pop() || `${media.id}.mp4`;
        const localPath = await LruCacheManager.downloadFile(signedData.signedUrl, fileName);

        if (localPath) {
          setMediaStatus(prev => ({ ...prev, [media.id]: 'ready' }));
          Alert.alert("Successo!", `"${media.title}" è stato sbloccato e scaricato localmente per l'ascolto offline.`);
        } else {
          setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
          Alert.alert("Errore", "Salvataggio locale fallito.");
        }
      } else {
        Alert.alert("Sblocco Fallito", msg || "Saldo LOTO PTI insufficiente.");
        setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
      }

    } catch (e) {
      console.error('[PoiDetailSheet] Errore sblocco:', e);
      setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
    }
  };

  const handlePlayMedia = async (media: any) => {
    if (media.id === 'm3') {
      setPremiumMockVisible(true);
      return;
    }

    const fileName = media.media_path?.split('/').pop() || `${media.id}.mp4`;
    const localPath = LruCacheManager.getLocalPath(fileName);
    
    // Aggiorna l'ultimo accesso per la cache LRU
    await LruCacheManager.touchFile(fileName);

    Alert.alert(
      "Riproduzione Sandboxed",
      `In riproduzione locale protetta:\n"${media.title}"\n\nPercorso locale:\n${localPath}`,
      [{ text: "Ok" }]
    );
  };

  if (!poi) return null;

  const isZTL = poi.name.toLowerCase().includes('castel') || poi.name.toLowerCase().includes('duomo');
  const hasParkingSuggestion = !!poi.recommended_parking_id;

  const handleNavigate = (type: 'driving' | 'walking' | 'transit' | 'bicycling', isParking: boolean = false) => {
    // Coordinate fittizie per il parcheggio se isParking è vero, altrimenti coordinate del POI
    const destLat = isParking ? 40.4720 : poi.latitude;
    const destLng = isParking ? 17.2285 : poi.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${type}`;
    Linking.openURL(url).catch(err => console.error("Impossibile aprire le mappe", err));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.dragHandle} />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. Header Image */}
            <View style={styles.imageContainer}>
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.primary }]}>
                <MaterialIcons name={poi.category === 'partner' ? "store" : "account-balance"} size={48} color={theme.background} />
              </View>
              <View style={styles.closeBtn}>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Header Info */}
            <View style={[styles.infoSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.text }]}>{poi.name}</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>{poi.category === 'free' ? 'Accesso Libero' : (poi.category === 'partner' ? 'B2B Partner' : 'Storia Segreta')}</Text>
              
              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: theme.border }]}>
                  <Text style={[styles.badgeText, { color: theme.text }]}>+{poi.xp_reward || 15} XP</Text>
                </View>
                {poi.has_water && (
                  <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.badgeText, { color: '#0284C7' }]}>Refill Idrico</Text>
                  </View>
                )}
              </View>
            </View>

            {/* SEZIONE VAULT MULTIMEDIALE (TEASE & REVEAL) */}
            {vaultMedia.length > 0 && (
              <View style={[styles.vaultSection, { borderBottomColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🎒 RISORSE ESCLUSIVE</Text>
                {vaultMedia.map(media => {
                  const status = mediaStatus[media.id] || 'locked';
                  return (
                    <View key={media.id} style={[styles.mediaRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <View style={styles.mediaInfo}>
                        <MaterialIcons 
                          name={media.media_type === 'audio' ? "audiotrack" : (media.media_type === 'digital_file' ? "description" : "videocam")} 
                          size={24} 
                          color={theme.primary} 
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.mediaTitle, { color: theme.text }]}>{media.title}</Text>
                          <Text style={[styles.mediaTypeLabel, { color: theme.textMuted }]}>
                            {media.media_type.toUpperCase()} • {media.loto_cost} LOTO PTI
                          </Text>
                        </View>
                      </View>
                      
                        {media.is_premium && !isElite ? (
                          <TouchableOpacity 
                            style={[styles.vaultBtn, { backgroundColor: theme.text }]}
                            onPress={() => { onClose(); router.push('/upgrade'); }}
                          >
                            <MaterialIcons name="workspace-premium" size={16} color={theme.accent} style={{ marginRight: 4 }} />
                            <Text style={[styles.vaultBtnText, { color: theme.accent }]}>Esclusiva Premium</Text>
                          </TouchableOpacity>
                        ) : status === 'ready' ? (
                          <TouchableOpacity 
                            style={[styles.vaultBtn, { backgroundColor: theme.primary }]}
                            onPress={() => handlePlayMedia(media)}
                          >
                            <MaterialIcons name={media.media_type === 'digital_file' ? "folder-open" : "play-arrow"} size={20} color={theme.background} style={{ marginRight: 4 }} />
                            <Text style={[styles.vaultBtnText, { color: theme.background }]}>{media.media_type === 'digital_file' ? 'Apri' : 'Ascolta'}</Text>
                          </TouchableOpacity>
                        ) : status === 'downloading' ? (
                          <View style={[styles.vaultBtnDisabled, { borderColor: theme.border }]}>
                            <ActivityIndicator size="small" color={theme.primary} />
                          </View>
                        ) : status === 'queued' ? (
                          <View style={[styles.vaultBtnDisabled, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                            <MaterialIcons name="schedule" size={16} color="#D97706" style={{ marginRight: 4 }} />
                            <Text style={[styles.vaultBtnTextDisabled, { color: '#D97706', fontSize: 11 }]}>In coda</Text>
                          </View>
                        ) : media.is_premium && isElite ? (
                          <TouchableOpacity 
                            style={[styles.vaultBtn, { backgroundColor: theme.accent }]}
                            onPress={() => handleUnlockMedia(media)}
                          >
                            <MaterialIcons name="nfc" size={16} color={theme.background} style={{ marginRight: 4 }} />
                            <Text style={[styles.vaultBtnText, { color: theme.background }]}>Sblocca con NFC</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            style={[styles.vaultBtn, { backgroundColor: theme.primary }]}
                            onPress={() => handleUnlockMedia(media)}
                          >
                            <MaterialIcons name="lock-open" size={16} color={theme.background} style={{ marginRight: 4 }} />
                            <Text style={[styles.vaultBtnText, { color: theme.background }]}>Sblocca ({media.loto_cost} PTI)</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* EVENTI PARTNER */}
            {poi.events && poi.events.length > 0 && (
              <View style={[styles.vaultSection, { borderBottomColor: theme.border, marginTop: 15 }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>📅 PROSSIMI EVENTI</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {poi.events.map((ev: any) => (
                    <View key={ev.id} style={{ backgroundColor: theme.background, padding: 15, borderRadius: 15, marginRight: 15, width: 200, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 14, color: theme.text }}>{ev.title}</Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 5 }}>{new Date(ev.date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                      <TouchableOpacity 
                        style={{ marginTop: 10, backgroundColor: ev.is_premium ? theme.accent : theme.primary, paddingVertical: 8, borderRadius: 10, alignItems: 'center' }}
                        onPress={() => ev.is_premium && !isElite ? router.push('/upgrade') : Alert.alert('Iscritto!', 'Sei in lista per questo evento.')}
                      >
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Partecipa {ev.is_premium ? '🌟' : ''}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 3. IL BIVIO DECISIONALE & IL PATTO */}
            <View style={styles.actionSection}>
              
              {isBooked ? (
                // STATO: PRENOTATO
                <View style={[styles.bookedContainer, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
                  <MaterialIcons name="check-circle" size={48} color={theme.primary} style={{ alignSelf: 'center', marginBottom: 10 }} />
                  <Text style={[styles.bookedTitle, { color: theme.text }]}>Prenotazione Attiva</Text>
                  <Text style={[styles.bookedSub, { color: theme.textMuted }]}>Hai riservato i tuoi posti. Raggiungi il luogo per sbloccare i punti.</Text>
                  
                  <TouchableOpacity style={[styles.mainBtn, { backgroundColor: theme.primary }]} onPress={() => onValidate(poi)}>
                    <Text style={[styles.mainBtnText, { color: theme.background }]}>Convalida Arrivo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // STATO: DA PRENOTARE
                <>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Conferma Ospiti</Text>
                  <View style={[styles.partySelector, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
                    <TouchableOpacity style={[styles.partyBtn, { backgroundColor: theme.surface }]} onPress={() => setPartySize(Math.max(1, partySize - 1))}>
                      <MaterialIcons name="remove" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.partyText, { color: theme.text }]}>{partySize} {partySize > 1 ? 'Persone' : 'Persona'}</Text>
                    <TouchableOpacity style={[styles.partyBtn, { backgroundColor: theme.surface }]} onPress={() => setPartySize(partySize + 1)}>
                      <MaterialIcons name="add" size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Come raggiungerai la destinazione?</Text>
                  <View style={styles.bivioContainer}>
                    <TouchableOpacity 
                      style={[styles.bivioBtn, { backgroundColor: mobilityMode === 'mezzo_proprio' ? theme.primary : theme.background, borderColor: theme.border, borderWidth: 1 }]}
                      onPress={() => setMobilityMode('mezzo_proprio')}
                    >
                      <MaterialIcons name="directions-car" size={24} color={mobilityMode === 'mezzo_proprio' ? theme.background : theme.textMuted} />
                      <Text style={[styles.bivioText, { color: mobilityMode === 'mezzo_proprio' ? theme.background : theme.textMuted }]}>Mezzo Proprio</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.bivioBtn, { backgroundColor: mobilityMode === 'loto_mobility' ? theme.primary : theme.background, borderColor: theme.border, borderWidth: 1 }]}
                      onPress={() => setMobilityMode('loto_mobility')}
                    >
                      <MaterialIcons name="directions-walk" size={24} color={mobilityMode === 'loto_mobility' ? theme.background : theme.textMuted} />
                      <Text style={[styles.bivioText, { color: mobilityMode === 'loto_mobility' ? theme.background : theme.textMuted }]}>Proposte L.O.T.O.</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ESPANSIONE BIVIO */}
                  {mobilityMode === 'mezzo_proprio' && hasParkingSuggestion && (
                    <View style={[styles.governanceCard, { backgroundColor: 'rgba(217, 160, 91, 0.1)', borderColor: theme.accent }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <MaterialIcons name="local-parking" size={20} color={theme.accent} />
                        <Text style={[styles.governanceTitle, { color: theme.accent }]}>Suggerimento Sosta Strategica</Text>
                      </View>
                      <Text style={[styles.governanceText, { color: theme.textMuted }]}>
                        La zona intorno a {poi.name} è a traffico limitato o congestionata. Parcheggia comodamente a &quot;Park Porto Antico&quot; e guadagna <Text style={{fontWeight: 'bold', color: theme.accent}}>+10 PTI</Text>.
                      </Text>
                      <TouchableOpacity style={[styles.navParkingBtn, { backgroundColor: theme.accent }]} onPress={() => handleNavigate('driving', true)}>
                        <MaterialIcons name="navigation" size={16} color={theme.background} style={{ marginRight: 5 }} />
                        <Text style={{ color: theme.background, fontWeight: 'bold' }}>Naviga al Parcheggio</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {mobilityMode === 'loto_mobility' && (
                    <View style={[styles.mobilityRow, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
                      <TouchableOpacity style={styles.mobilityItem} onPress={() => handleNavigate('walking')}>
                        <MaterialIcons name="directions-walk" size={24} color={theme.primary} />
                        <Text style={[styles.mobilityLabel, { color: theme.textMuted }]}>15 min</Text>
                        <Text style={[styles.mobilityBonus, { color: theme.primary }]}>+5 XP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mobilityItem} onPress={() => handleNavigate('bicycling')}>
                        <MaterialIcons name="directions-bike" size={24} color={theme.primary} />
                        <Text style={[styles.mobilityLabel, { color: theme.textMuted }]}>6 min</Text>
                        <Text style={[styles.mobilityBonus, { color: theme.primary }]}>+10 XP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mobilityItem} onPress={() => handleNavigate('transit')}>
                        <MaterialIcons name="directions-bus" size={24} color={theme.primary} />
                        <Text style={[styles.mobilityLabel, { color: theme.textMuted }]}>Bus 1/2</Text>
                        <Text style={[styles.mobilityBonus, { color: theme.primary }]}>-1.2kg CO₂</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.mainBtn, { backgroundColor: theme.primary }, (!mobilityMode) && { opacity: 0.5 }]} 
                    disabled={!mobilityMode}
                    onPress={() => onBook(poi, partySize)}
                  >
                    <Text style={[styles.mainBtnText, { color: theme.background }]}>Prenota Visita</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* PITCH UPGRADE PREMIUM */}
              {!isElite && poi.category !== 'partner' && (
                <TouchableOpacity onPress={() => { onClose(); router.push('/upgrade'); }} activeOpacity={0.9} style={{ backgroundColor: theme.text, padding: 15, borderRadius: 15, marginTop: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <MaterialIcons name="workspace-premium" size={24} color={theme.accent} />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>Turista Premium</Text>
                  </View>
                  <Text style={{ color: '#E2E8F0', fontSize: 12, lineHeight: 18 }}>
                    Diventa Premium per sbloccare gratuitamente i file digitali scansionando il tag NFC del luogo e guadagnare bonus discreti!
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* MOCK VISUALIZZATORE PREMIUM ALTO LIVELLO */}
        {premiumMockVisible && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#121417', zIndex: 1000 }]}>
            <Image 
              source={require('../assets/images/archivio_aragonese.png')} 
              style={{ width: '100%', height: '60%', resizeMode: 'cover' }} 
            />
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MaterialIcons name="workspace-premium" size={24} color="#C5A059" />
                <Text style={{ color: '#F2ECE4', fontSize: 24, fontWeight: 'bold', marginLeft: 10, fontFamily: 'serif' }}>L'Archivio Segreto</Text>
              </View>
              <Text style={{ color: '#9B968B', fontSize: 16, lineHeight: 24, fontStyle: 'italic' }}>
                Un antico manoscritto del 1400 ritrovato nei sotterranei, contenente le rotte commerciali segrete della dinastia Aragonese. 
              </Text>
              <Text style={{ color: '#C5A059', fontSize: 14, marginTop: 20, fontWeight: 'bold' }}>ESCLUSIVA L.O.T.O. PREMIUM</Text>
            </View>
            <TouchableOpacity 
              style={{ position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 }}
              onPress={() => setPremiumMockVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    height: height * 0.85,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  imageContainer: { width: '100%', height: 200, position: 'relative' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 5 },
  infoSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 26, fontWeight: '900', fontFamily: 'serif', color: LOTO_PALETTE.EBANO },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  badgesRow: { flexDirection: 'row', marginTop: 12 },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  actionSection: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, marginBottom: 15, marginTop: 10 },
  partySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 15, padding: 10, marginBottom: 20 },
  partyBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  partyText: { fontSize: 16, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  bivioContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  bivioBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 15, marginHorizontal: 5 },
  bivioBtnActive: { backgroundColor: LOTO_PALETTE.EBANO },
  bivioText: { marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  governanceCard: { backgroundColor: 'rgba(217, 160, 91, 0.1)', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(217, 160, 91, 0.3)' },
  governanceTitle: { fontSize: 14, fontWeight: 'bold', color: LOTO_PALETTE.SABBIA_DORATA, marginLeft: 5 },
  governanceText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 15 },
  navParkingBtn: { backgroundColor: LOTO_PALETTE.SABBIA_DORATA, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10 },
  mobilityRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15 },
  mobilityItem: { alignItems: 'center' },
  mobilityLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 5 },
  mobilityBonus: { fontSize: 11, color: LOTO_PALETTE.VERDE_OLIVA, fontWeight: 'bold' },
  mainBtn: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bookedContainer: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, alignItems: 'center', marginVertical: 20 },
  bookedTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
  bookedSub: { textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 5, marginBottom: 15 },
  // Stili per il Vault Multimediale
  vaultSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  mediaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  mediaInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mediaTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E' },
  mediaTypeLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  vaultBtn: { backgroundColor: '#C36B4D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, elevation: 1 },
  vaultBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  vaultBtnDisabled: { backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  vaultBtnTextDisabled: { color: '#64748B', fontSize: 12, fontWeight: 'bold' }
});

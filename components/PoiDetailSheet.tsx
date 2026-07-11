import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, Alert, Linking, Dimensions, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { LruCacheManager } from '../utils/LruCacheManager';
import { OfflineQueueManager } from '../utils/OfflineQueueManager';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { useRouteBuilder } from '../context/RouteContext';

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
  onCheckIn: (poi: any) => void;
};

export default function PoiDetailSheet({ visible, poi, onClose, onCheckIn }: PoiDetailSheetProps) {
  const router = useRouter();
  const { theme, isElite } = useTheme();
  
  // Route Builder
  const { isPoiInRoute, addPoiToRoute, removePoiFromRoute } = useRouteBuilder();
  const inRoute = poi ? isPoiInRoute(poi.id) : false;
  
  // Stati per la gestione del Vault Multimediale
  const [vaultMedia, setVaultMedia] = useState<any[]>([]);
  const [mediaStatus, setMediaStatus] = useState<{[key: string]: 'locked' | 'downloading' | 'ready' | 'queued'}>({});
  const [premiumMockVisible, setPremiumMockVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'info' | 'events'>('media');

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
      // Gestione Mock Data (m1, m2, m3)
      if (media.id.startsWith('m')) {
        const simulaSbloccoMock = () => {
          setMediaStatus(prev => ({ ...prev, [media.id]: 'downloading' }));
          setTimeout(() => {
            setMediaStatus(prev => ({ ...prev, [media.id]: 'ready' }));
            if (media.id === 'm3') {
              Alert.alert("Successo!", `Hai decifrato il tag NFC (Simulazione) e ottenuto l'accesso all'Archivio!`);
            } else {
              Alert.alert("Successo!", `"${media.title}" è stato sbloccato con successo (Simulazione)`);
            }
          }, 1500);
        };

        if (media.id === 'm3') {
          const avviaSbloccoNativo = async () => {
            try {
              setMediaStatus(prev => ({ ...prev, [media.id]: 'downloading' }));
              // Richiesta permessi e avvio lettura
              await NfcManager.requestTechnology(NfcTech.Ndef);
              const tag = await NfcManager.getTag();
              if (tag) {
                setMediaStatus(prev => ({ ...prev, [media.id]: 'ready' }));
                Alert.alert("Successo TSaaSI!", `L'hardware ha verificato l'NFC NTAG424. Contenuto sbloccato.`);
              }
            } catch (ex) {
              console.warn('Errore lettura NFC:', ex);
              setMediaStatus(prev => ({ ...prev, [media.id]: 'locked' }));
              Alert.alert("Errore NFC", "Non è stato possibile leggere il tag.");
            } finally {
              NfcManager.cancelTechnologyRequest();
            }
          };

          // Approccio Lean: se il device supporta NFC ed è abilitato, proviamo quello vero. Altrimenti Mock.
          let isSupported = false;
          try {
            isSupported = await NfcManager.isSupported();
          } catch (nfcErr) {
            console.log('[NFC] Modulo nativo non trovato (ambiente Expo Go). Uso fallback.');
          }
          
          if (isSupported) {
            const isEnabled = await NfcManager.isEnabled();
            if (isEnabled) {
               await avviaSbloccoNativo();
            } else {
               Alert.alert("NFC Disabilitato", "Attiva l'NFC dalle impostazioni, oppure prosegui con la simulazione.", [
                 { text: "Simula Sblocco", onPress: simulaSbloccoMock }
               ]);
            }
          } else {
            // Dispositivo senza NFC (es. vecchi iPhone, Simulatori, Expo Web)
            simulaSbloccoMock();
          }
        } else {
          // Per m1 o m2, simula subito
          simulaSbloccoMock();
        }
        
        return; // Interrompe per qualsiasi mock
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
              {poi.id === 'mena' ? (
                <Image 
                  source={require('../assets/images/mena_logo.jpg')} 
                  style={styles.coverImage} 
                  resizeMode="contain" 
                />
              ) : poi.id === 'diseducation' ? (
                <Image 
                  source={require('../assets/images/diseducation_logo.jpg')} 
                  style={styles.coverImage} 
                  resizeMode="contain" 
                />
              ) : poi.id === 'castello' || (poi.name && poi.name.includes('Castello Aragonese')) ? (
                <Image 
                  source={require('../assets/images/castello-evento.png')} 
                  style={styles.coverImage} 
                  resizeMode="cover" 
                />
              ) : poi.image_url ? (
                <Image 
                  source={{ uri: poi.image_url }} 
                  style={styles.coverImage} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.primary }]}>
                  <MaterialIcons name={poi.category === 'partner' ? "store" : "account-balance"} size={48} color={theme.background} />
                </View>
              )}
              <View style={styles.closeBtn}>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* ROUTE BUILDER FAB (uguale alla mappa) */}
              <TouchableOpacity 
                style={[styles.fabCircleRoute, { backgroundColor: inRoute ? theme.primary : '#FFF' }]}
                onPress={() => {
                  if (inRoute) removePoiFromRoute(poi.id);
                  else addPoiToRoute(poi);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name={inRoute ? "explore" : "add-location-alt"} size={22} color={inRoute ? '#FFF' : theme.text} />
              </TouchableOpacity>
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

              {/* NFC SCAN BUTTON MOVED TO TOP */}
              <TouchableOpacity 
                style={[styles.mainBtn, { backgroundColor: theme.primary, marginTop: 15 }]} 
                onPress={() => onCheckIn(poi)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="nfc" size={20} color={theme.background} style={{ marginRight: 8 }} />
                  <Text style={[styles.mainBtnText, { color: theme.background }]}>Rileva Passaggio (NFC/QR)</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* SELETTORE TAB */}
            <View style={styles.tabBar}>
              <TouchableOpacity style={[styles.tabBtn, { borderBottomColor: activeTab === 'media' ? theme.primary : 'transparent' }]} onPress={() => setActiveTab('media')}>
                <Text style={[styles.tabBtnText, { color: activeTab === 'media' ? theme.primary : theme.textMuted }]}>DIGITALE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, { borderBottomColor: activeTab === 'info' ? theme.primary : 'transparent' }]} onPress={() => setActiveTab('info')}>
                <Text style={[styles.tabBtnText, { color: activeTab === 'info' ? theme.primary : theme.textMuted }]}>INFO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, { borderBottomColor: activeTab === 'events' ? theme.primary : 'transparent' }]} onPress={() => setActiveTab('events')}>
                <Text style={[styles.tabBtnText, { color: activeTab === 'events' ? theme.primary : theme.textMuted }]}>EVENTI</Text>
              </TouchableOpacity>
            </View>

            {/* CONTENUTO TAB: DIGITALE */}
            {activeTab === 'media' && (
              <View style={styles.tabContent}>
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
              </View>
            )}

            {/* CONTENUTO TAB: EVENTI */}
            {activeTab === 'events' && (
              <View style={styles.tabContent}>
                {poi.events && poi.events.length > 0 ? (
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
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <MaterialIcons name="event-busy" size={48} color={theme.border} />
                    <Text style={{ color: theme.textMuted, marginTop: 10, textAlign: 'center' }}>Nessun evento in programma al momento.</Text>
                  </View>
                )}
              </View>
            )}

            {/* CONTENUTO TAB: INFO */}
            {activeTab === 'info' && (
              <View style={[styles.actionSection, styles.tabContent]}>
                
                {/* Bio / Description */}
                {poi.description && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>STORIA E BIO</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 22, marginTop: 5 }}>
                      {poi.description}
                    </Text>
                  </View>
                )}

                {/* MEZZO PROPRIO & SOSTA (Solo se ha suggerimento parcheggio) */}
                {hasParkingSuggestion && (
                  <View style={[styles.governanceCard, { backgroundColor: 'rgba(217, 160, 91, 0.1)', borderColor: theme.accent, marginTop: 10 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <MaterialIcons name="local-parking" size={20} color={theme.accent} />
                      <Text style={[styles.governanceTitle, { color: theme.accent }]}>Suggerimento Sosta Strategica</Text>
                    </View>
                    <Text style={[styles.governanceText, { color: theme.textMuted }]}>
                      La zona intorno a {poi.name} è a traffico limitato o congestionata. Parcheggia comodamente a "Park Porto Antico" e guadagna <Text style={{fontWeight: 'bold', color: theme.accent}}>+10 PTI</Text>.
                    </Text>
                    <TouchableOpacity style={[styles.navParkingBtn, { backgroundColor: theme.accent }]} onPress={() => handleNavigate('driving', true)}>
                      <MaterialIcons name="navigation" size={16} color={theme.background} style={{ marginRight: 5 }} />
                      <Text style={{ color: theme.background, fontWeight: 'bold' }}>Naviga al Parcheggio</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.mainBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 15 }]} 
                  onPress={async () => {
                    try {
                      const url = poi.website_url || `https://www.google.com/search?q=${encodeURIComponent(poi.name + ' Taranto')}`;
                      await WebBrowser.openBrowserAsync(url);
                    } catch (e) {
                      Alert.alert('Errore', 'Impossibile aprire il browser');
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="language" size={20} color="#475569" style={{ marginRight: 8 }} />
                    <Text style={[styles.mainBtnText, { color: '#475569' }]}>Sito Ufficiale in App</Text>
                  </View>
                </TouchableOpacity>

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
            )}
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
  coverImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8 },
  fabCircleRoute: { 
    position: 'absolute', 
    top: 15, 
    left: 15, 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5 
  },
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
  governanceCard: { padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 15 },
  governanceTitle: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  governanceText: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  navParkingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, marginTop: 10 },
  mobilityRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15 },
  mobilityItem: { alignItems: 'center' },
  mobilityLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 5 },
  mobilityBonus: { fontSize: 11, color: LOTO_PALETTE.VERDE_OLIVA, fontWeight: 'bold' },
  mainBtn: { padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { fontWeight: 'bold', fontSize: 16 },
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
  vaultBtnTextDisabled: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabContent: {
    paddingTop: 10,
  }
});

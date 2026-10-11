import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useGamification } from '../../context/GamificationContext';
import XpToast from '../../components/XpToast';
import { supabase } from '../../utils/supabase';
import { startCrowdRadarScan } from '../../utils/bleManager';
import { buildLevelUpEvents, calculateLevel } from '../../utils/levelUtils';

const { height } = Dimensions.get('window');

export default function DeepLinkPoiScreen() {
  const { id } = useLocalSearchParams();
  const idStr = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { theme } = useTheme();
  const gamification = useGamification();

  const [poiData, setPoiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Modal and Toast State
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpTitle, setLevelUpTitle] = useState("");
  const [levelUpMessage, setLevelUpMessage] = useState("");
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastXp, setToastXp] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        const { data, error } = await supabase
          .from('pois')
          .select('*')
          .eq('id', idStr)
          .single();
        
        if (error) {
          console.error("Errore fetch POI:", error.message);
        } else {
          setPoiData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPoi();
  }, [idStr]);

  const handleToastHide = () => setToastVisible(false);

  const handleClaim = async () => {
    if (!poiData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsScanning(true);

    try {
      // Radar BLE in background: mappa la folla senza bloccare il check-in.
      startCrowdRadarScan(poiData.id).catch(err => console.warn('Radar BLE fallito o non supportato:', err));

      const loc = await Location.getCurrentPositionAsync({});

      const { data: { user } } = await supabase.auth.getUser();
      let oldXp = 0;
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
        oldXp = prof?.total_xp || 0;
      }

      // Percorso di check-in UFFICIALE: proximity gate + cooldown + anti-speed
      // applicati lato server (stessa funzione di index.tsx e PoiDetailSheet).
      const { data, error } = await supabase.rpc('scan_poi_gps', {
        p_poi_id: poiData.id,
        p_lat: loc.coords.latitude,
        p_lng: loc.coords.longitude,
      });
      if (error) throw error;

      const newXp = data.new_total_xp;
      const events = buildLevelUpEvents(calculateLevel(oldXp), calculateLevel(newXp), 'it');
      if (events.length > 0) {
        gamification.queueEvents(events);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastXp(data.xp_awarded ?? 0);
      setToastMessage(`Check-in validato presso ${poiData.name}`);
      setToastVisible(true);

      setTimeout(() => {
        router.replace('/' as any);
      }, 2500);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Errore GPS', e.message);
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!poiData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.textMuted} />
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: 'bold', marginTop: 20 }}>Punto Non Trovato</Text>
        <Text style={{ color: theme.textMuted, fontSize: 16, textAlign: 'center', marginTop: 10 }}>Il sensore NFC ha letto un identificativo non valido o non più attivo.</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary, marginTop: 30 }]} onPress={() => router.back()}>
          <Text style={[styles.btnText, { color: theme.background }]}>Torna Indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Modale Level Up Custom - Mantenuto per coerenza design */}
      <Modal visible={levelUpModalVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialIcons name="workspace-premium" size={100} color="#D4AF37" style={{ marginBottom: 20 }} />
          <Text style={{ fontFamily: 'serif', fontSize: 28, color: '#D4AF37', fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }}>{levelUpTitle}</Text>
          <Text style={{ fontFamily: 'Outfit_Regular', fontSize: 16, color: '#FFF', textAlign: 'center', marginBottom: 40, lineHeight: 24, paddingHorizontal: 20 }}>{levelUpMessage}</Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#D4AF37', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, elevation: 5 }}
            onPress={() => {
              setLevelUpModalVisible(false);
              router.replace('/' as any);
            }}
          >
            <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 16 }}>FANTASTICO!</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Toast Animato */}
      <XpToast 
        visible={toastVisible} 
        xpAmount={toastXp} 
        message={toastMessage}
        type={poiData.category === 'partner' ? 'PTI' : 'XP'}
        onHide={handleToastHide} 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Header Icon / Image */}
        <View style={[styles.headerIconContainer, { backgroundColor: theme.primary, overflow: 'hidden' }]}>
          {poiData.image_url ? (
            <Image 
              source={{ uri: poiData.image_url }} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="cover" 
            />
          ) : (
            <MaterialIcons name="camera-alt" size={80} color={theme.background} />
          )}
        </View>

        {/* Info Box */}
        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: 'rgba(95, 113, 61, 0.1)' }]}>
             <MaterialIcons name="verified" size={16} color={theme.primary} />
             <Text style={[styles.badgeText, { color: theme.primary }]}>
               {poiData.category === 'partner' ? 'Partner L.O.T.O. Verificato' : 'Nodo Culturale Verificato'}
             </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{poiData.name}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{poiData.category}</Text>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.description, { color: theme.text }]}>
              {poiData.description || 'Nessuna descrizione disponibile per questo punto di interesse.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: isScanning ? theme.border : theme.primary }]} 
          onPress={handleClaim}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 10 }} />
              <Text style={[styles.btnText, { color: theme.primary, fontSize: 14 }]}>Scansione Ambiente (5s)...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="nfc" size={24} color={theme.background} style={{ marginRight: 8 }} />
              <Text style={[styles.btnText, { color: theme.background }]}>Riscatta {poiData.xp_reward || 50} LOTO {poiData.category === 'partner' ? 'PTI' : 'XP'}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>Chiudi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconContainer: { width: '100%', height: height * 0.35, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  content: { padding: 25, marginTop: -20 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 15 },
  badgeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  title: { fontSize: 32, fontWeight: '900', fontFamily: 'serif', marginBottom: 5 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textTransform: 'capitalize' },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 10 },
  description: { fontSize: 16, lineHeight: 24 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 15, width: '100%' },
  btnText: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { marginTop: 15, alignItems: 'center', padding: 10 },
  closeBtnText: { fontSize: 14, fontWeight: 'bold' }
});

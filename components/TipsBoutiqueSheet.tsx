import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, Switch } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { useTheme } from '../context/ThemeContext';
import { startBackgroundTracking, stopBackgroundTracking, getTrackingMode, setTrackingMode } from '../utils/SincroAvventura';
import { supabase } from '../utils/supabase';

interface TipsBoutiqueSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TIPS_DATA = [
  {
    id: 'explore',
    title: 'L\'Arte dell\'Esplorazione',
    icon: 'map',
    content: 'L.O.T.O. rivela i suoi segreti con eleganza, un passo alla volta. Usa il radar sensoriale nella mappa per percepire le zone attive senza spezzare la magia del viaggio.'
  },
  {
    id: 'earn',
    title: 'Sigilli Digitali (Zero-IoT)',
    icon: 'nfc',
    content: 'Ogni Luogo Custode protegge un emblema invisibile. Sfiora l\'adesivo L.O.T.O. con il tuo dispositivo per validare la tua presenza e rivendicare i tuoi Punti Impatto (PTI).'
  }
];

export default function TipsBoutiqueSheet({ visible, onClose }: TipsBoutiqueSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [gpsGranted, setGpsGranted] = useState(false);
  const [bgGpsGranted, setBgGpsGranted] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      checkPermissions();
      fetchUser();
      getTrackingMode().then(mode => setBatterySaver(mode === 'battery'));
    }
  }, [visible]);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) setUserId(session.user.id);
  };

  const checkPermissions = async () => {
    const gps = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();
    setGpsGranted(gps.status === 'granted');
    setBgGpsGranted(bg.status === 'granted');
  };

  const requestGps = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    if (res.status === 'granted') setGpsGranted(true);
  };

  const requestBgGps = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (res.status === 'granted' && bg.status === 'granted') {
      setBgGpsGranted(true);
      
      if (userId) {
        startBackgroundTracking(userId); // Avvia tracking se permesso
      }
    }
  };

  const toggleBatterySaver = async (value: boolean) => {
    setBatterySaver(value);
    await setTrackingMode(value ? 'battery' : 'performance');

    // Se il tracking è già attivo, riavvialo con i nuovi parametri di campionamento
    if (bgGpsGranted && userId) {
      stopBackgroundTracking();
      startBackgroundTracking(userId);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Math.max(25, insets.bottom) }]}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Guida & Sensori</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 10) }}>
            
            {/* SEZIONE 1: I SENSI DEL CAMALEONTE (PERMESSI HARDWARE) */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}>Eco-Passi</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              Sincronizza il tuo dispositivo per sbloccare il pieno potenziale dell'ecosistema L.O.T.O.
            </Text>

            {/* Tasto GPS */}
            <TouchableOpacity 
              style={[styles.permissionRow, { borderColor: gpsGranted ? '#2ECC71' : theme.border }]} 
              onPress={requestGps}
              disabled={gpsGranted}
            >
              <View style={[styles.iconBox, { backgroundColor: gpsGranted ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <MaterialIcons name="place" size={24} color={gpsGranted ? '#2ECC71' : theme.primary} />
              </View>
              <View style={styles.permissionText}>
                <Text style={[styles.permTitle, { color: theme.text }]}>Mappa & Check-in (GPS)</Text>
                <Text style={[styles.permDesc, { color: theme.textMuted }]}>Necessario per trovarti sulla mappa e validare i punti.</Text>
              </View>
              <MaterialIcons name={gpsGranted ? "check-circle" : "add-circle-outline"} size={24} color={gpsGranted ? '#2ECC71' : theme.primary} />
            </TouchableOpacity>

            {/* Tasto Pedometro */}
            <TouchableOpacity 
              style={[styles.permissionRow, { borderColor: bgGpsGranted ? '#2ECC71' : theme.border }]} 
              onPress={requestBgGps}
              disabled={bgGpsGranted}
            >
              <View style={[styles.iconBox, { backgroundColor: bgGpsGranted ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <MaterialIcons name="explore" size={24} color={bgGpsGranted ? '#2ECC71' : theme.primary} />
              </View>
              <View style={styles.permissionText}>
                <Text style={[styles.permTitle, { color: theme.text }]}>Eco-Passi (GPS)</Text>
                <Text style={[styles.permDesc, { color: theme.textMuted }]}>Esplora in background e sblocca ricompense con la distanza percorsa.</Text>
              </View>
              <MaterialIcons name={bgGpsGranted ? "check-circle" : "add-circle-outline"} size={24} color={bgGpsGranted ? '#2ECC71' : theme.primary} />
            </TouchableOpacity>

            {/* Toggle Risparmio Batteria (solo se Eco-Passi abilitato) */}
            {bgGpsGranted && (
              <View style={[styles.permissionRow, { borderColor: theme.border }]}>
                <View style={[styles.iconBox, { backgroundColor: batterySaver ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
                  <MaterialIcons name="battery-saver" size={24} color={batterySaver ? '#2ECC71' : theme.primary} />
                </View>
                <View style={styles.permissionText}>
                  <Text style={[styles.permTitle, { color: theme.text }]}>Risparmio Batteria</Text>
                  <Text style={[styles.permDesc, { color: theme.textMuted }]}>Campiona i dati GPS meno spesso per consumare meno batteria. I chilometri restano sempre certificati.</Text>
                </View>
                <Switch
                  value={batterySaver}
                  onValueChange={toggleBatterySaver}
                  trackColor={{ false: '#D1D5DB', true: '#2ECC71' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            )}


            {/* SEZIONE 2: CONSIGLI (TIPS) */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}>Consigli di Esplorazione</Text>
            {TIPS_DATA.map((tip) => (
              <View key={tip.id} style={[styles.tipCard, { backgroundColor: theme.background }]}>
                <View style={styles.tipHeader}>
                  <MaterialIcons name={tip.icon as any} size={22} color={theme.primary} />
                  <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
                </View>
                <Text style={[styles.tipContent, { color: theme.textMuted }]}>{tip.content}</Text>
              </View>
            ))}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  closeBtn: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 15,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  permissionText: {
    flex: 1,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  permDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  tipCard: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tipContent: {
    fontSize: 13,
    lineHeight: 20,
  }
});

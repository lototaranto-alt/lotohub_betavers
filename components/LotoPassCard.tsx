import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { supabase } from '../utils/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDFBF2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
};

export default function LotoPassCard() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const passRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUuid(user.id);
      }
    };
    fetchUser();
  }, []);

  const handleSaveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Devi concedere l\'accesso alla galleria per salvare il L.O.T.O Pass.');
        return;
      }

      if (passRef.current) {
        const uri = await captureRef(passRef, {
          format: 'png',
          quality: 1,
        });

        await MediaLibrary.saveToLibraryAsync(uri);
        setIsSaved(true);
        Alert.alert('Successo', 'L.O.T.O Pass salvato in galleria! Conservalo con cura.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile salvare il pass.');
    }
  };

  const handleShare = async () => {
    try {
      if (passRef.current) {
        const uri = await captureRef(passRef, {
          format: 'png',
          quality: 1,
        });

        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Condivisione non disponibile', 'La condivisione non è supportata su questo dispositivo.');
          return;
        }

        await Sharing.shareAsync(uri);
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile condividere il pass.');
    }
  };

  if (!uuid) return null;

  return (
    <View style={styles.container}>
      {!isSaved && (
        <View style={styles.warningBox}>
          <MaterialIcons name="security" size={24} color={LOTO_PALETTE.TERRACOTTA} />
          <Text style={styles.warningText}>
            Crea il tuo backup profilo. Abbiamo a cuore la tua privacy: dovrai effettuare il backup generando il QR che dovrai conservare se accedi da altri dispositivi.
          </Text>
        </View>
      )}

      <ViewShot ref={passRef} options={{ format: 'png', quality: 1 }} style={styles.passWrapper}>
        <View style={styles.passCard}>
          <Image source={require('../assets/images/qr_backup_flat.png')} style={styles.cardIllustration} resizeMode="cover" />
          
          <View style={styles.cardContent}>
            <Text style={styles.passTitle}>L.O.T.O. PASS</Text>
            <Text style={styles.passSubtitle}>Identità Anonima Zero-PII</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
              value={uuid}
              size={180}
              color={LOTO_PALETTE.EBANO}
              backgroundColor="#FFF"
            />
          </View>
            
            <Text style={styles.uuidLabel}>ID UNIVOCO</Text>
            <Text style={styles.uuidText}>{uuid.split('-')[0]}-...-{uuid.split('-')[4]}</Text>
          </View>
        </View>
      </ViewShot>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnSave} onPress={handleSaveToGallery}>
          <MaterialIcons name="save-alt" size={20} color="#FFF" />
          <Text style={styles.btnText}>SALVA IN GALLERIA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={LOTO_PALETTE.EBANO} />
          <Text style={[styles.btnText, { color: LOTO_PALETTE.EBANO }]}>CONDIVIDI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEFE5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F6C1A6',
    width: '90%'
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#9C3A16',
    lineHeight: 18,
  },
  passWrapper: {
    width: '85%',
    backgroundColor: 'transparent',
  },
  passCard: {
    backgroundColor: LOTO_PALETTE.CREMA,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: LOTO_PALETTE.VERDE_OLIVA,
    elevation: 10,
    shadowColor: LOTO_PALETTE.EBANO,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  cardIllustration: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: 30,
    alignItems: 'center',
  },
  passTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: LOTO_PALETTE.VERDE_OLIVA,
    letterSpacing: 2,
    marginBottom: 5,
  },
  passSubtitle: {
    fontSize: 12,
    color: LOTO_PALETTE.EBANO,
    marginBottom: 25,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 25,
  },
  uuidLabel: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 5,
  },
  uuidText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LOTO_PALETTE.EBANO,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '85%',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  btnSave: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: LOTO_PALETTE.TERRACOTTA,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  btnShare: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: LOTO_PALETTE.EBANO,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  }
});

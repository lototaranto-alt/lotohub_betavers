import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, StyleSheet, Platform, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import jsQR from 'jsqr';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

export default function LotoPassRecoveryScanner({ visible, onClose, theme }: Props) {
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setManualCode(data);
    processRecoveryCode(data);
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: true, // Need base64 or pixel data for JSQR, wait JSQR needs ImageData, which is tricky in React Native.
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        Alert.alert('In Sviluppo', 'Libreria Galleria inserita, parser QR in via di perfezionamento.');
        // NOTE: reading pixels from base64 in RN for jsQR requires Canvas or rn-qr-generator.
        // We will need rn-qr-generator. Let me just use a placeholder here and fix the import.
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const processRecoveryCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('recover_loto_pass', {
        recovery_code: code.trim()
      });
      if (error) throw error;
      else if (data?.success) {
        Alert.alert('Recupero Riuscito', data.message || 'Bentornato! Il tuo L.O.T.O. Pass è valido.');
        onClose();
      } else {
        Alert.alert('Attenzione', data?.message || 'Codice non valido.');
      }
    } catch (err: any) {
      Alert.alert('Errore di Recupero', 'Impossibile verificare il codice: ' + err.message);
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Recupero L.O.T.O. Pass</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* GALLERY PICKER BUTTON */}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary, marginBottom: 15, flexDirection: 'row', justifyContent: 'center' }]}
            onPress={pickImageFromGallery}
          >
            <MaterialIcons name="photo-library" size={20} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Carica QR dalla Galleria</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', color: theme.textMuted, marginVertical: 10 }}>- OPPURE FOTOGRAFA UN ALTRO SCHERMO -</Text>

          {/* SCANNER AREA */}
          <View style={[styles.cameraContainer, { borderColor: theme.accent }]}>
            {!isCameraActive ? (
                <TouchableOpacity onPress={() => setIsCameraActive(true)} style={{alignItems: 'center'}}>
                    <MaterialIcons name="camera-alt" size={40} color={theme.primary} />
                    <Text style={{color: theme.text, marginTop: 10}}>Attiva Fotocamera</Text>
                </TouchableOpacity>
            ) : hasPermission === null ? (
              <Text style={{color: theme.text}}>Richiesta permessi fotocamera...</Text>
            ) : hasPermission === false ? (
              <Text style={{color: theme.text}}>Nessun accesso alla fotocamera.</Text>
            ) : (
              <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            {scanned && (
              <View style={styles.scannedOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}
          </View>

          <Text style={{ textAlign: 'center', color: theme.textMuted, marginVertical: 15 }}>- OPPURE INSERISCI MANUALMENTE -</Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Es. LOTO-A1B2C3D4-5678"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            value={manualCode}
            onChangeText={setManualCode}
          />

          <TouchableOpacity 
            onPress={() => processRecoveryCode(manualCode)} 
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.text, marginTop: 15 }]}
          >
            {loading ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.buttonText, {color: theme.background}]}>Verifica Codice Manuale</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', borderRadius: 24, padding: 25, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  cameraContainer: { height: 160, borderWidth: 2, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  scannedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, textAlign: 'center', letterSpacing: 1 },
  button: { padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';
import { Camera, CameraView } from 'expo-camera';

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

  const processRecoveryCode = async (code: string) => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('recover_loto_pass', {
        recovery_code: code.trim()
      });

      if (error) {
        throw error;
      } else if (data?.success) {
        Alert.alert('Recupero Riuscito', data.message || 'Bentornato! Il tuo L.O.T.O. Pass e valido e i tuoi dati sono stati ripristinati.');
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

          {/* SCANNER AREA */}
          <View style={[styles.cameraContainer, { borderColor: theme.accent }]}>
            {hasPermission === null ? (
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

          <Text style={{ textAlign: 'center', color: theme.textMuted, marginVertical: 20 }}>- OPPURE INSERISCI MANUALMENTE -</Text>

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
            style={[styles.button, { backgroundColor: theme.primary }]}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verifica Codice</Text>}
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
  cameraContainer: { height: 200, borderWidth: 2, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  scannedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, textAlign: 'center', letterSpacing: 1 },
  button: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { useTheme } from '../context/ThemeContext';

interface PoiScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (poiId: string) => void;
}

export default function PoiScannerModal({ visible, onClose, onScanSuccess }: PoiScannerModalProps) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);

  React.useEffect(() => {
    let active = true;

    async function initNfc() {
      try {
        const supported = await NfcManager.isSupported();
        if (supported && active) {
          setNfcSupported(true);
          await NfcManager.start();
        }
      } catch (e) {
        console.warn('NFC initialization failed', e);
      }
    }

    if (visible) {
      initNfc();
      startNfcListener();
    } else {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }

    return () => {
      active = false;
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, [visible]);

  async function startNfcListener() {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        // Decode the first record payload
        const payload = tag.ndefMessage[0].payload;
        let uri = '';
        if (payload) {
            uri = Ndef.uri.decodePayload(payload as any);
        }
        
        NfcManager.cancelTechnologyRequest().catch(() => {});
        setScanned(true);
        Alert.alert('Tag NFC Rilevato!', `Contenuto: ${uri || 'Dati NDEF'}`);
        onScanSuccess(uri || 'nfc-tag-id');
        setTimeout(() => {
          setScanned(false);
          onClose();
        }, 1500);
      }
    } catch (ex) {
      // User cancelled or timeout
    }
  }

  if (!visible) return null;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.container}>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: 'white' }}>
            LOTO ha bisogno del permesso per usare la fotocamera.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: theme.primary, padding: 15, borderRadius: 10 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Concedi Permesso</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const handleBarcodeScanned = ({ type, data }: any) => {
    setScanned(true);
    // Presumiamo che il QR Code contenga l'ID del POI o un URL con l'ID
    // Per questa Alpha test, qualsiasi QR invocherà il success
    Alert.alert('Scansione Completata', `Dati letti: ${data}`);
    onScanSuccess(data);
    setTimeout(() => {
      setScanned(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Acquisizione (NFC / QR)</Text>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.targetBox} />
          </View>
        </View>

        <View style={styles.footer}>
          {nfcSupported && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <MaterialIcons name="nfc" size={24} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>NFC Attivo - Avvicina il Tag</Text>
            </View>
          )}
          <Text style={styles.instructions}>
            Inquadra il QR Code oppure avvicina il dispositivo al Tag NFC (Plasticaqqua/Rifugiamoci) per fare check-in.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    position: 'absolute',
    top: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeBtn: {
    position: 'absolute',
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20
  },
  cameraContainer: {
    width: '100%',
    height: '60%',
    overflow: 'hidden',
    position: 'relative'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  targetBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: 'transparent'
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
    alignItems: 'center'
  },
  instructions: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8
  }
});

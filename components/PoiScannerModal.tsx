import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
          <Text style={styles.title}>Scansiona QR Code</Text>
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
          <Text style={styles.instructions}>
            Inquadra il QR Code presente presso il Punto di Interesse (o la segnaletica Rifugiamoci).
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

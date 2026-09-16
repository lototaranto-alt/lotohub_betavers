import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import LotoPermissionModal from './LotoPermissionModal';

/**
 * LotoHardwareGate
 * Componente invisibile piazzato in app/_layout.tsx.
 * Controlla silenziosamente lo stato dei permessi all'avvio (getPermission, non requestPermission).
 * Mostra la modale narrativa LOTO solo se mancano permessi critici, bloccando l'UX rumorosa
 * e costringendo tutti i componenti a usare getForegroundPermissionsAsync() anzichè requestForegroundPermissionsAsync().
 */
export default function LotoHardwareGate() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      let needsModal = false;

      try {
        // 1. Controlla GPS (solo legge lo stato, non chiede)
        const { status: gpsStatus } = await Location.getForegroundPermissionsAsync();
        if (gpsStatus !== 'granted') needsModal = true;

        // 2. Controlla Bluetooth (solo legge lo stato, non chiede)
        if (Platform.OS === 'android') {
          const apiLevel = parseInt(Platform.Version.toString(), 10);
          if (apiLevel >= 31) {
            const scanGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
            const connectGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
            if (!scanGranted || !connectGranted) needsModal = true;
          } else {
            const locationGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (!locationGranted) needsModal = true;
          }
        }

        if (needsModal) setShowModal(true);
      } catch (e) {
        // Se il check fallisce in modo imprevisto, mostriamo comunque la modale
        console.warn('[LotoHardwareGate] Errore check permessi:', e);
        setShowModal(true);
      }
    };

    checkPermissions();
  }, []);

  const handleRequestPermissions = async () => {
    try {
      // 1. Richiedi GPS
      await Location.requestForegroundPermissionsAsync();

      // 2. Richiedi Bluetooth (il pop-up grigio di sistema comparirà ORA, quando l'utente si aspetta)
      if (Platform.OS === 'android') {
        const apiLevel = parseInt(Platform.Version.toString(), 10);
        if (apiLevel >= 31) {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);
        } else {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        }
      }

      setShowModal(false);
    } catch (e) {
      console.error('[LotoHardwareGate] Errore richiesta permessi:', e);
      setShowModal(false);
    }
  };

  return (
    <LotoPermissionModal
      visible={showModal}
      onRequestPermissions={handleRequestPermissions}
    />
  );
}
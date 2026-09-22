import React, { useCallback, useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import * as Location from 'expo-location';
import LotoPermissionModal from './LotoPermissionModal';

export type SensorGateState = 'ok' | 'missing' | 'gpsOff';

/**
 * Richiede preventivamente i permessi GPS + Bluetooth (da usare nei CTA
 * espliciti: onboarding, Tips, comando mappa). MAI al mount.
 */
export function requestSensors(): Promise<{ fg: boolean; bt: boolean }> {
  return (async () => {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    let bluetoothOk = true;
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      if (apiLevel >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        bluetoothOk = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted'
          && results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted';
      } else {
        bluetoothOk = true;
      }
    }
    return { fg: fgStatus === 'granted', bt: bluetoothOk };
  })();
}

/**
 * Stato sensori in SOLA LETTURA (mai richieste → mai popup di sistema).
 * Distingue: permesso non dato vs permesso dato ma GPS OFF a livello provider.
 * Il caso 'gpsOff' è la chiave del fix #2: con permesso già concesso e GPS
 * spento, la risposta corretta è una modale LOTO che porta alle impostazioni,
 * NON il ri-trigger della notifica nativa.
 */
export async function getSensorGateState(): Promise<SensorGateState> {
  try {
    const { status: gpsStatus } = await Location.getForegroundPermissionsAsync();
    if (gpsStatus !== 'granted') return 'missing';

    let btOk = true;
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      if (apiLevel >= 31) {
        const scanGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const connectGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        btOk = scanGranted && connectGranted;
      } else {
        btOk = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
    }
    if (!btOk) return 'missing';

    const provider = await Location.getProviderStatusAsync();
    if (!provider.locationServicesEnabled) return 'gpsOff';

    return 'ok';
  } catch (e) {
    console.warn('[LotoHardwareGate] Errore check permessi:', e);
    return 'missing';
  }
}

/**
 * Apre le impostazioni di sistema della posizione (Android: pagina GPS;
 * iOS/iOS: impostazioni app). Da usare ANCHE dal comando "centra posizione"
 * della mappa per evitare che il sistema mostri la propria dialog.
 */
export function openLocationSettings() {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings());
  } else {
    Linking.openSettings();
  }
}

type LotoHardwareGateProps = {
  suppressed?: boolean;
};

export default function LotoHardwareGate({ suppressed = false }: LotoHardwareGateProps) {
  const [gateState, setGateState] = useState<SensorGateState>('ok');
  const [showModal, setShowModal] = useState(false);

  const runCheck = useCallback(async () => {
    const state = await getSensorGateState();
    setGateState(state);
    if (state === 'ok') {
      setShowModal(false);
    } else if (!suppressed) {
      setShowModal(true);
    }
  }, [suppressed]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const handleRequestPermissions = async () => {
    await requestSensors();
    await runCheck();
  };

  const handleOpenSettings = () => {
    openLocationSettings();
  };

  return (
    <LotoPermissionModal
      visible={showModal}
      state={gateState}
      onClose={() => setShowModal(false)}
      onRequestPermissions={handleRequestPermissions}
      onOpenSettings={handleOpenSettings}
    />
  );
}
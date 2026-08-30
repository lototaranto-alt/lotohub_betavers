import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// MOCK PER L'OTA: Rimuoviamo l'import di react-native-ble-plx perch  nativo e blocca l'OTA
// import { BleManager, Device, State, BleError } from 'react-native-ble-plx';

export const SCAN_DURATION_MS = 5000;
export const KNOWN_DEVICES_KEY = 'loto_known_ble_devices';
export const FIXED_DEVICE_THRESHOLD = 3;

export async function requestBluetoothPermissions(): Promise<boolean> {
  return true;
}

export async function startCrowdRadarScan(): Promise<number> {
  return new Promise((resolve) => {
    console.log('[BLE] Avvio scansione Crowd Radar MOCKATA per OTA (5 secondi)...');
    setTimeout(() => {
      // Mock result
      resolve(3); // Ritorna un numero finto temporaneo
    }, SCAN_DURATION_MS);
  });
}

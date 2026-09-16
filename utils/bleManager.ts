import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * L.O.T.O. HUB - IRON FENCE BLE MANAGER
 * Implementazione Edge Computing (Zero-Cost Server)
 */

const BLE_SCAN_DURATION_MS = 5000;
const TRUSTED_RSSI_THRESHOLD = -75;
const DECAY_MS = 3 * 24 * 60 * 60 * 1000; // 72 Ore
const PROMOTION_QUORUM = 5;
const COLD_START_QUORUM = 2;

let manager: BleManager | null = null;

const getBleManager = () => {
  if (!manager) manager = new BleManager();
  return manager;
};

const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS === 'android') {
    const apiLevel = parseInt(Platform.Version.toString(), 10);
    if (apiLevel < 31) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const statuses = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        statuses[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        statuses[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }
  return false;
};

interface LocalDeviceMap {
  [mac: string]: { times_seen: number; first_seen_at: number; last_seen_at: number };
}

export interface BleScanResult {
  crowdCount: number;
  isIndoorValidated: boolean;
  ambientHash: string; // Per Anti-Spoofing Outdoor
}

export const startCrowdRadarScan = async (poiId: string): Promise<BleScanResult> => {
  return new Promise(async (resolve) => {
    let crowdCount = 0;
    let isIndoorValidated = false;
    const seenMacs = new Set<string>();

    const ble = getBleManager();
    const btState = await ble.state();
    
    // Fallback UI silenziosa/persuasiva
    if (btState !== State.PoweredOn) {
      if (Platform.OS === 'android') {
        try { await ble.enable(); } catch (e) { return resolve({ crowdCount: 0, isIndoorValidated: false, ambientHash: '' }); }
      } else {
        return resolve({ crowdCount: 0, isIndoorValidated: false, ambientHash: '' });
      }
    }

    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) return resolve({ crowdCount: 0, isIndoorValidated: false, ambientHash: '' });

    // 1. Avvio Scansione
    ble.startDeviceScan(null, { allowDuplicates: false }, (error, device: Device | null) => {
      if (error || !device || !device.id || !device.rssi) return;
      if (device.rssi >= TRUSTED_RSSI_THRESHOLD) {
        seenMacs.add(device.id);
      }
    });

    // 2. Elaborazione Edge Computing (Dopo 5 Secondi)
    setTimeout(async () => {
      ble.stopDeviceScan();
      
      const now = Date.now();
      const storageKey = `loto_known_ble_devices_${poiId}`;
      let localDevices: LocalDeviceMap = {};
      
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) localDevices = JSON.parse(stored);
      } catch (e) {}

      // A. Decadimento Igienico (72h)
      for (const mac in localDevices) {
        if (now - localDevices[mac].last_seen_at > DECAY_MS) {
          delete localDevices[mac];
        }
      }

      // Valutazione Stato del POI (Cold-Start vs Maturazione)
      let isPoiMature = false;
      for (const mac in localDevices) {
        if (localDevices[mac].times_seen >= PROMOTION_QUORUM) {
          isPoiMature = true;
          break;
        }
      }
      const activeQuorum = isPoiMature ? PROMOTION_QUORUM : COLD_START_QUORUM;

      // B. Apprendimento & Statistica
      for (const mac of Array.from(seenMacs)) {
        if (localDevices[mac]) {
          localDevices[mac].times_seen += 1;
          localDevices[mac].last_seen_at = now;
        } else {
          localDevices[mac] = { times_seen: 1, first_seen_at: now, last_seen_at: now };
        }

        // Validazione (Indoor)
        if (localDevices[mac].times_seen >= activeQuorum) {
          isIndoorValidated = true; // Ancora riconosciuta (T0 o T1)
        } else {
          crowdCount++; // Non è un'ancora -> Turista/Folla
        }
      }

      // C. Fingerprint Ambientale (Anti-Spoofing per Outdoor)
      // Generiamo un hash semplice basato sui MAC visti, ordinati alfanumericamente
      const sortedMacs = Array.from(seenMacs).sort().join('|');
      let ambientHash = 0;
      for (let i = 0; i < sortedMacs.length; i++) {
        ambientHash = ((ambientHash << 5) - ambientHash) + sortedMacs.charCodeAt(i);
        ambientHash |= 0;
      }
      const finalHash = ambientHash.toString(16);

      // Salva l'apprendimento per la prossima visita
      AsyncStorage.setItem(storageKey, JSON.stringify(localDevices)).catch(()=>{});

      // D. Invio Statistica Pulita (Risparmio Ingress Data)
      if (crowdCount > 0) {
        try {
          const session = await supabase.auth.getSession();
          const userId = session.data.session?.user?.id;
          if (userId) {
            await supabase.from('crowd_predictions').insert({
              poi_id: poiId,
              reporter_id: userId,
              raw_count: crowdCount,
              confidence_score: 100
            });
          }
        } catch (e) {
          console.log('[BLE Radar] Errore DB:', e);
        }
      }

      resolve({ crowdCount, isIndoorValidated, ambientHash: finalHash });
    }, BLE_SCAN_DURATION_MS);
  });
};
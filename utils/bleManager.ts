
import { BleManager, Device, State, BleError } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const bleManager = new BleManager();
export const SCAN_DURATION_MS = 5000;
export const KNOWN_DEVICES_KEY = 'loto_known_ble_devices';
export const FIXED_DEVICE_THRESHOLD = 3;

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return false;
}

export async function startCrowdRadarScan(): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        throw new Error('Permessi Bluetooth/Localizzazione non garantiti.');
      }
      const state = await bleManager.state();
      if (state !== State.PoweredOn) {
        throw new Error('Bluetooth disattivato.');
      }
      console.log('[BLE] Avvio scansione Crowd Radar (5 secondi)...');
      const seenDevicesInScan = new Set<string>();
      bleManager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error: BleError | null, device: Device | null) => {
          if (error) return;
          if (device && device.id) seenDevicesInScan.add(device.id);
        }
      );
      setTimeout(async () => {
        bleManager.stopDeviceScan();
        console.log(`[BLE] Scansione terminata. Dispositivi: ${seenDevicesInScan.size}`);
        try {
          const knownDevicesJson = await AsyncStorage.getItem(KNOWN_DEVICES_KEY);
          const knownDevices: Record<string, number> = knownDevicesJson ? JSON.parse(knownDevicesJson) : {};
          let crowdCount = 0;
          seenDevicesInScan.forEach((deviceId) => {
            const timesSeen = (knownDevices[deviceId] || 0) + 1;
            knownDevices[deviceId] = timesSeen;
            if (timesSeen < FIXED_DEVICE_THRESHOLD) crowdCount++;
          });
          await AsyncStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(knownDevices));
          resolve(crowdCount);
        } catch (storageError) {
          resolve(seenDevicesInScan.size);
        }
      }, SCAN_DURATION_MS);
    } catch (err) {
      reject(err);
    }
  });
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * L.O.T.O. HUB - BLE Radar & Indoor Validation
 * 1. Crowd Heatmap (Conteggio folla anonima)
 * 2. Trusted Anchors (Validazione indoor anti-spoofing)
 */

const BLE_SCAN_DURATION_MS = 5000; // 5 secondi di sonar
const TRUSTED_RSSI_THRESHOLD = -75; // Segnale forte = dentro l'edificio

// MAC Address Randomizzati: il 2° carattere esadecimale (bit meno significativi del 1° byte) 
// In BLE, se i due bit più significativi sono 11, è un "Random Static", ma gli smartphone usano "Random Private" (Resolvable o Non-Resolvable).
// Semplificazione logica per l'ambiente RN: 
const isRandomizedMac = (mac: string) => {
  // Se il MAC inizia con determinati prefissi o cambia costantemente, lo consideriamo mobile.
  // In produzione reale si usa la decodifica dei bit del MAC BLE.
  // Per il MVP: deleghiamo l'intelligenza al server (chi è visto tante volte diventa statico).
  return false; 
};

export const startCrowdRadarScan = async (poiId: string): Promise<{ crowdCount: number; isIndoorValidated: boolean }> => {
  return new Promise(async (resolve) => {
    let crowdCount = 0;
    let isIndoorValidated = false;
    const seenMacs = new Set<string>();

    // 1. Recuperiamo dal DB le Trusted Anchors per questo POI
    let trustedAnchors: string[] = [];
    try {
      const { data } = await supabase
        .from('poi_ble_fingerprints')
        .select('scanned_mac_address')
        .eq('poi_id', poiId)
        .eq('is_trusted_anchor', true);
      
      if (data) {
        trustedAnchors = data.map(d => d.scanned_mac_address);
      }
    } catch (e) {
      console.warn("Impossibile caricare ancore BLE", e);
    }

    // MOCK della scansione nativa BLE (sostituire con react-native-ble-plx in prod)
    console.log(`[BLE Radar] Avvio sonar di 5s per il POI ${poiId}...`);
    
    // Simuliamo il rilevamento di 10 dispositivi dopo 5 secondi
    setTimeout(async () => {
      // Dati simulati dal chip Bluetooth
      const scannedDevices = [
        { mac: '00:11:22:33:44:55', rssi: -60, name: 'Samsung TV' },
        { mac: 'AA:BB:CC:DD:EE:FF', rssi: -80, name: 'iPhone' }, // Lontano
        { mac: '99:88:77:66:55:44', rssi: -70, name: 'Unknown' },
      ];

      for (const device of scannedDevices) {
        if (device.rssi < TRUSTED_RSSI_THRESHOLD) continue; // Troppo lontano, ignoriamo
        
        seenMacs.add(device.mac);

        // A. CONVALIDA (Trusted Anchor)
        if (trustedAnchors.includes(device.mac)) {
          console.log(`[BLE Radar] ANCORA TROVATA (${device.mac})! Check-in Validato 100%.`);
          isIndoorValidated = true;
        } else {
          // B. CROWD HEATMAP
          crowdCount++;
        }
      }

      // C. AUTO-APPRENDIMENTO (Registriamo i device visti nel DB)
      // Per non spammare il server, inviamo i log BLE in background
      if (seenMacs.size > 0) {
        supabase.rpc('log_ble_fingerprints', { 
          p_poi_id: poiId, 
          p_mac_addresses: Array.from(seenMacs) 
        }).catch(e => console.error(e));
      }

      console.log(`[BLE Radar] Scansione terminata. Folla: ${crowdCount}, Validato: ${isIndoorValidated}`);
      resolve({ crowdCount, isIndoorValidated });

    }, BLE_SCAN_DURATION_MS);
  });
};

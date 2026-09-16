import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { supabase } from './supabase';
import { calculateDistanceRaw } from './haversine';

const STORAGE_KEY = '@sincro_avventura_meters';
const SYNC_THRESHOLD = 200; // Sincronizza ogni 200 metri

let currentSessionMeters = 0;
let subscription: Location.LocationSubscription | null = null;
let lastLocation: Location.LocationObjectCoords | null = null;

// Registrazione Headless Task per Android Notifee
notifee.registerForegroundService((notification) => {
  // Risoluzione immediata per prevenire ANR (Fire-and-forget)
  return Promise.resolve();
});

// Ascolto eventi background separato (Isolate)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
    stopBackgroundTracking();
  }
});

async function syncDistance(userId: string, meters: number): Promise<void> {
  try {
    // 100 metri = 5 XP, 100 metri = 1 PTI. Supabase farà il calcolo.
    // Inoltriamo i metri percorsi.
    const { error } = await supabase.rpc('rpc_sync_adventure_distance', {
      user_id: userId,
      meters_count: Math.round(meters)
    });
    
    if (error) {
      console.error('[SincroAvventura] Errore sincronizzazione distanza:', error);
    }
  } catch (err) {
    console.error('[SincroAvventura] Eccezione durante sincronizzazione distanza:', err);
  }
}

async function incrementDistance(userId: string, meters: number): Promise<void> {
  currentSessionMeters += meters;
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const totalLocal = (stored ? parseFloat(stored) : 0) + meters;
    await AsyncStorage.setItem(STORAGE_KEY, totalLocal.toString());
    
    // Emettiamo evento per l'UI (arrotondato ai metri)
    DeviceEventEmitter.emit('onDistanceIncrement', { total: Math.round(totalLocal) });
    
    if (Platform.OS === 'android') {
const displayDistance = totalLocal > 1000 ? (totalLocal/1000).toFixed(2) + ' Km' : Math.round(totalLocal) + ' m';
      await notifee.displayNotification({
        id: 'sincro-avventura',
        title: 'Eco-Passi Attivi',
        body: `Distanza esplorata: ${displayDistance}`,
        android: {
          channelId: 'sincro-avventura',
          asForegroundService: true,
          importance: AndroidImportance.HIGH,
          onlyAlertOnce: true,
          ongoing: true,
        },
      });
    }

    if (currentSessionMeters >= SYNC_THRESHOLD) {
      const distanceToSync = currentSessionMeters;
      currentSessionMeters = 0;
      await syncDistance(userId, distanceToSync);
    }
  } catch (err) {
    console.error('[SincroAvventura] Errore aggiornamento storage distanza:', err);
  }
}

export async function startBackgroundTracking(userId: string): Promise<void> {
if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'sincro-avventura',
      name: 'Eco-Passi Tracking',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: 'sincro-avventura',
      title: 'Eco-Passi Avviati',
      body: 'In attesa di segnale GPS...',
      android: {
        channelId,
        asForegroundService: true,
        importance: AndroidImportance.HIGH,
        ongoing: true,
        onlyAlertOnce: true,
      },
    });
  }

  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  
  currentSessionMeters = 0;
  lastLocation = null;

  // Richiediamo permessi Foreground e Background per garantire tracking pulito.
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    console.warn('[SincroAvventura] Permesso Foreground negato.');
    return;
  }
  
  // Opzionale: richiamare background per massima persistenza in Android Doze
  await Location.requestBackgroundPermissionsAsync();

  try {
    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation, // Massima precisione
        timeInterval: 5000, // Aggiornamento minimo ogni 5 secondi
        distanceInterval: 10, // Aggiornamento ogni 10 metri reali
      },
      (newLocation) => {
        if (!lastLocation) {
          lastLocation = newLocation.coords;
          return;
        }

        const deltaMeters = calculateDistanceRaw(
          lastLocation.latitude,
          lastLocation.longitude,
          newLocation.coords.latitude,
          newLocation.coords.longitude
        );

// FILTRO ANTI-DRIFT (Kalman povero)
        // Se l'accuratezza del GPS in questo istante è pessima (> 20 metri) o il movimento è irrisorio (< 15 metri)
        // ignoriamo il dato perché è solo rumore (drift) da fermo.
        if (newLocation.coords.accuracy !== null && newLocation.coords.accuracy !== undefined && newLocation.coords.accuracy > 20) return;

        if (deltaMeters >= 15 && deltaMeters < 100) {
          incrementDistance(userId, deltaMeters);
          lastLocation = newLocation.coords;
        }
      }
    );
  } catch (err) {
    console.error('[SincroAvventura] Errore avvio watchPosition:', err);
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  
  if (Platform.OS === 'android') {
    await notifee.stopForegroundService();
  }
}


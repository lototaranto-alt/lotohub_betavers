import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer, Accelerometer } from 'expo-sensors';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { supabase } from './supabase';

const STORAGE_KEY = '@sincro_avventura_steps';
const SYNC_THRESHOLD = 1000;

let currentSessionCount = 0;
let subscription: any = null;
let lastPeakTime = 0;

// Registrazione Headless Task per Android Notifee
notifee.registerForegroundService((notification) => {
  return new Promise((resolve) => {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
        stopBackgroundTracking();
        resolve();
      }
    });
  });
});

async function syncSteps(userId: string, count: number, isAccessibilityMode: boolean): Promise<void> {
  try {
    const { error } = await supabase.rpc('rpc_sync_adventure', {
      user_id: userId,
      steps_count: count,
      is_wheelchair: isAccessibilityMode,
    });
    
    if (error) {
      console.error('[SincroAvventura] Errore sincronizzazione:', error);
    }
  } catch (err) {
    console.error('[SincroAvventura] Eccezione durante sincronizzazione:', err);
  }
}

async function incrementSteps(userId: string, isAccessibilityMode: boolean, steps: number = 1): Promise<void> {
  currentSessionCount += steps;
  
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const totalLocal = (stored ? parseInt(stored, 10) : 0) + steps;
    await AsyncStorage.setItem(STORAGE_KEY, totalLocal.toString());
    DeviceEventEmitter.emit('onStepIncrement', { total: totalLocal });
    
    if (Platform.OS === 'android') {
      await notifee.displayNotification({
        id: 'sincro-avventura',
        title: 'Sincro-Avventura Attiva',
        body: `Passi/Spinte elaborati: ${totalLocal}`,
        android: {
          channelId: 'sincro-avventura',
          asForegroundService: true,
          importance: AndroidImportance.HIGH,
          onlyAlertOnce: true,
          ongoing: true,
        },
      });
    }

    if (currentSessionCount >= SYNC_THRESHOLD) {
      const countToSync = currentSessionCount;
      currentSessionCount = 0;
      await syncSteps(userId, countToSync, isAccessibilityMode);
    }
  } catch (err) {
    console.error('[SincroAvventura] Errore aggiornamento storage:', err);
  }
}

export async function startBackgroundTracking(isAccessibilityMode: boolean, userId: string): Promise<void> {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'sincro-avventura',
      name: 'Sincro Avventura Tracking',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: 'sincro-avventura',
      title: 'Sincro-Avventura Avviata',
      body: 'In attesa di movimento...',
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
  
  currentSessionCount = 0;

  if (!isAccessibilityMode) {
    const { status } = await Pedometer.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[SincroAvventura] Permesso Pedometro negato.');
      return;
    }
  }

  if (isAccessibilityMode) {
    Accelerometer.setUpdateInterval(200);
    subscription = Accelerometer.addListener(accelerometerData => {
      const { x, z } = accelerometerData;
      const magnitude = Math.sqrt(x * x + z * z);
      const now = Date.now();
      
      if (magnitude > 1.5 && now - lastPeakTime > 500) {
        lastPeakTime = now;
        incrementSteps(userId, isAccessibilityMode, 1);
      }
    });
  } else {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      let lastCount = 0;
      subscription = Pedometer.watchStepCount(result => {
        const delta = result.steps - lastCount;
        lastCount = result.steps;
        if (delta > 0) {
          incrementSteps(userId, isAccessibilityMode, delta);
        }
      });
    } else {
      console.warn('[SincroAvventura] Pedometro non disponibile su questo dispositivo.');
    }
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

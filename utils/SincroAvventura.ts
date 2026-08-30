import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer, Accelerometer } from 'expo-sensors';
// import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { supabase } from './supabase';

const STORAGE_KEY = '@sincro_avventura_steps';
const SYNC_THRESHOLD = 1000;

let currentSessionCount = 0;
let subscription: any = null;
let lastPeakTime = 0;



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
  

  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  
  currentSessionCount = 0;

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
    // await notifee.stopForegroundService();
  }
}

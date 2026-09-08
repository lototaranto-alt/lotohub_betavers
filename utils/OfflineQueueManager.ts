import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { LruCacheManager } from './LruCacheManager';

const OFFLINE_QUEUE_KEY = 'loto_offline_action_queue';

export type QueueActionType = 'UNLOCK_MEDIA' | 'CHECKIN_GPS';

export interface QueueItem {
  id: string; // unique ID to prevent duplicates (e.g. `${type}_${poiId}`)
  type: QueueActionType;
  payload: any; // e.g. { mediaId, lotoCost } or { poiId, lat, lng }
  description: string; // for logging and UI (e.g. "Sblocco Media", "Check-in GPS")
  queuedAt: number;
}

export type QueueStatus = 'synced' | 'pending' | 'syncing' | 'error';

type StatusListener = (status: QueueStatus, pendingCount: number) => void;

export class OfflineQueueManager {
  private static listeners: StatusListener[] = [];
  private static isSyncing = false;

  static addListener(listener: StatusListener): () => void {
    this.listeners.push(listener);
    this.getQueue().then(queue => {
      listener(queue.length > 0 ? 'pending' : 'synced', queue.length);
    });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(status: QueueStatus, pendingCount: number) {
    this.listeners.forEach(listener => {
      try {
        listener(status, pendingCount);
      } catch (e) {
        console.error('[OfflineQueue] Errore nel notificare il listener:', e);
      }
    });
  }

  static async getQueue(): Promise<QueueItem[]> {
    try {
      const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  }

  // --- COMPATIBILITA' ESISTENTE: SBLOCCO MEDIA ---
  static async enqueueUnlock(mediaId: string, lotoCost: number, poiName: string): Promise<void> {
    const queue = await this.getQueue();
    const id = `UNLOCK_${mediaId}`;
    if (queue.some(item => item.id === id)) return;

    queue.push({
      id,
      type: 'UNLOCK_MEDIA',
      payload: { mediaId, lotoCost, poiName },
      description: `Sblocco "${poiName}" (${lotoCost} PTI)`,
      queuedAt: Date.now()
    });

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Accodato ${id}`);
    this.notifyListeners('pending', queue.length);
  }

  // --- NUOVA FUNZIONE: CHECK-IN GPS ---
  static async enqueueCheckinGPS(poiId: string, lat: number, lng: number, poiName: string): Promise<void> {
    const queue = await this.getQueue();
    const id = `CHECKIN_${poiId}`; // Evita spam dello stesso checkin
    if (queue.some(item => item.id === id)) return;

    queue.push({
      id,
      type: 'CHECKIN_GPS',
      payload: { poiId, lat, lng },
      description: `Check-in GPS a "${poiName}"`,
      queuedAt: Date.now()
    });

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Accodato ${id}`);
    this.notifyListeners('pending', queue.length);
  }

  static async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    
    const queue = await this.getQueue();
    if (queue.length === 0) {
      this.notifyListeners('synced', 0);
      return;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('[OfflineQueue] Impossibile processare: Rete disconnessa.');
      this.notifyListeners('pending', queue.length);
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing', queue.length);
    const remainingItems: QueueItem[] = [];

    for (const item of queue) {
      try {
        console.log(`[OfflineQueue] Processo: ${item.description}`);
        
        if (item.type === 'UNLOCK_MEDIA') {
          const { mediaId } = item.payload;
          const { data, error } = await supabase.rpc('sblocca_media', { p_media_id: mediaId });
          
          if (error) throw error;
          
          const success = data[0]?.unlocked;
          const mediaPath = data[0]?.media_path;
          
          if (success) {
            const { data: signedData } = await supabase.storage.from('loto-vault').createSignedUrl(mediaPath, 900);
            if (signedData?.signedUrl) {
              const fileName = mediaPath.split('/').pop() || `${mediaId}.mp4`;
              await LruCacheManager.downloadFile(signedData.signedUrl, fileName);
            }
          } else if (data[0]?.message?.includes('insufficiente')) {
             console.error('[OfflineQueue] Rimozione elemento: saldo insufficiente.');
             continue; // scarta
          }
        } 
        else if (item.type === 'CHECKIN_GPS') {
          const { poiId, lat, lng } = item.payload;
          // Usa la nuova RPC anti-spoofing appena scritta!
          const { data, error } = await supabase.rpc('scan_poi_gps', { 
             p_poi_id: poiId, p_lat: lat, p_lng: lng 
          });
          
          if (error) {
             // Se è un errore di cooldown (12h), lo scartiamo perché è ormai inutile
             if (error.message.includes('Cooldown')) {
                console.warn('[OfflineQueue] Scartato check-in per Cooldown attivo.');
                continue;
             }
             throw error;
          }
        }

      } catch (err) {
        console.error(`[OfflineQueue] Fallimento transitorio per ${item.id}:`, err);
        remainingItems.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingItems));
    this.isSyncing = false;

    if (remainingItems.length > 0) {
      this.notifyListeners('error', remainingItems.length);
    } else {
      this.notifyListeners('synced', 0);
    }
  }

  static init(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { LruCacheManager } from './LruCacheManager';

const OFFLINE_QUEUE_KEY = 'loto_offline_unlock_queue';

export interface QueueItem {
  mediaId: string;
  lotoCost: number;
  poiName: string;
  queuedAt: number;
}

export type QueueStatus = 'synced' | 'pending' | 'syncing' | 'error';

type StatusListener = (status: QueueStatus, pendingCount: number) => void;

export class OfflineQueueManager {
  private static listeners: StatusListener[] = [];
  private static isSyncing = false;

  /**
   * Registra un listener per ricevere aggiornamenti sullo stato della coda
   */
  static addListener(listener: StatusListener): () => void {
    this.listeners.push(listener);
    // Invia lo stato iniziale
    this.getQueue().then(queue => {
      listener(queue.length > 0 ? 'pending' : 'synced', queue.length);
    });

    // Ritorna la funzione per rimuovere il listener
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

  /**
   * Recupera la coda di sblocchi pendenti da AsyncStorage
   */
  static async getQueue(): Promise<QueueItem[]> {
    try {
      const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Aggiunge una richiesta di sblocco alla coda offline
   */
  static async enqueueUnlock(mediaId: string, lotoCost: number, poiName: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      
      // Evita duplicati nella coda
      if (queue.some(item => item.mediaId === mediaId)) {
        console.log(`[OfflineQueue] Media ${mediaId} già presente nella coda offline.`);
        return;
      }

      const newItem: QueueItem = {
        mediaId,
        lotoCost,
        poiName,
        queuedAt: Date.now()
      };

      queue.push(newItem);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      
      console.log(`[OfflineQueue] Accodato sblocco offline per: ${poiName} (Costo: ${lotoCost} PTI)`);
      this.notifyListeners('pending', queue.length);
      
    } catch (e) {
      console.error('[OfflineQueue] Errore enqueueUnlock:', e);
    }
  }

  /**
   * Avvia il processamento della coda offline (da chiamare quando si è online)
   */
  static async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    
    const queue = await this.getQueue();
    if (queue.length === 0) {
      this.notifyListeners('synced', 0);
      return;
    }

    // Verifica connettività effettiva prima di partire
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('[OfflineQueue] Tentativo di sync ma la rete risulta ancora disconnessa.');
      this.notifyListeners('pending', queue.length);
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing', queue.length);
    console.log(`[OfflineQueue] Inizio sincronizzazione coda di ${queue.length} elementi...`);

    const remainingItems: QueueItem[] = [];

    for (const item of queue) {
      try {
        console.log(`[OfflineQueue] Sincronizzo sblocco per POI ${item.poiName} (${item.mediaId})`);
        
        // Esegue la RPC transazionale su Supabase
        const { data, error } = await supabase.rpc('sblocca_media', {
          p_media_id: item.mediaId
        });

        if (error) {
          console.error(`[OfflineQueue] Errore RPC per ${item.poiName}:`, error.message);
          remainingItems.push(item); // Tiene in coda per riprovare
          continue;
        }

        const res = data as any;
        const success = res[0]?.unlocked;
        const mediaPath = res[0]?.media_path;
        const msg = res[0]?.message;

        if (success) {
          console.log(`[OfflineQueue] Sblocco registrato con successo sul DB. Avvio download in background...`);
          
          // Genera il link firmato da Supabase Storage usando il path restituito
          const { data: signedData, error: storageError } = await supabase
            .storage
            .from('loto-vault')
            .createSignedUrl(mediaPath, 900); // URL valido 15 minuti

          if (storageError || !signedData?.signedUrl) {
            console.error('[OfflineQueue] Errore creazione signed URL:', storageError?.message);
            remainingItems.push(item);
            continue;
          }

          // Scarica fisicamente nella sandbox tramite LruCacheManager
          const fileName = mediaPath.split('/').pop() || `${item.mediaId}.mp4`;
          const downloadedPath = await LruCacheManager.downloadFile(signedData.signedUrl, fileName);

          if (downloadedPath) {
            console.log(`[OfflineQueue] Contenuto scaricato e salvato localmente: ${downloadedPath}`);
          } else {
            console.warn('[OfflineQueue] Download completato ma salvataggio fallito. Riprovo al prossimo ciclo.');
            remainingItems.push(item);
          }
        } else {
          console.warn(`[OfflineQueue] RPC sblocca_media ha risposto negativo: ${msg}`);
          // Se il saldo punti è insufficiente o non esiste sul server, rimuoviamo per non bloccare la coda
          if (msg && msg.includes('insufficiente')) {
            console.error('[OfflineQueue] Rimozione elemento per saldo punti insufficiente sul server.');
          } else {
            remainingItems.push(item);
          }
        }

      } catch (err) {
        console.error(`[OfflineQueue] Eccezione durante la sincronizzazione di ${item.poiName}:`, err);
        remainingItems.push(item);
      }
    }

    // Aggiorna AsyncStorage con gli elementi rimasti (se presenti)
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingItems));
    this.isSyncing = false;

    if (remainingItems.length > 0) {
      console.log(`[OfflineQueue] Riconciliazione parziale completata. Rimangono ${remainingItems.length} elementi.`);
      this.notifyListeners('error', remainingItems.length);
    } else {
      console.log('[OfflineQueue] Riconciliazione completata con successo! Coda svuotata.');
      this.notifyListeners('synced', 0);
    }
  }

  /**
   * Inizializza l'ascolto dello stato di connettività per la sincronizzazione automatica
   */
  static init(): void {
    console.log('[OfflineQueue] Inizializzazione manager coda offline...');
    
    NetInfo.addEventListener(state => {
      console.log('[OfflineQueue] Rete cambiata - Connesso:', state.isConnected, '| Tipo:', state.type);
      if (state.isConnected) {
        // Se siamo online, prova a processare la coda pendente
        this.processQueue();
      }
    });
  }
}

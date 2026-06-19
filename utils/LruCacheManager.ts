import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_DIR = `${(FileSystem as any).documentDirectory || ''}loto_vault/`;
const LRU_METADATA_KEY = 'loto_vault_lru_metadata';
const CACHE_LIMIT_BYTES = 150 * 1024 * 1024; // Limitazione fissa a 150MB per salvaguardia dispositivi

interface LruMetadata {
  [fileName: string]: number; // Nome file -> timestamp dell'ultimo accesso/ascolto
}

export class LruCacheManager {
  /**
   * Inizializza la directory del vault sandboxed se non esiste
   */
  static async init(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(VAULT_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
        console.log('[LruCache] Creata cartella vault locale:', VAULT_DIR);
      }
    } catch (e) {
      console.error('[LruCache] Errore inizializzazione directory:', e);
    }
  }

  /**
   * Aggiorna il timestamp di ultimo accesso/riproduzione per un file
   */
  static async touchFile(fileName: string): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(LRU_METADATA_KEY);
      const metadata: LruMetadata = metadataStr ? JSON.parse(metadataStr) : {};
      
      metadata[fileName] = Date.now();
      
      await AsyncStorage.setItem(LRU_METADATA_KEY, JSON.stringify(metadata));
      console.log(`[LruCache] Registrato accesso (touch) per il file: ${fileName}`);
    } catch (e) {
      console.error('[LruCache] Errore touchFile:', e);
    }
  }

  /**
   * Ritorna il percorso locale assoluto della sandbox per un file
   */
  static getLocalPath(fileName: string): string {
    // Pulisce eventuali slash iniziali per evitare concatenazioni non valide
    const cleanName = fileName.replace(/^\//, '');
    return `${VAULT_DIR}${cleanName}`;
  }

  /**
   * Verifica se un file è presente fisicamente in cache localmente
   */
  static async fileExists(fileName: string): Promise<boolean> {
    await this.init();
    const localPath = this.getLocalPath(fileName);
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      return fileInfo.exists;
    } catch {
      return false;
    }
  }

  /**
   * Calcola la dimensione totale in byte di tutti i file nel vault sandboxed
   */
  static async getCacheSize(): Promise<number> {
    await this.init();
    try {
      const files = await FileSystem.readDirectoryAsync(VAULT_DIR);
      let totalSize = 0;
      
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${VAULT_DIR}${file}`);
        if (fileInfo.exists && !fileInfo.isDirectory) {
          totalSize += fileInfo.size;
        }
      }
      return totalSize;
    } catch (e) {
      console.error('[LruCache] Errore calcolo dimensione cache:', e);
      return 0;
    }
  }

  /**
   * Rimuove i file meno utilizzati (LRU) se la cache supera il limite di 150MB
   */
  static async enforceCacheLimit(): Promise<void> {
    try {
      let currentSize = await this.getCacheSize();
      const currentMb = (currentSize / (1024 * 1024)).toFixed(2);
      console.log(`[LruCache] Stato memoria: ${currentMb} MB / 150.00 MB`);
      
      if (currentSize <= CACHE_LIMIT_BYTES) {
        return; // Sotto la soglia, nessun intervento
      }

      console.log('[LruCache] Quota cache superata. Avvio pulizia selettiva LRU...');

      const metadataStr = await AsyncStorage.getItem(LRU_METADATA_KEY);
      const metadata: LruMetadata = metadataStr ? JSON.parse(metadataStr) : {};

      const files = await FileSystem.readDirectoryAsync(VAULT_DIR);
      const fileList = [];

      for (const file of files) {
        const filePath = `${VAULT_DIR}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && !fileInfo.isDirectory) {
          const lastAccess = metadata[file] || 0; // Se non tracciato, assume 0 (priorità eliminazione)
          fileList.push({
            name: file,
            path: filePath,
            size: fileInfo.size,
            lastAccess
          });
        }
      }

      // Ordina i file dal più vecchio (ultimo accesso minore) al più recente
      fileList.sort((a, b) => a.lastAccess - b.lastAccess);

      for (const fileObj of fileList) {
        if (currentSize <= CACHE_LIMIT_BYTES) {
          break; // Dimensione tornata sotto controllo
        }

        console.log(`[LruCache] LRU - Elimino file non recente: ${fileObj.name} (${(fileObj.size / (1024 * 1024)).toFixed(2)} MB)`);
        await FileSystem.deleteAsync(fileObj.path, { idempotent: true });
        
        delete metadata[fileObj.name];
        currentSize -= fileObj.size;
      }

      // Salva i metadati aggiornati
      await AsyncStorage.setItem(LRU_METADATA_KEY, JSON.stringify(metadata));
      console.log(`[LruCache] Pulizia completata. Nuova dimensione cache: ${(currentSize / (1024 * 1024)).toFixed(2)} MB`);

    } catch (e) {
      console.error('[LruCache] Errore enforceCacheLimit:', e);
    }
  }

  /**
   * Scarica un file remoto salvandolo nella sandbox locale e applicando la pulizia LRU
   */
  static async downloadFile(remoteUrl: string, fileName: string): Promise<string | null> {
    await this.init();
    const localPath = this.getLocalPath(fileName);
    
    try {
      console.log(`[LruCache] Download in corso per: ${fileName}`);
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, localPath);
      
      if (downloadResult.status === 200) {
        console.log(`[LruCache] File salvato in locale: ${fileName}`);
        
        // Aggiorna l'accesso ed esegue il controllo cap
        await this.touchFile(fileName);
        await this.enforceCacheLimit();
        
        return localPath;
      } else {
        console.error('[LruCache] Download fallito con status code:', downloadResult.status);
        return null;
      }
    } catch (e) {
      console.error('[LruCache] Errore durante il download del file:', e);
      return null;
    }
  }
}

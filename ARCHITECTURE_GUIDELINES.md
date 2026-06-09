# 🛡️ L.O.T.O. HUB - Architettura e Linee Guida di Sicurezza

## 1. Permessi e Fallback
Gestire sempre i rifiuti per GPS, NFC e Fotocamera in modo elegante senza far crashare l'app.

## 2. Sicurezza Dati (RLS)
Nessuna tabella deve avere permessi di scrittura pubblici. Implementare le policy RLS su Supabase.

## 3. Ciclo di Vita (Background/Foreground)
Eventi critici (sincronizzazione offline, refresh GPS) devono essere agganciati al listener `AppState` al ritorno in Foreground.

## 4. Limiti AsyncStorage
Usare AsyncStorage SOLO per stringhe leggere. I file offline (es. foto scontrini) vanno nel File System nativo (`expo-file-system`).

## 5. Transizione EAS
Ogni pacchetto aggiunto deve essere compatibile con le build native tramite EAS.

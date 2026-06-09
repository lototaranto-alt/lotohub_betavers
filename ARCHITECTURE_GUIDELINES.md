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

## 6. Logica White-Label e Zero-Code
* Nessuna validazione spaziale complessa nel frontend. Il Geofencing e la triangolazione sono gestiti dal backend (PostGIS) per garantire un data-entry Zero-Code sicuro alle Web Agency.

## 7. UX e Gamification (Anti-TripAdvisor Rule)
* L'app NON deve includere sistemi di recensione pubblica visibili tra utenti. I feedback sui P.O.I./Partner saranno raccolti in forma privata/anonima per le dashboard B2B. L'interazione social degli utenti si limiterà alla creazione e condivisione dei "Percorsi" personali.



---
id: ZERO-IOT-E-OFFLINE
tipo: analisi
ambito: punto-3-interazione-zero-iot-e-sincronizzazione-offline
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:107
  - supabase/migrations/20260927090000_scan_chain_shadowban_and_ledger.sql:83
  - components/PoiDetailSheet.tsx:136
  - components/PoiDetailSheet.tsx:576
  - components/PoiScannerModal.tsx:62
  - utils/nfcManager.ts:11
  - utils/OfflineQueueManager.ts:69
  - utils/bleManager.ts:11
---

# Punto 3 — Interazione "Zero-IoT" e sincronizzazione offline

## 0. Esito in apertura

| Claim | Esito |
|---|---|
| NFC e GPS innescano entrambi lo scan BLE di 5 secondi | **CONFERMATO a metà**: solo il GPS. Il ramo NFC non lo chiama |
| Tag NFC crittografati NTAG424 per partner e custodi | **ROTTO**: la crittografia esiste alle due estremità e non è collegata |
| Coda offline crittografata, l'app non blocca l'utente | **ROTTO**: non è crittografata, non si svuota mai, e i check-in non si accodano |
| Anti-spoofing lato DB con `scan_poi_gps` | **CONFERMATO**, ma è rimasto un pezzo in laboratorio |

Il claim numero 4 è l'unico che regge, ed è anche quello su cui poggia la parte più seria del
prodotto. Gli altri tre sono architetture scritte e cablate a metà.

---

## 1. Tutte le formule di questo punto

Il punto le chiede esplicitamente, quindi sono qui con valore e provenienza. Quelle che valgono
per tutto il prodotto sono già in `FORMULE-PROPRIETARIE.md`; qui solo quelle di scansione.

### 1.1 Raggio di prossimità

```
accettata se   ST_Distance(posizione_utente, poi.coords) <= poi.checkin_radius
```

`supabase/migrations/20260926120000_scan_chain_canonical.sql:158-165`. Il raggio **non è cablato a
80 m**: viene dalla colonna `pois.checkin_radius`, riga per riga. È la scelta giusta (un cortile
pubblico e un museo hanno porte diverse) e va difesa.

> ⚠️ **Questa formula non è nella versione viva.** Vedi §4.

### 1.2 Anti-spoofing velocità

```
velocita' = distanza_ultimo_checkin / ore_trascorse
>  130 km/h  ->  SHADOWBAN   (visita registrata, XP=0, CO2=0, esclusa dai DaaS)
20-130 km/h  ->  VEICOLARE   (XP sì, CO2 no)
   < 20 km/h  ->  PEDONALE    (XP sì, CO2 sì)
```

`20260926120000:178-210`. Il `GREATEST(..., 0.01)` a riga 184 evita la divisione per zero quando il
tempo trascorso è zero.

**Il rischio, e la ragione per cui 130 è giusto:** se il GPS aggancia male e restituisce un punto
a 3 km, la velocità calcolata supera 130 e l'utente legittimo viene marchiato. La difesa non è
abbassare la soglia, è non pubblicare nulla sotto una **griglia minima di k visitanti** — la stessa
k=5 della heatmap e delle Mete Consigliate. Un solo k in tutto il prodotto.

### 1.3 Cooldown

```
nessun XP se esiste gia' una visita dello stesso utente allo stesso POI
negli ultimi 12 ore
```

`20260926120000:187-194`, con `v_cooldown_hours := 12` a riga 132. Il commento a riga 188 dice la
cosa giusta: *"Questo è il vero atto di chiusura dell'exploit XP (non un indice unique)"*. **Concordo,
ed è l'opposto di quello che fanno le altre tabelle del progetto**, che si affidano a vincoli
`UNIQUE` che sui `uuid` non hanno mai funzionato.

Nota: in cooldown la funzione **non scrive niente** (`IF NOT v_visited_today`, riga 215). Una riga
con XP=0 non sarebbe una visita reale e inquinerebbe la heatmap DaaS. È la scelta giusta.

### 1.4 Presenza fisica per l'accredito (fase 2)

```
scan_poi(p_poi_id) e' autorizzata solo se esiste una riga in user_pois
per (utente, POI) negli ultimi 15 minuti
```

`20260926120000:345-357`. Altrimenti `RAISE EXCEPTION 'Check-in non autorizzato: nessuna
validazione GPS recente'`.

È la parte meglio progettata di tutte: la ricompensa **è già stata contabilizzata** da
`scan_poi_gps`, e `scan_poi` non accredita nulla (riga 359). È solo la conferma finale. Due fasi,
una sola scrittura.

### 1.5 Ricompense

`20260926120000:196-210`: `xp_reward` e `base_co2` **vengono dal POI**, non sono numeri scritti a
mano. La versione del 27/09 usa invece `COALESCE(xp_reward, 15)` e `1.5` cablati, più i PTI
(10 pedonale / 1 veicolare). Le due versioni **non coincidono**; vedi §4.

### 1.6 Density proxy BLE

Già verificata e documentata in `FORMULE-PROPRIETARIE.md` §2: 5 s, RSSI ≥ -75, quorum 5 (POI
maturo) o 2 (POI nuovo), decadimento 72 h, hash djb2 dei MAC ordinati. Il ramo NFC non la
innesca, quindi metà della formula è adoperata a metà.

---

## 2. Il ramo GPS: il BLE parte, ma nessuno lo guarda

`components/PoiDetailSheet.tsx:136-139`:

```ts
// FIRE & FORGET: Avviamo il Radar BLE in background per mappare la folla.
import('../utils/bleManager').then(module => {
  module.startCrowdRadarScan(poi.id).catch(err => console.log('BLE Error', err));
});
```

Tre cose da notare, nessuna delle quali è un problema di per sé:

1. **È fire-and-forget.** Non è `await`, il risultato non viene usato dal flusso. Va bene: non
   si fa aspettare l'utente 5 secondi. `bleManager` scrive da solo in `crowd_predictions` e basta.
2. **L'errore è solo un `console.log`.** Se il BLE fallisce non succede niente di visibile, il
   check-in prosegue. È il comportamento voluto.
3. **Quindi il BLE non "completa il circo di azioni".** È un canale indipendente che scrive una
   tabella. Non partecipa alla validazione del check-in: non sblocca niente, non sanziona niente.

Il commento del claim — "con le sue formule completa il circo di azioni" — suggerisce che il BLE
sia un anello del meccanismo di validazione. **Non lo è.** È telemetria. Va detto chiaramente,
perché un domani si vende "validazione a tre fattori" e questa frase è già scritta.

---

## 3. Il ramo NFC: crittografia esatta, cablaggio assente

Qui la situazione è più interessante, perché **la parte difficile è stata fatta bene**.

### 3.1 Cosa c'è

`utils/nfcManager.ts` è un'implementazione corretta:

```ts
const p = /* parametro 'p' = PICCDATA, dall'URL del tag */
const c = /* parametro 'c' = CMAC */
// SICUREZZA ARCHITETTURALE: L'app fa solo da postino.
await supabase.rpc('validate_ntag424_sdm', { picc_data: p, cmac: c })
```

Estrae i due parametri crittografici dall'NDEF e li manda al backend, che valida l'AES-128. Il
commento spiega il perché ed è giusto: **le chiavi AES non stanno nell'APK**, quindi un competitor
che fa reverse engineering dell'app non ottiene nulla. È la scelta giusta per un prodotto che si
distingue per la "Proof of Action".

E la RPC c'è: `validate_ntag424_sdm` è definita in
`20260926120000_scan_chain_canonical.sql:325`.

### 3.2 Cosa non c'è

**`scanEncryptedTag` non è chiamata da nessuna parte.** Unico match in tutto il repository è la sua
stessa dichiarazione, `utils/nfcManager.ts:11`. È codice morto.

E il flusso che l'utente può davvero premere fa un'altra cosa. `PoiScannerModal.tsx:48-67`:

```ts
const uri = Ndef.uri.decodePayload(payload);
Alert.alert('Tag NFC Rilevato!', `Contenuto: ${uri || 'Dati NDEF'}`);
onScanSuccess(uri || 'nfc-tag-id');        // <-- grezzo, nessuna validazione
```

Nessuna chiamata a `validate_ntag424_sdm`. Nessuna estrazione di `p` e `c`. **Il contenuto grezzo
del tag viene mostrato in un Alert e passato avanti.**

Nello stesso file che dovrebbe fare il check-in, l'import di NfcManager è **commentato**:
`components/PoiDetailSheet.tsx:22`.

### 3.3 E il tag non serve a nulla

`components/PoiDetailSheet.tsx:562-576`, l'handler di `onScanSuccess`:

```ts
if (scannedData.includes('loto.app/e/1') || scannedData.includes('plasticaqqua')) {
   setIsEventSheetVisible(true);
} else {
   const { data, error } = await supabase.rpc('scan_poi', { p_poi_id: poi.id });
```

Due cose, e la seconda è la grave.

1. **Il contenuto del tag serve solo a distinguere l'evento rifiuti.** Per tutto il resto non
   guarda che POI sia.
2. **Passa `p_poi_id: poi.id`** — cioè il POI che l'utente ha già aperto nella scheda, **non quello
   codificato nel tag**. Quindi la scansione non seleziona la destinazione: conferma quella che è
   già selezionata.

E `scan_poi`, per §1.4, **non accredita niente**: richiede che una `scan_poi_gps` sia passata per
quel POI negli ultimi 15 minuti, altrimenti solleva un errore. Quindi il bottone "Acquisisci POI
(NFC/QR)" o fallisce, o rilegge un totale già accreditato.

**Verdetto: il ramo NFC non è una validazione alternativa. È un secondo pulsante che duplica il
primo con un passaggio in meno.**

Il claim dice "per i partner commerciali custodi". Va detto chiaramente: **non esiste un flusso
check-in dedicato ai partner**. Un partner è un POI con `category = 'partner'`, non un percorso
di autenticazione diverso.

---

## 4. Il claim che regge, e il buco che nessuno sapeva

`scan_poi_gps` **esiste nel cloud** ed è attivo (corpo 2, `ESITO-QUERY.md:54`). La validazione non
è nel client, usa `auth.uid()`, e il claim è corretto.

Due precisazioni, perché il testo sbaglia dove il codice ha ragione:

- **Non è "isteresi temporale"**: è un **cooldown** di 12 ore sullo stesso POI. L'isteresi vera
  esiste, ma altrove: `HYSTERESIS_TIMER_MS` in `utils/BackgroundLocationTask.ts:11`, che serve al
  cambio città, non ai check-in.
- **Il shadowban non è un blocco.** La visita **viene registrata**, con XP=0 e CO2=0, e resta
  memorizzata. `success: false` nella risposta (riga 367), e l'utente vede un errore. È una
  sanzione silenziosa e reversibile, non un rifiuto: **e va detto all'utente**, perché scoprire
  settimane dopo che il proprio check-in non è valso nulla è il modo migliore per perderlo.

### 4.1 Il proximity gate è sparito

Qui c'è il difetto serio, e non è nel testo del claim: **è sparito dal codice**.

`20260926120000_scan_chain_canonical.sql` implementa la formula §1.1 alle righe 157-165, con
`checkin_radius`, `ST_Distance` e il messaggio *"Sei troppo distante dal POI per il check-in"*.
Cinque occorrenze di quel controllo.

`20260927090000_scan_chain_shadowban_and_ledger.sql` **sostituisce il corpo della funzione** e
delle cinque ne resta **una**: `ST_Distance` a riga 149, che serve per l'**anti-velocità**, non per
la prossimità. **`checkin_radius` non è più letto da nessuna parte.**

La versione del 27/09 è quella che il suo stesso header dichiara *"verificata token per token
contro il corpo restituito dal cloud"*. Quindi quello che manca **manca anche in produzione**.

Conseguenza, e qui sta il punto:

```
utente nuovo, primo check-in della vita, dal balcone di casa
   -> nessun check-in precedente, quindi nessuna velocita' da calcolare
   -> nessun controllo di prossimita'
   -> 15 XP accreditati, riga in user_pois scritta
   -> finisce nella heatmap DaaS e nel report che si vende alla PA
```

Nessun errore, nessun avviso. È il controllo che tiene insieme tutta la "Proof of Action", e non
c'è. Il 20 km/h, il 130 km/h, il cooldown, lo shadowban: tutto il resto è a posto, e senza questo
non serve.

**Non sto dicendo che sia stato fatto apposta.** Sto dicendo che la sostituzione del corpo ha
portato via un controllo che il commento di riga 188 chiama *"il vero atto di chiusura"* — per
l'exploit XP, in effetti, non per la prossimità, ma il principio è lo stesso: qui si difendeva
l'esistenza della visita, non il suo valore. `Q24`.

---

## 5. OfflineQueueManager: quattro cose, tutte da sistemare

Il file c'è, è scritto bene, e `utils/OfflineQueueManager.ts` fa esattamente quello che dice il
nome. Ma il claim ne descrive una versione che non è questa.

### 5.1 Non è crittografato

```ts
await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
```

Riga 69, e 88. `AsyncStorage` su Android è in chiaro. La coda contiene `lat`, `lng` e `poiId`
(riga 83). Quindi: **lo storico preciso delle posizioni dell'utente, in chiaro sul dispositivo**,
e sopravvive ai riavvii.

Non è un difetto di privacy GDPR in senso stretto, perché i dati restano sul dispositivo
dell'utente. Ma è il posto dove finisce il dato più sensibile che l'app raccolga, ed è l'unico
scritto senza alcuna protezione. Cifratura a riposo, o almeno non promettere "crittografati".

### 5.2 Non si svuota mai

`static init()` (riga 170) registra il listener di `NetInfo` che chiama `processQueue()` quando
torna la rete. **`init()` non è chiamato da nessuna parte.** Stessa forma del claim "l'app non
blocca l'utente": la coda si riempie e non si svuota, perché il meccanismo di svuotamento non è
stato avviato. `processQueue()` non ha chiamanti esterni.

### 5.3 I check-in non si accodano

`enqueueCheckinGPS` (riga 75) **non ha nessun chiamante.** L'unica `enqueue*` usata è
`enqueueUnlock`, da `PoiDetailSheet.tsx:325`.

Quindi il check-in offline **non esiste**: nessuno lo accoda, nessuno lo invia. E il percorso
reale del check-in GPS, a `PoiDetailSheet.tsx:161-162`, è:

```ts
} catch (e: any) {
   Alert.alert('Errore GPS', e.message);
}
```

**Nessun fallback in coda.** Senza rete l'utente vede un errore e il check-in è perso. Il claim
"l'app non blocca l'utente" è vero solo per lo sblocco media.

### 5.4 E le "transazioni" non sono in coda

`QueueActionType` (riga 8) conosce due tipi: `UNLOCK_MEDIA` e `CHECKIN_GPS`. Il ledger ESG non c'è,
e non è Typescript che lo esclude: semplicemente non è stato pensato.

---

## 6. Il difetto che non è in nessun claim: la coda mente sul tempo

Questo è il più subdolo, e vale anche se tutto quanto sopra viene sistemato.

La funzione server scrive `visited_at` con **`now()`** (`20260927090000:187`), cioè l'istante in cui
**il server riceve** la richiesta, non quello in cui l'utente era lì.

Quindi un check-in accodato alle 18:00 in un zona senza rete, inviato alle 21:00 quando il segnale
torna, viene registrato **alle 21:00**. E non è un dettaglio:

| Cosa dipende da `visited_at` | Cosa succede |
|---|---|
| Cooldown 12 h (§1.3) | slitta in avanti: sbaglia nel generoso |
| Presenza 15 min di `scan_poi` (§1.4) | **impossibile** dopo il ritorno della rete |
| Finestra 1 h di occupazione Mete Consigliate | il POI risulta vuoto al momento in cui era pieno |
| Bucket 15 min della heatmap DaaS | il dato finisce nello sconsigliato |
| Report ESG temporali | il deflusso è spostato di ore |

Il caso peggiore è la riga 2: un check-in offline non può **mai** chiudere la seconda fase, perché
quando arriva al server sono passati più di 15 minuti dal momento in cui l'utente era davvero lì.
Il giro si chiude solo se l'utente rifà il check-in online.

Ed è la ragione per cui la coda offline, per il check-in, **non è una feature mancante: è una
trappola**. Accodare un check-in significa promettere all'utente che verrà registrato, e il sistema
registrerebbe qualcos'altro. `Q25`.

**Il timestamp va trasportato.** `enqueueCheckinGPS` riceve `lat` e `lng` ma non l'ora, e
`scan_poi_gps` non accetta un parametro temporale. Finché l'orario è deciso dal server, la
sincronizzazione offline del check-in non èimplementabile senza cambiare la firma della funzione.

---

## 7. Cosa blocca questo punto

1. **`Q24`** — il proximity gate è stato perso di proposito o per sostituzione? Prima di tutto va
   ripristinato in una migration; poi va deciso se il raggio resta per-POI. **È il punto più
   urgente dei tre punti finora esaminati.**
2. **`Q25`** — la coda offline deve poter accreditare check-in retroattivi? Se sì, `scan_poi_gps`
   accetta un `p_visited_at` e la firma cambia, quindi va rifatta insieme a `scan_poi`. Se no, la
   coda va limitata a `UNLOCK_MEDIA` e il claim va riscritto.
3. **Decidere il ruolo dell'NFC.** O si cabla `scanEncryptedTag` e il tag diventa la prova, o si
   dichiara che il check-in è solo GPS e si toglie il bottone. Il secondo è più semplice e
   onesto; il primo è ciò che rende il prodotto diverso.

## 8. Il verdetto di sintesi

Le tre formule di validazione del claim 4 sono giuste e ben fatte. Il claim 3 è vero ma
incompleto. I claim 1 e 2 descrivono un'app più robusta di quella che c'è.

E la cosa che conta più di tutte, detta in una riga: **la distanza dal POI non viene più
controllata, e senza quella tutte le altre formule proteggono il valore di una visita che non è
avvenuta.**

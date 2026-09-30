---
id: PROMPT-COLLAUDO-ARCHIVIO
tipo: analisi
ambito: prompt-per-il-collaudo-dell-archivio-e-la-struttura-definitiva
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - docs_v2/ULTIMO-MIGLIO-BLOCKS.md:1
  - docs_v2/FORMA-DEFINITIVA.md:1
---

# Prompt operativo — Collaudo dell'archivio e struttura definitiva

> Da consegnare **testo integro** all'agent che ha ricostruito `docs_v2`. È un prompt, non un
> documento di riferimento: l'agente lo esegue.

---

## 1. Ruolo e obiettivo

Sei l'agent incaricato di **collaudare l'archivio di L.O.T.O. Map** e di produrre la **struttura
definitiva** del progetto.

Non devi ricostruire i documenti in `docs_v2` (sono già stati scritti) e non devi fare manutenzione.
Il tuo compito è diverso e più difficile: **verificare quali delle affermazioni contenute nei
documenti reggono, e da quelle verificate ricavare la struttura definitiva.**

Il motivo è preciso: due affermazioni di `docs_v2` si sono già rivelate false in una singola
sessione di verifica. Un archivio non collaudato non è un archivio, è un insieme di ipotesi con una
data. Tu sei il passaggio da ipotesi a fatti.

---

## 2. Regole ferree (non negoziabili)

1. **Nessun documento è fonte di verità.** I file in `docs_v2/`, in `docs/` e nella cartella brain
   `C:\Users\Sem\.gemini\antigravity\brain\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b` sono **materiale da
   collaudare**, non risposte. Un documento che dice "X è fatto" è un'ipotesi, non un fatto.
2. **Gerarchia dell'evidenza, in questo ordine:**
   1. codice in `C:\loto_app`
   2. migration in `C:\loto_app\supabase\`
   3. stato del cloud (query dirette)
   4. documentazione
   Un documento non vale più del codice che descrive. Se sono in conflitto, **vince il codice** e il
   documento è da correggere.
3. **Ogni riga della tabella di verifica riporta una prova.** Se non riesci a provare un'affermazione,
   la marcata `NON VERIFICABILE` e vai avanti. **Il valore "probabilmente" è vietato**: è la causa
   delle due letture sbagliate che dobbiamo correggere.
4. **Non modificare il codice applicativo e non modificare il database.** Questo blocco produce
   analisi. Nemmeno una riga di `_layout.tsx`, `utils/`, `app/`, `components/`, e nessuna scrittura
   sul cloud.
5. **Non committare `docs_v2/`.** Va creato solo se serve, e resta non tracciato.
6. **Non fare il push della dashboard admin.** Fuori perimetro.
7. **Non interrogare il cloud con il refresh token del device.** Supabase lo ruota a ogni uso e
   bruciarlo innesca un bug distruttivo nell'app (vedi §4, fatto già verificato). Per il cloud usa il
   SQL editor del pannello Supabase, oppure le chiavi `service_role` se presenti in `.env`.
8. **Non rifare il lavoro già fatto** (§4). Non sprecare risorse a re-derivare cose certe, e non
   mettere in discussione un fatto verificato senza una prova contraria.
9. **Non estendere il perimetro.** Se trovi un problema che non è in §5, annotalo in una sezione
   "fuori perimetro" e non analizzarlo. Il rischio di questa sessione è il dispersione, non la
   scarsità di anomalie.
10. **Non confondere "il frontend lo chiama" con "esiste e funziona".** Sono due fatti distinti, e
    la loro distanza è esattamente il buco che dobbiamo chiudere.

---

## 3. Le due lenti da usare

Non analizzare a caso. Ogni riga della verifica va letta attraverso **due modelli**, e questo è il
compito che ti rende diverso da chi ha scritto i documenti iniziali.

**Lente predittiva** — `docs_v2/MODELLO_PREDITTIVO.md`. Il ciclo è:
`segnale → verifica → classificazione → aggiornamento → verifica`.
Per ogni oggetto del database chiediti: **a quale passaggio del ciclo serve?** Un oggetto che non
sta in nessun passaggio è o superfluo, osta per un passaggio che non è stato costruito. La
domanda che ti serve: *il ciclo è chiuso*, o c'è un passaggio che produce dati e nessuno li
verifica?

**Lente operativa** — `docs_v2/MODELLO_OPERATIVO.md`. L'unità non è la feature, è la **catena**
dall'azione dell'utente al fatto vendibile. Per ogni catena chiediti: **dove si spezza?** Una catena
che si spezza a metà non è un dettaglio da sistemare: è ciò che impedisce di vendere.

Le due lenti hanno un criterio in comune, ed è il tuo compito: **l'esistenza di un oggetto non è
una catena funzionante**. Una vista che esiste ma che nessuna migration può ricreare non è un asset,
è un debito.

---

## 4. Già verificato — non rifare, non confutare senza prova

Questo è stato accertato con letture dirette del device e query al cloud. È il tuo punto di partenza,
non il tuo compito.

**Ambiente e versione**
- Repo canonico `C:\loto_app`, branch `fix/ripristino-lavoro-15-set-selective`, HEAD `bb0fa37`.
- App `com.lotohub.app`, versione `1.0.7`, versionCode `9`, debug, expo-dev-client, New
  Architecture. **La documentazione in `docs/` è ferma alla 1.0.2**: è il drift documentale più
  grande in assoluto.
- Progetto Supabase: `fsuolbwsvpgiglwcaffh`. Il bundle del device misura 14.856.404 byte ed è
  allineato al sorgente ricostruito.

**Database (via query dirette)**
- Esistono e funzionano: `vw_pois_frontend`, `vw_collective_impact`, `vw_user_dashboard_metrics`,
  `vw_daas_heatmap_15min`. `vw_pois_frontend` restituisce righe reali (POI "Castello Aragonese").
- Esistono e richiedono auth: `vw_dev_telemetry_daily`, `app_telemetry_events`.
- La tabella `pois` esiste e contiene dati.
- **`get_pois` risponde `42703: column p.alternative_poi_id does not exist`.** Usata solo da
  `app/route-creation-mockup.tsx:51`, fuori dal percorso POI attivo. **Non è un blocker P0**: è un
  errore preesistente e isolato. Non treatmentsarlo come priorità.
- `scan_poi`, `scan_poi_gps`, `get_pois_with_status`, `sblocca_media` restituiscono `PGRST202` con
  sonde GET senza parametri. **Questo NON significa che le funzioni non esistano**: significa che
  hanno parametri obbligatori e la sonda era sbagliata. Non concludere "assente" senza
  `pg_proc`.

**Il buco principale (D9)**
- `vw_pois_frontend` e `vw_collective_impact` **esistono nel cloud ma non in nessuna migration del
  repo**. Caso 2: funziona, ma non è versionato. Una ricostruzione fedele oggi è impossibile.
- `scan_poi_gps` è usata dal frontend (`PoiDetailSheet`, `OfflineQueueManager`) e la sua migration
  esiste in `C:\Users\Sem\.gemini\antigravity\brain\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\rpc_scan_poi_gps.sql`
  più una versione `rpc_scan_poi_gps_fixed.sql` **fuori dal repo**.

**Il modello identità (NON è un difetto)**
- L'identità anonima basata su UUID `auth.users` è **il progetto**, confermato da
  `LOTO_DB_PRODUCTION_MAP.md` §1 e dal principio Zero-PII. Non va ridefinita.
- Il meccanismo di continuità esiste ed è implementato: **L.O.T.O. Pass** con QR, la funzione
  `recover_loto_pass`, il tag NFC `validate_ntag424_sdm`, e `files/loto_vault` come deposito
  locale. La risoluzione a `components/LotoPassRecoveryScanner.tsx:59` si limita ad Alert e chiusura:
  **tutto il ricongiungimento è nella funzione sul DB**, e non è ispezionabile dal client.

**Il bug distruttivo (già corretto, da NON riaprire)**
- `app/_layout.tsx` aveva un "Deep Recovery" che su qualsiasi errore di rete eseguiva
  `AsyncStorage.clear()` + `signInAnonymously()`, creando un UUID nuovo e rendendo orfani i dati.
  Cinque `profile_id` abbandonati in AsyncStorage ne sono la firma. **Corretto oggi**: il `clear()`
  e la creazione di account sono eliminati, un errore di rete porta solo in modalità offline, e un
  profilo assente non autorizza più a creare un altro anonimo. **Non trattarlo come un problema
  aperto**, e non segnalarlo come regressione.

**Compilazione**
- `npx tsc --noEmit` passa con **zero errori** su tutto il progetto. I difetti di coesione sono
  semantici, non sintattici. Non perdere tempo a cercare errori di tipo.

**Attenzione a due trappole del modello dati**
- `pois.xp_reward` contiene i valori reali (10, 30, 50, 100); `base_xp` è a 0 e va ignorato
  (`LOTO_DB_PRODUCTION_MAP.md` §3). UnReward letto dalla colonna sbagliata dà zero silenziosamente.
- Il ledger ESG è **append-only** per scelta di audit. Non è un bug che non si aggiorni.

---

## 5. Il tuo compito — cosa devi produrre

### 5.1 La tabella di verifica

Una tabella, una riga per affermazione, con le colonne: **affermazione | fonte che la sostiene |
stato | prova**. Stati ammessi: `VERIFICATA`, `FALSATA`, `NON VERIFICABILE` (più la prova in ogni
riga, anche per `FALSATA`).

Le affermazioni da collaudare, in ordine di priorità:

1. Quale versione dell'app corrisponde a quale stato del database.
2. Quali delle **8 condizioni di coesione** di `MODELLO_OPERATIVO` §4 sono davvero mancanti, e
   quante sono semplicemente non documentate.
3. Se `recover_loto_pass` esiste, qual è la sua firma esatta, e che cosa fa: ricongiunge
   l'`auth.uid` corrente a un profilo esistente, oppure fa solo una lettura? **Questa risposta
   condiziona il Blocco 0** ed è la più importante del tuo elenco.
4. Se i 4 blocker della catena di scansione (transazione assente, `unique_violation` che collassa
   le visite, race del cooldown con doppio XP, backfill `profiles.tenant_id`) sono tutti e quattro
   ancora presenti nel codice attuale, o se qualcuno è già risolto.
5. Quali oggetti del database sono **usati dal frontend ma non creati da alcuna migration**. Produci
   l'elenco completo, non solo i tre noti: è la prova oggettiva del criterio C11.
6. Quale versione di `scan_poi_gps` sia quella attiva a runtime, dato che ne esistono due copie
   fuori repo (una "fixed"): confrontale e stabilisci quale corrisponde al cloud.
7. Se le regole di `MODELLO_OPERATIVO` §4 sono soddisfatte dal codice, o se descrivono un
  'aspirazione mai costruita.

### 5.2 La struttura definitiva

Dal materiale **verificato** — e solo da quello, mai dalle ipotesi sfatate — ricava la struttura
definitiva del progetto, e produci:

- **L'inventario reale del database**, distinto in tre stati: versionato in migration, esistente
  solo nel cloud, e inesistente. Questo documento sostituisce la ricostruzione a memoria.
- **La catena dell'utente**, dalla scansione al fatto vendibile, con il punto esatto in cui ogni
  catena si spezza o è completa.
- **L'elenco delle condizioni mancanti**, in ordine di dipendenza, distinguendo ciò che è SQL, ciò
  che è una decisione di prodotto, e ciò che è UI.
- **Le decisioni che spettano all'utente**, formulate come domande a cui si possa rispondere sì o
  no, con la ragione per cui ognuna blocca qualcosa.

Se una delle 8 condizioni si rivela non mancante, dillo: **la priorità di questo documento è
rimuovere lavoro che non serve**, non aggiungerne.

---

## 6. Cosa non devi fare

- Non modificare codice applicativo, migration o database.
- Non committare niente, in nessun branch.
- Non fare il push della dashboard admin.
- Non usare il refresh token del device per interrogare il cloud.
- Non riaprire il bug di `_layout.tsx`, già corretto.
- Non analizzare i 4 APK presenti nella cartella brain (221 MB l'uno): servono solo alla fine, per
  la ricostruzione delle versioni, e non sono un input per la struttura.
- Non produrre un documento di "stato del progetto" generico. Il formato richiesto è la **tabella di
  verifica** e la **struttura definitiva**. Se ti viene naturale scrivere un riassunto, non è quello
  che è stato chiesto.

---

## 7. Criterio di accettazione del tuo lavoro

Il tuo output è accettato se e solo se:

1. Ogni riga della tabella di verifica ha una prova e uno stato, e **nessuna riga dice
   "probabilmente"**.
2. Il numero di affermazioni `FALSATE` è dichiarato esplicitamente in apertura, con l'elenco. Un
   archivio che si rivela in gran parte sbagliato è un buon risultato, non un fallimento: è il primo
   dato reale che avremo sulla deviazione fra documentazione e realtà.
3. L'inventario del database distingue i tre stati, e la lista degli oggetti usati dal frontend ma
   privi di migration è **completa**.
4. Ogni catena descritta ha un esito esplicito: completa o spezzata, con il punto di rottura.
5. Le decisioni richieste all'utente sono formulate in modo che si possano rispondere con sì o no.

---

*L'unico modo che hai di sbagliare è dichiarare qualcosa di verificato che non hai verificato. Il
secondo modo è tacere un'affermazione falsa che hai trovato. Entrambi sono più gravi che lasciare
incompleta la tabella.*

---
id: TASKS-PER-AREA
tipo: indice
ambito: indice-unico-dei-task-per-area-con-quesiti-aperte
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - docs_v2/PianoOperativo-26-09.md:1
  - docs_v2/ANONIMATO-E-INTEGRITA-LEDGER.md:1
  - docs_v2/CHIUSURA-SESSIONE-27-09.md:1
  - docs_v2/aree/A3_dati_e_sql.md:1
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:113
  - app/(tabs)/index.tsx:597
---

# Task per area — l'indice unico

> **Questo è il documento da aprire per primo.** Esiste perche' il lavoro si e' diramato in sette
> direzioni e non c'era un posto unico dove vederle. Non sostituisce le aree `A1`-`A7`: le
> **indirizza**. Non ripete le prove: ogni riga dice dove guardare.
>
> Non aggiungere task qui dentro il dettaglio tecnico. Il dettaglio sta in
> `ANONIMATO-E-INTEGRITA-LEDGER.md`, nelle aree, o in `PianoOperativo-26-09.md`. Qui stanno tre
> cose: **dove siamo**, **chi blocca chi**, e **le domande che ti toccano**.

---

## 0. Come leggerlo

Mappa: `[x]` fatto · `[!]` blocca altri task · `[?]` serve una tua decisione · `[ ]` da fare.

Ogni task ha un id stabile (`A3-T4`). Se ne parliamo, usa l'id: "A3-T4 fatto" o "A3-T4 è
sbagliato". Gli id non si rinumerano, così restano validi anche se l'ordine cambia.

Le aree sono quelle gia' dichiarate in `docs_v2/aree/`, non una segmentazione nuova.

---

## 1. Ordine di esecuzione, per dipendenza

Il lavoro non e' parallelo in quattro pezzi: tre task sbloccano il resto.

```
Q15  ──►  A3-T1/T2 (identita' del ledger)
             │
             ├──►  A5-T2 (policy SELECT)  ──►  A5-T3 (deploy GPS)  ──►  A5-T5 (test device)
             │         └── serve dopo Q15: e' la stessa lettura
             └──►  A2-T2 (idempotenza)  ──►  A2-T3 (firma RPC)
             
Q6/Q7/Q14 (A4-T4)  ──►  A4-T1 (grid-only)  ──►  A7-T1/A7-T2 (consumer e UI)

A1-T1/A1-T2 (regole false)  ──►  puo' partire subito, non blocca niente
A3-T4 (governance)  ──►  tutto il resto, ma non in questa sessione
A3-T12 (proximity gate)  ──►  in assoluto per primo: non aspetta nessuna decisione
```

Il blocco critico era **Q15**, ed e' **chiuso**: risposta del 27/09, e non negativa. Il ramo GPS non
riparte da li'. Il vero blocco e' **il ledger a 0 righe**: nessuna delle 4 query del 27/09 ha
toccato `impact_transactions`, che e' l'asset che si vende (`ESITO-QUERY.md:40-42`).

**Dal 29/09 il task piu' urgente della lista non e' uno di quelli che aspettavano una risposta, ma
`A3-T13`**: il fix del Blocco 0 funziona ma **non e' committato**, quindi la perdita di profili e'
risolta solo su questa macchina. Un `git add` e un commit. **Prima di tutto il resto.**

Subito dopo, `A3-T12`: la distanza dal POI non viene piu' controllata da `scan_poi_gps`. E' un buco,
non una domanda, e non ha bisogno di cloud per essere diagnosticato ne' per essere corretto. Va
chiuso **prima** di `A5-T3`, perche' deployare la catena cosi' com'e' significa portare in
produzione l'assenza del controllo.

**L'ordine completo, con il costo di ogni passo e il nodo strategico che lo determina, e' in
[`PIANO-DECISIONE.md`](PIANO-DECISIONE.md).**

**Q16 e' chiusa** e la risposta era buona: la funzione di recupero scrive gia'. Il buco e' che il
client ne scarta la risposta e che la funzione non e' in Git (`A1-T10`).

**Q17 resta aperta** ed e' l'unica di questo gruppo che nessuno ha mai interrogato: `FIX-BLOCK.sql:109`
interroga `public.tenants`, ma il tipo di `tenants.id` non e' in nessun esito salvato.

---

## 2. I task, per area

### A1 — Fondazione: le regole che generano bugie

Ambito: le regole che l'agente carica a ogni sessione. Un claim falso qui non e' un errore di
copy, e' la regola che produce i prossimi errori.

- `A1-T1` `[ ]` **Claim "1% campionato" nel brief E in `.agents/AGENTS.md` sez. 5.** Non esiste
  nessun sampling. Duplicato in due file, quindi correggerne uno solo non serve.
- `A1-T2` `[!]` **Claim crittografia NTAG424 — AGGIORNATO il 29/09, e il verdetto e' cambiato.**
  Il task era nato dal fatto che si legga `NfcTech.Ndef`, quindi NDEF non autenticato. Questo e'
  vero, **ma non e' piu' tutto**. Esiste un'implementazione corretta in `utils/nfcManager.ts:11`
  che estrae i parametri crittografici `p` (PICCDATA) e `c` (CMAC) e li manda a
  `validate_ntag424_sdm`, che esiste (`20260926120000_scan_chain_canonical.sql:325`). Il commento
  a riga 36 spiega perche' e' la scelta giusta: le chiavi AES restano fuori dall'APK.
  **Il problema non e' che manca la crittografia: e' che `scanEncryptedTag` non ha un solo
  chiamante** (unico match in tutto il repo: la sua dichiarazione), e il flusso che l'utente puo'
  davvero premere, `PoiScannerModal.tsx:62`, passa il payload grezzo a `onScanSuccess` senza mai
  chiamare la RPC. Dettaglio in `docs_v2/loto_map/03-zero-iot-e-offline.md` §3. Cableggiamento in
  `A5-T7`, decisione sul prodotto in `Q10` (che resta aperta e cambia senso: non e' piu'
  "implementare o togliere", e' "collegare o dichiarare che il check-in e' solo GPS").
- `A1-T3` `[ ]` **Claim trigger Anti-Cheat a 130 km/h.** Non e' un trigger, e' un `IF` in
  `scan_poi_gps`, e la funzione non e' deployata. Inoltre shadowban != blocco.
- `A1-T4` `[ ]` **"Isteresi 5 minuti" → sono 10.** `utils/BackgroundLocationTask.ts:11`.
- `A1-T5` `[ ]` **Attribuzione ISPRA/DEFRA assente.** Coefficienti hardcoded senza fonte.
- `A1-T6` `[ ]` **"Email INTOCCABILE"** in `docs/LOTO_ENGINEERING_MANIFESTO.md:31`, contro
  `.agents/AGENTS.md` sez. 1 e contro la decisione QR-only.
- `A1-T7` `[ ]` **"Modello ibrido"** in `docs/LOTO_HUB_SSOT_DEFINITIVO.md:8`, che dichiara Zero-PII
  superato.
- `A1-T8` `[ ]` **Audit dei claim residui.** Solo la riga 23 del brief e' stata verificata per
  intero. Il resto del brief e le altre aree non sono mai state passate in rassegna.
- `A1-T9` `[x]` **Claim GDPR al 100% e "impossibilita' matematica"** corretti il 2026-09-27.
- `A1-T10` `[!]` **Il giro di recupero non si chiude, ma per un motivo diverso da quello creduto.**
  ~~La funzione non scrive~~: **errore mio, corretto il 2026-09-29.** Il cloud ha il corpo B, che
  fa `UPDATE public.profiles ... WHERE id = auth.uid()` (`ESITO-QUERY.md:51-52`). Il buco e' che
  `LotoPassRecoveryScanner.tsx:63` legge `data?.success`, mostra un Alert e chiude: la risposta che
  la funzione produce viene **scartata**, e la funzione **non e' in Git** (N4: 0 definizioni in
  `supabase/`). Quindi: non riscrivere la funzione, far leggere il risultato al client, e portare
  la funzione in Git. `Q16` e' chiusa. Dettaglio in `docs_v2/loto_map/01-onboarding-identita.md`.
- `A1-T11` `[ ]` **Decidere il modello di recupero.** Giro chiuso, oppure accettazione scritta che chi
  cambia telefono riparte da zero. Oggi "niente email" significa che reinstallare perde i
  progressi, in silenzio.
- `A1-T12` `[ ]` **Archiviare `components/LotoPassBackupModal.tsx`.** Orfano, ma contiene
  "Opzione B (Email)" con `signIn` per email e password: reintroduce esattamente cio' che il
  prodotto dichiara di non avere.
- `A1-T13` `[ ]` **Perimetro dello Zero-PII.** `profile.tsx:77` decide l'anonimato leggendo
  `user.email`, quindi `profiles.email` e' un ramo vivo, non una colonna morta. E `nfc-setup.tsx:71`
  raccoglie `b2b_phone`. Zero-PII vale per l'app consumatrice, non per il prodotto: va scritto
  cosi', o chiuso sul serio.
- `A1-T14` `[?]` **Il Double GPS Handshake non e' verificabile.** `docs/logiche_proprietarie.md:29-43`
  descrive `saveCoordinatesAtInstallation()` e `getCoordinatesAtFirstScan()`: questi due nomi non
  compaiono in **nessun** file del repository. O il codice ha nomi diversi, o la specificazione
  non e' mai stata scritta. Chiuso da `Q19`.
- `A1-T15` `[?]` **Le soglie civiche 1/5/10 stanno fuori dalla catena.** Le tre funzioni
  (`award_civic_pti`, `award_action_badges`, `award_impact_badges`) si trovano nei 63 export, ma i
  **numeri** delle soglie no: nessun valore e' tracciato in git. Chiuso da `Q20`.
- `A1-T16` `[!]` **Le "Mete Consigliate" non avevano un algoritmo — DECISO 29/09: entra nel
  prodotto, opzione C, raggio 2000 m.** Il flag `is_recommended` si scriveva in un solo punto di
  tutto il progetto, con un `UPDATE` manuale. Nota: non era "il sistema che riposa per assenza di
  massa critica" (`storico_chat_vecchia.md:3556`): **non e' mai stato scritto**. Le tre colonne
  servite esistono gia' su `pois` e sono gia' in `vw_pois_frontend`, quindi manca **solo lo
  scrittore**, non lo schema. Migration scritta:
  `supabase/migrations/20260929120000_mete_consigliate_soft_sorting.sql` (additiva, nessun DROP).
  **Da eseguire nell'SQL Editor.** Spec in `docs_v2/METE-CONSIGLIATE-SPEC.md`.
- `A1-T16b` `[x]` **`Q23` RISOLTA: opzione C, `recommended_until`.** Il conflitto fra algoritmo e
  marketing manuale e' chiuso con una sola colonna: `recommended_until IS NULL` = dominio
  dell'algoritmo, `NOT NULL` = campagna manuale che l'algoritmo non tocca. Le campagne scadute si
  spengono e tornano all'algoritmo nella stessa passata. Il raggio di 2000 m e' confermato, con
  cast esplicito a `geography` perche' su `geometry` il raggio sarebbe in gradi.
- `A1-T16c` `[!]` **Prima di schedulare il cron, popolare `loto_quota_max`.** Se resta `NULL` su
  tutti i POI la condizione d'eccesso non si innesca mai: **l'algoritmo gira, non capita niente,
  e sembra funzionante.** Stessa forma di fallimento silenzioso di `crowd_predictions`. Verifica:
  `select count(*) filter (where loto_quota_max is not null), count(*) from pois;` — se il primo
  numero e' 0, la funzione e' spenta per costruzione.
- `A1-T16d` `[ ]` **Il pannello admin deve scrivere `recommended_until`.** Senza questo, ogni scelta
  fatta a mano entra nel dominio dell'algoritmo e viene spenta al giro successivo: la protezione
  appena costruita serve solo se qualcuno la usa. La colonna esiste, va usata con una data.
- `A7-T9` `[ ]` **`crowd_level` ha due default diversi nello stesso file.** `PoiCard.tsx:30` usa
  `|| 20` per la logica (affollato sopra 75), `:86` usa `|| 85` per il testo mostrato. Quindi un
  POI senza dato puo' essere **visualizzato come pieno all'85% e trattato come non affollato** nello
  stesso render. Invisibile finche' l'algoritmo scrive il campo, ma il primo POI con occupazione
  sotto k=5 lo fa emergere. Serve un default solo.
- `A1-T17` `[!]` **`crowd_predictions` non e' definita da nessuna parte.** L'app ci scrive dentro
  (`utils/bleManager.ts:150`), la tabella e' in `types/database.ts:240` e viene chiesto se esiste
  in `supabase/schema/introspection.sql:102`. Ma **nessun `CREATE TABLE`** compare nelle 11
  migration ne' nei 63 export. Se manca nel cloud, l'`INSERT` fallisce, l'errore finisce in un
  `console.log` (`:157-159`) e la heatmap resta vuota senza che nessuno se ne accorga. Chiuso da
  `Q22`.
- `A1-T18` `[ ]` **`confidence_score` e' cablato a 100.** `utils/bleManager.ts:154` scrive una
  costante, non un punteggio calcolato. La colonna non misura confidenza: misura presenza. Se un
  report commerciale la legge come confidenza, sta leggendo una costante.
- `A1-T19` `[!]` **`crowd_predictions` e' una tabella per utente, e va sotto k-anonimato.** La forma
  e' `(poi_id, reporter_id, raw_count)`: una riga per utente per POI. E' esattamente la forma che
  `ANONIMATO-E-INTEGRITA-LEDGER.md` dichiara vietata. Va aggregata a griglia e soglia **prima** di
  alimentare la heatmap, non dopo.
- `A1-T20` `[x]` **Le formule hanno una fonte unica.** Creato `docs_v2/FORMULE-PROPRIETARIE.md` il
  2026-09-29: ogni formula con codice, origine e verdetto. I tre documenti che se ne contendevano
  il contenuto sono marcati come superati, e i "3 secondi" BLE sono corretti in 5 in
  `LOTO_HUB_SSOT_DEFINITIVO.md:31,33`. La sezione 2.2 sui tier e' cancellata perche' descrive un
  modello vietato da `utils/LevelUpLore.ts:4`.
- `A1-T21` `[ ]` **"Panic Mode" resta nel brief di pitch.** Punto 4: verificato che **non esiste
  codice** (zero match per `panic_mode` / `panicMode` in `app/`, `components/`, `utils/`), quindi il
  re-branding a "Safe & Fast" e' completo e senza residui. L'unica menzone e' in
  `.agents/rules/master_business_brief.md:29`, che si ricarica a ogni sessione: da togliere. Nessun
  codice da congelare, perche' la feature non e' mai stata scritta. Dettaglio in
  `docs_v2/loto_map/04-features-ux-e-gamification.md` §3.
- `A1-T22` `[ ]` **Le "associazioni nodo" della Validazione Community non compaiono da nessuna
  parte.** Il claim promette la convalida sul campo da parte loro; il form (`CivicReportSheet.tsx:42`)
  scrive `status: 'pending'` e basta, e l'unica validazione esistente e' fra cittadini. O si
  introduce il ruolo, o il claim va riscritto. `Q28`.

### A2 — Gamification: ricompense e integrita' del credito

- `A2-T1` `[x]` **Ramo scontrino rimosso** da `executeScan`. `p_iva` e `pec` libere.
- `A2-T2` `[!]` **Idempotenza.** Ogni chiamata su un POI `partner` riassegna 50 PTI e 50 XP senza
  controllo. Non e' una regressione (il guard non partiva gia'), ma ora e' vero. Va risolto
  lato server: UNIQUE su `(profile_id, poi_id, data)` o check in funzione.
- `A2-T3` `[ ]` **La firma della RPC corrisponde?** L'app chiama 7 argomenti con `p_takeaway`;
  l'export del cloud ha `p_hash`. Se la funzione viva ha la firma dell'export, la chiamata **fallisce
  sempre** e il flusso partner e' muto. Si chiude con Q15.
- `A2-T4` `[?]` **Semantica dello shadowban.** Oggi registra la visita con XP=0, CO2=0, esclusa dai
  DaaS. Va deciso se e' questo o un blocco duro, perche' cambia il messaggio all'utente e cosa vede
  il commerciante.
- `A2-T5` `[ ]` **`vw_collective_impact` e' l'SSOT?** `community.tsx` la usa, ma e' all-time, non
  "today", e legge da `scans` che e' creata fuori dalla catena.
- `A2-T6` `[!]` **La coda offline registrerebbe il check-in all'ora sbagliata, e lo promise
  all'utente.** La funzione server scrive `visited_at` con **`now()`**
  (`20260927090000_scan_chain_shadowban_and_ledger.sql:187`), cioe' l'istante in cui il server
  riceve la richiesta, non quello in cui l'utente era li'. Un check-in accodato alle 18:00 e
  inviato alle 21:00 quando torna il segnale viene registrato alle 21:00, e non e' un dettaglio:
  slitta il cooldown 12 h, **rende impossibile la finestra di 15 min di `scan_poi`**, svuota la
  finestra 1 h di occupazione delle Mete Consigliate, sposta il bucket 15 min della heatmap DaaS e
  sballa i report ESG temporali. Il caso peggiore e' la seconda: **un check-in offline non puo'
  mai chiudere la seconda fase**, perche' quando arriva al server sono passati piu' di 15 minuti
  dal momento in cui l'utente era davvero li'.
  **Il timestamp va trasportato**: `enqueueCheckinGPS` riceve `lat` e `lng` ma non l'ora, e
  `scan_poi_gps` non accetta un parametro temporale. Finche' l'orario e' deciso dal server, la
  sincronizzazione offline del check-in **non e' implementabile senza cambiare la firma della
  funzione**, e cambiare la firma tocca anche `scan_poi`. Decidere in `Q25`. Dettaglio in
  `docs_v2/loto_map/03-zero-iot-e-offline.md` §6.
- `A2-T7` `[!]` **La regola di Validazione Community e' scritta bene e non gira.** `check_for_match()`
  e `trigger_match_report` stanno in `supabase/archive_scattered_sql/ULTIMATE_RESTORE.sql:325-362`:
  stessa categoria, `user_id != NEW.user_id` (niente auto-conferma), finestra 7 giorni, controllo
  dei 50 m veri, e aggiorna **sia** la riga nuova **sia** quella precedente. E' la cosa meglio
  progettata del blocco 4. Ma `CREATE TRIGGER ... civic_reports` compare in 16 file, **tutti** in
  archivio o dentro i 63 export: **zero migration applicabili**. Conseguenza verificata: **nessuno
  scrive mai `status = 'confirmed'`**, e le due occorrenze nel codice sono entrambe letture. Come
  `recover_loto_pass`, e' nata a mano e non e' mai entrata in Git. **Da portare in Git.**
- `A2-T8` `[ ]` **Il form e il trigger usano due nomi di colonna diversi.** `CivicReportSheet.tsx:47`
  scrive `grid_cell` ("adattato per coerenza col DB"), `CivicDashboard.tsx:83` scrive `grid_cell_50m`,
  e il trigger confronta `grid_cell_50m = NEW.grid_cell_50m`. Se il trigger girasse, il form
  principale non confermerebbe mai niente. Esistono anche due `CREATE TABLE civic_reports` in
  conflitto (`grid_cell_50m` in tre restore, `grid_cell` in `FIX_5_BUGS.sql:25`). `Q27`.
  Nota: `grid_cell_50m` con `toFixed(3)` vale ~111 m, non 50. Non e' un bug (il trigger verifica i
  50 m veri con la distanza euclidea), ma il nome della colonna e l'indice che la nomina promettono
  una griglia che non e' quella.
- `A2-T9` `[ ]` **Il "+25 PTI bonus" non e' mai stato assegnato a nessuno.** Stringa in
  `CivicReportSheet.tsx:86` e `CivicDashboard.tsx:116`, mostrata dopo una conferma che il trigger non
  conferma. I PTI si scrivono in `scan_poi_gps`, che nessuno dei due chiama. Un premio annunciato
  e non consegnato, sul percorso che chiede la fiducia del cittadino.
- `A2-T10` `[ ]` **La sezione Community non ha obiettivi.** La somma c'e' ed e' fatta bene
  (`community.tsx:99` legge `vw_collective_impact`, con il commento *"mai coefficienti inventati nel
  client"*). Ma `collective_goals` e `goal_participations` hanno `CREATE TABLE` in 7 file e **zero
  nella catena viva**, e `TraguardiModal` prende tutto da props: nessuna query a obiettivi in tutto
  `app/` e `components/`. Il collettivo e' misurato, la ricompensa collettiva no. Manca l'intera
  meta' finale, ed e' quella che dà senso al vincolo "i punti non hanno valore economico individuale".

### A3 — Dati e SQL: la catena, l'RFS, l'integrita'

Ambito: il problema piu' serio del progetto, e non e' nuovo: `PianoOperativo-26-09.md` §1 lo
chiama "l'ambiente non e' riproducibile da Git". Oggi confermato da un secondo angolo.

- `A3-T1` `[x]` **Q15 — RISPOSTA CONosciUTA dal 27/09, e non e' quella che si temeva.**
  `ESITO-QUERY.md:74-80`: nel cloud e' attivo il **corpo 2** di `scan_poi_gps`, che scrive
  `user_pois` e `profiles`, ma **non ha nemmeno l'INSERT in `impact_transactions`**. La tabella
  esiste ma ha **0 righe, mai nate** (N8). Quindi `process_esg_impact` non e' un problema di
  identita': **non e' proprio nel percorso attivo**. Non c'e' niente da proteggere con `auth.uid()`
  perche' non scrive. Il buco e' a monte: il ledger non riceve niente. Q15 chiude come
  **risposta, non come lavoro**; il lavoro vero e' `A5-T3` (portare la catena canonica dentro la
  funzione viva) ed e' gia' in `ESITO-QUERY.md` sezione 5 come **fix 3**.
- `A3-T2` `[x]` **Non applicabile.** Era "se A3-T1 e' negativo, aggiungere il controllo di
  identita'". A3-T1 non e' negativo: e' irrilevante, perche' la funzione non scrive sul ledger.
- `A3-T3` `[?]` **`GRANT ALL` su tutto lo schema.** `anon` e `authenticated` hanno grant su
  `impact_transactions`, `profiles`, `vw_collective_impact`. Origine probabile
  `supabase/pure_cloud_queries/62_untitled_query.sql`, col commento "per sicurezza". L'RLS annulla
  quasi tutto, ma il grant resta.
- `A3-T4` `[!]` **72 file in `supabase/pure_cloud_queries/`: 63 export JSON del SQL Editor + 9 query
  di ispezione in sola lettura.** Definizioni di `vw_pois_frontend`, `scans`,
  `impact_transactions`, e il `GRANT ALL`. **Fuori da ogni migration, e con una data che peggiora
  il quadro:** gli export portano `updated_at` dal **2026-04-13 al 2026-07-15**, mentre la prima
  migration e' `20260715191000_SEED_DATA.sql`, cioe' **lo stesso giorno dell'ultimo export**. La
  catena di migration *inizia* quando il lavoro da pannello *finisce*: quasi tutta la provenienza
  dello schema (aprile-luglio) e' fuori. **Decisione strutturale: sono la fonte di verita' o
  spazzatura?** Se sono la verita', il repo non riproduce il DB e va riscritto. E' la decisione piu'
  grande di questa lista.
- `A3-T5` `[ ]` **Timestamp di migration duplicati:** `20260822` ×2, `20260824` ×2, e
  `00_SETUP_ADMIN_DASHBOARD.sql` senza timestamp. L'ordine resta deterministico, ma solo per
  convenzione sul nome completo: l'intento di esecuzione e' implicito e fragile, e chi rinomina
  un file cambia la sequenza senza accorgersene.
- `A3-T6` `[ ]` **`migration_v22/23/24` non tracciati** in `supabase/`, duplicano la hardening.
  Fallirebbero rumorosamente (`CREATE VIEW` senza `OR REPLACE`): difesa buona, ma vanno archiviati
  perche' attrattano.
- `A3-T7` `[ ]` **`20260926120000_scan_chain_canonical.sql` non applicata**, con 4 blocker
  (`PianoOperativo-26-09.md` §1.4). O si applica, o si dichiara obsoleta e si cancella.
- `A3-T8` `[ ]` **Integrita' di `user_pois`:** nessuna PK ne' UNIQUE su `(profile_id, poi_id)`, con
  `id NOT NULL`. Doppio check-in possibile a livello di schema.
- `A3-T9` `[?]` **Policy di `pois`: `qual = true` OR `qual = is_active = true`.** Tutti i POI sono
  leggibili da `anon`, **inclusi i disattivati**. E' voluto? Non si puo' dedurre dal codice.
- `A3-T10` `[ ]` **`profiles.email` residuo** (safe drop, ma "nessun DROP" e' vincolo) **e
  `LotoPassBackupModal.tsx` orfano.** Rimuovere il codice morto; il drop resta sospeso.
- `A3-T11` `[ ]` **Doppio backslash nei grant** in 4 `pure_cloud_queries/`: `public\pois` invece di
  `public.pois`. Dentro un JSON su una riga, quindi probabilmente non eseguiti, ma da verificare.
- `A3-T12` `[!]` **IL PROXIMITY GATE E' STATO PERSO. Priorita' massima, trovato il 29/09.**
  `20260926120000_scan_chain_canonical.sql:157-165` implementa il controllo di prossimita':
  `ST_Distance(posizione, poi.coords) <= poi.checkin_radius`, con messaggio d'errore esplicito. Sono
  5 occorrenze di quel controllo. `20260927090000_scan_chain_shadowban_and_ledger.sql` **sostituisce
  il corpo di `scan_poi_gps`** e di 5 ne resta **1**: `ST_Distance` a riga 149, che serve all'
  anti-velocita'. **`pois.checkin_radius` non e' piu' letto da nessuna parte.** La versione del 27/09
  e' quella che il suo header dichiara verificata token per token contro il cloud, quindi il buco e'
  anche in produzione.
  Conseguenza: **utente al primo check-in della vita, ovunque si trovi, non ha controlli.** Nessuna
  velocita' da calcolare (serve un check-in precedente), nessuna prossimita' da verificare. 15 XP
  accreditati, riga in `user_pois` scritta, heatmap DaaS e report PA inquinati. **Senza errore.**
  Tutto il resto della catena (20/130 km/h, cooldown 12 h, shadowban, ledger) e' corretto: senza
  questo controllo pero' protegge il *valore* di una visita che non e' avvenuta.
  **Fix SCRITTO il 29/09: `supabase/migrations/20260929160000_restore_proximity_gate.sql`.**
  Sostituisce solo il corpo di `scan_poi_gps` con `CREATE OR REPLACE` (stessa firma, stesso
  ritorno `JSONB`, nessun `DROP`), e **non è ancora applicata al cloud**. Oltre al proximity
  gate la migration chiude altri tre buchi della stessa classe, emersi leggendo i due corpi
  per ripristinarlo:
  - **coordinate NULL**: se il client manda `p_lat`/`p_lng` nulli, `distanza > raggio` produce
    NULL, che in SQL non è vero: il controllo passava e il check-in veniva accettato. Stesso
    buco anche per un POI senza `coords`. Ora entrambi sollevano.
  - **`search_path` mancante in `SECURITY DEFINER`**: il 27/09 non lo imposta, lasciando le
    risoluzioni dei nomi dirottabili da uno schema che precede `public`. Ora è
    `SET search_path = public, pg_temp`.
  - **velocità non calcolabile = ricompensa piena**: il 27/09 ricavava la posizione precedente
    unendola a `pois.coords`; se quel POI non ha coordinate la velocità è NULL, `NULL > 130` non
    è vero, e il check-in cadeva nell'`ELSE` con XP e CO2 pieni. Ora usa `up.lat`/`up.lng` e un
    valore non calcolabile vale 9999, che è la scelta che il 27/09 usava già per il tempo.
  **Il gate solleva un'eccezione, e non restituisce uno status, per una ragione precisa:**
  `PoiDetailSheet.tsx:147` fa `if (error) throw error` e basta — un JSONB con
  `{status:'troppo_lontano'}` passerebbe inosservato e l'app mostrerebbe comunque il check-in
  riuscito. Con l'eccezione, `PoiDetailSheet.tsx:162` mostra l'Alert con la distanza reale e la
  riga non viene scritta.
  **Deliberatamente NON cambiati**, perché sono numeri che gli utenti hanno già accumulato e
  cambiarli è una decisione di prodotto, non un fix: il CO2 pedonale resta `1.5` fisso invece
  di leggere `pois.base_co2`, e XP/PTI veicolare restano `2`/`1` cablati. Vedi `A3-T15`.
  `Q24` non è un blocco: riguarda solo il fallback a 80 m per i POI senza raggio proprio, ed è
  una riga sola. Dettaglio in `docs_v2/loto_map/03-zero-iot-e-offline.md` §4.1.
- `A3-T13` `[!]` **Il Blocco 0 è risolto ma non è committato. Perdita di dati, non igiene.**
  Il fix che impedisce ad `app/_layout.tsx` di chiamare `AsyncStorage.clear()` e creare un account
  anonimo nuovo a ogni errore di rete **è nel working tree ma non in un commit**
  (`git diff --stat app/_layout.tsx` → 25 +, 23 −). Verificato il 29/09 che `AsyncStorage.clear()`
  non esista più da nessuna parte, e che il ramo di errore entri in modalità offline mantenendo
  l'identità corrente. **Il blocco è risolto solo su questa macchina**: un clone, un checkout
  diverso o un `git checkout` riporta il difetto, e continua a creare profili orfani a ogni
  sessione persa. **Committare prima di qualunque altra cosa.** Dettaglio in
  `docs_v2/ULTIMO-MIGLIO-BLOCKS.md`.
  **Confermato a runtime il 29/09** (`VERIFICA-RUNTIME-2026-09-29.md` §1): con Wi-Fi e dati
  realmente spenti, l'app ha stampato il warn di modalità offline, **mantenuto lo stesso
  `user_id`** (`9f22d449…`, stesso `created_at`), **non creato** un account nuovo, **non
  cancellato** nulla (13 chiavi in AsyncStorage prima e dopo, 5 UUID distinti invariati). Il fix
  non è più sperato: è misurato. Resta solo da committarlo.
    - `A3-T14` `[!]` **RIAPERTA IL 30/09. Le migration sono in Git, ma il DB non è riproducibile.**
      La parte originale ("`docs_v2/` e `supabase/migrations/` fuori da git") è chiusa: entrambe
      committate. Ma misurando il cloud il 30/09 è emerso che delle **25 tabelle reali, le migration
      del repo ne creano 4**. Ventuno non sono riproducibili: 3 non sono definite in nessun file del
      repo (`badges`, `crowd_predictions`, `loto_squads`), le altre 18 stanno solo in `migration_vNN`
      dismessi e in `archive_scattered_sql/`. Quindi: **funzioni e trigger a posto, schema no.** Il
      commit `6e969eb` diceva di chiudere `A3-T14` e lo chiude solo a metà. Diventa il sottotask
      `A3-T14b`, da risolvere esportando lo schema reale e decidendo cosa diventa migration.
    - `A3-T14b` `[ ]` **Esportare lo schema reale del cloud e ricostruire le 21 tabelle mancanti come
      migration.** Regole: mai `CREATE TABLE IF NOT EXISTS` come unico meccanismo, perché sul cloud ha
      appena fatto fallire `impact_transactions` (la tabella c'era, con uno schema diverso, e la
      funzione è morta su `receipt_hash` inesistente). Per ogni tabella: `ALTER TABLE ADD COLUMN IF
      NOT EXISTS` + `DROP/CREATE` espliciti per indici, policy e vincoli. Fonte unica, il cloud
      misurato, non un archivio.
- `A3-T15` `[?]` **I premi del check-in sono cablati, non letti dal POI.** Trovato il 29/09
  leggendo i due corpi di `scan_poi_gps` per ripristinare il proximity gate. La versione del
  27/09 assegna valori letterali invece di leggerli dalla tabella `pois`:
  - **CO2 pedonale `1.5` fisso** (`20260927090000:181`), mentre la canonica del 26/09 leggeva
    `pois.base_co2`. Il CO2 risparmiato non dipende dal POI: un parco e un epitaffio valgono
    uguale, e i totali di `profiles.total_co2` non sono riconciliabili con nessuna configurazione.
  - **XP veicolare `2` e PTI `1` cablati** (`:174-175`), **PTI pedonale `10` cablato** (`:180`).
    Solo `xp_reward` del pedonale viene letto dal POI (`:179`).
  **Non è stato corretto dentro `A3-T12`** per scelta: sono i numeri che gli utenti hanno già
  accumulato, e cambiarli di nascosto sposterebbe i totali già presenti. Va deciso con calma se il
  CO2 deve venire da `base_co2` e cosa valgono i PTI, poi va detto ad alta voce. Finché è aperto,
  la dashboard ESG e la heatmap DaaS leggono numeri che nessun amministratore può riconciliare
  con la configurazione del POI.

### A4 — Dashboard e DaaS: anonimato e rilascio

- `A4-T1` `[!]` **Vincolo DROP per rimuovere colonne.** PostgreSQL non permette di togliere colonne da
  una vista con `CREATE OR REPLACE VIEW`. Tre strade: **(A)** vista nuova e sposta `map.tsx:131`;
  **(B)** rinomina e ricrea, lasciando una legacy con grant `anon`; **(C)** DROP consentito. La
  hardening **gia'** usa `DROP VIEW IF EXISTS` (righe 81, 118, 246, 271), quindi il divieto non e'
  mai stato applicato al DB. **Decidi tu, blocca A4-T2 e A7-T1.**
- `A4-T2` `[ ]` **Heatmap grid-only:** togliere `poi_id` dal `SELECT` (riga 106) **e** dal
  `GROUP BY` (riga 112). Attende A4-T1.
- `A4-T3` `[?]` **Finestra rolling e cadenza di rilascio.** Mai decise. Senza, la vista non si
  scrive. Il differencing su blocchi da 15 minuti resta aperto.
- `A4-T4` `[ ]` **Soglia k come letterale:** `5 AS k_anonymity_threshold` alle righe 110 e 257. Se
  si cambia `HAVING` senza la letterale, la UI mente. Vanno tenute insieme.
- `A4-T5` `[ ]` **`vw_daas_event_attendance`** ha la stessa soglia e lo stesso letterale (riga 266).
  Stesso trattamento di A4-T4.
- `A4-T6` `[x]` **Verificato, non e' un'azione:** heatmap e attendance hanno `is_loto_admin()` e
  `REVOKE ALL FROM anon` (righe 115, 268). **Non sono esposte al pubblico.** Da non perdere.
- `A4-T7` `[ ]` **Rimuovere `p_iva` e `pec` da `vw_pois_frontend`.** Il codice applicativo non le
  usa piu' (`A2-T1`), quindi l'ostacolo e' solo il vincolo di `A4-T1`.

### A5 — App mobile: stato funzionale e cantieri aperti

- `A5-T1` `[ ]` **Validare la syntax della migration GPS.** Non ha mai passato un parser, solo un
  controllo strutturale. Il PG locale chiede credenziali.
- `A5-T2` `[!]` **Policy SELECT su `impact_transactions`.** Senza, `index.tsx:347` legge zero righe
  e l'app resta muta anche col deploy. Si scrive **dopo** il verdetto di Q15: e' la stessa lettura.
- `A5-T3` `[ ]` **Deploy catena GPS**, nell'ordine: ledger, policy SELECT, `poi_id`.
- `A5-T4` `[ ]` **`utils/dbAggregation.ts` non e' tracciato ma `index.tsx` lo importa.** Committando
  solo i file tracciati la build si rompe. O si aggiunge, o si annulla l'import.
- `A5-T5` `[ ]` **Test runtime su device.** Mai fatto. Tutto il lavoro fin qui e' verificato per
  lettura di codice e da query, non a runtime.
- `A5-T6` `[ ]` **Provenienza delle modifiche a `index.tsx` e `_layout.tsx`** (chiamate a
  `enrichProfileWithDbMetrics`): erano in coda prima della sessione 27-09, non documentate.
- `A5-T7` `[!]` **`scanEncryptedTag` non e' chiamata da nessuna parte.** `utils/nfcManager.ts:11`,
  unico match in tutto il repository e' la sua stessa dichiarazione. Il flusso realmente
  raggiungibile, `PoiScannerModal.tsx:48-67`, decodifica l'NDEF, **mostra il contenuto grezzo in un
  Alert** e chiama `onScanSuccess(uri)` senza mai invocare `validate_ntag424_sdm`. Quindi
  l'handler (`PoiDetailSheet.tsx:562`) riceve una stringa arbitraria: la usa solo per distinguere
  l'evento rifiuti (`loto.app/e/1` / `plasticaqqua`) e poi passa `p_poi_id: poi.id`, cioe' **il POI
  gia' aperto, non quello codificato nel tag**. Dopo di che chiama `scan_poi`, che per costruzione
  non accredita nulla (`20260926120000:359`) e richiede una `scan_poi_gps` passata per quel POI negli
  ultimi 15 minuti, altrimenti solleva. **Il bottone "Acquisisci POI (NFC/QR)" o fallisce o rilegge
  un totale gia' accreditato.** Decidere in `Q10`: collegare la crittografia, o togliere il bottone e
  dichiarare il check-in solo GPS.
- `A5-T8` `[!]` **`OfflineQueueManager.init()` non ha un solo chiamante**, quindi il listener di
  `NetInfo` non viene mai registrato e `processQueue()` non gira da nessuna parte: la coda si
  riempie e **non si svuota mai**. Una riga (`utils/OfflineQueueManager.ts:170`).
- `A5-T9` `[!]` **I check-in non si accodano, e senza rete il dato si perde.**
  `enqueueCheckinGPS` (`:75`) non ha chiamanti; l'unica `enqueue*` usata e' `enqueueUnlock`, da
  `PoiDetailSheet.tsx:325`. Il percorso reale del check-in GPS finisce in
  `PoiDetailSheet.tsx:161-162` con `Alert.alert('Errore GPS', e.message)`: **nessun fallback in
  coda**. Quindi il claim "l'app non blocca l'utente" vale solo per lo sblocco media. La coda
  offline del check-in non e' una feature mancante, e' una trappola finche' `visited_at` non
  viaggia: vedi `A2-T6` e `Q25`.
- `A5-T10` `[ ]` **La coda offline non e' crittografata.** `AsyncStorage.setItem(..., JSON.stringify(queue))`
  (`OfflineQueueManager.ts:69,88`) su Android e' in chiaro, e la coda contiene `lat`, `lng` e
  `poiId` (`:83`). Non e' un problema GDPR in senso stretto (il dato resta sul dispositivo
  dell'utente), ma e' il posto dove finisce il dato piu' sensibile che l'app raccolga ed e' l'unico
  scritto senza protezione. Cifratura a riposo, o almeno non promettere "crittografati" nel claim.

### A6 — Commerciale

- `A6-T1` `[ ]` **`20260825_whatsapp_bot_setup.sql`: stato applicato sconosciuto.** `b2b_phone` e
  `b2b_plan` su `pois` sono assenti da `types/database.ts`, il che suggerisce che non sia applicata.
  **Non verificato.**
- `A6-T2` `[ ]` **Lo stesso file fa `row_to_json(NEW)` e `row_to_json(OLD)` verso una Edge Function**,
  cioe' la riga POI intera, e ha un cron alle 20:30 UTC. Se applicato, e' una fuga di dati
  commerciali. Verificare prima di qualsiasi deploy.
- `A6-T3` `[x]` **Nessuna tabella `merchants`, nessun dato di terzi, nessun `DROP`.** Decisione ferma.
  Riapre solo con un caso d'uso reale.
- `A6-T4` `[x]` **`b2b_feedbacks` esiste**, in `supabase/migrations/20260822_create_b2b_feedbacks.sql`.
  Non e' orfana. Chiuso.

### A7 — Struttura ed esperienza

- `A7-T1` `[ ]` **`map.tsx:131` e' l'unico consumatore noto** di `vw_pois_frontend`. Da spostare se
  `A4-T1` = opzione A.
- `A7-T2` `[ ]` **La UI heatmap mostra `poi_id`?** Se si', cambia con `A4-T2` e va rifatta la mappa.
- `A7-T3` `[ ]` **`scans` e' in `types/database.ts` ma definita fuori catena.** Riferimento `A3-T4`.
- `A7-T4` `[!]` **L'auto-switch da GPS e' commentato fuori.** `TenantContext.tsx:214-220`: il ciclo
  Haversine calcola `closest` e `minDist` e poi scarta tutto,assegnando Taranto. O si riattiva, o si
  cancella il codice morto — cosi' si smette di chiedere il permesso GPS (`:196-199`) per un risultato
  che viene buttato. Dettaglio in `docs_v2/loto_map/02-motore-camaleonte.md`.
- `A7-T5` `[ ]` **I colori del tenant reggono 2 su 6.** `TenantColors` (`:9-12`) dichiara solo
  `primary` e `secondary`, ma `ThemeContext.tsx:77-81` ne usa sei, quattro dei quali nascosti da
  `as any` su campi inesistenti. O si estende il tipo, o si tagliano i quattro campi e i quattro cast.
- `A7-T6` `[ ]` **Il Premium non vede i colori del suo tenant.** `ThemeContext.tsx:69-72` scarta i
  colori per chi e' Elite. Scelta possibile, ma il partner che paga il whitelabel riceve il tema di
  default: deciso tu.
- `A7-T7` `[!]` **`id` e `slug` confusi sulla stessa colonna.** `map.tsx:133` e `index.tsx:372`
  filtrano per `slug`, `index.tsx:286` per `id`, e `pois.tenant_id` e' un TEXT con slug dentro
  (creato a mano, default `'taranto'`). Se `tenants.id` e' un UUID, `:286` restituisce zero righe
  **senza errore**. Anche i deep link: il commento (`:163`) documenta uno slug, il codice filtra
  `.eq('id', ...)` (`:116`). **Prima questo, poi il resto del multi-tenancy.**
- `A7-T8` `[!]` **Il sottosistema tenant non e' nelle migration.** `tenants`,
  `tenant_localizations`, `tenant_associations`, `tenant_events`, `tenant_badge_overrides`,
  `territories`, `media_vault`, `user_unlocked_media` e le funzioni `sblocca_media`,
  `assign_and_validate_poi_territory_fn`, `insert_poi_standardized`,
  `verify_checkin_speed_plausibility_fn` nascono **solo** nei 63 export. Delle 11 migration una sola
  la tocca. Il pezzo che dovrebbe rendere il sistema replicabile e' quello meno replicabile: senza
  questo, S1 non chiude.
- `A7-T10` `[!]` **Il flag accessibilita' dell'utente sono due flag che non si parlano.** Il FAB
  sulla mappa (`map.tsx:412-416`) scrive in **AsyncStorage** (`MobilityContext.tsx:127`, chiave
  `loto_mobility_accessible`). `PoiCard.tsx:50` invece legge **`profiles.accessibility_mode`**, che
  **nessuno scrive mai** in tutto `app/`, `components/`, `utils/`. Quindi `isAccessibleUser` e'
  sempre `false` e il banner di avviso **non compare mai**: il FAB sembra funzionare e non cambia
  niente. Peggio: il campo e' `BOOLEAN` in 5 file (`migration_v7_wizard.sql:12`,
  `RESTORE_DEFINITIVO.sql:766`, tre `*_RESTORE`) e **`TEXT`** in `LOTO_RESURRECTION_FULL.sql:23`.
  Se il cloud ha il `TEXT`, il `=== true` e' falso per ragione di tipo. `Q26`.
- `A7-T11` `[!]` **Tre nomi per l'accessibilita' del POI, due sistemi disgiunti.**
  `pois.is_accessible` (`BOOLEAN DEFAULT true`) sta nelle migration e nelle viste ma **non ha un
  solo consumer** in `app/`; `pois.is_wheelchair_accessible` (3 stati) e' quello che l'app mostra
  (`PoiDetailSheet.tsx:795-811`) e **non e' in nessuna migration ne' nei 63 export**; esiste anche
  `accessibility_info` (`:804`), letto e inesistente. Nota: `tsc` non segnala nulla, perche' questi
  campi arrivano da `supabase` come `any` — **il type-check non copre i dati che vengono dal DB**.
  Va deciso il nome e scritta la migration. `Q26`.
- `A7-T12` `[!]` **La difficolta' di un sito e' decisa dal nome che ha.**
  `PoiCard.tsx:51`: `item.difficulty_score || (item.name?.includes('Castello') ? 80 : 20)`.
  `difficulty_score` **non esiste in nessuna tabella**, quindi il fallback parte sempre: un POI il cui
  nome contiene "Castello" vale 80 (barriere), tutti gli altri 20 (accessibili). Da rileggere insieme
  ad `A7-T10`: **un utente con mobilita' ridotta viene avvisato in base a una sottostringa del nome,
  e non gli viene avvisato nulla negli altri casi.** Il default silenzioso e' "accessibile".
- `A7-T13` `[ ]` **Il banner della scheda ha il bottone SEGNALA morto, e le due schermate non
  mostrano lo stesso dato.** `PoiDetailSheet.tsx:808-810` e' un `TouchableOpacity` **senza
  `onPress`**: dentro ci sono solo `style` e un `<Text>`. E il claim chiede i banner "nell'anteprima
  **e** nella scheda": l'anteprima ha il banner di sfida architettonica di `PoiCard.tsx:77-82`, che
  e' un avviso per utente, non lo stato di accessibilita' del luogo. Due dati diversi su due schermate.

---

## 3. Le domande che spettano a te

Sono ventidue aperte e tre chiuse, e non le posso rispondere io: o sono preferenze, o richiedono un
accesso che non ho. Ordinate per quando bloccano. Rispondi anche solo a `Q1`-`Q3` e la sessione ha
gia' una direzione.

| # | Domanda | Blocca |
|---|---|---|
| `Q24` | **Il proximity gate è stato perso di proposito o per sostituzione del corpo?** Il controllo `checkin_radius` esisteva nella canonica del 26/09 ed è sparito quando il 27/09 ha riscritto `scan_poi_gps`. Prima di tutto va **ripristinato** (è `A3-T12`, e quello non aspetta una decisione: è un buco). Poi: il raggio resta per-POI da `checkin_radius`, o si fissa? E il messaggio "troppo distante" torna visibile? | `A3-T12`, `A2-T6` |
| `Q25` | **La coda offline deve poter accreditare check-in retroattivi?** Se sì, `scan_poi_gps` accetta un `p_visited_at` e la firma cambia (quindi si rifà anche `scan_poi`). Se no, la coda si limita a `UNLOCK_MEDIA` e il claim della coda crittografata va riscritto. **Decidere prima di scrivere il codice**: accodare un check-in oggi promette all'utente qualcosa che il sistema non registra. | `A2-T6`, `A5-T9` |
| `Q26` | **`profiles.accessibility_mode` è `BOOLEAN` o `TEXT` nel cloud?** E **su `civic_reports` la colonna è `grid_cell` o `grid_cell_50m`?** Sono i due disallineamenti che rendono il blocco Accessibilità e Validazione Community muti. Il primo decide se `PoiCard:50` può mai essere vero; il secondo decide quale dei due componenti è corretto e se `trigger_match_report` può funzionare | `A7-T10`, `A7-T11`, `A2-T8` |
| `Q27` | La Validazione Community deve prevedere **le associazioni nodo** come soggetto terzo della convalida, o la conferma fra cittadini basta? Oggi il codice conosce solo il cittadino, e il "+25 PTI" promesso non viene assegnato | `A1-T22`, `A2-T9` |
| `Q28` | Gli **Obiettivi Comuni** sono dentro questo blocco o sono `A2-T10` da fare dopo? La somma collettiva c'è già e legge la fonte giusta; manca solo ciò che si sblocca. Senza obiettivi, "i punti non valgono nulla individualmente" è solo una restrizione, non un modello | `A2-T10` |
| `Q1` | `process_esg_impact` **deve** essere bloccata al deploy finche' non c'e' `auth.uid()`? Se sì, confermi che e' priorita' assoluta, perche' blocca anche l'idempotenza e la policy | `A3-T1`, `A5-T2`, `A2-T2` |
| `Q2` | Per togliere colonne dalle viste: **A** (vista nuova, sposto il consumer), **B** (rinomina e ricrea), **C** (DROP consentito)? La hardening gia' usa DROP | `A4-T1`, `A4-T2`, `A7-T1` |
| `Q3` | Tutti i POI leggibili da `anon`, **inclusi i disattivati**: e' voluto o serve restringere? | `A3-T9` |
| `Q4` | ~~I 63 export del SQL Editor sono la fonte di verita'?~~ **CHIUSA il 30/09: NO, sono snapshot.** Sono stati generati durante lo sviluppo del database attuale e **non** hanno autorita' sulla catena di migration. Conseguenze: (a) `pure_cloud_queries/` e i 63 export si archivano come materiale storico, non si consultano come schema; (b) il repo **non** rigenera il DB da loro, e non deve; (c) sbloccato il ramo `A3-T4` e il blocco B5, che poteva diventare una riscrittura di settimane | `A3-T4`, B5 |
| `Q5` | Heatmap: **finestra rolling** e **cadenza** di rilascio? Senza non posso scrivere la vista | `A4-T3`, `A4-T2` |
| `Q6` | `k` deve **salire** col tempo di rilascio, o resta fisso a 5? | `A4-T4` |
| `Q7` | **Shadowban = registra con 0**, o **blocco duro**? Cambia il messaggio all'utente | `A2-T4` |
| `Q8` | ~~Il brief e' documento di realta' o materiale di pitch?~~ **PARZIALMENTE CHIUSA il 30/09.** Risposta ricevuta: *"il Master Blueprint 2026 v2 e' l'unica Single Source of Truth vincolante per l'architettura del codice e del DB"*. **resta aperta la parte sui garanzie legali del brief**, che non e' stata toccata. Attenzione: c'e' una tensione da risolvere, perche' il file che l'utente indica si chiama "Master Blueprint 2026" e non "v2", ed e' quello che il 29/09 e' stato **demotato** per due affermazioni verificate false (`scan_poi_gps` che verifica la posizione; logica di validazione "interamente" lato server). Da chiarire: quale file e' il SSOT vincolante, e se "vincolante per l'architettura" convive o no con "il codice e' l'autorita'" di `METODICA.md` §1 | tutte le `A1`, `METODICA.md` |
| `Q9` | Il campionamento 1%: **lo implementiamo** o **lo dichiariamo non fatto** e correggiamo brief + `AGENTS.md`? | `A1-T1` |
| `Q10` | NTAG424: **implementiamo la crittografia** o **togliamo la promessa** dal brief? | `A1-T2` |
| `Q11` | Come **validiamo la syntax** senza PostgreSQL locale? Supabase CLI con dry run, o un branch di staging? | `A5-T1`, `A5-T3` |
| `Q12` | ~~`docs_v2/` si committa o resta fuori da git?~~ **CHIUSA il 30/09: SI', committata.** Commit `972397a`, 56 file, 47 documenti. `A3-T14` resta pero' aperta per `supabase/migrations/`, che e' il piano di lavoro e resta fuori da git: una migration applicata al cloud e assente dal repo rende il DB non riproducibile | igiene di repo |
| `Q16` | ~~Corpo reale di `recover_loto_pass`~~ — **CHIUSA il 27/09**: il corpo B scrive e ricongiunge (`ESITO-QUERY.md:51-52`). Restano due task, non una domanda: `A1-T10` (portare la funzione in Git) e il client che scarta la risposta | `A1-T10` |
| `Q17` | `tenants.id` e' un **UUID** o un testo? Serve a chiudere `A7-T7`: se e' UUID, `index.tsx:286` filtra una colonna TEXT che contiene slug e restituisce zero righe in silenzio | `A7-T7` |
| `Q18` | Esiste in `public` una RPC **`get_distance`**? `docs/logiche_proprietarie.md:10` la da' per esistente, ma non e' in nessuna delle 11 migration ne' in nessuno dei 63 export. Se non esiste, la distanza e' calcolata solo lato client e il backend non puo' validare niente | `FORMULE-PROPRIETARIE.md` 1.1 |
| `Q19` | Esistono **`saveCoordinatesAtInstallation`** e **`getCoordinatesAtFirstScan`**? Sono i nomi del Double GPS Handshake in `docs/logiche_proprietarie.md:29-43`, e non compaiono in nessun file del repository | `A1-T14` |
| `Q20` | Quali sono i valori reali delle soglie **1/5/10** in `award_civic_pti`? Le funzioni stanno nei 63 export, i numeri no | `A1-T15` |
| `Q21` | ~~Le Mete Consigliate hanno un algoritmo?~~ — **CHIUSA il 29/09: sì, entra nel prodotto.** La specifica è `docs_v2/METE-CONSIGLIATE-SPEC.md`, e `Q23` pure | `A1-T16` |
| `Q23` | ~~Come si distingue il flag dell'algoritmo da quello a mano?~~ — **CHIUSA il 29/09: opzione C**, `recommended_until`, raggio 2000 m confermato. Migration scritta in `supabase/migrations/20260929120000_mete_consigliate_soft_sorting.sql`, **da eseguire nell'SQL Editor**. Restano `A1-T16c` (popolare `loto_quota_max`, altrimenti l'algoritmo gira a vuoto) e `A1-T16d` (l'admin deve scrivere la scadenza, altrimenti la protezione è inutile) | `A1-T16`, `A1-T16b` |
| `Q22` | **`crowd_predictions`: esiste nel cloud?** L'app ci scrive dentro (`utils/bleManager.ts:150`) ma non c'e' un `CREATE TABLE` in nessuna migration ne' in nessuno dei 63 export. Se manca, l'errore e' ingoiato da un `try/catch` e la heatmap resta vuota in silenzio | `A1-T17` |

---

## 4. Cosa non rifare

- Il ramo scontrino e' **gia' rimosso** (`A2-T1`). Non cercarlo in `index.tsx`.
- Il claim GDPR e' **gia' corretto** (`A1-T9`).
- `b2b_feedbacks` **esiste** (`A6-T4`), e `k >= 5` sta a **riga 113 e 266**, non a 316. Sono a posto.
- Non applicare `migration_v22/23/24`: duplicano la hardening.
- Non applicare il fix `??` → `||` in `utils/dbAggregation.ts:35`: maschera il ledger, viola l'SSOT.
- Non deployare la catena GPS prima di Q15.

---

## 5. Dove sta il resto

Questo documento e' **solo l'indice**. Il dettaglio e' altrove, e non va duplicato qui:

| Domanda | Documento |
|---|---|
| **In che ordine affrontarli** | `PIANO-DECISIONE.md` — 5 passi, costo di ciascuno, e il nodo correttezza/demo |
| **Il file da girare a NotebookLM** | `NOTEBOOKLM-BRIEFING.md` — autosufficiente, 7 domande in coda |
| Prove di cloud, policy, RLS, ledger, k=5 | `ANONIMATO-E-INTEGRITA-LEDGER.md` |
| Stato di sessione, cosa fare per primo | `CHIUSURA-SESSIONE-27-09.md` |
| Ambiente verificato, fasi, 4 blocker della canonica | `PianoOperativo-26-09.md` |
| Decisioni prese e da non riaprire | `DECISIONI.md` |
| Query cloud pronte all'uso | `QUERY-CLOUD.sql`, `FIX-BLOCK.sql` |
| Il perimetro di ogni area | `aree/A1`…`A7` |

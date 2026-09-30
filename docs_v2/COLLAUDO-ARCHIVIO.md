---
id: COLLAUDO-ARCHIVIO
tipo: analisi
ambito: verdetto-riga-per-riga-sulle-affermazioni-di-docs-v2
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - types/database.ts:1
  - app.json:1
  - android/app/build.gradle:1
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:48
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:189
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:228
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:1
  - docs/db_migrations/02_gamification_and_events.sql:42
  - utils/dbAggregation.ts:26
  - utils/dbAggregation.ts:54
  - components/LotoPassRecoveryScanner.tsx:59
  - app/(tabs)/index.tsx:451
  - app/(tabs)/community.tsx:99
  - app/(tabs)/index.tsx:286
  - supabase/migration_v24_app_telemetry.sql:1
  - docs_v2/MODELLO_OPERATIVO.md:119
---

# Collaudo dell'archivio: la tabella di verifica

> Formato: **una riga per affermazione**, con la fonte che la sostiene, lo stato e la **prova**.
> Stati ammessi: `VERIFICATA`, `FALSATA`, `NON VERIFICABILE`. Nessuna riga dice "probabilmente".
> La gerarchia dell'evidenza è quella di `PROMPT-COLLAUDO-ARCHIVIO.md` §2: codice > migration >
> cloud > documentazione.
>
> ---
>
> **SUPERATO DA `ESITO-QUERY.md` (27/09).** Le 8 `NON VERIFICABILE` di questo documento **sono
> state chiuse** con le 4 query di `QUERY-CLOUD.sql`, e i risultati hanno prodotto **4
> affermazioni in più da `FALSATA`** (F11-F14 in `ESITO-QUERY.md` §4), fra cui una che ribalta
> `§2.3` di questo stesso documento.
>
> **Questo file resta il collaudo del 27/09 mattina.** Non è stato riscritto: le correzioni stanno
> nel file che le ha prodotte, perché `C10` vuole un argomento in una casa sola e la trappola di
> questo progetto è l'attribuzione a documenti che non hanno firmato nulla. Per lo stato finale
> leggere `ESITO-QUERY.md`.

---

## 0. Esito in apertura

**31 righe di verifica. 13 `VERIFICATA`, 10 `FALSATA`, 8 `NON VERIFICABILE`.**

### Le 10 `FALSATA`, in elenco

| # | Affermazione smentita | Dove è scritta | Prova della smentita |
|---|---|---|---|
| **F1** | "il DB reale **NON** ha la colonna `profiles.total_co2` (verificato dai tipi generati `database.ts` -> `profiles`: Row **senza** `total_co2`)" | `supabase/migration_v21_fix_scan_co2.sql:5-12` | `types/database.ts` dichiara `profiles.Row.total_co2: number \| null` (anche in `Insert` e `Update`). La root cause dichiarata nel file non piu' regge: la colonna c'e' |
| **F2** | "`vw_collective_impact` **non e' definita da nessuna parte**" | `BRIEFING-AGENTE.md:90`; `docs_v2/verifica_coerenza.py` (regola R1) | Esiste in `docs/db_migrations/02_gamification_and_events.sql:42-49`. Le sue 5 colonne coincidono una per una con `vw_collective_impact.Row` in `types/database.ts` (`total_checkins`, `total_co2_saved`, `total_explorers_today`, `total_pti_generated`, `total_water_saved`) |
| **F3** | "`vw_collective_impact` ... **non chiamato dal frontend**" | `docs_v2/tooling/verifica_coerenza.py`, riga `[R1-inesistente]` | Chiamata in `app/(tabs)/community.tsx:99` e `app/(tabs)/index.tsx:451`. Il commento `community.tsx:96` la chiama "la SSOT" |
| **F4** | "`scans`, `loto_squads`, `crowd_predictions`, `poi_ble_fingerprints`: **mai esistute**" | `BRIEFING-AGENTE.md:92`; `docs_v2/RICOSTRUZIONE.md` | Tutte e quattro sono dichiarate nella sezione `Tables` di `types/database.ts`, file **tracciato** e generato dal progetto reale: `scans` (6 colonne), `loto_squads` (5), `crowd_predictions` (7), `poi_ble_fingerprints` (5). Esistono nel cloud. La formulazione ristretta "nessuna definizione in alcuna migration" resta **vera** |
| **F5** | "Sono **8 condizioni di coesione**" | `docs_v2/MODELLO_OPERATIVO.md:127-128`; `docs_v2/ULTIMO-MIGLIO-BLOCKS.md:126` | La tabella `MODELLO_OPERATIVO.md:119-125` ha **7 righe**, non 8. Il conteggio e' sbagliato in due documenti che si citano a vicenda |
| **F6** | "il meccanismo di continuita' **esiste ed e' implementato**: il L.O.T.O. Pass. ... `recover_loto_pass(recovery_code)` e' la funzione **che ricongiunge l'utente al proprio storico**" | `docs_v2/FORMA-DEFINITIVA.md:151-155` e `:162` | L'unica definizione che esiste su file (fuori repo) e' **di sola lettura**: `brain/fb161e9d-9c2c-4652-bb90-544173968410/MIGRATE_PREBETA_CLEANUP.sql:63-95` fa un `SELECT` su `profiles` e `RETURN json_build_object(...)`. Nessuna `UPDATE`, nessun `auth.uid()`, nessuna scrittura. E il client ne scarta il risultato: `components/LotoPassRecoveryScanner.tsx:63-68` legge solo `data?.success` e mostra un `Alert` |
| **F7** | "validatore pulito, **23 documenti**, 13 ambiti distinti" | `docs_v2/PianoOperativo-26-09.md:246` | Oggi `MANIFEST.json.conteggi.totali` = **28** e `validate.py` ne analizza 28. E' una **deriva**, non un errore di lettura: 5 documenti sono stati scritti dopo quella riga. Ma la frase, se citata oggi, e' falsa |
| **F8** | "`migration_v22/v23/v24` fanno `DROP VIEW` + `CREATE VIEW` senza gate `is_loto_admin()` **e con `GRANT SELECT ... TO anon`**" | `docs_v2/PianoOperativo-26-09.md:399-400`; `docs_v2/aree/A3_dati_e_sql.md:76` e `:153` | Per `v24` la parte del `GRANT` ad `anon` e' falsa: `supabase/migration_v24_app_telemetry.sql` non contiene **nessun** GRANT ad `anon`, concede a `postgres, service_role, authenticated`. Per `v22` e `v23` la frase regge (`GRANT SELECT ... TO postgres, anon, authenticated, service_role`). Il pericolo di `v24` resta reale ma per un altro motivo: toglie il filtro `WHERE public.is_loto_admin()` (hardening `:375`) lasciando il `GRANT` a `authenticated` |
| **F9** | "il dump del 25/09: `profiles` ha **21 colonne**, `user_pois` **11**, `badges` 6, `user_badges` 4" | `docs_v2/aree/A3_dati_e_sql.md:104-106` | `user_pois.Row` in `types/database.ts` ha **10** colonne, non 11 (`calculated_speed_kmh`, `co2_saved`, `id`, `is_shadowbanned`, `lat`, `lng`, `poi_id`, `profile_id`, `visited_at`, `xp_awarded`). `profiles` = 21: **corretto** |
| **F10** | "**26 tabelle** e **8 viste DaaS/admin** definite nelle migration" | `docs_v2/MODELLO_OPERATIVO.md:37` | Estrazione esaustiva dei `CREATE` da `supabase/migrations/`: **3 tabelle** (`admin_alerts`, `app_telemetry_events`, `b2b_feedbacks`), **7 viste**, **5 funzioni** = 15 oggetti. Anche su tutto `supabase/` (inclusi archivio e query) si contano 30 tabelle e 16 viste: il 26/8 non corrisponde a nessuna lettura possibile |

### Il fatto che cambia la priorita' dei blocchi

`types/database.ts` e' un file **tracciato**, generato da `supabase gen types` dal progetto reale
`fsuolbwsvpgiglwcaffh`, committato in `bb0fa37` (HEAD corrente) il **2026-09-25**. E' il tier piu'
alto di evidenza disponibile per lo stato del cloud senza aprire il SQL editor: e' uno snapshot
generato, non una dichiarazione.

Da quello snapshot, con 0 accessi al cloud:

- **`scan_poi` e `scan_poi_gps` esistono nel cloud**, con firma `(p_poi_id uuid, p_lat float8, p_lng float8) -> Json`. I 4 blocker della catena canonica **non** sono attivi perche' quella funzione non e' stata definita lì, non perche' "la migration non e' stata applicata".
- **`sblocca_media`, `process_esg_impact`, `get_user_itineraries`, `create_itinerary`, `validate_ntag424_sdm` sono ASSENTI** dallo snapshot: 0 occorrenze in tutto il file. Esistono invece in SQL del repo (`migration_v13`, `migration_v20`, `migration_v15`, `migration_v2`, `migration_v4`). Il cloud e il repo sono **sincronizzati in entrambe le direzioni**: il cloud ha cose che Git non ha, Git ha cose che il cloud non ha.
- **`scans`, `loto_squads`, `crowd_predictions`, `poi_ble_fingerprints`, `civic_reports`, `badge_templates`, `system_logs`, `tenant_localizations`, `territories`, `whispers`, `media_vault`, `events`, `tenant_events`, `b2b_feedbacks`, `badges`, `user_badges`, `user_unlocked_media`, `impact_transactions`, `pois`, `profiles`, `tenants` esistono** e non hanno definizione in `supabase/migrations/`.

---

## 1. Quale versione dell'app corrisponde a quale stato del database

| # | Affermazione | Fonte che la sostiene | Stato | Prova |
|---|---|---|---|---|
| 1.1 | L'app in sviluppo e' alla **1.0.7**, `versionCode` 9, `com.lotohub.app` | `PianoOperativo-26-09.md:92-94`; `MODELLO_PREDITTIVO.md` regola **AP11** | **VERIFICATA** | `app.json`: `"version": "1.0.7"`, `"buildNumber": "9"`, `"versionCode": 9`; `android/app/build.gradle`: `versionName "1.0.7"`, `versionCode 9`, `applicationId 'com.lotohub.app'`. I due file concordano: deriva zero fra `app.json` e Gradle |
| 1.2 | "`docs/` e' fermo alla **1.0.2**" | `PROMPT-COLLAUDO-ARCHIVIO.md:99` | **VERIFICATA** | `1.0.2` compare in `docs/NEXT_SESSION_HANDOFF.md` e `docs/REPORT_GAMIFICATION_STATUS.md`. `1.0.7`: **0 occorrenze** in tutti i `.md` di `docs/` |
| 1.3 | "lo stato del DB alla 1.0.2 **non aveva** `profiles.total_co2`" | `supabase/migration_v21_fix_scan_co2.sql:5-12` | **FALSATA** (F1) | `types/database.ts` -> `profiles.Row.total_co2: number \| null`. La colonna esiste nello snapshot del 25/09 |
| 1.4 | La versione dell'app che il **DB riceve** corrisponde alla versione in sviluppo | implicito in `PianoOperativo-26-09.md:49-51` | **FALSATA** (nuova) | `utils/dbAggregation.ts:54` scrive `app_version: '1.0.2'` hardcodato, in un file non tracciato, mentre l'app e' alla 1.0.7. **Ogni evento di telemetria su `app_telemetry_events` e' etichettato 1.0.2**: per griglia di versione, il dato cloud non sa distinguere la 1.0.2 dalla 1.0.7 |
| 1.5 | Lo stato del DB alla 1.0.2 aveva la PK composta `(profile_id, poi_id)` su `user_pois` | implicito in `LOTO_BACKEND_STATE_REPORT.md:23` ("rimosso il constraint `profile_id + poi_id`") | **VERIFICATA** | `types/database.ts` -> `user_pois.Row` espone `id: string` come chiave e `poi_id`/`profile_id` come colonne ordinarie; in `Insert` `id` e' opzionale (ha un default). Lo snapshot del 25/09 e' gia' **dopo** la rimozione del vincolo, che coincide con `LOTO_SQL_HOTFIXES.sql` (`DROP CONSTRAINT IF EXISTS user_pois_pkey` + `ADD COLUMN id UUID ... PRIMARY KEY`) |
| 1.6 | "**nessuna** delle due migration canoniche e' stata applicata su cloud" | `aree/A3_dati_e_sql.md:124-125`; `PianoOperativo-26-09.md:53` e `:216` | **NON VERIFICABILE** | L'esistenza degli oggetti non distingue: `vw_daas_heatmap_15min`, `vw_daas_esg_monthly`, `vw_daas_event_attendance`, `vw_user_dashboard_metrics`, `vw_dev_telemetry_daily`, `app_telemetry_events` sono definiti **sia** nella hardening **sia** in `migration_v22/v23/v24`, quindi la loro presenza non dice quale delle due sia stata applicata. Lo snapshot del 25/09 **precede** la hardening, che e' committata in `bb0fa37` del 25/09: non contiene `is_loto_admin()` tra le funzioni, il che e' **indizio** (non prova) che la hardening non fosse applicata a quell'ora. La risposta la da' una riga: `select proname, prosrc from pg_proc where proname='is_loto_admin'` |
| 1.7 | Quale corpo di `scan_poi_gps` e' attivo a runtime | `PianoOperativo-26-09.md:419-420` | **NON VERIFICABILE** | 5 definizioni con la stessa firma, nessuna in `supabase/migrations/` tracciata. Vedi §6 |

---

## 2. Le condizioni di coesione di `MODELLO_OPERATIVO` §4: quante mancano davvero

La tabella ha **7 righe**, non 8 (F5). Verdetto riga per riga.

| # | Condizione dichiarata | Manca davvero? | Stato | Prova |
|---|---|---|---|---|
| 2.1 | **S1** `scan_chain_canonical` applicata: 4 blocker aperti (B1-B4) | **no, non e' un buco aperto: e' un lavoro non fatto, e i blocker sono misurati** | **VERIFICATA** (che manchi) | B1-B4 verificati riga per riga in `20260926120000_scan_chain_canonical.sql`; vedi §4 di questa tabella. La catena non e' "rotta": e' **non applicata** |
| 2.2 | **S1** `vw_pois_frontend` definita o sostituita | **no: esiste, funziona, ed e' proprio la non-migrazione a essere il buco** | **VERIFICATA** (che il buco sia di versioning) | 0 definizioni in `supabase/migrations/`; 5 copie in `supabase/archive_scattered_sql/` e 1 nel brain; presente nello snapshot cloud (`types/database.ts` -> `Views`). C11 |
| 2.3 | **S2** `is_premium_unlocked` senza destinatario UI | **parzialmente falsa: la colonna esiste, ma non in nessuna tabella che il frontend legga** | **FALSATA** nella forma, **VERIFICATA** nel merito (nuova) | `is_premium_unlocked` compare solo in `supabase/migrations/00_SETUP_ADMIN_DASHBOARD.sql`, `20260822_create_b2b_feedbacks.sql` e `types/database.ts`. **0 occorrenze in `app/`, `components/`, `utils/`, `context/`**: il frontend non legge quel dato. Il funnel di upgrade non ha schermo **perche' non ha nemmeno un lettore**: e' una colonna di tabella che nessuno consuma |
| 2.4 | **S3** `tenants.licenza` (o equivalente) manca | **VERIFICATA, e piu' grave di quanto scritto** | **VERIFICATA** | `tenants.Row` in `types/database.ts` = 12 colonne, nessuna di licenza: `center_lat`, `center_lng`, `city_name`, `default_zoom`, `display_name`, `favicon_url`, `features`, `id`, `logo_url`, `primary_color`, `region`, `secondary_color`, `slug`, `status`. Il termine "licen" ha **0 occorrenze** in tutto `app/`, `components/`, `utils/`, `context/`: il concetto di licenza non esiste da nessuna parte, non solo nella tabella |
| 2.5 | **S4** k-anonimita' e griglia "decise insieme" | **NON e' una condizione mancante: sono gia' implementate insieme** | **FALSATA** come condizione (nuova) | `20260925120000_admin_dashboard_hardening.sql:86-87` griglia `ROUND(lat,3)` = ~110 m; `:88-89` bucket 15 min; `:110` `5 AS k_anonymity_threshold`; `:113` `HAVING COUNT(DISTINCT profile_id) >= 5`. L'opzione 1 di D12 ("complementari, in due livelli") **e' gia' quella scritta nel codice**. D12 non e' una decisione aperta su cosa costruire: e' una decisione da ratificare, piu la scelta del valore di k |
| 2.6 | **S4** hardening applicata su cloud | **NON VERIFICABILE**, e non per mancanza di accesso: per **indistinguibilita'** | **NON VERIFICABILE** | v22/v23/v24 e la hardening creano gli stessi oggetti. L'unico oggetto unico della hardening e' `is_loto_admin()`, assente dallo snapshot del 25/09. Risolvibile con una riga di query |
| 2.7 | **S5** dashboard deployata | **VERIFICATA** (che non lo sia) | **VERIFICATA** | `git log --oneline -1` = `bb0fa37 feat(admin): secure DaaS dashboard and privacy views`; `PianoOperativo-26-09.md:52-53`: "il branch corrente e' `[gone]` lato remoto". Il codice c'e', il deploy no |

**Numero di condizioni davvero mancanti: 5 su 7.** Le altre due non sono mancanti: una e' gia'
costruita (2.5, griglia + soglia insieme) e una non e' verificabile con le chiavi disponibili (2.6).
Una terza (2.3) e' vera nel merito ma falsa nella forma: non e' un funnel senza schermo, e' una
colonna senza lettore.

---

## 3. `recover_loto_pass`: firma esatta e che cosa fa

**Risposta breve: la firma e' confermata; il corpo no. E il corpo che esiste su file non ricongiunge
niente.**

### 3.1 La firma, confermata da un file tracciato

```
recover_loto_pass: { Args: { recovery_code: string }; Returns: Json }
```

- `types/database.ts:1908` — file tracciato, generato dal progetto reale, committato in `bb0fa37`
  il 2026-09-25.
- `supabase/schema/introspection.sql:81` e `scripts/dump-db.ps1:222` la elencano fra le RPC da
  introspettare, cioe' il progetto la conosce come oggetto atteso.
- `components/LotoPassRecoveryScanner.tsx:59-61` la chiama con `{ recovery_code: code.trim() }`:
  **il nome del parametro combacia**.

Quindi: **la funzione esisteva nel cloud al 25/09** e il client chiama il nome giusto. Il
`PGRST202` che §4 del prompt registra per altre RPC non la riguarda: questa ha un solo parametro
obbligatorio ed e' chiamata con il nome corretto.

### 3.2 Il corpo: due definizioni in conflitto, nessuna nel repo

`supabase/` contiene **0 definizioni** di `recover_loto_pass`. Le due candidate sono entrambe
fuori dal repo, e hanno semantica opposta.

**Corpo A — l'unico su file.** `brain/fb161e9d-9c2c-4652-bb90-544173968410/MIGRATE_PREBETA_CLEANUP.sql:63-95`

```sql
CREATE OR REPLACE FUNCTION public.recover_loto_pass(recovery_code TEXT)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    target_user_id UUID; target_xp INTEGER; target_pti INTEGER;
BEGIN
    SELECT id, total_xp, total_tokens INTO target_user_id, target_xp, target_pti
    FROM public.profiles
    WHERE nickname = recovery_code OR id::text = recovery_code
    LIMIT 1;
    IF target_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Codice di recupero non valido o scaduto.');
    END IF;
    RETURN json_build_object(
        'success', true, 'message', 'Profilo recuperato con successo!',
        'user_id', target_user_id, 'xp_restored', target_xp, 'pti_restored', target_pti);
END;
$$;
```

- **Non scrive niente.** Nessuna `UPDATE`, nessuna `INSERT`.
- **Non chiama `auth.uid()`.** Non sa chi e' l'utente corrente: la funzione e' cieca all'identita'.
- **Il commento del file stesso lo dichiara**: `-- mock logic per pre-beta` (riga 73) e
  `-- facciamo finta di restituire un token virtuale` (riga 85).
- Se questo e' il corpo attivo, il recupero **non ricongiunge niente**: restituisce dati che il
  client scarta.

**Corpo B — solo in un transcript del 01/09.**
`brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/.system_generated/logs/chunks/transcript_full/00000066.jsonl:1`
e `.../transcript_full.jsonl:5148`. Istruiva l'utente di incollare nel SQL editor:

```sql
CREATE OR REPLACE FUNCTION public.recover_loto_pass(recovery_code TEXT)
RETURNS JSON AS $$
DECLARE v_old_profile RECORD; v_current_uid UUID; v_target_uuid UUID;
BEGIN
    v_current_uid := auth.uid();
    ...
    SELECT * INTO v_old_profile FROM public.profiles WHERE id = v_target_uuid;
    ...
    UPDATE public.profiles
       SET total_xp = v_old_profile.total_xp,
           is_premium = v_old_profile.is_premium
     WHERE id = v_current_uid;
    RETURN json_build_object('success', true, 'message', 'Bentornato! ...');
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

- **Scrive**, e scrive sull'`auth.uid()` corrente: ricongiunge davvero.
- **Ma travasa solo `total_xp` e `is_premium`.** Non tocca `user_pois`, `impact_transactions`,
  `user_badges`, `pois_discovered`. La progressione e' parziale per costruzione, anche nel caso migliore.
- Non e' mai diventato un file. Non e' in Git, non in `supabase/`, non in una migration.

### 3.3 Che cosa risponde il client

`components/LotoPassRecoveryScanner.tsx:55-75`: chiama la RPC, e su successo fa
`Alert.alert('Recupero Riuscito', ...)` + `onClose()`. **Legge `data?.success` e `data?.message`, e
ignora `user_id`, `xp_restored` e `pti_restored`.** Non scrive nulla in AsyncStorage, non cambia
sessione, non aggiorna il profilo.

Quindi, anche nel caso migliore (corpo B attivo), l'utente riceve un messaggio e una schermata che si
chiude. Il `Alert` dice *"i tuoi dati sono stati ripristinati"* sulla base di un `success` che il
client non verifica.

### 3.4 Lo stato della risposta

| Domanda | Stato | Prova |
|---|---|---|
| La firma e' `(recovery_code text) -> json`? | **VERIFICATA** | `types/database.ts:1908`; `LotoPassRecoveryScanner.tsx:59-61` |
| La funzione esisteva nel cloud al 25/09? | **VERIFICATA** | `types/database.ts`, generato dal progetto reale e committato in `bb0fa37` |
| Esiste in `supabase/`? | **VERIFICATA: no, 0 definizioni** | scansione esaustiva di `supabase/**.sql` |
| **Quale corpo e' attivo?** | **NON VERIFICABILE** | Serve `pg_get_functiondef`; nessun `service_role` in `.env`, nessuna chiave `SUPABASE_DB_PASSWORD`, `supabase` CLI non installata. `psql` esiste ma non ha credenziali |
| **Ricongiunge l'`auth.uid` a un profilo, o fa solo una lettura?** | **NON VERIFICABILE per il corpo attivo; FALSATA per l'unico corpo su file** | Il corpo A (`MIGRATE_PREBETA_CLEANUP.sql:63-95`) e' sola lettura: 0 `UPDATE`, 0 `auth.uid()`. Il corpo B (transcript `00000066.jsonl:1`) scrive, ma travasa solo 2 colonne ed esiste solo in un log di chat |
| `FORMA-DEFINITIVA.md:151-155` "il meccanismo esiste ed e' implementato" | **FALSATA** (F6) | vedi sopra |

**Una riga per chiudere il punto.** Nel SQL editor:

```sql
select pg_get_functiondef('public.recover_loto_pass(text)'::regprocedure);
```

Se il corpo contiene `auth.uid()` e un `UPDATE`, il Blocco 0 ha bisogno di un'altra risposta: il
recupero esiste ma resta da collegare al client. Se non lo contiene, il Blocco 0 deve costruire
quello che manca, e la riga 63-68 del client va riscritta perche' oggi promette un ripristino che
nessuno esegue.

---

## 4. I 4 blocker della catena di scansione: presenti o gia' risolti?

Domanda: sono **tutti e quattro ancora presenti nel codice attuale**? Risposta: **3 presenti, 1
condizionale, e nessuno dei 4 e' attivo oggi** perche' la funzione canonica non e' quella deployata.

| # | Blocker | Stato nel file | Prova |
|---|---|---|---|
| **B1** | Nessun `BEGIN`/`COMMIT` | **PRESENTE** | `20260926120000_scan_chain_canonical.sql`: 0 `BEGIN;` e 0 `COMMIT;`. Contrasto con `20260925120000_admin_dashboard_hardening.sql`: `BEGIN;` a riga 1, `COMMIT;` a riga 381. 0/0 contro 1/1: esatto |
| **B2** | `EXCEPTION WHEN unique_violation` -> `UPDATE`: le visite ripetute collassano sulla stessa riga | **PRESENTE nel testo, INATTIVO sullo schema corrente** | Il testo c'e' (`scan_chain:221-239`) e la `EXCEPTION` ricade su `UPDATE` a riga 229-238. Ma il collasso richiede un vincolo `(profile_id, poi_id)`, e nello snapshot del 25/09 quel vincolo **non c'e' piu'**: `user_pois` ha `id UUID` come PK. La migration pero' **non afferma** l'assenza del vincolo: non contiene `DROP CONSTRAINT`, quindi non e' auto-sufficiente se trova uno schema diverso |
| **B3** | Race sul cooldown -> doppio XP con richieste concorrenti | **PRESENTE, e ATTIVO** | `scan_chain:189-194` legge con `SELECT EXISTS`, `scan_chain:215-227` scrive: nessuna atomicita'. 0 occorrenze di `advisory`, `FOR UPDATE`, `SERIALIZABLE` in tutto il file. **Lo stesso difetto e' in tutti i corpi candidati**: `rpc_scan_poi_gps_fixed.sql:50-57` (SELECT) e `:104` (INSERT), `rpc_scan_poi_gps.sql:49-53` e `:102`. Questo blocker e' l'unico dei quattro che riguarda **anche** la funzione oggi in uso |
| **B4** | `profiles.tenant_id` aggiunta senza backfill | **PRESENTE, e la colonna non e' neppure in cloud** | `scan_chain:87-90`: solo `ADD COLUMN IF NOT EXISTS tenant_id TEXT` + `CREATE INDEX`. **0 `UPDATE` di backfill.** In piu' `profiles.Row` in `types/database.ts` **non ha `tenant_id`**: la colonna non esiste nel cloud. Il consumatore `app/(tabs)/index.tsx:284-291` fa `.eq('tenant_id', currentTenant.id)` e chiude con `if (data) setRecentUsers(data)`: **errore silenzioso**, la lista "utenti recenti" della Home resta vuota senza alcun messaggio |
| H1 | "FASE 2 neutralizzazione" e' solo un commento e cita `mitigation.sql` inesistente | **PRESENTE** (fuori perimetro, annotato) | `scan_chain:381-391` e' commento; `mitigation.sql` non esiste ne in `supabase/` ne nella root (0 risultati) |
| H2 | `scan_poi` (NFC) diventa "finalizzazione" GPS | **PRESENTE** (fuori perimetro, annotato) | `scan_chain:322-326` lo dichiara come decisione di prodotto, non tecnica |

**Nota di stato.** I 4 blocker sono "latenti" nel senso che la funzione canonica non e' quella
deployata. Ma **non per la ragione che dicono i documenti**: non perche' la migration "non sia stata
applicata", bensi' perche' nello snapshot del 25/09 `scan_poi_gps` ha la firma
`(p_poi_id, p_lat, p_lng) -> Json` — firma **identica** in tutte e 5 le definizioni in conflitto,
quindi la sua presenza **non distingue** quale sia attiva. Il Blocco 0 e' quindi piu' urgente di
quanto scritto in `ULTIMO-MIGLIO-BLOCKS.md`: se qualcuno riapplica quella migration per "metterla a
posto", B3 diventa vivo senza che nessuno lo sappia.

---

## 5. Oggetti usati dal frontend ma privi di definizione in una migration

Elenco completo, metodo riproducibile. Estrazione di tutti i `.from('...')` e `.rpc('...')` da
`app/ components/ context/ hooks/ utils/ types/ lib/ services/` (80 file), confronto con i `CREATE`
di `supabase/migrations/`.

### 5.1 Tabelle e viste: 20 bersagli, **2 definiti in migration, 18 no**

| Oggetto | Usato da | Definito in `supabase/migrations/` | Esiste nel cloud (snapshot 25/09) | Definizione nel repo fuori da `migrations/` |
|---|---|---|---|---|
| `app_telemetry_events` | `utils/dbAggregation.ts:50` | **si** (hardening `:332`) | si | `migration_v24` |
| `vw_user_dashboard_metrics` | `utils/dbAggregation.ts:26` | **si** (hardening `:295-330`) | si | `migration_v23` |
| `pois` | `community.tsx`, `admin/nfc-setup.tsx` | **no** | si | `migration_master_reset.sql`, `seed_pois.sql`, 6 archivi |
| `profiles` | 10 file (`index.tsx`, `profile.tsx`, `_layout.tsx`, …) | **no** | si | `schema_profiles.sql`, `migration_master_reset.sql` |
| `user_pois` | `index.tsx`, `map.tsx`, `VaultModal.tsx`, `communityFeed.ts` | **no** | si | `user_pois_schema.sql`, 6 archivi |
| `impact_transactions` | `index.tsx`, `communityFeed.ts` | **no** | si | `migration_v2.sql`, `migration_v4_verity.sql` |
| `user_badges` | `index.tsx`, `profile.tsx`, `badgeAssignment.ts` | **no** | si | `docs/db_migrations/02_...sql:18`, 4 archivi |
| `media_vault` | `PoiDetailSheet.tsx`, `VaultModal.tsx` | **no** | si | `migration_v13_sprint3_database.sql`, 6 archivi |
| `user_unlocked_media` | `PoiDetailSheet.tsx` | **no** | si | `migration_v13`, 6 archivi |
| `events` | `community.tsx`, `index.tsx`, `PoiDetailSheet.tsx` | **no** | si | `docs/db_migrations/02_...sql:27`, `migration_v6_smart_poi.sql` |
| `tenant_events` | `RouteSummarySheet.tsx` | **no** | si | `migration_v18_whitelabel_core.sql` |
| `tenants` | `TenantContext.tsx` | **no** | si | `migration_v18_whitelabel_core.sql` |
| `whispers` | `PoiDetailSheet.tsx` | **no** | si | `migration_master_reset.sql` |
| `civic_reports` | `community.tsx`, `CivicDashboard.tsx`, `CivicReportSheet.tsx` | **no** | si | `FIX_5_BUGS.sql` + 4 archivi |
| `location_pings` | `index.tsx` | **no** | **non nei tipi** | `migration_v4_verity.sql` |
| `civic_goals` | `CivicDashboard.tsx` | **no** | **non nei tipi** | **0 definizioni nel repo**; solo `brain/fb161e9d/MIGRATE_PREBETA_CLEANUP.sql:30` |
| `partner_insights` | `B2BFeedbackModal.tsx` | **no** | **non nei tipi** | **0 definizioni nel repo e nel brain** |
| `crowd_predictions` | `bleManager.ts` | **no** | **si** (7 colonne) | solo `brain/edf3a8e6/scratch/ble_heatmap_engine.sql` |
| `vw_pois_frontend` | `index.tsx:370`, `map.tsx:131` | **no** | si | 5 copie in `archive_scattered_sql/`, 6 nel brain |
| `vw_collective_impact` | `index.tsx:451`, `community.tsx:99` | **no** | si | `docs/db_migrations/02_gamification_and_events.sql:42` (F2) |

### 5.2 Funzioni: 11 bersagli, **2 definite in migration, 9 no**

| Funzione | Usata da | In `migrations/` | Nel cloud (25/09) | Definizione nel repo |
|---|---|---|---|---|
| `scan_poi` | `PoiDetailSheet.tsx:576` | si, ma **file non tracciato** | si | — |
| `scan_poi_gps` | `PoiDetailSheet.tsx:141`, `OfflineQueueManager.ts:140` | si, ma **file non tracciato** | si | 5 copie in conflitto, vedi §6 |
| `sblocca_media` | `PoiDetailSheet.tsx`, `OfflineQueueManager.ts:119` | **no** | **NO — 0 occorrenze in `types/database.ts`** | `migration_v13`, `migration_v20` |
| `process_esg_impact` | `index.tsx` | **no** | **NO — 0 occorrenze** | `migration_v2.sql`, `migration_v4_verity.sql` |
| `get_user_itineraries` | `index.tsx:413`, `profile.tsx` | **no** | **NO — 0 occorrenze** | `migration_v15_user_itineraries.sql` |
| `create_itinerary` | `route-creation-mockup.tsx` | **no** | **NO — 0 occorrenze** | `migration_v15_user_itineraries.sql` |
| `get_pois` | `route-creation-mockup.tsx:51` | **no** | si (`Args: never`) | 6 copie; **restituita rotta**: `42703 alternative_poi_id` |
| `join_squad` | `ProfileModal.tsx` | **no** | si | **0 definizioni nel repo e nel brain** |
| `recover_loto_pass` | `LotoPassRecoveryScanner.tsx:59` | **no** | si | solo nel brain, vedi §3 |
| `rpc_sync_adventure_distance` | `SincroAvventura.ts` | **no** | si (`{meters_count, user_id}`) | 4 copie nel brain |
| `validate_ntag424_sdm` | `nfcManager.ts` | **no** | **NO — 0 occorrenze** | **0 definizioni nel repo e nel brain** |

**Totale: 29 oggetti chiamati dal frontend attivo, 4 definiti in `supabase/migrations/`, e 2 di quei
4 in un file non tracciato. 25 oggetti senza migration tracciata.** Di questi, **5 non risultano
neppure nello schema cloud** (semicentrati in 5.2): sono chiamati dal frontend e non esistono da
nessuna parte. E **3 non hanno definizione in nessun file del repo ne' del brain**:
`partner_insights`, `join_squad`, `validate_ntag424_sdm`.

---

## 6. Quale `scan_poi_gps` e' attivo a runtime

Cinque definizioni, stessa firma `(p_poi_id UUID, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS JSONB`. Confronto corpo per corpo.

| # | Dove | SHA-256 (8) | Cooldown | Ricompense | Scrive `total_co2` | Scrive `total_tokens` | Scrive `user_pois` |
|---|---|---|---|---|---|---|---|
| 1 | `brain/edf3a8e6/rpc_scan_poi_gps.sql` (133 righe) | `D2FD2098` | **RAISE EXCEPTION** a 12 h (`:56`) | veicolare = `xp_reward`; pedonale CO2 = **10.0** (`:97`, commento "Mock") | no | no | si, 9 colonne (`:102`) |
| 2 | `brain/edf3a8e6/rpc_scan_poi_gps_fixed.sql` (138 righe) | `4CECA767` | **RAISE EXCEPTION** a 12 h (`:56`) | veicolare = **2 XP + 1 PTI**; pedonale = `xp_reward` + 10 PTI, CO2 = **1.5** (`:93-100`) | **si** (`:120`) | **si** (`:119`) | si, 9 colonne (`:104`) |
| 3 | `brain/edf3a8e6/scratch/rpc_gps.sql` (55 righe) | `09FD4490` | da leggere | da leggere | da leggere | da leggere | da leggere |
| 4 | `anti_spoofing_scan_poi_gps.sql` (root del repo) | `BF57BF7F` | da leggere | da leggere | no | no | **no** — scrive `user_id`/`created_at`, colonne inesistenti: **fallisce sempre** |
| 5 | `supabase/migrations/20260926120000_scan_chain_canonical.sql:107-298` | file non tracciato | **nessuna exception**: ritorna `status='cooldown'`, 0 ricompense (`:197-198`, `:215`) | veicolare = `xp_reward`; pedonale CO2 = `pois.base_co2` | si (`:260`) | **no, sempre 0** (`:248`) | si, 9 colonne (`:222`) |

### La catena di indizi converge sul nr. 2

1. `SUPABASE_SQL_EXPORT_APPLY_ORDER.sql` (brain) `BLOCO 2` dichiara testualmente:
   `-- Fonte: rpc_scan_poi_gps_fixed.sql (V4 MASTER)`. E' il file che raccoglie l'ordine di
   applicazione, e sceglie il nr. 2.
2. `LOTO_BACKEND_STATE_REPORT.md:15` riporta la conferma dell'utente:
   *"Hai eseguito con successo il mio script `rpc_scan_poi_gps_fixed.sql`"*.
3. `migration_v21_fix_scan_co2.sql:6-11` documenta l'errore in strada
   *"column profiles.total_co2 does not exist"*. **Solo il nr. 2 scrive `total_co2`** (`:120`): il nr. 1
   non lo tocca. L'errore osservato il 22/09 durante il test con APK 1.0.2 prova che in quel
   momento il corpo attivo era della famiglia del nr. 2.

**Stato: `NON VERIFICABILE`.** Tutta la catena e' documentale (tier 4), nessun pezzo e' una query.
Il candidato e' identificato e i tre indizi convergono, ma "convergono" non e' "provato": dal 22/09 a
oggi chiunque puo' aver riapplicato `migration_v21`, `migration_master_reset.sql:504` o la catena
canonica, e nessuno di questi eventi lascia una traccia nel repo.

Una riga chiude la questione:

```sql
select pg_get_functiondef('public.scan_poi_gps(uuid,float8,float8)'::regprocedure);
```

Il discriminatore e' immediato e non ambiguo: `v_co2_saved := 10.0` = nr. 1; `1.5` + `total_tokens` =
nr. 2; `RETURN jsonb_build_object('status', ... 'cooldown_hours', ...)` + `COALESCE(p.base_co2,0)` =
nr. 5 (catena canonica). **`co2_saved = 10.0` e' un valore che non ha senso fisico**: se lo vedi, il
nr. 1 e' vivo e il dato CO2 del progetto e' sporato per un fattore ~7.

---

## 7. Le regole di `MODELLO_OPERATIVO` §4: soddisfatte dal codice o aspirazione?

| Regola | Verdetto | Prova |
|---|---|---|
| "Il DB e' la SSOT, il frontend non calcola" (C3) | **SOSTENUTA, con un'eccezione** | `utils/dbAggregation.ts:22-42` delega tutto a `vw_user_dashboard_metrics` e ripiega sulla riga 30. Ma `index.tsx:436` e `:486` leggono `loto_fallback_xp` / `_tokens` / `_pois`: 3 chiavi **lette e mai scritte** in tutto il repo, quindi `fallbackXp: fbXp ? parseInt(fbXp) : 0` riceve sempre 0. Il fallback non e' un fallback: e' uno zero che sembra una difesa |
| "Il numero arriva dal DB" | **VIOLATA** | `enrichProfileWithDbMetrics(profile)` (`:22`, `:28`) filtra su `profile_id = profile.id`, e `profile` arriva da `index.tsx:406` (`.eq('id', user.id)`). Quindi `profile_id` **e'** `auth.uid`: la preoccupazione di `PianoOperativo-26-09.md:415-416` e' **risolta** e va rimossa dai blocchi. Il numero, pero', puo' comunque essere 0 per la riga 30 |
| "Griglia 110 m e bucket 15 min" | **CODIFICATI** | hardening `:86-89`: `ROUND(lat::numeric,3)` = 110 m all'equatore; `DATE_TRUNC('hour',...) + INTERVAL '15 min' * (minute/15)` |
| "k-anonimita'" | **CODIFICATA, valore 5** | hardening `:110` `5 AS k_anonymity_threshold`, `:113` `HAVING COUNT(DISTINCT profile_id) >= 5` |
| "Il ledger e' append-only" | **CONFORME** | `scan_chain:244-250` e hardening `:31-56`: `impact_transactions` riceve solo INSERT, nessun UPDATE ne DELETE in tutto il repo |
| "Le viste non hanno revoca ad `anon`" | **CONFORME nella hardening** | `:115-116`, `:329-330`, `:378-379`: `REVOKE ALL ... FROM anon` + `GRANT SELECT ... TO authenticated, service_role` |
| "Le stesse viste senza revoca in v22/v23" | **CONFORME alla denuncia, con un'eccezione** | v22 e v23 `GRANT ... TO anon` (F8). **v24 no**, ma toglie il gate admin |
| "`impact_transactions` e' la sola fonte di verita' per CO2/PTI/XP" | **NON SODDISFATTA** | `scan_chain:258-262` scrive anche `profiles.total_xp` e `profiles.total_co2` in cache; e `scan_chain:248` scrive `tokens_earned = 0`, quindi il check-in non accredita mai PTI (D6) |
| "`is_premium_unlocked` ha un funnel di upgrade" | **ASPIRAZIONE** | 0 lettori nel frontend (2.3) |
| "Il check-in e' il punto 2 della catena di fatturazione" | **NON RAGGIUNTO** | vedi `STRUTTURA-DEFINITIVA.md` §2 |

---

## 8. Cosa NON ho verificato, detto chiaramente

> **Risolto il 27/09 pomeriggio.** Le prime due voci sono chiuse in `ESITO-QUERY.md` §1: il corpo
> attivo di `recover_loto_pass` **ricongiunge** (è il corpo B, con `auth.uid()` e `UPDATE`), e
> `scan_poi_gps` **esiste** ed è il corpo nr. 2. La ditta applicata alla hardening è **sì**, e la
> ditta del ledger è **0 righe**. Le voci 3-6 restano aperte.

- **Il corpo attivo di `recover_loto_pass` e di `scan_poi_gps`.** Nessun `service_role` in `.env`,
  nessuna `SUPABASE_DB_PASSWORD`, CLI `supabase` non installata, `psql` senza credenziali. Per
  AP10 una `PGRST202` non prova l'assenza, e una firma non prova un corpo: le due domande che
  reggono il Blocco 0 e il Blocco 4 restano aperte e chiudono con **due query**.
- **Lo stato del cloud oggi.** `types/database.ts` e' uno snapshot del **25/09**. Ogni riga che dice
  "nel cloud" dice "al 25/09". Se qualcosa e' cambiato il 26 o il 27, qui non lo si vede.
- **La ditta applicata alla hardening.** Richiede `is_loto_admin()` in `pg_proc`.
- **I 4 APK** nella cartella brain: esclusi perimetro, come da §6 del prompt.
- **`docs/schema_architecture.md`** e **`docs/logiche_proprietarie.md`**: non confrontati, restano
  non verificate come in `A3_dati_e_sql.md:96-103`.
- **`app/_layout.tsx`**: verificato **solo** il fatto che la correzione sia presente
  (`app/_layout.tsx:78-95`: nessun `AsyncStorage.clear()`, nessuna creazione di anonimo su errore di
  rete, un profilo assente scrive `loto_profile_missing` e basta). **Non riapro il bug** e non lo
  segnalo come regressione: e' chiuso.

---

## 9. Fuori perimetro, annotati e non analizzati

- `utils/dbAggregation.ts:21` contiene **1 carattere U+FFFD** ("la vista non \ufffd\ufffd ancora
  deployata"). `A3_dati_e_sql.md:145` dichiara che le due migration canoniche ne hanno 0: vero, ma il
  file non tracciato che il client usa per le metriche ne ha uno. Non e' un blocker, e' un indicatore
  che quel file e' stato scritto altrove.
- `PianoOperativo-26-09.md:126-131` dice "**cinque** UUID distinti" e ne elenca quattro. Ambiguo:
  i cinque includono l'`auth.uid` corrente, che non e' abbandonato. Il numero va riscritto per essere
  inequivocabile, altrimenti la firma del bug di `_layout` non e' piu' citabile.
- `supabase/functions/` contiene due edge function (`calculate-esg-impact`, `whatsapp-bot`) che
  nessun `.from()`/`.rpc()` del frontend raggiunge e che nessuna migration crea. Non le ho analizzate.

---

*Collaudo del 27/09/2026 su `C:\loto_app` @ `bb0fa37`, branch `fix/ripristino-lavoro-15-set-selective`.
Nessuna scrittura al cloud, nessuna modifica a codice, migration o documentazione. I due file di
questo blocco restano non tracciati.*

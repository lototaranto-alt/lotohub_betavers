---
id: STRUTTURA-DEFINITIVA
tipo: analisi
ambito: inventario-reale-del-db-catene-e-condizioni-mancanti
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-27
evidenza:
  - types/database.ts:1
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:82
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:110
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:107
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:215
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:244
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:87
  - components/PoiDetailSheet.tsx:141
  - components/PoiDetailSheet.tsx:565
  - components/PoiDetailSheet.tsx:576
  - components/LotoPassRecoveryScanner.tsx:59
  - utils/dbAggregation.ts:26
  - utils/dbAggregation.ts:30
  - utils/OfflineQueueManager.ts:119
  - utils/OfflineQueueManager.ts:140
  - app/(tabs)/index.tsx:286
  - app/(tabs)/index.tsx:370
  - app/(tabs)/index.tsx:451
  - app/(tabs)/map.tsx:131
  - docs/db_migrations/02_gamification_and_events.sql:42
  - brain/fb161e9d-9c2c-4652-bb90-544173968410/MIGRATE_PREBETA_CLEANUP.sql:63
---

# Struttura definitiva: inventario reale, catene, condizioni, decisioni

> Ricavata **solo** dal materiale verificato in `COLLAUDO-ARCHIVIO.md`. Nessuna ipotesi sfatata
> entra in questo documento. Dove la prova manca, la riga dice `NON VERIFICABILE` e non viene
> riempita per completezza.
>
> **La fonte primaria del cielo qui è `types/database.ts`**: file tracciato, generato da
> `supabase gen types` dal progetto reale `fsuolbwsvpgiglwcaffh`, committato in `bb0fa37` il
> 2026-09-25. E' uno **snapshot**, non una lettura di oggi: ogni "esiste nel cloud" qui sotto
> significa "esisteva nel cloud al 25/09".
>
> ---
>
> **COMPLETATO DA `ESITO-QUERY.md` (27/09).** Le 4 query di chiusura hanno risolto A1-A3 e hanno
> ribaltato tre affermazioni di questo documento. Le due da corregere subito, perché sono le uniche
> che inducono a costruire la cosa sbagliata:
>
> - **`:213` catena 4 "SPEZZATA al passo 1"** — **falso per il heatmap.** `vw_daas_heatmap_15min`
>   legge `user_pois`, che riceve righe: **funziona**. Vale solo per `vw_daas_esg_monthly`.
> - **`:153` e `:356` "`tokens_earned` sempre 0, il check-in non accredita PTI"** — **falso per il
>   corpo attivo**, che accredita 1 o 10 PTI in `profiles.total_tokens`. Vanno persi a valle, in
>   `utils/dbAggregation.ts:35`, non mai accreditati.
>
> Il quadro completo, con i 3 difetti e i 4 fix, è in `ESITO-QUERY.md`.

---

## 1. L'inventario reale del database, in tre stati

Metodo: estrazione esaustiva dei `CREATE TABLE|VIEW|FUNCTION` da `supabase/**/*.sql` (75 oggetti
distinti) e dei bersagli `.from()`/`.rpc()` dal frontend attivo (29 oggetti, 80 file), confronto con
le sezioni `Tables`/`Views`/`Functions` di `types/database.ts`.

### Stato 1 — Versionato in una migration tracciata di `supabase/migrations/`

14 oggetti. **Nessuno di questi e' un fantasma**: si applicano a un ambiente vuoto e lo creano.

| Oggetto | Kind | Definito in | Usato dal frontend? |
|---|---|---|---|
| `b2b_feedbacks` | tabella | `00_SETUP_ADMIN_DASHBOARD.sql`, `20260822_create_b2b_feedbacks.sql` | no (solo dashboard) |
| `vw_admin_pois` | vista | `00_SETUP_ADMIN_DASHBOARD.sql`, `20260822_admin_pois_view.sql` | no |
| `vw_admin_checkins_analytics` | vista | `00_SETUP_ADMIN_DASHBOARD.sql`, `20260824_analytics_view.sql` | no |
| `admin_alerts` | tabella | `20260825_whatsapp_bot_setup.sql` | no |
| `is_loto_admin()` | funzione | `20260925120000_admin_dashboard_hardening.sql:61` | no (interna) |
| `app_telemetry_events` | tabella | `20260925120000_admin_dashboard_hardening.sql:332` | **si** (`dbAggregation.ts:50`) |
| `vw_dev_telemetry_daily` | vista | `...hardening.sql:365` | no |
| `vw_daas_heatmap_15min` | vista | `...hardening.sql:82` | no (dashboard) |
| `vw_daas_esg_monthly` | vista | `...hardening.sql:118` | no |
| `vw_daas_event_attendance` | vista | `...hardening.sql` | no |
| `vw_user_dashboard_metrics` | vista | `...hardening.sql:295-330` | **si** (`dbAggregation.ts:26`) |

**Nota critica.** `is_loto_admin()` e' l'**unico** oggetto che esiste solo nella hardening e non in
`v22/v23/v24`. E' il suo, e solo suo, la presenza che distingue "hardening applicata" da "v22/v23
applicate". Non e' nello snapshot del 25/09.

### Stato 2 — Esiste, ma **fuori** da `supabase/migrations/`

23 oggetti che il frontend o il ledger richiedono, che non sono versionati, e di cui **18 sono
provabilmente nel cloud** (dichiarati in `types/database.ts`).

| Oggetto | Kind | Dove e' definito | Nel cloud al 25/09 | Rischio |
|---|---|---|---|---|
| `vw_pois_frontend` | vista | 5 copie in `archive_scattered_sql/`, 6 nel brain. **Nessuna in Git come migration** | **si** | **il peggiore**: funziona, e la definizione attiva non e' recuperabile da Git |
| `vw_collective_impact` | vista | `docs/db_migrations/02_gamification_and_events.sql:42` | **si** | definizione compatibile con lo snapshot (5 colonne identiche), ma **fuori da `supabase/`**: nessun tooling la vede |
| `pois` | tabella | `migration_master_reset.sql`, `seed_pois.sql` | si | il ledger dipende da `xp_reward` e `base_co2` |
| `profiles` | tabella | `schema_profiles.sql`, `migration_master_reset.sql` | si | **manca `tenant_id`** (vedi catena 1) |
| `user_pois` | tabella | `user_pois_schema.sql` + 6 archivi | si | 10 colonne, PK surrogata `id` |
| `impact_transactions` | tabella | `migration_v2.sql`, `migration_v4_verity.sql` | si | **il bene che si vende**: nessuna migration lo crea |
| `tenants` | tabella | `migration_v18_whitelabel_core.sql` | si | **manca ogni colonna di licenza** |
| `user_badges` | tabella | `docs/db_migrations/02_...sql:18` | si | |
| `user_unlocked_media` | tabella | `migration_v13_sprint3_database.sql` | si | |
| `media_vault` | tabella | `migration_v13_sprint3_database.sql` | si | |
| `events` | tabella | `docs/db_migrations/02_...sql:27` | si | |
| `tenant_events` | tabella | `migration_v18_whitelabel_core.sql` | si | |
| `whispers` | tabella | `migration_master_reset.sql` | si | |
| `civic_reports` | tabella | `FIX_5_BUGS.sql` + 4 archivi | si | |
| `crowd_predictions` | tabella | solo `brain/edf3a8e6/scratch/ble_heatmap_engine.sql` | si | |
| `territories`, `tenant_localizations`, `badge_templates`, `system_logs`, `scans`, `loto_squads`, `poi_ble_fingerprints` | tabelle | 0 definizioni tracciate; 4 presenti in `docs/db_migrations/` e archivi | si | 3 delle 7 sono **usate dal frontend** |
| `scan_poi_gps()` | funzione | 5 copie in conflitto, vedi `COLLAUDO-ARCHIVIO.md` §6 | si | **il corpo attivo e' sconosciuto** |
| `scan_poi()` | funzione | solo `20260926120000_scan_chain_canonical.sql:329` (**file non tracciato**) | si | se il file si perde, la definizione si perde |
| `get_pois()` | funzione | 6 copie | si | **restituita rotta** (`42703 alternative_poi_id`) |
| `get_pois_with_status()` | funzione | 0 definizioni tracciate | si | ignorata dal frontend |
| `recover_loto_pass()` | funzione | solo brain, 2 corpi in conflitto | si | vedi `COLLAUDO-ARCHIVIO.md` §3 |
| `rpc_sync_adventure_distance()` | funzione | 4 copie nel brain | si | accetta `user_id` dal client |
| `join_squad()` | funzione | **0 definizioni ovunque** | si | |

### Stato 3 — **Inesistente**: il frontend le chiama, e non sono da nessuna parte

5 funzioni. Zero definizioni in tutto il repo e in tutto il brain, **e zero occorrenze in
`types/database.ts`**: non sono nello schema cloud al 25/09.

| Funzione | Chiamata da | Effetto del fallimento, nel codice |
|---|---|---|
| `sblocca_media` | `OfflineQueueManager.ts:119`, `PoiDetailSheet.tsx` | L'errore **non è intercettato**: l'item resta in coda e ogni flush lo riprova. **Lo sblocco dei media non avviene** |
| `process_esg_impact` | `index.tsx` (scansione scontrino) | Nessuna scrittura su `impact_transactions`: **il percorso ESG del partner è muto** |
| `get_user_itineraries` | `index.tsx:413`, `profile.tsx` | `if (itinData)` (riga 414) scarta l'errore: **la lista itinerari è vuota, senza messaggio** |
| `create_itinerary` | `route-creation-mockup.tsx` | Schermata mockup, fuori percorso attivo |
| `validate_ntag424_sdm` | `nfcManager.ts` | **Il challenge NFC firmato non esiste.** È la ragione per cui D5 ha solo 2 delle 3 opzioni che il registro promette |

**Da aggiungere a Stato 2** (definite solo nel brain, mai nel repo): `civic_goals`
(`brain/fb161e9d/MIGRATE_PREBETA_CLEANUP.sql:30`, letta da `CivicDashboard.tsx`) e
`location_pings` (definita in `migration_v4_verity.sql`, ma **assente dallo snapshot cloud**:
non risulta nelle tabelle di `types/database.ts`).

### Il numero, in una riga

> **29 oggetti richiesti dal frontend attivo. 4 definiti in `supabase/migrations/`, di cui 2 in un
> file non tracciato. 5 non esistono da nessuna parte.**

---

## 2. Le catene dell'utente, con il punto esatto di rottura

### Catena 1 — Check-in GPS: dall'azione al ledger

```
utente apre il POI
  -> GPS on-device, distanza calcolata                       [PoiDetailSheet.tsx:540-552]        OK
  -> scan_poi_gps(p_poi_id, lat, lng)                        [PoiDetailSheet.tsx:141]            OK (la funzione esiste)
  -> INSERT user_pois (log di validazione)                   [corpo attivo, sconosciuto]         ???
  -> INSERT impact_transactions (LEDGER)                     [corpo attivo, sconosciuto]         ??? <-- QUESTO
  -> UPDATE profiles.total_xp / total_co2 (cache)            [corpo attivo, sconosciuto]         ???
```

**Esito: SPEZZATA, in un punto che non si puo' nominare senza una query.**

Il punto di rottura non e' il frontend: `PoiDetailSheet` chiama, e la funzione risponde. Il punto di
rottura e' **within la funzione**, e la sua posizione esatta dipende da quale dei 5 corpi in
conflitto e' vivo. I tre esiti possibili, e ognuno ha un esito diverso per la catena:

| Se il corpo attivo e'… | `impact_transactions` riceve? | Catena |
|---|---|---|
| nr. 2, `rpc_scan_poi_gps_fixed.sql` | **no**: quel corpo scrive **solo** `user_pois` e `profiles` | il **ledger non esiste**: la catena si ferma al passo 2 di 6, e tutto il prodotto vendibile nasce da qui |
| nr. 1, `rpc_scan_poi_gps.sql` | **no**, identico | idem, e in più il CO2 e' `10.0`, un valore che non ha senso fisico |
| nr. 5, catena canonica | **si** (`:244-250`) | la catena passa, ma `tokens_earned` e' **sempre 0** (`:248`): il check-in non accredita mai PTI |

**Questo e' il punto piu' importante di tutta la struttura.** `impact_transactions` e' nominata in
`MODELLO_OPERATIVO.md:90` come *"IL LEDGER. Il bene che vendi"*, e **nessuna delle definizioni
attualmente in gioco nel cloud lo scrive**, tranne la catena canonica che non e' applicata. Se la
sonda di `scan_poi_gps_fixed` e' quella giusta, il progetto ha quattro mesi di check-in che non
producono il prodotto.

**Una riga chiude il punto:** `select count(*) from impact_transactions;` — zero righe e catena
spizzata al passo 2; righe e il ledger esiste gia'.

### Catena 2 — Check-in NFC / tag

```
utente inquadra il tag                    [PoiScannerModal via PoiDetailSheet.tsx:559-562]
  -> il contenuto NON viene confrontato con il POI           [PoiDetailSheet.tsx:565]
  -> scan_poi(p_poi_id)                    [PoiDetailSheet.tsx:576]
  -> (nel corpo canonico) richiede una visita GPS nei 15 minuti [scan_chain:346-357]
```

**Esito: SPEZZATA al passo 1, per progetto, non per difetto.**

`PoiDetailSheet.tsx:565` confronta `scannedData` solo con due stringhe
(`loto.app/e/1`, `plasticaqqua`): se non corrispondono, chiama `scan_poi` con `poi.id` **preso dalle
props** e `scannedData` **viene buttato**. Qualsiasi QR inquadrato dentro quella modale finalizza il
POI che si sta guardando. Nel corpo canonico la guardia 15-minuti (`:346-357`) chiude il buco, ma
**il corpo attivo è sconosciuto**: se è il nr. 2, `scan_poi` non è nemmeno definito lì (il nr. 2
ridefinisce solo `scan_poi_gps`), e la catena si rompe con `PGRST202`.

Il punto di rottura è questo: **manca `validate_ntag424_sdm`**, la firma NFC verificata lato server
che D5 chiama "opzione 3" e che `nfcManager.ts` già invoca. Non è una feature futura: è la
prerequisito che rende legittimo il tag, ed è in Stato 3.

### Catena 3 — Identità e continuità

```
salvataggio del Pass in galleria           [fuori dal perimetro: nessun writer trovato]
  -> lettura del QR / "Copia Testo"          [LotoPassRecoveryScanner.tsx:30-53, 128-135]
  -> recover_loto_pass(recovery_code)        [LotoPassRecoveryScanner.tsx:59]
  -> Alert + chiusura                        [LotoPassRecoveryScanner.tsx:63-68]
  -> (nessuna scrittura locale, nessun cambio di sessione)
```

**Esito: SPEZZATA al passo 3, e in modo definitivo.**

Il client legge `data?.success` e `data?.message` e **ignora `user_id`, `xp_restored`,
`pti_restored`**. Anche se il corpo che scrive (corpo B) fosse attivo, l'utente riceve un messaggio e
una schermata che si chiude. `FORMA-DEFINITIVA.md:151-155` dice che questo meccanismo *"esiste ed è
implementato"*: **l'implementazione è la chiamata, non il ricongiungimento.**

### Catena 4 — Dal dato al fatto vendibile

```
user_pois.lat/lng/visited_at                [disponibili: 10 colonne, PK surrogata]
  -> vw_daas_heatmap_15min  griglia 110m, bucket 15min, k>=5  [hardening:82-113]  CODIFICATA
  -> vw_daas_esg_monthly / _event_attendance                    [hardening:118+]   CODIFICATE
  -> report CSV/GeoJSON a mano                                 [nessun codice]     POSSIBILE
  -> vendita all'agenzia                                       [nessun contratto]  FUORI PERIMETRO
```

**Esito: SPEZZATA al passo 3 per `vw_daas_esg_monthly`; COMPLETA per `vw_daas_heatmap_15min`.**

> **Corretto il 27/09** (`ESITO-QUERY.md` §2.1 e F13). Tutto il downstream è scritto, corretto e
> pronto: griglia, bucket, soglia k, gate `is_loto_admin`, revoca ad `anon`. È la parte meglio fatta
> del progetto, e **funziona**: `vw_daas_heatmap_15min` legge `user_pois`, che il check-in riempie.
> La versione originale di questo paragrafo diceva che la catena era spezzata al passo 1 "perché il
> passo 1 non riceve nulla": **confondeva il heatmap con il report ESG.** L'heatmap ha i suoi dati;
> `vw_daas_esg_monthly` legge `impact_transactions`, che ha 0 righe.

Tutto il downstream è scritto e pronto: griglia, bucket, soglia k, gate `is_loto_admin`, revoca ad
`anon`. Ma `vw_daas_esg_monthly` legge `impact_transactions`, e il ledger ha **0 righe**: il report
ESG è vuoto e non lo sarà finché la funzione viva non lo scrive.

Nota: questa catena **non** ha un punto di rottura suo. È la prima per cui la risposta è "il
prodotto esiste già, manca solo il dato". È anche l'unica dove non c'è nessuna decisione di prodotto
da prendere.

### Catena 5 — Le metriche della Home

```
auth.getUser()                             [index.tsx:404]        OK
  -> profiles .eq('id', user.id)           [index.tsx:406]        OK  (id == auth.uid: RISOLTO)
  -> vw_user_dashboard_metrics             [dbAggregation.ts:26]  silenzioso
  -> fallback su profiles statico          [dbAggregation.ts:30]  silenzioso
  -> fallbackXp/Tokens/Pois                [index.tsx:436, 486]   SEMPRE 0
```

**Esito: COMPLETA nel percorso, INCOMPLETA nel risultato.**

`profile_id` **è** `auth.uid`: `enrichProfileWithDbMetrics` filtra su `profile.id` (`:28`) e
`profile` viene da `.eq('id', user.id)` (`index.tsx:406`). La preoccupazione di
`PianoOperativo-26-09.md:415-416` e di `ULTIMO-MIGLIO-BLOCKS.md:189-191` è **da rimuovere**: non è la
causa dei fallback silenziosi.

La causa dei fallback silenziosi è un'altra, ed è doppia: `dbAggregation.ts:30` (`if (error || !data)
return profile`) e le tre chiavi `loto_fallback_*`, che sono **lette in 4 punti e scritte in 0** in
tutto il repo. Il fallback non ripiega su niente: è uno zero travestito da difesa.

**Rotte secondaria, nella stessa schermata:** `index.tsx:284-291` interroga `profiles` con
`.eq('tenant_id', currentTenant.id)`; `profiles` **non ha `tenant_id`** (né in cloud, né dopo la
catena canonica senza backfill). Errore `42703`, catturato da `if (data)` e scartato: **la lista
"utenti recenti" è vuota e non lo dice.**

---

## 3. Le condizioni mancanti, in ordine di dipendenza

Ordinate per **dipendenza**, non per importanza: ogni riga è prerequisito della successiva. La
colonna "tipo" è la distinzione richiesta: **SQL**, **decisione di prodotto**, **UI**.

### 3.1 Blocco A — niente di tutto il resto si muove senza questi

| # | Condizione | Tipo | Prova che manca | Dipende da |
|---|---|---|---|---|
| **A1** | Il corpo di `recover_loto_pass` è noto | **SQL** (una query) | `COLLAUDO-ARCHIVIO.md` §3.2: due corpi in conflitto, nessuno in Git | — |
| **A2** | Il corpo di `scan_poi_gps` è noto | **SQL** (una query) | 5 definizioni, stessa firma, `COLLAUDO-ARCHIVIO.md` §6 | — |
| **A3** | `impact_transactions` contiene righe | **SQL** (una query) | `MODELLO_OPERATIVO.md:105` la dichiara il bene vendibile; nessun corpo attivo noto la scrive | A2 |
| **A4** | La firma del Blocco 0 è decisa: cosa fa il client con il risultato di `recover_loto_pass` | **decisione di prodotto** | `LotoPassRecoveryScanner.tsx:63-68` scarta `user_id`; `FORMA-DEFINITIVA.md:151` lo dichiara invece risolto | A1 |
| **A5** | B3 chiuso: `pg_advisory_xact_lock` o `SELECT ... FOR UPDATE` sul profilo | **SQL** | `scan_chain:189-227`, 0 lock in tutto il file; difetto presente in **tutti** i corpi candidati | A2 |
| **A6** | B1 chiuso: `BEGIN` / `COMMIT` nella catena canonica | **SQL** | `scan_chain` 0/0 contro 1/1 della hardening | — |
| **A7** | B4 chiuso: `ADD COLUMN profiles.tenant_id` **+ backfill** | **SQL** | `scan_chain:87-90`: solo `ADD COLUMN`, 0 `UPDATE`. La colonna non è in cloud | — |
| **A8** | B2 chiuso: la migration **afferma** l'assenza del vincolo `(profile_id, poi_id)` invece di presupporla | **SQL** | `scan_chain:221-239` presuppone; 0 `DROP CONSTRAINT` nel file | A2 |
| **A9** | `profiles.tenant_id` consumato senza fallback silenzioso | **UI** (1 riga) | `index.tsx:286-290`: `if (data)` scarta l'errore | A7 |

### 3.2 Blocco B — senza questi il dato non arriva alle viste

| # | Condizione | Tipo | Prova che manca | Dipende da |
|---|---|---|---|---|
| **B1** | `vw_pois_frontend` portata in una migration, con `pg_get_viewdef` | **SQL** | 0 definizioni in `supabase/migrations/`; 5 copie in archivio, nessuna canonica | A2 (serve sapere quale è viva) |
| **B2** | `vw_collective_impact` portata in una migration | **SQL** | definita in `docs/db_migrations/02_...sql:42`, fuori da `supabase/`; il tooling non la vede | — |
| **B3** | `sblocca_media` esiste davvero | **SQL** | 0 definizioni nel repo, 0 occorrenze in `types/database.ts`. **Media unlock e funnel di upgrade insieme** | — |
| **B4** | `process_esg_impact` esiste davvero | **SQL** | 0 definizioni e 0 occorrenze. Il percorso ESG del partner è muto | — |
| **B5** | `get_user_itineraries` esiste davvero | **SQL** | 0 definizioni e 0 occorrenze. La lista itinerari è vuota in silenzio | — |
| **B6** | Le tre chiavi `loto_fallback_*` o scritte o **rimosse** | **UI** | 4 letture, 0 scrizioni in tutto il repo. Un fallback mai esercitato sembra esserci e non è | — |

### 3.3 Blocco C — ciò che va deciso, non costruito

| # | Condizione | Tipo | Prova | Note |
|---|---|---|---|---|
| **C1** | Il tag NFC vale da solo, o solo come finalizzazione GPS? | **decisione di prodotto** | `scan_chain:322-326` lo dichiara esplicitamente; `DECISIONI.md` D5 | **Cambia la firma delle funzioni.** Va deciso prima del rilascio |
| **C2** | Il check-in accredita PTI? | **decisione di prodotto** | `scan_chain:248` scrive `tokens_earned = 0` | D6. Se "congelata", va scritto nel codice con un commento |
| **C3** | Il valore di **k** per la soglia di anonimato | **decisione di prodotto** | `hardening:110` fissa `5`, senza che la decisione sia registrata | La griglia e la soglia **sono già complementari nel codice**: D12 ratifica, non costruisce |
| **C4** | `tenants` ha una colonna di licenza, o le licenze stanno altrove? | **decisione di prodotto** | `tenants.Row` = 12 colonne, nessuna di licenza; 0 occorrenze di "licen" in tutto il frontend | Senza, non c'è nulla da dire a un'agenzia |
| **C5** | Il partner sblocca i feedback su WhatsApp o su schermata? | **decisione di prodotto** | `is_premium_unlocked` ha 0 lettori nel frontend | D13. Il blocco non è "manca lo schermo": è "manca il lettore" |
| **C6** | `poi.tier` esiste, o la validazione a 4 tier resta prosa? | **decisione di prodotto** | `pois.Row` non ha `tier` | D10 |
| **C7** | La privacy del dato venduto: griglia e soglia, alternativa o complementari? | **decisione di prodotto** | già implementate **in complementarità** | D12: la risposta è già nel codice |

### 3.4 Blocco D — ciò che è UI e non blocca nessuno

| # | Condizione | Tipo | Prova |
|---|---|---|---|
| **D1** | `app_version` nei log di telemetria non hardcodato | **UI** | `dbAggregation.ts:54` scrive `'1.0.2'` con l'app alla 1.0.7: **il cloud non distingue le due versioni** |
| **D2** | Lo sblocco media ha un destinatario visibile | **UI** | `VaultModal.tsx` e `PoiDetailSheet.tsx` leggono `user_unlocked_media`; la RPC che lo sblocca non esiste (B3) |
| **D3** | La tab bar ha una politica di visibilità | **UI** | 7 route tab, nessuna policy. Fuori dai blocchi di questo documento |

### 3.5 Ciò che NON manca, e va tolto dalla lista

| Cosa | Perché non manca | Prova |
|---|---|---|
| La griglia 110 m | già codificata | `hardening:86-87` |
| Il bucket 15 min | già codificato | `hardening:88-89` |
| La soglia k-anonimita' | già codificata, k=5 | `hardening:110`, `:113` |
| La revoca ad `anon` sulle viste | già codificata nella hardening | `hardening:115-116`, `:329-330`, `:378-379` |
| Il gate `is_loto_admin()` | già codificato | `hardening:61-79`, 10 occorrenze |
| L'append-only del ledger | già conforme | `scan_chain:244-250`: solo INSERT in tutto il repo |
| L'identita' anonima come UUID | **è il progetto**, non un difetto | `AGENTS.md`, `LOTO_DB_PRODUCTION_MAP.md` §1, principio Zero-PII |
| Il bug di `_layout.tsx` | **corretto** | `app/_layout.tsx:78-95`: nessun `clear()`, nessun anonimo nuovo su errore di rete |

---

## 4. Le decisioni che spettano all'utente

Formulate a **risposta sì/no**. Ognuna ha la ragione per cui blocca qualcosa. Nessuna richiede di
scegliere fra opzioni: le opzioni sono in `DECISIONI.md`, qui c'è solo la domanda binaria che
sblocca il lavoro.

### 4.1 Decisioni che sbloccano SQL (rispondere enables immediately)

| # | Domanda | Sì | No | Perché blocca |
|---|---|---|---|---|
| **Q1** | Apri il SQL editor e mi fai leggere **3 query** (`recover_loto_pass`, `scan_poi_gps`, `count(*) su impact_transactions`)? | Chiudo il Blocco 0 e il Blocco 4 con fatti invece che con ipotesi | Tutto il resto resta costruito su 5 definizioni in conflitto e su un ledger di esistenza ignota | Le 3 righe chiudono `COLLAUDO-ARCHIVIO.md` §3, §6 e la catena 1. **Nessun'altra riga di codice può sostituirle** |
| **Q2** | Il codice di `recover_loto_pass` deve **ricongiungere** l'`auth.uid` corrente a un profilo esistente, o deve solo **confermare** che un codice è valido? | Riscriviamo `LotoPassRecoveryScanner.tsx:63-68` perché applichi il risultato | Il client resta com'è, ma va tolta la frase *"i tuoi dati sono stati ripristinati"* dall'Alert: sarebbe falsa | Il client oggi scarta `user_id`. Senza questa risposta non si sa cosa scrivere |
| **Q3** | `recover_loto_pass` deve spostare **anche** `user_pois`, `impact_transactions` e `user_badges`, o solo XP e Premium? | Il recupero è completo e il Blocco 0 si chiude sul serio | Va scritto nel codice, con un commento, che il recupero è **parziale per progetto** — altrimenti il prossimo agente lo legge come un bug | Il corpo B travasa 2 colonne su 6. È una scelta, non un dettaglio |
| **Q4** | `sblocca_media`, `process_esg_impact`, `get_user_itineraries` vanno **portate in Git e applicate**, o il frontend smette di chiamarle? | Il media unlock e l'ESG tornano a funzionare | 3 schermate restano vuote **in silenzio**, e va detto all'utente che sono vuote | 5 funzioni chiamate dal frontend non esistono da nessuna parte. La risposta cambia 3 feature |
| **Q5** | Chiudo **B1-B4** nella catena canonica **prima** di riapplicarla? | La catena si applica in un colpo solo e B3 non lascia più il doppio XP | La catena va trattata come debito, e va scritto **quando** verrà chiuso | B3 è l'unico blocker che riguarda **anche** la funzione oggi in uso |

### 4.2 Decisioni di prodotto (nessuna riga di codice le chiude)

| # | Domanda | Sì | No | Perché blocca |
|---|---|---|---|---|
| **Q6** | Lo scan del tag NFC deve **funzionare da solo**? | Serve `validate_ntag424_sdm`, che oggi non esiste: è lavoro, non una riga | `scan_poi` resta una finalizzazione GPS e l'utente col telefono spento fatica | **Cambia la firma delle funzioni.** Va deciso prima del rilascio, non dopo (D5) |
| **Q7** | Il check-in **accredita PTI**? | `scan_chain:248` passa da `0` a un valore calcolato | Va scritto un commento nel codice con la regola *"PTI congelata"* | Ogni check-in vale 0 token: se è voluto, l'economia del civismo è un'altra (D6) |
| **Q8** | La soglia k=5 è il valore giusto per la vendita? | È scritto in `DECISIONI.md` D12 e il codice smette di essere un mistero | Serve un altro numero, e va deciso prima del primo report venduto | Il codice ha `5` senza che nessuna decisione lo copra. È il rischio legale della vendita |
| **Q9** | `tenants` deve avere una **colonna di licenza**? | Si può dire a un'agenzia cosa ha attivato | Le licenze stanno fuori dal DB, e vanno decise dove | La multi-tenancy c'è, la gestione delle licenze no: senza, S3 non ha nulla da vendere |
| **Q10** | Il partner sblocca i feedback **su WhatsApp**? | Zero-UI coerente con il progetto, e si usa un canale che già esiste | Serve una mini-schermata web, che il progetto aveva escluso | `is_premium_unlocked` ha 0 lettori nel frontend: il funnel non ha nemmeno un pubblico (D13) |
| **Q11** | `poi.tier` entra nello schema? | La validazione a 4 tier diventa costruibile | La 4-tier resta prosa e il pricing non ha una base (D10) | Senza il campo, la struttura di validazione non distingue il costo zero dal costo per transazione |

### 4.3 Decisioni di scope (rispondere ferma il lavoro, non lo sblocca)

| # | Domanda | Sì | No | Perché blocca |
|---|---|---|---|---|
| **Q12** | Le tre chiavi `loto_fallback_*` si **tolgono**? | Il codice dice la verità su quello che fa | Vanno scritte, e allora servono a qualcuno | 4 letture, 0 scrizioni: oggi sono uno zero che sembra una difesa |
| **Q13** | `app_version` nei log di telemetria si legge dalla app invece che da una costante? | Il cloud distingue 1.0.7 dalla 1.0.2 | Va accettato che la telemetria non distingue le versioni | `dbAggregation.ts:54` etichetta ogni evento come 1.0.2: la griglia di versione è falsata alla fonte |
| **Q14** | I 4 APK nella cartella brain si analizzano **ora**? | Si può ricostruire quale corpo di `scan_poi_gps` e quale UI giravano in ciascuna release | Restano fuori perimetro | È l'unico modo di **chiudere per inferenza** la catena 1 e il corpo di `recover_loto_pass` senza accesso al cloud |

---

## 5. La sequenza, in cinque righe

```
Q1  (3 query)          ->  chiude §3.1 A1-A3: cosa è davvero vivo nel DB
Q2 + Q3                ->  chiude A4: il Blocco 0 smette di essere un'ipotesi
B1-B4 chiusi           ->  A5-A8: la catena si può applicare in un colpo solo
B1-B4 applicata        ->  catena 1 completa: il ledger riceve, e da li la catena 4 regge
Q6, Q7                 ->  prima del rilascio: cambiano la firma delle funzioni
```

Il resto — griglia, bucket, k, revoca ad `anon`, gate admin, append-only — **è già fatto**.

---

*Struttura definitiva del 27/09/2026, derivata da `docs_v2/COLLAUDO-ARCHIVIO.md`. Nessuna scrittura
al cloud, nessuna modifica a codice o migration, nessun commit. Le due query di `Q1` e le due di
`COLLAUDO-ARCHIVIO.md` §3.4 e §6 sono l'unico lavoro che resta per passare dal "verificato fino a
qui" al "verificato tutto".*

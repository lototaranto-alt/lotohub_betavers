# VISIONE & ESECUZIONE — CORE BUSINESS

> **Scopo.** Documento unico che (A) fissa la visione del funzionamento dell'app e del
> core business — dalla gamification in poi — e (B) registra ogni discrepanza tra
> "voluto" e "reale", con evidenza e via di chiusura. I documenti senza questo
> registro sono rumore di riferimento.
>
> **Regole di chiusura.** Una discrepanza si chiude SOLO con:
> 1. evidenza `file:line` o misura Fase 0, e
> 2. riferimento al modulo `M*` o alla decisione `P-D*` che la risolve.
> Le correzioni non si riscrivono (METODO 7.1): si chiudono con stato + riferimento.
>
> **Stato:** vivo — aggiornato a ogni misura, modifica e decisione.

---

## A. Visione canonica (bozza approvata in sessione 06/10)

### A1. Core business
Mappa della città → scoperta POI (fog of war) → check-in con verifica di
prossimità GPS → XP / CO₂ / PTI → progressione livelli → sblocco contenuti
(eventi, diario, community, itinerari).

### A2. Gamification (dominio prioritario della visione)
- Livelli: soglie **statiche** in `utils/levelUtils.ts:79-130` (LV1→LV2 = 30 XP, max 50).
- `KEY_LEVELS = [1,2,5,11,20,21,30,31,41]` → WHISPER / REVEAL / RITO tramite
  `buildLevelUpEvents` + `GamificationTransitionManager`.
- Gate sezioni: EVENTI=2, ITINERARI=4, DIARIO=6, COMMUNITY=8, CO-EXPERIENCE=20
  (`utils/levelUtils.ts:17-21`).
- Badge: `utils/badgesCatalog.ts` (metriche = colonne `profiles`), assegnati da
  `utils/badgeAssignment.ts` (`ensureEarnedBadges`).
- Vietate le leve PTI/Bronzo-Argento-Oro nella crescita (`utils/LevelUpLore.ts:4`).

### A3. Anti-cheat / catena check-in
- **1° check-in** (cold-start, velocità non misurabile) — **P-D1**:
  `v_xp_awarded := 20`, `co2_saved := 0`, `tokens_earned := 0`,
  `calculated_speed_kmh := NULL`, `is_shadowbanned := FALSE`,
  `action_type = 'tourist_checkin'` (invariato).
- **Dal 2° check-in** (velocità misurabile) — tre fasce **invarianti**
  (`supabase/migrations/20260929160000_restore_proximity_gate.sql:232-245`):
  - `>130 km/h` → shadowban, 0 XP / 0 PTI / 0 CO₂
  - `20 ≤ v ≤ 130` → **2 XP fissi** (costante, NON da POI), 1 PTI, 0 CO₂
  - ELSE pedonale → `COALESCE(pois.xp_reward, 15)` (**dinamico da POI**; 15 solo
    se `xp_reward` è NULL), 10 PTI, 1,5 CO₂
- Sentinella `9999` **eliminata** (P-D2/P-D5): `NULL` esplicito; `NULL > 130` non
  è `TRUE`, quindi nessun shadowban spurio sui cold-start.
- Percorso ufficiale di check-in: **solo `scan_poi_gps`** (gated) — vedi G-06.
  NFC/QR è un **trigger**, non un controllo: la convalida è **sempre server-side**
  (cooldown 12h + coordinate reali nel ledger + anti-speed). Ogni trigger deve
  convergere su `scan_poi_gps` (chiarimento 09/10, riscontro G-06).

### A4. Livelli → premi (nessuna previsione forzata)
La progressione segue l'XP **effettivo** vs le soglie statiche di `levelUtils.ts`.
Nessun presupposto sul numero di check-in necessari (l'esempio "20+15=35" era
illustrativo, **non** una promessa di livello).

### A5. Community / Nodi civici
- Nodi/associazioni = POI con `layer_name` in (`nodo_civico`, `partner`) — modello
  multi-tenant.
- Eventi (`events.event_type = 'nodo_community'`), impatto collettivo
  (`vw_collective_impact`), report civici (`civic_reports`).
- `PlasticaqquaEventSheet` è il **primo tenant pilota**, non un'entità software:
  futuro `CommunityEventSheet` generico — rinviato a Fase 2 (post M14→M16).

### A6. Identità e accesso
- App: `supabase.auth.signInAnonymously()` (`app/_layout.tsx:72-77`) → riga `profiles`.
- B2B: `loto-admin-v2` con `signInWithPassword` + gate unico DaaS `is_loto_admin()`.
- **Nickname (P-D7, decisa 08/10):** convalida **definitiva** — il nome si
  imposta una volta (3-20 caratteri, solo lettere/cifre/spazi, blocklist
  volgari+riservati, univoco via `UNIQUE` nel DB) e poi è **bloccato**
  (`ProfileModal` mostra lucchetto; TouristBaptism usa lo stesso validatore
  `utils/nicknameValidation.ts`). NOTA: il flusso baptism è attualmente
  disabilitato in `index.tsx:514` (commento "ZERO-PII").

### A7. Nuova funzionalità: SEZIONE "CONTATTI E REPORT"
- **Ubicazione (confermata utente 06/10):** tab bar → **Profilo** → sezione
  **Opzioni** → voce **"Contatti e report"**. Convive con le altre voci già
  presenti in Opzioni: nessuna nuova tab, nessuna voce aggiunta alla tab bar.
- Contenuto: contatti (assistenza/supporto) + "segnala un problema" (report utente).
- Destinazione report: **da decidere** — vedi §D.

---

## B. Registro discrepanze (il cuore del documento)

Stato: `APERTA` · `IN LAVORAZIONE` · `CHIUSA` (con evidenza+modulo) · `RINVIATA` ·
`ACCETTATA` (rischio assunto).

### B.1 Dominio GAMIFICATION (priorità 1)

| ID | Discrepanza (voluto vs reale) | Evidenza | Stato | Chiusura via |
|---|---|---|---|---|
| G-01 | Cold-start cade in ELSE → 15 XP + 1,5 CO₂ + 10 PTI non verificati, invece di 20/0/0/NULL | misura 04a; `20260929160000_restore_proximity_gate.sql:241-245` | CHIUSA (09/10) | P-D1 → M7 `20261009140000_m7_cold_start_no_9999.sql` APPLICATA (post-check 33: `init_velocita_zero=false`, `ha_speed_measurable=true`). Acceptance runtime in-app pendente |
| G-02 | Sentinella `9999` morta (init `0`); se viva, `9999 > 130` → shadowban di tutti i cold-start | misura 04a; `:225-227` | CHIUSA (09/10) | P-D2/P-D5 → M7 APPLICATA (post-check 33: `ha_sentinella_9999=false`, `n_filtri_shadow=1`). Acceptance runtime in-app pendente |
| G-03 | `is_shadowbanned IS NOT TRUE` esclude i bannati da STORIA **e** COOLDOWN insieme: voluto o effetto collaterale? | 04a `n_filtri_shadow=2` | APERTA | **da decidere** |
| G-04 | `user_badges` RLS ON + 0 policy → `ensureEarnedBadges` upsert e count falliscono in silenzio; `PlasticaqquaEventSheet:25` cade su mock 23/38 | precheck 35 (09/10): 0 policy, FK `badge_id` su `badge_templates`, grants tutti true; `utils/badgeAssignment.ts`; `components/PlasticaqquaEventSheet.tsx:25` | CHIUSA (09/10) | **M10** (R1 unificare su `badges`): FK `user_badges.badge_id` → `badges.id`; RLS + policy (SELECT pubblica su `badges`; SELECT/INSERT proprie su `user_badges`); assegnazione **server-side** `claim_badges()` (legge `profiles.total_xp`); `badgeAssignment.ts` eliminato; `communityFeed.ts:32/61` su `badges`. Residuo: mock 23/38 di `PlasticaqquaEventSheet` resta come fallback (il count ora non fallisce più) |
| G-05 | Osservazione "XP dinamico da POI dal 2° check-in" vale **solo** per il ramo pedonale; ramo veicolare resta 2 XP fisso | `restore_proximity_gate.sql:237-240` | CHIUSA (nota in P-D3) | — |
| G-06 | Due percorsi check-in: `scan_poi_gps` (gated) vs `scan_poi` (ungated) — **difetto di allineamento/sicurezza, NON scelta di prodotto** (replay via cURL con JWT anonimo: nessun cooldown, nessuna coordinata reale, nessun anti-speed). **Misurato (precheck 27, 09/10):** `scan_poi` = 881 char, `prosecdef=true` ma `search_path=null`, EXECUTE anche ad `anon`, gate/cooldown/anti-speed tutti `false`, nessun `impact_tx`; `scan_poi_gps` = canonico gated (gate vivo, search_path pinnato, ledger). Unico chiamante vivo di `scan_poi`: `PoiDetailSheet.tsx:576`. **Precheck 28 (09/10):** `scan_poi` è **deployed ma rotto** — l'INSERT usa `user_pois.discovered_at`, colonna **inesistente** (la reale è `visited_at`) → il percorso NFC/QR Partner **non ha mai potuto riuscire**; in più l'UPDATE `total_xp` gira a **ogni** chiamata (l'`ON CONFLICT DO NOTHING` non lo ferma) = farming latente se la colonna venisse "riparata" senza gate | misura 02; precheck 27 (`risultato 27_m6_scan.txt`); precheck 28 (`risultato 28_scan_poi.txt`); `components/PoiDetailSheet.tsx:576`; post-check 31 (`risultato 31_drop_scan_poi.txt`) | CHIUSA (09/10) | **M6** (deep link `app/p/[id].tsx` — già instradato, gate confermato) + **riparazione + drop di `scan_poi`** (client `PoiDetailSheet.tsx:576` instradato su `scan_poi_gps` 09/10; migration `20261009130000_drop_scan_poi_g06.sql` APPLICATA 09/10 — post-check 31: `scan_poi_residue=0`, `scan_poi_gps_presente=1`; REST anon: `scan_poi` = `404`/PGRST202) + residui: decisione partner indoor, `scan_poi_gps` `proacl=null`, sorgenti non tracciati che potrebbero ricrearla |
| G-07 | XP fisso al 1° check-in + anonimato = farming potenziale | `app/_layout.tsx:66` | ACCETTATA | registro in `DECISIONI.md` |
| G-08 | `xp_ledger` conta solo `action_type='tourist_checkin'` → coerente con P-D1 (type invariato) | `20260925120000_admin_dashboard_hardening.sql:294-296` | CHIUSA | — |
| G-09 | Dashboard utente filtra `p.id = auth.uid() OR is_loto_admin()` — OR, **NON** admin-only | script 08 (output); `hardening.sql:326-327` | CHIUSA | §7j STATO |

### B.2 Dominio CORE BUSINESS / DB (priorità 2)

| ID | Discrepanza | Evidenza | Stato | Chiusura via |
|---|---|---|---|---|
| CB-01 | `profiles.admin_role` scrivibile da qualunque autenticato → escalation su 5 viste DaaS | misura 07 (APERTO) | **PATCH SCRITTA 08/10**: `supabase/migrations/20261008120000_profiles_hardening_m14.sql` — in attesa di precheck 09/10/11 + esecuzione | M14 |
| CB-02 | SELECT globale `profiles` → ghost count (`PlasticaqquaEventSheet:24`, `loto-admin-v2/(dashboard)/page.tsx:31`) + dedup nickname `TouristBaptismModal:41-46` rotto dopo ristretzione | misure policy | **PATCH SCRITTA 08/10** (stessa migration: `count_profiles()` + policy own-row + `UNIQUE(nickname)`); client già aggiornato (Plasticaqqua, admin dashboard, 23505 in TouristBaptism/ProfileModal) | M14 |
| CB-03 | `events` RLS ON + 0 policy → letture eventi community vuote in silenzio | precheck 38 (09/10): `rls=true`, **0 policy**, 2 righe, FK `events_poi_id_fkey`→`pois` SET NULL; post-check 39 (09/10): policy `events_read_public` SELECT `using=true`; certificazione REST anon (2 righe visibili, INSERT 401, no righe modificate) | **CHIUSA 09/10** | **M16**: migration `20261009170000_events_policy_m16.sql` (GRANT SELECT + policy `events_read_public` SELECT `USING(true)`). Osservazione registrata: grant DML anon/auth erano/sono `true` via **PUBLIC** (il 38 li leggeva NO perché `role_table_grants` mostra solo grant diretti); la chiusura reale delle scritture è **RLS (0 policy DML)** — nessun client scrive `events` (grep 09/10) |
| CB-04 | `civic_reports.status='confirmed'` mai scritto da nessun codice → dashboard/community report vuoti | grep; 0 trigger utente (M2); precheck 16 | **MISURATA 08/10** — precheck 16: `righe_totali=0` (la tabella e' **vuota**: non esiste nemmeno una riga in alcuno stato), 1 sola policy (cmd = ALL), grants auth/anon tutti true → confermato: nessuno scrive mai nulla | Fase 3 (conferma server-side) |
| CB-17 | **Entrambi gli insert client di `civic_reports` sono rotti** (→ tabella sempre vuota, `righe_totali=0` misurato 08/10): (a) `CivicDashboard.tsx:83` scrive `grid_cell_50m` ma la colonna reale e' `grid_cell` (errore colonna inesistente); (b) `CivicReportSheet.tsx:46` scrive `user_id: userId` con prop `userId=''` passata da `community.tsx:292` (uuid vuoto → errore di cast). Il path (a) omette anche `tenant_id` | precheck 16 08/10; **precheck 34 09/10** (`user_id` = `uuid`; `tenant_id` text **nullable senza default**; `status` default **`'pending_match'`**; `grid_cell` text nullable; 0 `CHECK` su status); grep codice; `righe_totali=0` | **CHIUSA 09/10** | **M9** (fix client 09/10, **nessuna migration**): (a) `CivicDashboard.tsx` → `grid_cell` + `tenant_id` (componente = **codice morto**, 0 import: fixato ma non montato, non testabile a runtime); (b) `CivicReportSheet.tsx` → `user_id` dalla sessione (`supabase.auth.getUser()`), prop `userId` rimossa da `community.tsx`; `status` **non piu' forzato** → default DB `pending_match` (normalizzato tra i due). Errore di insert ora **mostrato** (`Alert`). `tsc --noEmit` 0 errori. Acceptance runtime sulla path viva `CivicReportSheet` |
| CB-05 | `vw_collective_impact.total_checkins = 0` per `scans` orfane | misura 05a | APERTA | M17 |
| CB-06 | Refill: lore/REVEAL promettono "primo patto con le fontanelle" (`LevelUpLore[4]`), in app esiste solo badge `has_water` (`PoiDetailSheet:507-515`) — **nessun flusso refill** | codice | APERTA | **da decidere** (feature o correggere lore) |
| CB-07 | `PlasticaqquaEventSheet` cablato (stringhe, QR match `loto.app/e/1`) vs visione multi-tenant | esplorazione 06/10 | RINVIATA | Fase 2 (dopo M14→M16) |
| CB-08 | Fog of war: stato ibrido AsyncStorage (`@loto_fog_of_war`) + POI discovered nel cloud — fonte di verità? | `components/ProfileModal.tsx`; `app/(tabs)/map.tsx` | CHIUSA (09/10) | **Direttiva di prodotto:** nessuna nebbia/oscuramento — mappa e POI sempre visibili e navigabili. `user_pois` = SSOT solo per stato di visita (`visitato/timbrato` vs da scoprire) + XP/ricompense. Rimosse dal client: toggle "Nebbia della Memoria" e logica di oscuramento (`map.tsx:376-398`, `ProfileModal.tsx:282-299`) — `tsc` 0 errori |
| CB-09 | Doc pericolosi: `A4:120` (hardening rifiutato dalle misure), `A3:76` (script v22-24 drop+create senza gate annullerebbero l'hardening) | `docs_v2/aree/A4`, `A3` | APERTA | Fase 0 (PIANO) + gate in M15 |
| CB-09b | **Re-run di `v22/v23` riapre `anon` su 4 viste DaaS** (misurato 08/10/22): `migration_v22/v23` fanno `GRANT SELECT ... TO anon` (v24 no). Cloud OGGI sicuro (fonte hardened `20260925`, precheck 22: `anon=false` su tutte) | precheck 22 08/10 + lettura `GRANT` in `migration_v22/v23/v24` | **REGISTRATA 08/10** | **CHIUSA 08/10** (gate applicato): migration `20261008150000_daas_views_anon_guard_m15.sql` + post-check 24 verde (`anon=false` ×5); resta il controllo di processo "non eseguire v22/v23" |
| CB-10 | Refuso brand `Engine Engine` (A8); `app.json` attuale riporta solo `"name": "L.O.T.O. Map"` | misura 08/10 su `app.json` + grep su tutta la root | **CHIUSA 08/10** — refuso non piu' riproducibile nei sorgenti; correzione registrata in A8 §1.2; resta solo in A8 (storica) e in `master_business_brief.md` (archivio demotuto) | — | (A8 + validate.py) |
| CB-11 | Offline queue → `processQueue` chiama RPC: esistenza/efficacia delle RPC offline non tracciata | `utils/OfflineQueueManager.ts` | APERTA | **da verificare** (misura futura) |
| CB-12 | **`profiles.is_premium` scrivibile dall'utente su se stesso** (`upgrade.tsx:27,40`: `update({ is_premium: true/false })`) → premium bypassato dal client; nessuna conferma server | grep M14 08/10 | APERTA | **da decidere**: revocare la colonna dai grant client + attivazione premium server-side. NOTA: M14 la lascia nei grant concesi per non rompere `upgrade.tsx` |
| CB-13 | Utente può azzerare da solo i propri contatori (`profile.tsx:152`: `update({ total_xp: 0, pois_discovered: 0, total_tokens: 0 })`) | grep M14 08/10 | APERTA | bassa: self-harm only; da valutare revoca colonna o server-side reset |
| CB-14 | Le funzioni cloud usate dal client (`recover_loto_pass`, `join_squad`, `get_user_itineraries`, ...) **non sono nel Git**: `SECURITY DEFINER` non verificabile dal repo | lacuna nota + precheck 10 | **VERIFICATA 08/10** — precheck 10 eseguito (CSV in `diagnostica_fase1/`): **11/11** funzioni `tocca_profiles=true` hanno `security_definer=true`, nessuna INVOKER tocca `profiles` → **gate M14 verde**. Eccezione: `get_user_itineraries` non esiste (vedi CB-15) | — |
| CB-15 | Il client chiama `supabase.rpc('get_user_itineraries')` ma **non esiste né la funzione né la tabella** (`PGRST205` 404 su `public.user_itineraries`, 08/10) → chiamata fallisce in silenzio (`data=null` → lista vuota, nessun crash: `profile.tsx:104-108`, `index.tsx:413-415`). Definizione nota in `migration_v15_user_itineraries.sql:88`. Contesto: feature cloud itinerari **non costruita** — FAB "Crea Percorso" è placeholder (`map.tsx:524-525`), la UI legge `itin.name`/`itin.pois` mentre la RPC restituirebbe `title`/`selected_pois` (schema mismatch), gli itinerari locali AsyncStorage funzionano (`index.tsx:400`) | precheck 10 + REST 404 + grep 08/10 | **CHIUSA 08/10 (opzione A)** — rimossi i 2 call morti (`profile.tsx:102-108`, `index.tsx:411-415`); 0 occorrenze residue, eslint/tsc verdi, nessun cambio di comportamento (la RPC falliva sempre); feature cloud in backlog |
| CB-16 | **Vettore INSERT su `admin_role`**: le 2 policy INSERT duplicate (`Users can insert their own profile` e la stessa con il punto, `roles={public}`) hanno `with_check` solo su `id` → una riga **propria** inserita con `admin_role='admin'` supererebbe il check → 5 viste DaaS (classe §7k, via UPDATE chiusa da M14, via INSERT no). Percorribile solo se il ruolo ha il grant INSERT **e** la riga propria non esiste (altrimenti 23505 sul PK) | censimento policy 13 (CSV post-check) + grep `.insert(` 08/10 (client: **mai** `.insert()` su profiles; trigger `handle_new_user` = SECURITY DEFINER) | **MISURATA 08/10**: precheck 14 → grant `anon/auth/adminrole` **tutti true** = vettore aperto | **CHIUSA 08/10** — precheck 14 (grant tutti true) → script `15_profiles_insert_revoke.sql` approvato ed **eseguito**: `false,false,false,1`; verifica REST agente: INSERT anon → `42501 permission denied for table profiles`, 0 righe create, anon SELECT=0, `count_profiles=50` |
| CB-18 | **`civic_reports` aperta al mondo**: RLS attiva ma unica policy `Civic access` = `FOR ALL TO public USING(true) WITH CHECK(true)` (misurata 08/10 con 16+17) → anon autenticato legge/scrive/cancella ogni riga; grant tabellari tutti true. Tabella vuota = danno non manifestato, vettore aperto | precheck 16+17 08/10 | **MISURATA 08/10** | **CHIUSA 08/10** — migration `20261008130000_civic_reports_rls_m4.sql` applicata (DROP dinamico, SELECT R3/P-D8, INSERT/UPDATE proprie, nessuna DELETE, `TO authenticated`); post-check 18: `n_policy=3, n_all=0, n_pubbliche=0, n_anon=0, vecchia=false` |
| CB-19 | **`process_crowd_radar` indifesa**: SECURITY DEFINER **senza `search_path`** (`proconfig=null`) + **EXECUTE a PUBLIC** (`proacl=null` → anon chiamava) + identità presa dal parametro client `p_reporter_id` invece che dal JWT | precheck 20 08/10 (`risultato 20_process.txt` = backup M3 del corpo); gate client: unico chiamante `app/p/[id].tsx:88` con sessione | **MISURATA 08/10** | **CHIUSA 08/10** — migration `20261008140000_process_crowd_radar_m5.sql` (corpo con `v_reporter_id := auth.uid()` + guardia anonima + `SET search_path`, `GRANT authenticated` + `REVOKE PUBLIC`); post-check 21 **tutto verde** (`exec_anon=false`, `search_path_pinnato=true`, `corpo_usa_auth_uid=true`, `corpo_usa_p_reporter_id=false`, `corpo_guardia_anonima=true`) + REST anon = 401/42501. APPLICATA 08/10. **Limite: D5 resta aperta** — l'identità è "chi ha un account", non "chi è lì" |
| CB-20 | **Dato crowd inaffidabile**: cap incoerente `IF p_raw_count > 1000 THEN p_raw_count := 100` (1500 → 100, 999 passa) + `v_certified = (new + avg)/2` su numero **dichiarato** dal chiamante → heatmap/`crowd_predictions` basati su dato non verificato. Non è un bug di sicurezza, è un bug di dato | corpo catturato nel precheck 20 (backup M3); piano M5 gate "lo lascio e lo registro" | **REGISTRATA 08/10** | **da decidere** (D5/geofence server; Fase 2+ — nessuna urgenza: nessun dato reale in circolo, `crowd_predictions` alimentata solo da check-in di test?) |
| CB-21 | **Impronta `def_length` non riproducibile** per le 5 viste DaaS: misurata 08/10 (precheck 22) **+4…+120** vs §7j (06/10) — 6313/706/1104/296/2619 vs 6193/682/1068/292/2551 — con guard e grant **invariati** (anon=false, auth=true). La lunghezza di `pg_get_viewdef` non è un hash stabile; il guard è comunque confermato presente | precheck 22 08/10 vs STATO-FASE-0 §7j (06/10) | **REGISTRATA 08/10** | **osservazione** (basso impatto): non usare `def_length` come impronta; se serve un confronto certo, dumpare il viewdef. Nessun impatto di sicurezza |
| CB-22 | **`pois.heat` non esiste**: `process_crowd_radar` fa `UPDATE public.pois SET heat=...` su una colonna **inesistente** → la RPC falliva alla prima chiamata (`column "heat" does not exist`). Chiamante `app/p/[id].tsx:88` con `try/catch` (99) → errore **silenzioso**: `crowd_predictions` mai popolata, heatmap mai alimentata. Nessuna migration crea `heat`; nessun client la legge (HeatScore locale). DaaS heatmap viene da `user_pois` | probe REST 08/10 (`pois?select=heat`→400, `select=*` senza heat); grep `heat` (solo M5:116); precheck 20 | **REGISTRATA 08/10** | **CHIUSA 08/10**: M11 R2 `20261008160000_process_crowd_radar_no_heat_m11.sql` applicata, 25 verde (no UPDATE/pois), 26 verde (5 colonne INSERT presenti) |
| CB-23 | **Filtri client `events.event_type` disallineati ai dati reali**: i valori in tabella sono **`eco` e `social`** (2 righe, precheck 38 09/10), ma `index.tsx:387` filtrava `event_type='web_public'` e `community.tsx:77` `'nodo_community'` → entrambi **0 match**. `PoiDetailSheet.tsx:178` filtra per `poi_id` (coerente) | precheck 38 09/10 (`EVENTS_EVENT_TYPES = eco, social`); `app/(tabs)/index.tsx:387`; `app/(tabs)/community.tsx:77` | **CHIUSA 09/10 (opzione A)** | **Opzione A**: rimossi i filtri `event_type` dai due client (`index.tsx` e `community.tsx`) → si mostrano **tutti** gli eventi (2 righe, robusto ai futuri valori). `tsc --noEmit` 0 errori. Restano solo usi display di `event_type` (`EventDetailSheet`, `RouteSummarySheet`) |

### B.3 Dominio INTERFACCIA / UX (priorità 3)

| ID | Discrepanza / Feature | Evidenza | Stato | Chiusura via |
|---|---|---|---|---|
| UX-01 | **Sezione CONTATTI E REPORT**: tab bar → Profilo → Opzioni → "Contatti e report" (richiesta utente 06/10) | richiesta 06/10 | APERTA | nuovo modulo M18 — vedi §D |
| UX-02 | Refill assente come schermata (legata a CB-06) | codice | APERTA | con CB-06 |
| UX-03 | Gate non allineati all'UI: `ITINERARIES_UNLOCK_LEVEL=4` punta a `/route-creation-mockup` (mockup) | `utils/levelUtils.ts:49` | APERTA | Fase 2 |
| UX-04 | **Impatto M14 noto**: `index.tsx:284` ("utenti recenti" del tenant, `limit 3`) legge nickname altrui → con SELECT own-row vede solo se stesso/lista vuota | grep M14 08/10 | IMPATTO NOTO (registrato) | RPC dedicata o rimuovere il feed (decisione UX, non bloccante) |
| UX-05 | Modifica nickname libera in `ProfileModal` → resa **definitiva** (P-D7): edit solo al primo set, poi lucchetto + convalida condivisa | decisione utente 08/10 | **IMPLEMENTATA 08/10** (`utils/nicknameValidation.ts`, `ProfileModal`, `TouristBaptismModal`) | verifica manuale in app |

---

## C. Parti da decidere / future (non bloccanti Fase 1)

1. **G-03** — esclusione bannati da history + cooldown insieme: confermare voluto.
2. **CB-06 / UX-02** — implementare il flusso Refill oppure correggere il lore (LV4).
3. **CB-08** — fonte di verità del fog of war (locale vs cloud). → **CHIUSA 09/10 (direttiva di prodotto):** nessuna nebbia/oscuramento sulla mappa; POI sempre visibili e navigabili. Il cloud (`user_pois`) resta SSOT solo per stato di visita/XP. Toggle e logica di oscuramento **rimossi dal client** (`map.tsx`, `ProfileModal.tsx`).
4. **UX-01 / §D** — destinazione dei report utente (opzioni 1–4) e canale contatti.
5. **CB-11** — verificare RPC dell'offline queue (misura dedicata).
6. **CB-04** — chi scrive `civic_reports.status='confirmed'` (Fase 3).
7. Promozione di questo doc in `docs_v2` con frontmatter + `autorita.json`
   (dopo che il registro è stabile).
8. **CB-12** — revoca di `is_premium` ai grant client + attivazione premium
   server-side (M14 l'ha lasciata concessa per non rompere `upgrade.tsx`).

---

## D. SEZIONE CONTATTI E REPORT (richiesta utente 06/10) — elementi aperti

- **Ubicazione — CONFERMATA:** tab bar → **Profilo** → sezione **Opzioni** → voce
  **"Contatti e report"**. Convive con le altre opzioni in Profilo → Opzioni.
  Nessuna nuova tab, nessuna voce aggiunta alla tab bar.
- **Contatti — da definire:** canale di assistenza (email? form? WhatsApp tramite
  edge function `whatsapp-bot` già presente con firma Meta?).
- **Report utente — destinazione da scegliere:**
  - opzione 1: `admin_alerts` (già usata da `whatsapp-bot` per UPGRADE_REQUEST)
  - opzione 2: `b2b_feedbacks` (già letta dal dashboard admin come whisper)
  - opzione 3: `civic_reports` (segnalazioni civiche georeferenziate)
  - opzione 4: nuova tabella `user_reports` (richiede migration + policy)
- **Decisione necessaria** prima di codificare (modulo M18): destinazione,
  autore (anonimo? autenticato?), visibilità admin.

---

## E. Collegamenti ai documenti di governo

- `HANDOFF.md` → questo file è in mappa file + ordine di lettura.
- `STATO-FASE-0.md` §8 → il registro §B è la destinazione delle discrepanze aperte.
- `PIANO-LAVORO-MODULARE.md` → ogni ID (`G-*`, `CB-*`, `UX-*`) referenziato dal
  modulo che lo chiude.
- **Ordine di lettura:** `HANDOFF.md` → `METODO-LAVORO.md` → `PIANO-LAVORO-MODULARE.md`
  → **questo doc** → `TRIAGE-DOCUMENTAZIONE.md` → `autorita.json` → `DECISIONI.md`.

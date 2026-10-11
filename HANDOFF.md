# HANDOFF — punto d'ingresso obbligatorio

> **Questo file va letto prima di qualsiasi risposta.** Se lo stai leggendo,
> non hai memoria della conversazione precedente. Che tu sia un agente o un
> umano, non partire a memoria: segui questo protocollo.

---

## 1. Chi legge questo

Un agente (umano o LLM) che apre la sessione in qualsiasi momento — anche
dopo un crash del terminale, anche dopo un ripristino di chat, anche in una
finestra nuova.

In tutti questi casi il rischio e' lo stesso: l'agente ha la documentazione
ma non il lavoro in corso, e per colmare il vuoto **inferisce**. L'inferenza
e' l'allucinazione. Questo file serve a impedirla.

---

## 2. Ordine di lettura (obbligatorio, in quest'ordine)

| # | File | Perche' |
|---|------|---------|
| 1 | `METODO-LAVORO.md` | metodo, 20 regole, lessico. **Non e' opzionale.** |
| 2 | `HANDOFF.md` (questo) | protocollo di riavvio |
| 3 | `docs_v2/tooling/autorita.json` | **chi dice il vero per dominio.** Un documento non registrato li non e' autorita', per quanto dica nel titolo |
| 4 | `STATO-FASE-0.md` | ogni numero misurato **+ come ricalcolarlo** |
| 5 | `PIANO-LAVORO-MODULARE.md` | moduli, gate, rollback |
| 6 | `VISIONE-ESECUZIONE-CORE-BUSINESS.md` | visione prodotto (A1–A7) + registro discrepanze (G-*, CB-*, UX-*) + decisioni P-D1…P-D6 |
| 7 | `TRIAGE-DOCUMENTAZIONE.md` | perimetro documentale (cosa ignorare) |

Dopo la riga 7 sei in grado di parlare. Prima no.

**`docs_v2/tooling/autorita.json` ha la precedenza su qualunque documento**, me compreso. Se
`STATO-FASE-0.md` e `docs_v2/tooling/autorita.json` dicono cose diverse, controlla prima e
poi dichiara la divergenza: non allineare in silenzio.

---

## 3. Veti di riavvio

Queste regole sono vincolanti. Violare una di esse produce allucinazione.

1. **Non inferire dettagli non misurati.** Se un dato non e' in
   `STATO-FASE-0.md`, per te non esiste.
2. **Un dato in `STATO-FASE-0.md` che non hai visto calcolare in questa
   sessione e' un'ipotesi, non un fatto.** Rileggilo dallo script se devi
   usarlo.
3. **Un nome non e' una prova** (`METODO-LAVORO.md` regola 2.1). Non
   dedurre che una tabella sia scritta da qualcuno perche' e' chiamata
   `scans`.
4. **Non riscrivere le correzioni.** Sono 17, in `STATO-FASE-0.md` §7, §7b e
   §7c. Correggere due volte la stessa cosa e' un segnale che il lavoro
   non e' stato letto.
5. **Scritture: solo autorizzate dalla Fase 1.** La Fase 0 e' chiusa (10
   misure su 10). Le scritture partono con **M14** e solo dentro il perimetro
   del modulo. La vecchia patch su `profiles` (§8 di `STATO-FASE-0.md`) e'
   il primo pezzo di M14, non piu' "trattenuta": va applicata come migration
   con gate e rollback.
6. **Uno script = un result set.** Il pannello SQL perde il primo blocco.
   Due misure = due script.
7. **Se non lo sai, dillo.** Non produrre una risposta completa quando manca
   una misura: `STATO-FASE-0.md` §8 elenca esplicitamente cosa e' aperto.
8. **Non rinominare, spostare o cancellare uno script di misura.** Le misure
   sono la prova, e la prova non si tocca. Se un file va proprio rinominato,
   si dichiara all'umano e poi si rifare `-Lock` su `handoff.ps1` per
   rinnovare l'impronta. Un cambio in silenzio e' identico a una falsificazione.
   (Successo il 06/10: `04_dimensione_...` rinominato `04a_...` da un altro
   agente, senza notifica. Contenuto verificato: invariato, in sola lettura.)

---

## 4. Stato in una riga

**Fase 0 CHIUSA — 10 misure su 10 concluse** (ultima: `08`, eseguita 06/10:
`vw_user_dashboard_metrics` usa `WHERE p.id = auth.uid() OR is_loto_admin()` —
rettifica §7j registrata). Decisioni **P-D1…P-D6** prese e registrate.
Moduli nuovi **M14–M18** nel piano. Nessun db scritto in Fase 0.

**M14 PREPARATO (08/10):** migration
`supabase/migrations/20261008120000_profiles_hardening_m14.sql` (RLS + policy
own-row + UNIQUE/CHECK nickname) + client già modificati (`count_profiles()` in
PlasticaqquaEventSheet e admin dashboard, convalida P-D7 in TouristBaptismModal
e ProfileModal — nick bloccato dopo il primo set).

**PRECHECK PARZIALI GIÀ FATTI DALL'AGENTE via REST API (08/10)** — in locale
non ci sono credenziali DB, ma la SELECT su `profiles` è globale (qual=TRUE):
- `09`-equivalente: 50 righe, 5 nick, **1 gruppo duplicato** ("Save Ks" x2)
- `09d`-equivalente: **1 violazione charset** = `Fragolina 🍓`
  (id 3a11bab3…, `Fragolina` base risulta libero)
- tentativo `09c`-equivalente via REST PATCH con le stesse guardie →
  **0 righe**: la RLS blocca l'UPDATE anon → **evidenza a favore del gate 11
  (RLS attiva)**, resta conferma dal pannello con `11`.

**GATE 10 VERDE (08/10):** output del precheck in
`diagnostica_fase1/Supabase Snippet Precheck_ Security Definer functions touching profiles.csv`
— **11/11** funzioni con `tocca_profiles=true` sono `security_definer=true`,
nessuna INVOKER tocca `profiles`. Registrato come **CB-14 chiusa** + nuovo
emergente **CB-15**: `get_user_itineraries` richiamata dal client
(`profile.tsx:103`, `index.tsx:412`) ma **assente dal catalogo** (fallimento
silenzioso, lista vuota).

**GATE 11 VERDE (08/10):** `rls_attivo=true`, `rls_forzato=false`,
`n_policy=6`, grant `auth/anon` SELECT+UPDATE tutti `true` → baseline
registrato; coerente col blocco REST osservato.

**M14 APPLICATA (08/10) — esito:**
- post-check `12…`: `rls=true`, `n_policy_own=2`, `auth_update_tabella=false`,
  `adminrole=false`, `nickname=true`, `anon_update=false`, `uniq/check=true`,
  `count_profiles_ok=true`, `righe_profiles=50` → **tutto verde tranne
  `n_policy=4` (atteso 2)**: 2 policy preesistenti non droppate (il DROP di
  M14 copre solo SELECT/UPDATE/ALL → sono INSERT/DELETE) → **censimento in
  `13_policy_profiles_elenco.sql` DA ESEGUIRE**
- verifica REST agente: anon SELECT su `profiles` = **0 righe** (atteso),
  `rpc count_profiles` = **50** (atteso) → chiusura M14 in attesa del 13

**13 ESEGUITO (08/10, CSV post-check):** le 4 policy =
2 nostre (`profiles_select_own`/`profiles_update_own`) +
2 INSERT **duplicate** (`Users can insert their own profile` e la stessa con
il punto, `roles={public}`, `with_check=(auth.uid()=id)`) → **CB-16**: il
`with_check` vincola solo l'id, non `admin_role` (vettore di escalation via
INSERT, via UPDATE già chiusa da M14). Grep client: **nessun `.insert()` su
profiles** in app/components/utils (solo trigger definer).

**14 ESEGUITO (08/10):** `anon_insert=true`, `auth_insert=true`,
`auth_insert_adminrole=true` → **CB-16 confermato aperto**. Verifiche a
monte: nessun `.insert()` su `profiles` in app/components/utils/admin né in
`supabase/functions` (edge: solo `admin_alerts`), trigger = SECURITY
DEFINER → REVOKE sicuro.

**15 ESEGUITO + CB-16 CHIUSA (08/10):** result set `false,false,false,1`;
verifica REST: INSERT anon → `42501 permission denied for table profiles`,
0 righe create, anon SELECT = 0, `count_profiles` = 50.

**M14 COMPLETO (08/10)** —RLS + policy own-row + colonna `admin_role`
chiusa + `REVOKE INSERT` + UNIQUE/CHECK nickname (P-D7) + `count_profiles()`;
6 precheck + post-check verdi; CB-14, CB-15 e CB-16 tutte chiuse 08/10.

**M4 — COMPLETO 08/10:**
1. **D4 DECISA 08/10 = R3** (registrata come P-D8): SELECT
   `USING (auth.uid() = user_id OR status = 'confirmed')` — autore legge i
   propri, tutti i confermati. (La destinazione dei report utente, §D/UX-01,
   resta una decisione diversa, aperta.)
2. **CB-15 CHIUSA 08/10 (opzione A):** rimossi i 2 call morti
   `get_user_itineraries` da `profile.tsx` e `index.tsx` (0 occorrenze,
   eslint/tsc verdi); feature cloud itinerari in backlog.
3. **16 + 17 + 19 ESEGUITI (08/10):** policy unica `Civic access` (ALL,
   `{public}`, qual/with_check `true`) = tabella aperta al mondo; tabella
   vuota (0 righe); colonna reale `grid_cell`; nessun CHECK su status;
   `user_id` uuid. Esiti registrati (CB-04, CB-17, PIANO M4).
4. **M4 COMPLETO (08/10)** — migration
   `supabase/migrations/20261008130000_civic_reports_rls_m4.sql` applicata
   su approvazione; post-check 18 verde: `rls=true, n_policy=3`
   (select/insert/update=1), `n_delete=0, n_all=0, n_pubbliche=0,
   n_anon=0, vecchia_civic_access=false, righe_totali=0`. CB-18 chiusa.
   Riepilogo misure M4: policy vecchia `Civic access` ALL/`{public}`/true
   (16+17), `user_id` uuid (19), nessun client UPDATE su civic_reports.

**M17 FATTO 09/10 (scansioni di integrita'/orphan, read-only):**
1. **`40` FK-anagrafe ESEGUITO** (evidenza `risultato 40_m17_fk_anagrafe.txt`):
   6 FK, tutte `public.`; `user_pois` **NOT NULL + CASCADE** su
   `poi_id`/`profile_id`; le altre (badge_id, user_id, impact poi_id,
   profile_id) nullable (SET NULL/CASCADE). `xp_ledger` del piano NON ESISTE
   (42P01) -> catena corretta: `user_pois`, `badges`, `badge_templates`,
   `user_badges`, `impact_transactions`.
2. **`41` scan ORPHAN ESEGUITO** (evidenza `risultato 41_m17_orphan_scan.txt`):
   **12/12 righe = 0** -> 0 orfani, 0 FK NULL su tutta la catena.
3. **Nota:** `user_badges`, `impact_transactions`, `badge_templates` ancora
   vuote (0 righe): riscansionare dopo le scritture di Fase 2/adozione.
4. **Acceptance runtime in-app ancora aperte (umano):** M6 deep link, M7,
   M9, M10 badge, M16 eventi visibili in app.

**M12 IN CORSO 09/10 (HeatScore su dispositivo):**
1. **R1 FIXATO** in `app/(tabs)/map.tsx` (`fetchPois`): prima la query del
   fondo si fermava a `boostCutoff` → un check-in dei 15 min precedenti il
   caricamento non entrava nel fondo e (preesistente alla sottoscrizione)
   non generava evento Realtime → non contava. Ora: una sola query
   `visited_at >= dayStart`, split riga per riga — vecchie nel `fondo`,
   recenti come `boost` +2 con il loro `visited_at` REALE dentro
   `heatBoostsRef` (il decadimento le gestisce come le real-time).
2. `tsc --noEmit` **0 errori**.
3. **Dwell 10 min RIMOSSO** da `components/PoiDetailSheet.tsx`: era residuo
   (codice morto) — `checkinStartTime`/`timerLeft`, `handleStartVisitaGPS`,
   chiavi `@checkin_start_*`, import `AsyncStorage`; mai mostrato né applicato
   alla convalida (`handleRiscattaVisitaGPS` validava subito via GPS+BLE).
   Zero residui, `tsc` 0. **Nota:** il cooldown 12h di `scan_poi_gps` è
   un'altra cosa (anti-farming, non toccato).
4. **Gate 1 (decadimento usa ora corrente, non quella di mount)**: PASSA a
   livello di codice (tick `setInterval` usa `Date.now()`).
5. **Resta all'umano:** i 4 casi di acceptance in-app (1 check-in → 0;
   2 ravvicinati su **2 POI diversi** → boost; finestra 15 min → decadimento;
   reload con storico → fondo riflesso) + **R2/gate 2**: il badge non deve
   coprire né spostare l'etichetta (verifica visiva).
6. Rollback previsto: revert del commit `c9efa00`.

**PROSSIMA AZIONE — M12: acceptance in-app dell'utente (4 casi + gate
visivo). Poi M13 (Igiene documentale, Fase 6) secondo l'ordine approvato.**

**M5 COMPLETO 08/10 (`process_crowd_radar`):**
1. **20 ESEGUITO** — output in `diagnostica_fase1/risultato 20_process.txt`:
   `prosecdef=true`, `proconfig=null` (**R2 aperto**), `proacl=null`
   (**R1 aperto**: EXECUTE di default a PUBLIC), firma `(uuid, uuid, integer)
   -> integer`, corpo catturato (= backup M3). CB-19 misurata.
2. **Gate client verde**: unico chiamante `app/p/[id].tsx:88` dentro
   `if (session)` (riga 85) → `session.user.id` coincide con `auth.uid()`.
3. **Migration APPLICATA (08/10)** — `supabase/migrations/20261008140000_process_crowd_radar_m5.sql`:
   corpo con `v_reporter_id := auth.uid()` + guardia anonima +
   `SET search_path` inline; `GRANT authenticated` + `REVOKE PUBLIC`
   (correzione: con proacl null il revoke da anon da solo e' no-op).
4. **Post-check 21 TUTTO VERDE**: `prosecdef=true, search_path_pinnato=true,
   exec_anon=false, exec_public=false, exec_authenticated=true,
   corpo_usa_auth_uid=true, corpo_usa_p_reporter_id=false,
   corpo_guardia_anonima=true`. Verifica indipendente REST (anon):
   **401 + 42501 permission denied for function**.
   CB-19 **CHIUSA**; CB-20 registrata (cap dato, lasciato); **D5 resta aperta**
   (geofence: M5 non rende l'identita' fidabile, solo "chi ha un account").

**M15 COMPLETO 08/10 (Guard famiglia DaaS):**
1. **22 ESEGUITO** (5 righe): tutte e 5 le viste con `guard=true`,
   `anon_select=false`, `auth/service_role=true`, RLS off, owner postgres →
   corrispondono alla fonte hardened `20260925120000` (righe
   116/244/269/330/379), NON a `v22/v23`. `def_length` +4…+120 vs §7j →
   **CB-21** (non e' un' impronta).
2. **23 ESEGUITO** (da CSV): `is_loto_admin()` hardened → `prosecdef=true`,
   `search_path=public`, `proacl` solo `authenticated+service_role`,
   `anon_exec=false`, `auth_exec=true`, corpo = repo `20260925120000`.
   Guard sicuro; SPOF baseline chiusa.
3. **CB-09b registrata**: `v22/v23` concedono SELECT ad `anon` (v24 no) →
   un re-run riaprirebbe 4 viste. Cloud oggi sicuro.
4. **Gate M15 APPLICATO 08/10**: `supabase/migrations/20261008150000_daas_views_anon_guard_m15.sql`
   (idempotente: `REVOKE anon/PUBLIC` + `GRANT authenticated,service_role`
   sulle 5 viste; NON tocca le definizioni) — post-check `24` **verde**
   (`anon=false`, `auth/service_role=true`, `guard=true` × 5). CB-09b CHIUSA.
5. Sonda `08` rettificata (`or is_loto_admin`, senza `public.`).

**M11 COMPLETO 08/10 (`pois.heat`):**
1. **Misurato (probe REST anon)**: `pois.heat` **NON esiste** —
   `pois?select=heat`→400, `select=id/name/crowd_level`→200; `select=*` senza
   `heat`. Nessuna migration crea la colonna (grep: solo M5:116).
2. **Conseguenza**: l'`UPDATE public.pois SET heat=...` in
   `process_crowd_radar` (pre-M5 e M5) falliva alla prima chiamata
   (`column "heat" does not exist`); `app/p/[id].tsx:88` ha `try/catch` (99)
   → errore **silenzioso**, `crowd_predictions` mai popolata.
3. **R2** (nessuno consuma la colonna; DaaS heatmap da `user_pois`) →
   `supabase/migrations/20261008160000_process_crowd_radar_no_heat_m11.sql`
   **APPLICATA 08/10**. Post-check `25` **verde** (`corpo_update=false`,
   `corpo_tocca_pois=false`, `exec_anon=false`, `exec_authenticated=true`).
   `26` **verde**: `crowd_predictions` ha le 5 colonne dell'INSERT
   (`poi_id, reporter_id, raw_count, certified_count, confidence_score`).
   CB-22 CHIUSA.
4. **"chi possiede `heat`"**: **nessuno** → M6 procede su R2.

**M6 IN CORSO 09/10 (deep link: niente scrittura grezza dal client — R2):**
1. **Ramo R2** confermato (M11: `pois.heat` non esiste; heatmap DaaS da `user_pois`).
2. **Client — `app/p/[id].tsx`:** il deep link ora instrada su `scan_poi_gps`
   (GPS + proximity/cooldown/anti-speed lato server), come gli altri due ingressi;
   BLE radar in fire-and-forget (`startCrowdRadarScan` riporta già `raw_count`).
   Rimossi `rpc('process_crowd_radar')` esplicita, `upsert` su `user_pois` e
   scrittura `loto_fallback_xp`.
3. **`loto_fallback_*` eliminato del tutto:** `GamificationContext.tsx` (`Math.max`
   → lettura diretta + opzioni `fallback*` rimosse), `app/(tabs)/index.tsx`
   (2 punti), `app/(tabs)/profile.tsx`. Grep: 0 occorrenze residue. `tsc` 0 errori.
4. **`27` ESEGUITO 09/10** (output in `diagnostica_fase1/risultato 27_m6_scan.txt`):
   **`scan_poi_gps` = canonico gated** (`ha_gate_prossimita=true`,
   `search_path=public, pg_temp`, `profile_id`+`auth.uid`, ledger `impact_tx`;
   dossier 04a "drift escluso" confermato). **`scan_poi` = ungated confermato**
   (881 char, gate/cooldown/anti-speed tutti `false`, `n_filtri_shadow=0`,
   nessun `impact_tx`, `search_path=null`, EXECUTE anche ad `anon`).
5. **G-06 (riscontro 09/10, opzione 1):** M6 resta sul deep link; G-06 è un
   **difetto di allineamento/sicurezza** (non scelta di prodotto) e si chiude con
   la **convergenza NFC** a valle dell'esito del `27` (unico chiamante vivo:
   `components/PoiDetailSheet.tsx:576`).
6. **M6 codice+server COMPLETO 09/10:** l'instradamento del deep link su
   `scan_poi_gps` è la protezione reale (gate vivo, misurato). Resta un
   **test di acceptance runtime** consigliato (deep link su POI a 500 m →
   eccezione di proximity, nessuna riga). G-06 aperto come da punto 5.
   Osservazione registrata: `scan_poi_gps` ha `proacl=null` (EXECUTE PUBLIC;
   anon ottiene 'Utente non autenticato', nessuna scrittura) — stessa classe di
   CB-19, da stringere nella convergenza G-06.

**M7 APPLICATO 09/10 (`scan_poi_gps`: cold-start, 9999, storico):**
1. **Perimetro (P-D1…P-D6, decise 06/10):** il primo check-in a freddo incassa
   **20 XP** (non il premio pedonale pieno); `calculated_speed_kmh = NULL`; la
   sentinella `9999` sparisce; lo storico anti-spoofing **non** filtra piu'
   `is_shadowbanned` (il ban non deve premiare); `action_type` invariato.
2. **Migration APPLICATA:** `supabase/migrations/20261009140000_m7_cold_start_no_9999.sql`
   (sostituisce SOLO il corpo, stessa firma; nessuna migrazione di schema).
3. **Precheck `32` / post-check `33` ESEGUITI:** `32` → `lunghezza=7289`,
   `ha_sentinella_9999=true`, `ha_speed_measurable=false`, `n_filtri_shadow=2`
   (corpo = canonico 29/09); `33` → `lunghezza=7322`,
   `ha_sentinella_9999=false`, `ha_speed_measurable=true`, `n_filtri_shadow=1`,
   firma invariata (evidenze `risultato 32/33_m7_cold_start.txt`).
4. **Rischio accettato registrato:** farming 20 XP via `signInAnonymously`
   ripetuto → `docs_v2/DECISIONI.md` §"Rischi accettati".
5. **RESTA APERTO — acceptance runtime (umano):** nuovo utente → 1o check-in
   20 XP, `calculated_speed_kmh = NULL`, riga presente; 2o check-in → velocita'
   valutata; tripper 130 → shadowban con storico che continua.

**M9 FATTO (client) 09/10 (`civic_reports`: `grid_cell_50m` non esiste):**
1. **Correzione di premessa:** `CivicDashboard.tsx` = **codice morto** (0 import).
   Unica path viva = `CivicReportSheet` (montata da `community.tsx`). Scelta utente:
   fixare comunque CivicDashboard e lasciarlo non montato.
2. **Misure (precheck 34, 09/10):** `user_id` uuid; `tenant_id` text NULL senza
   default; `status` default `'pending_match'`; `grid_cell` presente; 0 trigger
   (`civic_confirmed` inesistente, M2).
3. **Fix client (nessuna migration):**
   - `CivicReportSheet.tsx`: `user_id` da sessione (prop `userId` rimossa);
     `status` non forzato (default DB); errore mostrato (`Alert`).
   - `community.tsx`: rimossa la prop `userId={''}`.
   - `CivicDashboard.tsx`: `grid_cell_50m` → `grid_cell`; aggiunto `tenant_id`.
   `tsc --noEmit` 0 errori.
4. **RESTA APERTO — acceptance runtime (umano):** inserimento da
   `CivicReportSheet` (path vivo) finisce in tabella con `status='pending_match'`.

**M16 FATTO 09/10 (`events` / fog of war):**
1. **Policy `events`:** SELECT pubblica `events_read_public` `USING(true)`
   (decisione utente 09/10: visibilita' aperta, nessun login). Nessuna scrittura.
2. **CB-08 CHIUSA — direttiva:** nessuna nebbia/oscuramento; mappa e POI sempre
   visibili; `user_pois` SSOT solo stato visita/XP. Rimosso dal client toggle
   "Nebbia della Memoria" + oscuramento (`map.tsx`, `ProfileModal.tsx`).
3. **CB-23 CHIUSA (opzione A):** rimossi i filtri `event_type`
   (`web_public`/`nodo_community` vs valori reali `eco`/`social`) da
   `index.tsx` e `community.tsx`.
4. **Migration `20261009170000_events_policy_m16.sql` APPLICATA 09/10**
   (precheck 38 + post-check 39 verdi; evidenze `risultato 38/39_m16_events.txt`).
   Certificazione REST anon: 2 righe visibili (`ev_plasticaqqua` eco,
   `ev_passeggiata` social), INSERT 401, UPDATE 0 righe, dati intatti.
5. **Osservazione registrata (CB-03):** i grant DML anon/auth sono/erano `true`
   via **PUBLIC** (il 38 li vedeva NO — `role_table_grants` mostra solo grant
   diretti); scritture chiuse da **RLS (0 policy DML)**, nessun client scrive
   `events`.
6. **Restano pendenti (umano):** acceptance runtime M16 (eventi visibili in app).

**M10 FATTO 09/10 (catena dei badge — server + client):**
1. **Decisioni:** **R1** (unificare su `badges`; `badge_templates` abbandonata);
   badge civici 1/5/10 di CivicDashboard **fuori** da M10.
2. **Misurato (precheck 35/35b, 09/10):** `badges` 3 righe (req_xp 500/1000/1500);
   `badge_templates` 0 righe; `user_badges` 0 righe, FK
   `user_badges_badge_id_fkey` → `badge_templates(id)` CASCADE, UNIQUE
   `(user_id,badge_id)`; **RLS gia' ON su 3 tabelle con 0 policy** (tutto negato
   = G-04 confermato).
3. **Migration `20261009160000_badges_m10.sql` APPLICATA 09/10** (post-check `36`
   VERDE): FK → `badges.id`; policy `badges_read_catalog` + `user_badges_select_own`
   /`insert_own`; `badge_templates` bloccata (REVOKE grant); **`claim_badges()`**
   server-side (SECURITY DEFINER, ON CONFLICT, EXECUTE solo authenticated).
4. **Refactor client FATTO** (`tsc` 0 errori): `badgeAssignment.ts` eliminato;
   `index.tsx`/`profile.tsx` → `rpc('claim_badges')` + embedding `badges(*)`;
   `communityFeed.ts` su `badges(name)`.
5. **RESTA APERTO — acceptance runtime (umano):** nuovo utente con `total_xp`
   sufficiente → badge in `user_badges` via `claim_badges()` (nessun upsert
   client).

**G-06 RIPARAZIONE + DROP DEL MORTO APPLICATO 09/10 (`scan_poi`):**
1. **Perimetro deciso con l'utente:** il `28` ha dimostrato che `scan_poi` è una
   **funzione morta** (vedi punto 4). Scelta: **riparazione + drop del morto** —
   il pulsante NFC/QR Partner resta il TRIGGER, la convalida va su `scan_poi_gps`,
   e `scan_poi` viene rimosso (chiude anche l'esposizione anon).
2. **Client RIPARATO (09/10):** `components/PoiDetailSheet.tsx:576` ora chiama
   `scan_poi_gps` con il GPS del dispositivo (NFC/QR = trigger, convalida
   server-side); BLE radar fire-and-forget allineato. `tsc --noEmit` = 0 errori.
3. **Migration di drop APPLICATA 09/10:**
   `supabase/migrations/20261009130000_drop_scan_poi_g06.sql` —
   `DROP FUNCTION IF EXISTS public.scan_poi(uuid)` (senza CASCADE). Rollback dal
   backup `risultato 28_scan_poi.txt`.
4. **`28` ESEGUITO 09/10 (finding decisivo):** `scan_poi` è **deployed ma
   rotto** — l'INSERT usa `user_pois.discovered_at`, colonna **inesistente**
   (probe REST: `400/42703`; la reale è `visited_at`). Il percorso NFC/QR Partner
   **non ha mai potuto riuscire** (errore catturato a `PoiDetailSheet.tsx:592`).
   Inoltre l'`UPDATE total_xp` gira a **ogni** chiamata (l'`ON CONFLICT DO
   NOTHING` non lo ferma): farming latente se la colonna venisse "riparata" senza
   gate. Evidenza: `diagnostica_fase1/risultato 28_scan_poi.txt`.
5. **Precheck 30 + drop + post-check 31 ESEGUITI 09/10 (verdi):**
   `30_drop_scan_poi_precheck.sql` (1 riga, `oggetti_che_la_usano=0` → DROP
   sicuro); `31_drop_scan_poi_post_apply.sql` (`scan_poi_residue=0`,
   `scan_poi_gps_presente=1`); REST anon `rpc('scan_poi')` → `404`/PGRST202,
   `rpc('scan_poi_gps')` → `400` (esiste). Evidenze:
   `risultato 30_drop_scan_poi.txt`, `risultato 31_drop_scan_poi.txt`.
6. **Resta aperto (fuori perimetro):** decisione **partner indoor** (la convalida
   ora richiede GPS); osservazione `scan_poi_gps` `proacl=null`; file sorgente che
   potrebbero ricreare `scan_poi` se ri-eseguiti
   (`20260926120000_scan_chain_canonical.sql:329`).

Registro discrepanze e visione: `VISIONE-ESECUZIONE-CORE-BUSINESS.md`.

---

## 5. Mappa dei file

### Documenti di governo (leggere, non modificare)

- `METODO-LAVORO.md` — metodo
- `STATO-FASE-0.md` — stato, misure, correzioni, §8 con patch/SQL pronta
- `PIANO-LAVORO-MODULARE.md` — moduli (riallineato 06/10: P-D1…P-D6, M14–M18)
- `VISIONE-ESECUZIONE-CORE-BUSINESS.md` — visione + registro discrepanze
- `RAPPORTO-CHIUSURA-FASE-0.md` — report di chiusura Fase 0
- `PIANO-CHIUSURA-FASE0-RIEPILOGO.md` — riepilogo breve (1–6)
- `TRIAGE-DOCUMENTAZIONE.md` — perimetro documentale

### Script diagnostica (in `supabase/diagnostica_fase0/`)

| Script | Misura |
|--------|---------|
| `01_grant_e_righe.sql` | righe 9 tabelle |
| `01b_grant_compatti.sql` | ACL 10 tabelle |
| `02_scan_poi_corpo.sql` | corpo deployato `scan_poi` |
| `03b_grant_tutte_public.sql` | ACL 24 tabelle + 11 viste |
| `03c_policy_aperte.sql` | inventario policy (due result set) |
| `03d_righe_mancanti.sql` | righe 14 tabelle |
| `04a_dimensione_scan_poi_gps.sql` | dimensione corpo `scan_poi_gps` |
| `05a_vw_collective_impact.sql` | definizione `vw_collective_impact` (§7d) |
| `05b_vw_daas_heatmap_15min.sql` | definizione `vw_daas_heatmap_15min` (§7e) |
| `06_is_loto_admin.sql` | definizione/ACL `is_loto_admin()` (§7h) |
| `06b_dove_usato_is_loto_admin.sql` | 5 viste guardate (§7i) |
| `07_profiles_admin_role_scrivibile.sql` | vettore `admin_role` (§7k) |
| `08_vw_user_dashboard_metrics_guard.sql` | OR guard + rettifica §7j |

Tutte e 10 le misure di Fase 0 sono **ESEGUITE**.

### Fase 1 — M14 (scritti 08/10, da eseguire)

In `supabase/diagnostica_fase1/`: `09_nickname_unici_precheck.sql`
(eseguito: 1 doppione "Save Ks"), `09b_nickname_duplicati_righe.sql`,
`10_rpc_security_definer_precheck.sql`, `11_profiles_stato_rls_precheck.sql`.
Migration: `supabase/migrations/20261008120000_profiles_hardening_m14.sql`
(client già aggiornato: `count_profiles()` + gestione `23505`).

### Misura 1 (ACL funzioni) e misura 4 (corpo `scan_poi_gps`)
Mostrate in sessione, corpo confrontato con la migrazione: vedi `STATO-FASE-0.md`
§7 e §7b.

---

## 6. Come si verifica invece di fidarsi

Ogni affermazione in `STATO-FASE-0.md` nasce da uno script. Se un agente
dubita di un numero, **rilancia lo script e confronta**. Non fidarsi del file.

Esempio: il claim «`civic_reports` e `scans` sono le uniche scritture aperte
e sono vuote» si produce con `03c_policy_aperte.sql` + `03d_righe_mancanti.sql`.

Principio: **`STATO-FASE-0.md` dice cosa so; gli script dicono come
verificarlo; nessuno dei due ha il permesso di fidarsi da solo.**

---

## 7. Invariante di prodotto — ATTENZIONE, documento demotuo

**`master_business_brief.md` e' ARCHIVIO, demotuto il 30/09/2026. Non e'
fonte di autorita'** (testo che dichiara lui stesso, riga 3). Non citarlo
come specifica vincolante: l'avevo fatto, e' un errore.

L'autorita' su questo dominio e' `docs_v2/tooling/autorita.json`:

| Dominio | Stato | File canonico |
|---|---|---|
| `modello-prodotto` | canonico L2 | `docs_v2/loto-hub-architettura-sistema-master-2026.md` |
| `catena-scan-checkin` | canonico L1 | `supabase/migrations/20260929160000_restore_proximity_gate.sql` |
| `lessico-ufficiale` | canonico L1 | `docs_v2/aree/A8_lessico_e_marchio.md` |
| `database-schema` | **vuoto** | lacuna aperta: il cloud non e' riproducibile dalle migration |
| `gate-prossimita-attivo` | **vuoto** | priorita' alta (ma vedi §9: la nota e' invecchiata) |

**Nome ufficiale: L.O.T.O. Map (Life On The Outside) Co-Experience**, dal
30/09/2026. "L.O.T.O. HUB" e' il vecchio marchio: compare ancora in quasi
tutti i file, non e' un errore ma non e' il nome corrente.

> **`docs_v2/tooling/autorita.json` contiene due chiavi duplicate** (`database-schema` e
> `tabelle-non-ufficiali`): in JSON vince l'ultima. Da segnalare, non
> risolvere in autonomia.

---

## 8. Cosa fare dopo un riavvio, in ordine

1. Esegui `.\handoff.ps1` — verifica che i file del manifest esistano.
2. Leggi l'ordine del §2 in quest'ordine.
3. Non parlare finche' non hai finito il §2.
4. Le misure `05a`/`05b`/`06`/`06b`/`07`/`08` sono **gia' eseguite**: i
   risultati sono in `STATO-FASE-0.md` §7d–§7k. Non rifarle a memoria.
5. `PIANO-LAVORO-MODULARE.md` e' **gia' riallineato** (06/10): P-D1…P-D6,
   M14–M18, matrice e ordine eseguibili aggiornati.
6. **Fase 1 aperta:** si parte da **M14**. Ogni scrittura fuori dal modulo
   corrente va richiesta esplicitamente all'umano.

---

## 9. Divergenze note: `docs_v2/tooling/autorita.json` vs misure del 06/10

**Queste differenze NON sono state allineate.** Sono differenze vere: non
correggere il registro di testa, rileggi e dichiara.

1. `gate-prossimita-attivo` dice *«scan_poi_gps non ha chiamanti vivi: l'unico
   e' OfflineQueueManager.ts:140»*. **Falso al 06/10**: ci sono 3 chiamate vive
   — `app/(tabs)/index.tsx:598`, `components/PoiDetailSheet.tsx:141`,
   `utils/OfflineQueueManager.ts:140`. Nota del 30/09, invecchiata.
2. `database-schema` dice *«il cloud ha 25 tabelle»* (misurato 30/09).
   **Al 06/10 ho misurato 24 in `public`.** Delta da chiarire, non da
   arrotondare.
3. `process-esg-impact` dice *«GRANT EXECUTE a authenticated: un client
   modificato si accredita da solo»*. **Misura A: ACL solo `postgres`.**
   Probabilmente gia' risolto; da rileggere prima di dichiararlo chiuso.
4. `catena-scan-checkin` e' L1 con nota *«verifica runtime ancora pendente»*.
   Oggi ho confrontato il corpo deployato con la migrazione: **drift escluso**.
   Candidato a L2, ma la promozione la decide chi compila il registro.

C'e' inoltre una strada **ungated** parallela: `PoiDetailSheet.tsx:576` chiama
`scan_poi`, che non ha gate di prossimita' e accredita XP infinite.
Da mappare il controllo di flusso prima di toccare qualsiasi cosa.

---

## 10. FILE RICHIESTI — blocco letto dal validatore

<!--
  `handoff.ps1` legge SOLO questo blocco. Una riga = un percorso relativo alla
  root. Prefisso `!` = gap dichiarato: il file deve mancare finche' non e'
  scritto, e quando esiste il validatore segnala "gap chiuso".
  REGOLA: non cancellare una riga perche' il file non esiste. Quella riga e'
  la prova che il lavoro manca. Rimuoverla nasconde il lavoro invece di farlo.
  Le righe che iniziano con `#` sono commenti.
-->

# documenti di governo
METODO-LAVORO.md
HANDOFF.md
STATO-FASE-0.md
PIANO-LAVORO-MODULARE.md
VISIONE-ESECUZIONE-CORE-BUSINESS.md
TRIAGE-DOCUMENTAZIONE.md
RAPPORTO-CHIUSURA-FASE-0.md
PIANO-CHIUSURA-FASE0-RIEPILOGO.md
.agents/rules/master_business_brief.md

# registro di autorita' (niente si dichiara senza di lui)
docs_v2/tooling/autorita.json

# script diagnostica — Fase 0
supabase/diagnostica_fase0/01_grant_e_righe.sql
supabase/diagnostica_fase0/01b_grant_compatti.sql
supabase/diagnostica_fase0/02_scan_poi_corpo.sql
supabase/diagnostica_fase0/03b_grant_tutte_public.sql
supabase/diagnostica_fase0/03c_policy_aperte.sql
supabase/diagnostica_fase0/03d_righe_mancanti.sql
supabase/diagnostica_fase0/04a_dimensione_scan_poi_gps.sql

# misura 05 — ESEGUITA il 06/10. Risultati in STATO-FASE-0.md §7d e §7e.
supabase/diagnostica_fase0/05a_vw_collective_impact.sql
supabase/diagnostica_fase0/05b_vw_daas_heatmap_15min.sql

# misura 06 — 06 ESEGUITA il 06/10 (risultato STATO 7h). 06b ESEGUITA (§7i).
# misura 07 — ESEGUITA il 06/10 (§7k): vettore admin_role confermato.
# misura 08 — ESEGUITA il 06/10 (§7j, rettificata): OR guard confermato.

# Fase 1 M14 - precheck e correzioni, scritti l'08/10 (tutti eseguiti)
# 09 ESEGUITO (via REST): 1 doppione "Save Ks" -> 09b eseguito (righe 26/08 e 09/09)
# 09c = rename APPROVATO 08/10 e ESEGUITO nel pannello -> "Save Ks 4181f0"
# 09d = precheck charset -> ESEGUITO (via REST): 1 violazione "Fragolina <emoji>"
# 09e = fix charset -> APPROVATO e ESEGUITO 08/10 -> "Fragolina"
# 10, 11 = ESEGUITI nel pannello (gate 10 e 11 verdi; CSV 10 in manifest)
supabase/diagnostica_fase1/09_nickname_unici_precheck.sql
supabase/diagnostica_fase1/09b_nickname_duplicati_righe.sql
supabase/diagnostica_fase1/09c_nickname_duplicati_rename.sql
supabase/diagnostica_fase1/09d_nickname_charset_precheck.sql
supabase/diagnostica_fase1/09e_nickname_charset_fix.sql
supabase/diagnostica_fase1/10_rpc_security_definer_precheck.sql
supabase/diagnostica_fase1/11_profiles_stato_rls_precheck.sql
# post-apply di M14 - ESEGUITO 08/10 (tutto verde tranne n_policy=4)
supabase/diagnostica_fase1/12_m14_post_apply_verifica.sql
# censimento post-apply: M14 ha dato n_policy=4 (2 proprie + 2 INSERT
# preesistenti duplicate) - ESEGUITO 08/10 -> vettore CB-16
supabase/diagnostica_fase1/13_policy_profiles_elenco.sql
# esito del 13: 4 policy = 2 nostre + 2 INSERT duplicate -> vettore CB-16
supabase/diagnostica_fase1/Supabase Snippet Migration RLS and Policy Post-Check for profiles.csv
# precheck grant INSERT (misura del vettore CB-16) - ESEGUITO 08/10:
# anon/auth/adminrole tutti true -> vettore aperto
supabase/diagnostica_fase1/14_insert_privilege_precheck.sql
# chiusura CB-16 (REVOKE INSERT + drop policy duplicata) - APPROVATO ed
# ESEGUITO 08/10: false,false,false,1; verifica REST 42501 + anon SELECT 0
supabase/diagnostica_fase1/15_profiles_insert_revoke.sql
# esito del precheck 10 (gate M14): 11/11 SECURITY DEFINER = verde (CB-14)
supabase/diagnostica_fase1/Supabase Snippet Precheck_ Security Definer functions touching profiles.csv
supabase/migrations/20261008120000_profiles_hardening_m14.sql
# Fase 1 M4 - precheck, scritti l'08/10
# 16 = baseline civic_reports - ESEGUITO: policy unica "Civic access" ALL/
#      {public}/true/true, tabella vuota, colonna reale grid_cell, no CHECK
# 17 = censimento policy = backup M3 - ESEGUITO (definizione usata nel
#      ROLLBACK della migration M4)
# 19 = tipi colonne - ESEGUITO: user_id uuid, tutte le colonne chiave nullable
# 18 = post-apply - ESEGUITO 08/10: n_policy=3, n_all=0, n_pubbliche=0,
#      n_anon=0, vecchia=false, righe=0 -> M4 COMPLETO (CB-18 chiusa)
supabase/diagnostica_fase1/16_civic_reports_stato_precheck.sql
supabase/diagnostica_fase1/17_civic_reports_policy_elenco.sql
supabase/diagnostica_fase1/19_civic_reports_tipi_colonne_precheck.sql
supabase/diagnostica_fase1/18_m4_post_apply_verifica.sql
# migration M4 - APPROVATA ed APPLICATA 08/10
supabase/migrations/20261008130000_civic_reports_rls_m4.sql
# Fase 1 M5 - precheck, scritto l'08/10
# 20 = stato process_crowd_radar - ESEGUITO: prosecdef=true, proconfig=null
#      (R2), proacl=null (R1: EXECUTE PUBLIC), corpo = backup M3
supabase/diagnostica_fase1/20_process_crowd_radar_stato_precheck.sql
supabase/diagnostica_fase1/risultato 20_process.txt
# 21 = post-apply M5 - da eseguire DOPO la migration (atteso exec_anon=false,
#      exec_authenticated=true, search_path_pinnato=true)
supabase/diagnostica_fase1/21_m5_post_apply_verifica.sql
# migration M5 - APPLICATA 08/10 (21 verde + REST 401/42501)
supabase/migrations/20261008140000_process_crowd_radar_m5.sql
# Fase 1 M15 - precheck eseguiti l'08/10 (esito: cloud sicuro)
# 22 = stato delle 5 viste DaaS (RLS/owner/grant/guard)
# 23 = stato di is_loto_admin() (single point of failure)
supabase/diagnostica_fase1/22_m15_viste_daas_stato_precheck.sql
supabase/diagnostica_fase1/23_m15_is_loto_admin_stato_precheck.sql
# M15 gate - post-check, scritto l'08/10 (dopo gate migration)
supabase/diagnostica_fase1/24_m15_post_apply_verifica.sql
# M15 gate - APPLICATO 08/10 (24 verde: anon=false x5)
supabase/migrations/20261008150000_daas_views_anon_guard_m15.sql
# esiti eseguiti salvati dall'utente (output di 23 e 24)
# - CSV "Migration Verification for process_crowd_radar" = output del precheck 23 (is_loto_admin)
# - CSV "Verifica gate anon e RLS sulle viste DaaS" = output del post-check 24
supabase/diagnostica_fase1/Supabase Snippet Migration Verification for process_crowd_radar.csv
supabase/diagnostica_fase1/Supabase Snippet Verifica gate anon e RLS sulle viste DaaS.csv
# Fase 1 M11 - R2: rimozione UPDATE su pois.heat (colonna inesistente)
# 25 = post-apply (corpo senza UPDATE/pois) ; 26 = colonne crowd_predictions
supabase/diagnostica_fase1/25_m11_post_apply_verifica.sql
supabase/diagnostica_fase1/26_crowd_predictions_colonne.sql
# migration M11 - APPLICATA 08/10 (25 e 26 verdi)
supabase/migrations/20261008160000_process_crowd_radar_no_heat_m11.sql
# Fase 1 M6 - deep link (R2): fix client applicato 09/10
# (app/p/[id].tsx, context/GamificationContext.tsx, app/(tabs)/index.tsx,
#  app/(tabs)/profile.tsx; rimozione loto_fallback_*; tsc 0 errori)
# 27 = stato cloud di scan_poi_gps E scan_poi (gate/cooldown/anti-speed) - DA ESEGUIRE
supabase/diagnostica_fase1/27_m6_scan_functions_precheck.sql
# esito del 27 (ESEGUITO 09/10): scan_poi_gps canonico GATED; scan_poi UNGATED (G-06)
supabase/diagnostica_fase1/risultato 27_m6_scan.txt
# G-06 RIPARAZIONE + DROP del morto - APPLICATO 09/10 (verde)
# 28 = precheck/backup M3 (definizione + ACL di scan_poi) - ESEGUITO
supabase/diagnostica_fase1/28_scan_poi_hardening_precheck.sql
# esito del 28 (ESEGUITO 09/10): corpo + ACL; FINDING scan_poi DEPLOYED MA ROTTO
# (INSERT su user_pois.discovered_at, colonna inesistente; probe REST 42703)
supabase/diagnostica_fase1/risultato 28_scan_poi.txt
# client riparato: PoiDetailSheet.tsx:576 -> scan_poi_gps (NFC/QR = trigger)
# 30 = precheck dipendenze (atteso oggetti_che_la_usano=0) - ESEGUITO
supabase/diagnostica_fase1/30_drop_scan_poi_precheck.sql
# esito del 30 (ESEGUITO 09/10): 1 riga, p_poi_id uuid, oggetti_che_la_usano=0
# -> DROP senza CASCADE sicuro. Proseguire con la migration di drop + 31.
supabase/diagnostica_fase1/risultato 30_drop_scan_poi.txt
# migration = DROP FUNCTION IF EXISTS public.scan_poi(uuid) (senza CASCADE)
# 31 = post-check (ESEGUITO 09/10: scan_poi_residue=0, scan_poi_gps_presente=1)
# REST anon: scan_poi -> 404/PGRST202; scan_poi_gps -> 400 (esiste)
supabase/migrations/20261009130000_drop_scan_poi_g06.sql
supabase/diagnostica_fase1/31_drop_scan_poi_post_apply.sql
supabase/diagnostica_fase1/risultato 31_drop_scan_poi.txt
# Fase 1 M7 - scan_poi_gps: cold-start (P-D1), sentinella 9999 (P-D2/P-D5), storico (difetto 5) - APPLICATO
# 32 = precheck fingerprint del corpo - ESEGUITO
supabase/diagnostica_fase1/32_m7_cold_start_precheck.sql
# esito del 32 (09/10): 7289, 9999=true, speed_measurable=false, n_filtri=2
supabase/diagnostica_fase1/risultato 32_m7_cold_start.txt
# migration = nuovo corpo scan_poi_gps (P-D1..P-D6); stessa firma, no schema
supabase/migrations/20261009140000_m7_cold_start_no_9999.sql
# 33 = post-check - ESEGUITO: 7322, 9999=false, speed_measurable=true, n_filtri=1
supabase/diagnostica_fase1/33_m7_cold_start_post_apply.sql
supabase/diagnostica_fase1/risultato 33_m7_cold_start.txt
# Fase 1 M9 - civic_reports: allineamento client (nessuna migration)
# 34 = colonne/nullabilita'/default di civic_reports - ESEGUITO
supabase/diagnostica_fase1/34_m9_civic_reports_columns.sql
# esito 34 (09/10): user_id=uuid, tenant_id text NULL no-default, status default
# 'pending_match', grid_cell present; conferma CB-17. + fix client applicato.
supabase/diagnostica_fase1/risultato 34_m9_civic_reports.txt
# 34b = trigger su civic_reports - ESEGUITO 09/10: 0 righe (conferma M2)
supabase/diagnostica_fase1/34b_m9_civic_reports_triggers.sql
supabase/diagnostica_fase1/risultato 34b_m9_civic_reports.txt
# 35 = precheck unico: colonne+policy+vincoli+righe+grant+funzioni - ESEGUITO (CSV)
supabase/diagnostica_fase1/35_m10_badges_precheck.sql
supabase/diagnostica_fase1/Supabase Snippet Precheck badge Schema, Policy e Privilegi.csv
# 35b = stato RLS pre - ESEGUITO 09/10: rls=true su 3 tabelle, 0 policy (negato)
supabase/diagnostica_fase1/35b_m10_badges_rls.sql
supabase/diagnostica_fase1/risultato 35b_m10_badges.txt
# migration = FK su badges + RLS + policy + claim_badges() - APPLICATA 09/10
supabase/migrations/20261009160000_badges_m10.sql
# 36 = post-check - ESEGUITO 09/10: tutti i gate attesi verdi (FK su badges,
# RLS true, policy, REVOKE badge_templates, claim_badges secdef/conflict)
supabase/diagnostica_fase1/36_m10_badges_post_apply.sql
supabase/diagnostica_fase1/risultato 36_m10_badges.txt
# 37 = certificazione REST anon (ESEGUITO 09/10): badges 200/3 righe;
# claim_badges 401/42501; user_badges 200/[]; embed badges(*) 200/[];
# badge_templates 401/42501
supabase/diagnostica_fase1/risultato 37_m10_rest_anon.txt
# Fase 1 M16 - events / fog of war - IN CORSO (09/10)
# 38 = precheck events (colonne/RLS/policy/grant/righe/event_type/FK/PK/indici)
#   ESEGUITO 09/10: rls=true, 0 policy, grant tutti NO, 2 righe (eco/social)
supabase/diagnostica_fase1/38_m16_events_precheck.sql
supabase/diagnostica_fase1/risultato 38_m16_events.txt
# migration = GRANT SELECT + policy events_read_public - APPLICATA 09/10
supabase/migrations/20261009170000_events_policy_m16.sql
# 39 = post-check (grant+policy+RLS+rowcount) - ESEGUITO 09/10: policy present,
#   SELECT true, RLS true, rowcount 2; REST: 2 righe visibili, INSERT 401
supabase/diagnostica_fase1/39_m16_events_post_apply.sql
supabase/diagnostica_fase1/risultato 39_m16_events.txt
# 40 = M17 FK-anagrafe - ESEGUITO 09/10: FK 6 (user_pois 2, user_badges 2,
#   impact_transactions 2); user_pois NOT NULL + CASCADE; ROWCOUNT: user_pois 5,
#   badges 3, badge_templates 0, user_badges 0, impact_transactions 0,
#   pois 69, profiles 50
supabase/diagnostica_fase1/40_m17_fk_anagrafe.sql
supabase/diagnostica_fase1/risultato 40_m17_fk_anagrafe.txt
# 41 = M17 scan orphan (orfani reali + NULLFK per ogni FK) - ESEGUITO 09/10:
#   12/12 = 0 -> INTEGRITA' CATENA REWARD PULITA
supabase/diagnostica_fase1/41_m17_orphan_scan.sql
supabase/diagnostica_fase1/risultato 41_m17_orphan_scan.txt
# sonda 08 rettificata l'08/10 (M15): pattern 'or is_loto_admin' senza
# prefisso public. (falso-negativo 06/10); storico in STATO-FASE-0 §7j
supabase/diagnostica_fase0/06_is_loto_admin.sql
supabase/diagnostica_fase0/06b_dove_usato_is_loto_admin.sql
supabase/diagnostica_fase0/07_profiles_admin_role_scrivibile.sql
supabase/diagnostica_fase0/08_vw_user_dashboard_metrics_guard.sql

# impronte degli script di misura
supabase/diagnostica_fase0/SHA256SUMS.txt

# STATO MISURE — FASE 0 (L.O.T.O. HUB)

05/10/2026. Artefatto di recupero.
Creato dopo che il crash della finestra ha dimostrato che lo stato in chat
non basta. Ogni riga qui sotto è stata misurata, non dedotta.
**Punto d'ingresso per una nuova sessione: `HANDOFF.md`** (leggerlo per
primo, prima di questo file).
Metodo: `METODO-LAVORO.md`. Piano: `PIANO-LAVORO-MODULARE.md`.
Script: `supabase/diagnostica_fase0/`.
Verifica integrita' del manifest: `handoff.ps1`.

---

## 1. Funzioni — ACL e sicurezza (Script A)

| Funzione | SECURITY DEFINER | search_path | ACL |
|---|---|---|---|
| `process_crowd_radar` | si | **assente** | **di default = PUBLIC** |
| `scan_poi_gps` | si | `public, pg_temp` | **di default = PUBLIC** |
| `scan_poi` | si | **assente** | `postgres`, `anon`, `authenticated` espliciti |
| `process_esg_impact` | si | `public, pg_temp` | solo `postgres` |

Assenti: `scan_poi_nfc`, `calculate_esg_impact`.

---

## 2. Grant — misura 1b e 3b

**1b (10 tabelle).** `anon` e `authenticated` hanno `RWUD` su `profiles`,
`civic_reports`, `scans`, `user_pois` no: `user_pois` e `loto_squads` sono `----`.

**3b (tutte le 24 tabelle + 11 viste).**

`RWUD` per anon e auth: `badge_templates`, `badges`, `civic_reports`, `events`,
`impact_transactions`, `media_vault`, `pois`, `profiles`, `scans`,
`tenant_events`, `tenant_localizations`, `tenants`, `territories`,
`user_badges`, `user_unlocked_media`, `whispers`, vista `vw_collective_impact`.

`----` per entrambi: `app_telemetry_events`, `b2b_feedbacks`, `crowd_predictions`,
`loto_squads`, `poi_ble_fingerprints`, `system_logs`, `user_pois`,
`vw_admin_checkins_analytics`, `vw_admin_pois`.

Solo lettura per `anon`: `vw_pois_frontend`, `vw_daas_esg_monthly`,
`vw_daas_event_attendance`, `vw_daas_heatmap_15min`, `vw_dev_telemetry_daily`,
`vw_user_dashboard_metrics`, più le viste PostGIS.

`vw_collective_impact`: RLS **disattivato**, `RWUD` da `anon`.

---

## 3. Policy — misura 3c (completa, unione dei due result set)

**Scrittura aperta:**
- `civic_reports` — `Civic access`, `ALL`, `qual=TRUE`, `chk=TRUE`
- `scans` — `Scans access`, `ALL`, `qual=TRUE`, `chk=TRUE`
- `system_logs` — `INSERT`, `chk=TRUE` — **ma grant `----`, quindi inerte**

**Lettura aperta (`qual=TRUE`):** `profiles`, `pois`, `tenants`, `tenant_events`,
`tenant_localizations`, `whispers`.

**Policy restrittive, sommate in OR con le aperte (quindi inutili):**
`profiles` SELECT `auth.uid() = id`, `pois` SELECT `is_active = true`,
`media_vault` SELECT `auth.uid() IS NOT NULL` (nome che dice il contrario).

**Scritture con policy ma senza grant (inerti):** `app_telemetry_events`,
`b2b_feedbacks`, `user_pois`.

**Duplicate:** `profiles` UPDATE x2 e INSERT x2 (differiscono per il punto finale
nel nome); `b2b_feedbacks` INSERT x2, una chiamata «Utenti possono inserire i
propri whisper» su una tabella che non e' `whispers`.

**8 tabelle con RLS attivo e ZERO policy** (negano tutto, anche con grant `RWUD`):
`badge_templates`, `badges`, `events`, `territories`, `user_badges`,
`user_unlocked_media`, `crowd_predictions`, `poi_ble_fingerprints`.

---

## 4. Righe

| Tabella | Righe | Tabella | Righe |
|---|---:|---|---:|
| `pois` | 69 | `tenants` | 2 |
| `profiles` | 50 | `territories` | 2 |
| `whispers` | 26 | `events` | 2 |
| `media_vault` | 8 | `tenant_localizations` | 2 |
| `user_pois` | 5 | `badges` | 3 |
| `badge_templates` | 0 | `civic_reports` | 0 |
| `scans` | 0 | `user_badges` | 0 |
| `tenant_events` | 0 | `loto_squads` | 0 |
| `system_logs` | 0 | `impact_transactions` | 0 |
| `crowd_predictions` | 0 | `poi_ble_fingerprints` | 0 |
| `user_unlocked_media` | 0 | `app_telemetry_events` | 0 |
| `b2b_feedbacks` | 0 | | |

Totale **169 righe**. Attivita' reale: 5 `user_pois`.

**`profiles` (misura precedente):** 50 righe, 0 email, 0 nomi, 0 push token,
`admin_role` = 1 `admin` + 49 `viewer`, 1 solo con XP.

---

## 5. Corpo deployato di `scan_poi` (misura 2)

- `SECURITY DEFINER`, `auth.uid()` verificato con `RAISE EXCEPTION` se NULL
  -> **`anon` NON puo' scrivere**, nonostante l'`EXECUTE`.
- Legge `xp_reward` da `pois`, alza `profiles.total_xp` **sempre**, senza
  guardia sull'esito dell'INSERT.
- `INSERT INTO user_pois ... ON CONFLICT DO NOTHING` blocca la riga di storico,
  ma l'`UPDATE` degli XP esegue comunque: **XP acquisibili infinite volte sullo
  stesso POI, senza controllo di prossimita'.**
- `COALESCE(v_xp_reward, 15)` e' codice morto (la funzione ha gia' lanciato).
- Non tocca `scans`. Non calcola velocita' ne shadowban.
- Scrive la colonna `discovered_at`; `app/p/[id].tsx:97` scrive `visited_at`.

---

## 6. Sintesi

- **La superficie di scrittura aperta su un utente reale e' esattamente
  `civic_reports` e `scans`**, entrambe a 0 righe. Tutte le altre scritture
  sono bloccate dai grant, tutte le altre policy di scrittura non esistono.
- `app/p/[id].tsx:94-98` fa `upsert` su `user_pois`, che ha grant `----`:
  **fallisce sempre**, il `try/catch` lo assorbe, e a riga 104 `setToastXp`
  accredita comunque. XP solo in `AsyncStorage`.
- Le viste DaaS (`vw_daas_heatmap_15min` ecc.) sono leggibili da **ogni utente
  autenticato**, contro l'invariante scritta in
  `.agents/rules/master_business_brief.md:43` («riservato al personale
  autorizzato»).
- Esistono **due** tabelle eventi: `events` (2 righe, sigillata) e
  `tenant_events` (0 righe, pubblica).

---

## 7. Correzioni che devo al progetto

1. `scan_poi` **accredita** — l'affermazione contraria veniva da un riepilogo
   non verificato.
2. `anon` in `EXECUTE` su `scan_poi` **non** e' un vettore di scrittura.
3. «Zero dei cinque pezzi dei nodi nel DB» era **sbagliato**: `tenants`,
   `tenant_events`, `events`, `tenant_localizations` esistono. Ho violato la
   regola 2.2 cercando per nome.
4. Le dipendenze di `PlasticaqquaEventSheet` sono due (`profiles` e
   `user_badges`), non una.
5. L'allarme su `system_logs` era troppo alto: policy aperta, grant assenti.
6. Il modulo sul trigger civico (M8) e' **annullato**: 0 trigger utente in
   `public`, `civic_confirmed` inesistente.
7. D2 e' risolta sullo schema: `calculated_speed_kmh` e `is_shadowbanned` sono
   gia' nullable. Nessuna migrazione.
8. M3 (gate di backup) e' una raccomandazione, non un blocco: il rollback DDL
   e' nelle migration Git.

---

## 7b. Misura 4 — corpo deployato di scan_poi_gps + DRIFT

**Drift ESCLUSO.** Il corpo deployato e' identico a
`supabase/migrations/20260929160000_restore_proximity_gate.sql`, riga per
riga. Differenze solo di rendering (`SET search_path TO 'public', 'pg_temp'`
vs `SET search_path = public, pg_temp`). Le due query di controllo che la
migrazione stessa chiede di verificare — `v_dist_poi_m > v_radius_m` e
`SET search_path` — sono entrambe presenti. La migrazione del 29/09 e'
applicata.

**Cosa fa bene:** `auth.uid()` con eccezione, proximity gate con
`ST_Distance` sul raggio del POI (fallback 80 m), guardie su coordinate NULL
client e POI, cooldown 12 ore, `search_path` fissato, ledger di impatto solo
se non shadowbanned, campo `status` onesto.

**Bug confermato nel corpo deployato:**
`v_speed_kmh DOUBLE PRECISION := 0` (migrazione riga 127) rende impossibile
`v_speed_kmh IS NULL`, quindi `v_speed_kmh := 9999` (riga 225) e' **codice
morto**. Senza riga precedente valida il blocco esterno non si entra, la
velicita' resta 0, e il `0` cade nell'`ELSE` -> **ricompensa piena**.
La riga 200-201 della stessa migrazione scrive che "non deve cadere
nell'ELSE come ricompensa piena": **il requisito e' nel file e il codice lo
viola.**

Effetti collaterali dello stesso filtro `is_shadowbanned IS NOT TRUE`:
le righe bandite sono escluse dal **cooldown** (quindi un check-in respinto
si puo' rifare subito) e dalla **base di calcolo** (quindi non possono essere
rilevate due volte).

**Correzioni aggiunte:**
9. `scan_poi_gps` **non** scrive in `scans`: scrive in `user_pois` e
   `impact_transactions`. L'avevo scritto nell'intestazione dello script 04.
10. `scans` e' **orfana**: nessun `.from('scans')` nel codice, nessuna
   funzione la tocca. Tabella con `ALL/TRUE/TRUE`, grant `RWUD`, 0 righe.
11. **Difetto funzionale, non di sicurezza.** `events` (2 righe) e
    `user_badges` (0 righe) sono tra le 8 tabelle con RLS attivo e **zero
    policy** -> illeggibili dai client. `user_badges` e' letto da 9 punti vivi
    (`index.tsx` x4, `profile.tsx` x2, `communityFeed.ts`,
    `badgeAssignment.ts`, `PlasticaqquaEventSheet.tsx`); `events` da
    `community.tsx`, `index.tsx`, `PoiDetailSheet.tsx`. Le query non danno
    errore, tornano array vuoto, e il codice fa `if (data)` su un array
    truthy. **Nessuno vede i badge e nessuno vede gli eventi, silenziosamente.**

---

## 7c. Trovato costruendo la rete di sicurezza (06/10)

12. **`master_business_brief.md` e' ARCHIVIO, demotuto il 30/09/2026, non e'
    fonte di autorita'** (lo dichiara alla riga 3). Per la Fase 0 l'ho citato
    come specifica vincolante su `:34`, `:41`, `:42`, `:43`. Errore mio:
    quegli invariante vanno cercati nel file canonico del dominio.
13. **Il registro che dice chi dice il vero e'
    `docs_v2/tooling/autorita.json`.** Non l'avevo aperto prima di oggi.
    Regola: un documento non registrato li non e' autorita', per quanto dica
    nel titolo. `docs_v2/tooling/validate.py` esiste e passa: 54 documenti,
    18 ambiti, 0 errori, 2 avvertenze.
14. **Nome ufficiale: L.O.T.O. Map (Life On The Outside) Co-Experience** dal
    30/09/2026 (`A8_lessico_e_marchio.md`, D15). "L.O.T.O. HUB" e' il vecchio
    marchio, ancora in quasi tutti i file. Ho scritto `METODO-LAVORO.md` e
    `HANDOFF.md` col nome vecchio.
15. **`autorita.json` contiene due chiavi duplicate** (`database-schema`,
    `tabelle-non-ufficiali`): in JSON vince l'ultima. In `database-schema`
    la prima e' `canonico`, la seconda `vuoto`. Da segnalare, non sistemato
    in autonomia: e' il registro, non il mio.
16. **Tre note di `autorita.json` sono invecchiate rispetto a oggi:**
    `gate-prossimita-attivo` dice «scan_poi_gps non ha chiamanti vivi: l'unico
    e' OfflineQueueManager.ts:140» — al 06/10 ci sono **3 chiamate vive**
    (`index.tsx:598`, `PoiDetailSheet.tsx:141`, `OfflineQueueManager.ts:140`);
    `database-schema` dice 25 tabelle (30/09) — io ne ho misurate **24**;
    `process-esg-impact` dice «GRANT EXECUTE a authenticated» — la misura A dà
    **solo `postgres`**.
17. **Strada ungated parallela:** `PoiDetailSheet.tsx:576` chiama `scan_poi`
    (nessun gate, XP infinite) mentre `:141` chiama `scan_poi_gps` (gate
    presente). Due funzioni, due percorsi, stesso file. Controllo di flusso da
    mappare prima di qualsiasi modifica.

---

## 7d. Misura 05a — vista `vw_collective_impact` (06/10, eseguita)

**Riga:** `rls_attivo=false`, `rls_forzato=false`, `reloptions=null`,
`proprietario=postgres`, `lunghezza_def=377`, `troncata=false`,
`aggiornabile_stima=false`, `anon_sel=true`, `anon_upd=true`,
`auth_sel=true`, `auth_upd=true`.

**Definizione (integra, 377 caratteri):**
```sql
SELECT count(DISTINCT profile_id) AS total_explorers_today,
    COALESCE(sum(tokens_earned), 0::bigint) AS total_pti_generated,
    COALESCE(sum(co2_saved), 0::double precision) AS total_co2_saved,
    COALESCE(sum(liters_saved), 0::double precision) AS total_water_saved,
    ( SELECT count(*) FROM scans) AS total_checkins
   FROM impact_transactions it;
```

**Cosa dice:**
1. **Il bypass RLS temuto NON esiste.** La vista contiene aggregati
   (`count`, `sum`) e quindi **non e' aggiornabile**: Postgres rifiuta
   INSERT/UPDATE/DELETE sulla vista. Il `anon_upd=true` e' un GRANT che non
   puo' essere esercitato — inernte, stesso schema di `system_logs`.
   Resta un grant da togliere, ma non e' un buco.
2. **Non c'e' fuga di dato individuale.** Nessun GROUP BY: restituisce una
   sola riga di aggregati, non righe per utente. Nessun PII.
3. **RLS spento con proprietario `postgres`**: la vista gira coi diritti del
   proprietario e bypassa l'RLS di `impact_transactions` e `scans`. Espone
   aggregati globali a `anon`. E' il fatto vero: meno grave del bypass, ma
   il grant di lettura per `anon` su statistiche aggregate di tutti resta.
4. **`total_checkins` legge da `scans`, la tabella orfana** (0 righe, nessuno
   la scrive — correzione 10). Quindi i check-in della dashboard sono 0 per
   costruzione.
5. **`total_explorers_today` non ha nessun filtro data**: "today" e' falso,
   conta dall'inizio.
6. **Vista sempre a zeri**: `impact_transactions` ha 0 righe (misura 3d) e
   `scans` ha 0 righe. Le query la leggono (`community.tsx:99`,
   `index.tsx:450`) e trovano una riga di zeri — riga presente, quindi
   `if (data)` e' truthy e nessuno se ne accorge. Stesso schema dei badge.

**Non era quindi il buco piu' grave della Fase 0.** Il sospetto era
fondato e le colonne lo hanno smentito: e' un widget di dashboard rotto.

---

## 7e. Misura 05b — vista `vw_daas_heatmap_15min` (06/10, eseguita)

**Riga:** `rls_attivo=false`, `rls_forzato=false`, `reloptions=null`,
`proprietario=postgres`, `lunghezza_def=1068`, `troncata=false`,
`aggiornabile_stima=false`, `anon_sel=false`, `anon_upd=false`,
`auth_sel=true`, `auth_upd=false`.

**Definizione (integra, 1068 caratteri):**
```sql
WITH cells AS (
  SELECT COALESCE(p.tenant_id, 'unassigned'::text) AS tenant_id,
         round(up.lat::numeric, 3)::double precision AS grid_lat,
         round(up.lng::numeric, 3)::double precision AS grid_lng,
         date_trunc('hour', up.visited_at)
           + '00:15:00'::interval
           * (EXTRACT(minute FROM up.visited_at)::integer / 15)::double precision AS time_block,
         up.poi_id, up.profile_id,
         COALESCE(up.co2_saved, 0::double precision) AS co2_saved
    FROM user_pois up
    JOIN pois p ON p.id = up.poi_id
   WHERE is_loto_admin()
     AND up.is_shadowbanned IS NOT TRUE
     AND up.lat IS NOT NULL AND up.lng IS NOT NULL AND up.visited_at IS NOT NULL
)
SELECT tenant_id, grid_lat, grid_lng, time_block, poi_id,
       count(*) AS checkins,
       count(DISTINCT profile_id) AS unique_visitors,
       sum(co2_saved) AS co2_saved_kg,
       5 AS k_anonymity_threshold
  FROM cells
 GROUP BY tenant_id, grid_lat, grid_lng, time_block, poi_id
HAVING count(DISTINCT profile_id) >= 5;
```

**Cosa dice:**
1. **C'e' un guard server-side dentro la definizione:** `WHERE is_loto_admin()`.
   La vista e' leggibile da ogni `authenticated` (`auth_sel=true`), ma la
   riga di output dipende dalla funzione. Se torna `false`, la query resta
   vuota per l'utente normale. **Il gate esiste, ma non e' ancora misurato**
   (vedi 7f).
2. **k-anonimato reale:** `HAVING count(DISTINCT profile_id) >= 5` con la
   costante `5 AS k_anonymity_threshold`. Griglia `round(lat, 3)` ~ 111 m.
   Il SOSPETTO di violazione dell'invariante k>=5 e' **smentito**: la vista
   e' costruita correttamente su questo.
3. **Non aggiornabile** (CTE + aggregati): nessun rischio di scrittura.
4. **`reloptions=null`** -> nessun `security_invoker=true`: la vista gira
   con i permessi del proprietario `postgres`, quindi **bypassa l'RLS di
   `user_pois` e `pois`**. Serve perche' `user_pois` ha grant `----` per
   anon/auth: senza owner il vedere non funzionerebbe. Non e' di per se un
   difetto, ma e' il motivo per cui il guard interno e' l'unica barriera.
5. **Filtro `is_shadowbanned IS NOT TRUE` presente.**
6. **`anon_sel=false`**: anon non la vede affatto.

**In sintesi:** costruzione corretta su k e griglia, anon escluso, scrittura
impossibile. L'unico punto non verificato e' `is_loto_admin()`.

---

## 7f. Misura necessaria 06 — `is_loto_admin()` (ESEGUITA: vedi §7h — chiusa)

Il guard di `vw_daas_heatmap_15min` — e probabilmente dell'intera famiglia
`vw_daas_*` — si regge su `is_loto_admin()`. Non e' stata misurata in
nessuna delle quattro fasi.

Bisogna sapere, per decidere se il gate regge:

1. **definizione e `prosecdef`** — se e' SECURITY DEFINER, i suoi permessi
   e non quelli dell'utente decidono il risultato.
2. **ACL** (chi puo' eseguirla) e `search_path`.
3. **Su che cosa decide** — se legge `profiles.admin_role` per l'utente
   corrente, il rischio concreto e': `profiles` ha grant `RWUD` per
   `anon`+`authenticated` (misura 1b/3b) e policy UPDATE. **Se un utente
   puo' scrivere il proprio `admin_role` e metterlo `admin`, il guard cade**
   e con lui l'intera famiglia DaaS.
4. **Quante viste la usano** — se e' l'unica barriera di tutte e 5.

E' la domanda piu' importante rimasta aperta in Fase 0.

---

## 7g. Misura 04a — sentinelle di `scan_poi_gps` (06/10, eseguita)

**Riga:** `caratteri=7289`, `ha_search_path=false`, `ha_gate_prossimita=true`,
`init_velocita_zero=true`, `ha_ramo_9999=true`, `n_9999=2`,
`n_filtri_shadow=2`.

**Cosa prova:**
1. **`init_velocita_zero = true`** -> `v_speed_kmh DOUBLE PRECISION := 0` e'
   nel corpo deployato. Con `n_9999 = 2` (dichiarazione + assegnazione) la
   catena e' chiusa: l'inizializzazione a 0 rende impossibile
   `v_speed_kmh IS NULL`, quindi entrambe le occorrenze di `9999` sono
   irraggiungibili. **Il bug della misura 4 non e' una deduzione dal testo
   della migrazione: e' confermato sul corpo deployato.**
2. **`n_filtri_shadow = 2`** -> `is_shadowbanned IS NOT TRUE` compare due
   volte: escluso sia dallo **storico** sia dal **cooldown**. Conferma gli
   due effetti collaterali (check-in respinto rifacibile subito; il bandito
   non resta mai nelle proprie basi di calcolo).
3. **`ha_gate_prossimita = true`** -> il gate `v_dist_poi_m > v_radius_m`
   e' presente. Il difetto non e' il gate mancante, e' il ramo freddo che lo
   aggira passando per l'ELSE.
4. **`ha_search_path = false` e' UNA MISURA INVALIDA, non un risultato.**
   Vedi correzione 18.

**Correzione 18:** il test era `p.prosrc LIKE '%search_path%'`. Ma
`SET search_path` **non sta in `prosrc`**: sta in `pg_proc.proconfig`, e
`pg_get_functiondef` lo ricostruisce da li. La colonna poteva solo tornare
`false`, qualunque cosa ci fosse. Fonte corretta resta la misura A, che
leggeva `proconfig` e dava `public, pg_temp`; il corpo della migrazione
20260929160000 lo contiene. **Lo script 04a e' stato corretto per usare
`proconfig`; la colonna `ha_search_path` non va citata in nessun documento.**

---

## 7h. Misura 06 — funzione `is_loto_admin()` (06/10, eseguita)

**Riga:** `security_definer=true`, `proprietario=postgres`,
`search_path=search_path=public`, `acl={postgres=X, authenticated=X, service_role=X}`,
`anon_exec=false`, `auth_exec=true`, `legge_admin_role=true`,
`legge_profiles=true`, `usa_auth_uid=true`, `lunghezza_corpo=189`,
`troncata=false`.

**Corpo (integro, 189 caratteri):**
```sql
SELECT
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.admin_role IN ('admin', 'analyst')
  );
```

**Cosa dice:**
1. **Il rischio segnalato in 7f e' CONFERMATO strutturalmente.** La funzione
   decide leggendo `profiles.admin_role` della riga di `auth.uid()`.
   Essendo SECURITY DEFINER con proprietario `postgres`, legge `profiles`
   **bypassando l'RLS**. L'unica barriera rimasta e': **l'utente riesce a
   scrivere il proprio `admin_role`?** — vedi 7i.
2. **`anon_exec=false` con ACL esplicita**: anon NON puo' chiamarla. Non e'
   un default PUBLIC (proacl e' valorizzato), quindi qui il permissivo
   implicito non c'e'. Meglio di M1, dove 3 funzioni su 4 avevano ACL di
   default.
3. **`search_path=public` — `pg_temp` NON e' elencato.** Le altre DEFINER
   misurate in M1 hanno `public, pg_temp` (`scan_poi_gps`,
   `process_esg_impact`) oppure assente (`scan_poi`). Questa e' incoerente
   con entrambe: un valore a meta'. Da valutare, non e' un vettore
   dimostrato.
4. **`auth.role() = 'service_role'`** — ramo non forgiabile dal client
   (la service key resta server-side).
5. **Correzione 19:** la colonna `ritorna_boolean` e' falsa, ma la funzione
   torna boolean. Il regex cercava la parola nel **corpo**; il tipo di
   ritorno e' in `pg_proc.prorettype`. Terzo sonoro che misura testo invece
   di semantica (dopo `ha_search_path` e `ha_search_path`... vedi 18).
   **Regola da aggiungere:** un flag costruito con `LIKE`/regex su `prosrc`
   dice che la stringa c'e', non che il significato e' quello. Quando il
   corpo e' corto e intero, come qui (189 < 1200), l'unica prova e' il corpo.

---

## 7i. Domanda aperta 07 — l'utente puo' scrivere il proprio `admin_role`?

Tutto il gate DaaS dipende da questa domanda, ed e' l'**ultima** prima di
poter chiudere la valutazione del perimetro. Cosa si sa gia':

- `profiles` ha grant `RWUD` per `anon` e `authenticated` (misure 1b e 3b):
  la tabella e' scrivibile a livello di tabella.
- `profiles` ha **due policy UPDATE** duplicate e **zero trigger utente**
  (M2: 0 trigger in `public`). Nessun guardia applicativa.
- Nessun controllo di colonna misurato finora.

Serve misurare:
1. le **condizioni** delle policy UPDATE (`qual` e `with_check`) — se e'
   `auth.uid() = id` la scrittura sulla propria riga e' ammessa;
2. il **permesso di colonna**: `has_column_privilege('authenticated',
   'public.profiles', 'admin_role', 'UPDATE')`.

Se entrambi veri: **un utente qualunque si promuove ad `admin` o `analyst`
e apre tutta la famiglia DaaS.** Finche' non e' misurato, il gate
`is_loto_admin()` va considerato **non verificato**, non sicuro.

## 7k. Misura 07 � profiles.admin_role scrivibile (APERTO)

Script `07_profiles_admin_role_scrivibile.sql` (read-only, eseguito 06/10; prima
esecuzione fallita per `pg_get_consrc(oid)` inesistente — funzione inventata,
corretta in `pg_get_constraintdef`, relock fatto). **Quattro punti:**

1. **Policy UPDATE duplicate (2)**: `qual = (auth.uid() = id)`,
   `with_check = nessuna` — la scrittura sulla propria riga è ammessa.
2. **Permesso di colonna**: `has_column_privilege('authenticated',
   'public.profiles', 'admin_role', 'UPDATE') = true` (anche `anon = true`,
   inerte perché `auth.uid()` NULL non matcha righe).
3. **CHECK constraint**: `admin_role = ANY (ARRAY['admin','analyst','viewer'])`
   → il valore **`admin` è consentito** dal vincolo.
4. **Policy SELECT** `qual = true` (lettura globale), `polroles` vuota =
   **PUBLIC**; `default_admin_role = 'viewer'`, `admin_role_not_null = false`,
   0 trigger.

**Conclusione:** un utente autenticato (anche anonymous) può eseguire
`UPDATE profiles SET admin_role = 'admin' WHERE id = auth.uid()` →
`is_loto_admin()` diventa true → si aprono **tutte e 5** le viste DaaS.
Il gate DaaS è **non sicuro** finché M14 non chiude il vettore.
Registro: `VISIONE-ESECUZIONE-CORE-BUSINESS.md` CB-01 / CB-02.


---

## 7j. Misure 06b + 08 — guard delle viste (06/10, eseguite)

**Script 08 (read-only, eseguito 06/10) — rettifica.** La probe
`or public.is_loto_admin` ha dato `found = false`: **falso negativo**, non
assenza di OR. `pg_get_viewdef` restituisce `OR is_loto_admin()` **senza il
prefisso `public.`**, che la probe cercava letteralmente. L'output completo
dello script 08 conferma il WHERE finale:

```sql
WHERE p.id = auth.uid() OR is_loto_admin();
```

→ **L'OR ESISTE.** La vecchia affermazione "vista admin-only / utente normale
non vede la propria dashboard" è **ritrattata** (punto 4 sotto corretto):
l'utente vede sempre la **propria riga**; `is_loto_admin()` aggiunge solo
l'accesso admin. Correzione registrata, non riscritta (METODO 7.1).
Registro: `VISIONE-ESECUZIONE-CORE-BUSINESS.md` G-09.
**5 oggetti usano `is_loto_admin()`**, tutti `proprietario=postgres`, tutti
`rls_attivo=false`:

| oggetto | lunghezza_def |
|---|---|
| `vw_daas_esg_monthly` | 6193 |
| `vw_daas_event_attendance` | 682 |
| `vw_daas_heatmap_15min` | 1068 |
| `vw_dev_telemetry_daily` | 292 |
| `vw_user_dashboard_metrics` | 2551 |

**Cosa dice:**
1. **Il guard e' uniforme ed e' unico punto di fallimento**: le stesse 5
   viste che in 3b avevano `R---` per `authenticated` sono esattamente quelle
   protette da `is_loto_admin()`. Se cade lui, cadono tutte e 5.
2. **Tutte con RLS spento e proprietario `postgres`**: nessuna barriera
   interna oltre al guard.
3. **`vw_collective_impact` NON compare** — conferma la 05a: quella non ha
   guard, fa solo aggregati. Coerente.
4. **`vw_user_dashboard_metrics` NON e' admin-only** (rettificato 06/10 dallo
   script 08): e' una dashboard UTENTE con `WHERE p.id = auth.uid() OR
   is_loto_admin()`. Un utente normale vede la **propria riga**; il guard
   aggiunge l'accesso admin. La formula "`OR public.is_loto_admin`" della
   sonda 08 era senza corrispondenza per via dell'assenza del prefisso
   `public.` — sonda da correggere in futuro (non riscrivere: rettifica
   sopra).

---

## 8. Da fare

1. [CHIUSO] `04a_dimensione_scan_poi_gps.sql` — eseguita 06/10 (misura 04a);
   estrazione fissa, nessun `04b/04c` necessario.
2. [CHIUSO] `05` — sviluppate come `05a` (vw_collective_impact) e `05b`
   (vw_daas_heatmap_15min), eseguite 06/10.
3. [FATTO] `08_vw_user_dashboard_metrics_guard.sql` — creato ed eseguito
   06/10 (read-only): OR `auth.uid() OR is_loto_admin()` confermato; rettifica
   §7j registrata sopra.
4. Consolidare questo stato in `PIANO-LAVORO-MODULARE.md` (P-D1…P-D6, M14–M17)
   e in `VISIONE-ESECUZIONE-CORE-BUSINESS.md` (registro discrepanze).
5. Aggiornare `HANDOFF.md` + rinnovare `handoff.ps1 -Lock`.
6. Allineamento brand `A8` + `validate.py`.
7. **Solo allora** Fase 1 (scritture) — inizio M14.

**Patch trattenuta, non eseguita — SUPERATA il 08/10 dalla migration M14
`supabase/migrations/20261008120000_profiles_hardening_m14.sql`** (contiene lo
stesso `count_profiles()` + policy own-row + UNIQUE nickname; qui resta come
testo della patch originale):

```sql
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

CREATE OR REPLACE FUNCTION public.count_profiles()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*) FROM public.profiles;
$$;

REVOKE ALL ON FUNCTION public.count_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_profiles() TO anon, authenticated;
```

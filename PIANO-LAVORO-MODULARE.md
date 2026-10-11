# PIANO DI LAVORO MODULARE — L.O.T.O. HUB

> **Prima di tutto leggi `HANDOFF.md`** (protocollo di riavvio) e
> `METODO-LAVORO.md` (metodo). Questo piano va riallineato con le misure di
> `STATO-FASE-0.md`: dove divergono, ha ragione `STATO-FASE-0.md`.

Agente principale. Versione 04/10/2026.
Sostituisce integralmente `PIANO-LAVORO.md` v1 e `LOG-LAVORO.md`.

---

# M0 — ALLINEAMENTO

## Dove siamo

Il cantiere e' il **check-in e la catena di ricompense**: `scan_poi_gps`,
`process_crowd_radar`, `civic_reports`, badge, e la mappa che li consuma.
Presa in carico perche' e' l'unica area con difetti **bloccanti** misurati.

## Cosa NON e' il cantiere

Escluso perimetro, deciso e non da riaprire:

- `docs/` — originale senza metadati, non consultabile (vedi `TRIAGE-DOCUMENTAZIONE.md`)
- `docs_v3/` — pista dell'altro agente. **Non creo file, non tocco deliverable.**
- Archivio NotebookLM — `OSSERVAZIONE.txt`, `brief-notebooklm.txt`,
  `NOTEBOOKLM-BRIEFING.md`, le due trascrizioni chat. Materiale del vecchio agente.
  Lo consulto se serve ricostruire una decisione, mai come specifica.

## Documenti che governano questo piano

| File | Ruolo | Come lo uso |
|---|---|---|
| `PIANO-LAVORO-MODULARE.md` | questo | moduli, rami, gate |
| `TRIAGE-DOCUMENTAZIONE.md` | perimetro di consulto | cosa apro e cosa no |
| `docs_v2/DECISIONI.md` | decisioni dell'utente | vincolo non negoziabile |
| `docs_v2/tooling/autorita.json` | registro d'autorita' | **ripristinato, non modifico** |

## Regola operativa

Uno script alla volta, tu lo esegui, tu mi dai l'output, io misuro.
Nessuna scrittura nel DB senza output precedente che la giustifichi.
Nessun modulo entra in `FASE 1` senza il suo gate di coerenza chiuso.

---

# STRUTTURA DEI MODULI

Ogni modulo ha cinque sezioni fisse. Se una manca, il modulo non e' pronto.

```
Precondizioni   misure e decisioni che devono esistere PRIMA
Rami            bivi condizionali: se A allora B, con le conseguenze
Passi           numerati, eseguibili, uno alla volta
Gate di coerenza cosa deve restare vero DOPO, e cosa NON deve cambiare
Accettazione    output atteso, verificabile da te
Rollback        come si torna indietro
```

Il **Gate di coerenza** e' la parte che ha prodotto piu' guai in questa sessione:
e' li' che si scopre se una patch corregge un difetto e ne apre un altro.
Non si salta.

---

# FASE 0 — MISURE PRIMA DELLE SCRITTURE

Nessuna scrittura al DB in questa fase. Solo lettura.

## M1 — Permessi e oggetti non ancora visti

**Severita':** BLOCCANTE (abilita M3)
**Stato:** da fare

### Precondizioni
- Nessuna. E' il primo script.

### Rami
- **R1** — `prosecdef = true` su `process_crowd_radar`: la funzione gira con i
  permessi del proprietario, quindi i grant non bastano a limitarla. Diventa
  difetto di escalation, non solo di impersonazione. Segnalo e alzo severita'.
- **R2** — `proacl` con `EXECUTE` aperto a `anon`: vettore sfruttabile da chiunque
  non autenticato.
- **R3** — `proconfig` con `search_path` vuoto: la funzione risolve nomi non
  qualificati con il search_path del chiamante. Da chiudere con `SET search_path`.

### Passi
1. Eseguire lo script A (§ APPENDICE).

### Gate di coerenza
Il gate e' la stessa esistenza di questo modulo: **non applicare M3 senza aver letto
i grant.** Il mio codice letto non contiene `auth.uid()`, ma non ho mai visto gli
`ACL`, e ho sbagliato quattro volte a concludere da un nome.

### Accettazione
- righe per `process_crowd_radar`, `scan_poi_gps`, `scan_poi`, `process_esg_impact`
- colonne `args`, `prosecdef`, `proconfig`, `proacl` per ciascuna

### Rollback
nessuno: e' sola lettura

---

## M2 — Trigger completi e gestione errori

**Severita':** ALTA (abilita M6, M7)
**Stato:** da fare

### Precondizioni
- Nessuna.

### Rami
- **R1** — esiste un trigger che promuove `pending_match` -> `confirmed`:
  allora il trigger `civic_confirmed` **non e' circolare** e il bug di M6 e' diverso.
  Il mio sospetto si regge solo sull'assenza di questa via.
- **R2** — `CivicDashboard` gestisce l'errore di inserimento: se lo mostra, M7 e'
  un bug di dato. Se lo ingoia, e' anche un bug di fiducia.

### Passi
1. Eseguire lo script B (§ APPENDICE).

### Gate di coerenza
Prima di toccare `civic_reports`, sapere **tutti** i modi in cui una riga puo'
diventare `confirmed`. Se ne esiste uno che non conosco, la patch di M4 ne rompe uno.

### Accettazione
- elenco trigger con tabella, evento, funzione
- esito del test di `grid_cell_50m`

### Rollback
nessuno: sola lettura

---

## M3 — Backup

**Severita':** BLOCCANTE (declassata a RACCOMANDAZIONE il 06/10)
**Stato:** RACCOMANDAZIONE — non piu' prerequisito formale. Nessuna
esportazione misurabile dal pannello Supabase locale; si procede dichiarando
di agire senza backup (decisione da confermare e registrare in `DECISIONI.md`).
M4/M6/M7 non sono piu' bloccati da M3; resta un rischio residuo documentato.

### Precondizioni
- Nessuna.

### Rami
- **R1** — la dashboard Supabase offre export: si usa quella, nessun tooling locale.
- **R2** — no export: si valuta di NON applicare M5, che riscrive la funzione che
  assegna XP. Rischio non reversibile senza copia.

### Passi
1. Export di schema e dati dalla dashboard, o conferma esplicita che si procede senza.

### Gate di coerenza
**Nessuna patch sui reward entra senza questo.** Se `scan_poi_gps` viene riscritta e
la sintassi e' sbagliata, la funzione non si applica e gli utenti non fanno
check-in. Non si torna indietro.

### Accettazione
- copia dei dati, o decisione esplicita di procedere senza
- copia dello schema delle 4 tabelle toccate: `user_pois`, `civic_reports`,
  `badges`, `user_badges`

### Rollback
non applicabile: e' il rollback

---

# FASE 1 — SICUREZZA, SENZA TOCCARE I PREMI

Regola: se M5 (premi) viene applicato mentre M4-M6 stanno aperti, il codice di
ricompensa viene alimentato da scritture che nessuno controlla. La protezione
sarebbe inutile.

## M4 — `civic_reports`: chiude le scritture aperte

**Severita':** BLOCCANTE
**Stato:** **COMPLETO 08/10** — precheck 16/17/19 eseguiti (policy unica
`Civic access` ALL/public/true; tabella vuota; `user_id` uuid), migration
`20261008130000_civic_reports_rls_m4.sql` approvata e applicata,
post-check 18 verde (`n_policy=3, n_all=0, n_pubbliche=0, n_anon=0`).
CB-18 chiusa. Correzione registrata: UPDATE usa
`status IN ('pending','pending_match')` (il client scrive `'pending'`).
**Dipende da:** M1 (no), M3 (censimento 17 = backup, eseguito),
decisione D4 **DECISA 08/10 = R3** (P-D8)

### Precondizioni
- M2 chiuso (conosco i trigger)
- **D4** decisa: **R3, 08/10** — SELECT `USING (auth.uid() = user_id OR
  status = 'confirmed')`
- M3 chiuso (backup → censimento 17)
- **Note misurate 08/10 (precheck 16):** 1 sola policy (cmd = **ALL**,
  nessuna SELECT/INSERT/UPDATE/DELETE dedicata); grants auth/anon tutti true;
  tabella **vuota** (`righe_totali=0`); colonna reale `grid_cell` (l'archivio
  dice `grid_cell_50m`, vedi CB-17); **nessun CHECK** su status → il valore
  `'pending'` del client e' valido; `tenant_id` esiste (0 nulli).
  `user_id` = uuid (precheck 19) → cast diretto in policy.
- **Scelte registrate nella migration:** policy `TO authenticated` (l'app
  non querya mai senza sessione: `_layout.tsx:66` `signInAnonymously`);
  UPDATE con `status IN ('pending','pending_match')` (il client scrive
  `'pending'`, non `'pending_match'` come da testo originale del piano —
  correzione 7.1); nessuna variazione di grant (RLS fa da filtro).

### Rami
- **R1 — lettura pubblica nel tenant.** `tenant_id` valorizzato, contesto tenant
  impostato dal server. Serve una RPC `SECURITY DEFINER` o unJWT con claim tenant,
  perche' PostgREST **non** puo' impostare `app.current_tenant` da richiesta cliente.
- **R2 — lettura solo dei confermati, senza tenant.** Caso piu' semplice: si legge
  solo `status='confirmed'`. Scelgo questo se D4 non richiede il tenant, perche'
  non richiede infrastruttura.
- **R3 — anche i pending visibili all'autore.** Serve `USING (auth.uid()=user_id
  OR status='confirmed')`. Pericoloso se la self-conferma non e' chiusa, quindi
  **solo dopo** il ramo UPDATE sotto.

### Passi
1. `DROP POLICY IF EXISTS "Civic access"`.
2. Policy SELECT secondo D4.
3. Policy INSERT con `WITH CHECK (auth.uid() = user_id)`.
4. Policy UPDATE con `USING (auth.uid()=user_id AND status='pending_match')`.
5. Nessuna policy DELETE: la segnalazione non si cancella dal lato utente.

### Gate di coerenza
- **`DROP` obbligatorio, non `CREATE`.** Le policy RLS sono permissive e si
  combinano in OR: aggiungere lascia viva `using=true`. E' l'errore classico e
  produce l illusione di aver chiuso mentre e' tutto aperto.
- Se `tenant_id` e' `NULL` su righe esistenti, la policy SELECT le rende **invisibili
  a tutti**. Verificare con `SELECT count(*) FILTER (WHERE tenant_id IS NULL)`.
  0 righe oggi, ma il pattern va tenuto.
- Non bloccare `scan_poi_gps`: e' una tabella diversa.

### Accettazione
- da `anon`: `SELECT` -> 0 righe, `INSERT` -> errore, `UPDATE` -> errore
- da utente autenticato: `INSERT` propria ok; `UPDATE` su riga gia' confermata -> errore
- le righe gia' confermate restano leggibili: nessuna perdita di dato

### Rollback
```sql
DROP POLICY IF EXISTS "Civic read confermati" ON public.civic_reports;
DROP POLICY IF EXISTS "Civic insert propri" ON public.civic_reports;
DROP POLICY IF EXISTS "Civic update propri e non confermati" ON public.civic_reports;
-- e ripristinare la precedente dal backup di M3
```

---

## M5 — `process_crowd_radar`: identita' dal server

**Severita':** BLOCCANTE
**Stato:** **COMPLETO 08/10.** Precheck 20 eseguito (prosecdef=true,
**proconfig=null → R2 aperto**, **proacl=null → R1 aperto**: EXECUTE di
default a PUBLIC; corpo catturato = backup M3 in
`diagnostica_fase1/risultato 20_process.txt`); gate client verde
(`app/p/[id].tsx:88`, sessione obbligatoria alla riga 85). Migration
`20261008140000_process_crowd_radar_m5.sql` **applicata**. Post-check `21`
**tutto verde**: `prosecdef=true, search_path_pinnato=true, exec_anon=false,
exec_public=false, exec_authenticated=true, corpo_usa_auth_uid=true,
corpo_usa_p_reporter_id=false, corpo_guardia_anonima=true`. Verifica
indipendente REST (anon): **401 + `42501 permission denied for function`**.
**Correzione registrata (08/10):** con `proacl=null` il "REVOKE da anon" del
piano e' un no-op (il grant e' a PUBLIC) → la migration fa
`GRANT authenticated` + `REVOKE PUBLIC`. Il passo 4 (ALTER SET search_path)
e' fatto con `SET search_path` inline nella CREATE OR REPLACE (stesso
proconfig). Il cap incoerente resta (gate: "lo lascio e lo registro" →
**CB-20**). **D5 resta aperta.**
**Dipende da:** M1 (i grant, chiuso), M3 (backup = output precheck 20)

### Precondizioni
- **M1 chiuso**, perche' la severita' dipende da `prosecdef` e `proacl`
- M3 chiuso

### Rami
- **R1 — `anon` ha EXECUTE.** il vettore e' aperto a chiunque. Oltre a ignorare il
  parametro, serve revocare il grant a `anon`.
- **R2 — `SECURITY DEFINER` senza `search_path`.** va aggiunto `SET search_path =
  public, pg_temp` indipendentemente da R1.
- **R3 — il modello stesso e' insostenibile.** Spostare il calcolo al server non
  rende l'identita' fidabile: `v_certified = (new + avg)/2` resta una media su una
  persona che dichiara `p_raw_count`. Serve geofence verificata lato server.
  **Questo non lo risolvo io: e' D5.** Documento il limite e non prometto che
  l'identita' sia risolta.

### Passi
1. Sostituire l'uso di `p_reporter_id` con `v_reporter_id := auth.uid()`.
2. `IF auth.uid() IS NULL THEN RAISE EXCEPTION 'chiamata anonima non consentita'`.
3. `REVOKE EXECUTE ON FUNCTION process_crowd_radar(...) FROM anon` (R1).
4. `ALTER FUNCTION ... SET search_path = public, pg_temp` (R2).

### Gate di coerenza
- Il chiamante in `app/p/[id].tsx:88` passa `session.user.id`, quindi continua a
  funzionare: **verificare che il valore coincida** con `auth.uid()`.
- Il deep link chiama questa funzione **prima** di `user_pois`. Se `auth.uid()`
  fallisce, il catch di `app/p/[id].tsx:99` assorbe l'errore e il flusso continua.
  **M6 non chiude questo buco da solo**, va detto.
- Il cap `IF p_raw_count > 1000` tronca in modo incoerente: 1500 -> 100, 999 passa.
  Non e' un bug di sicurezza, e' un bug di dato. Lo lascio e lo registro.

### Accettazione
- chiamata anonima -> eccezione
- chiamata con `p_reporter_id` diverso da `auth.uid()` -> il valore nel DB e' `auth.uid()`
- il heatmap della mappa continua a popolarsi

### Rollback
`ALTER FUNCTION ... RESET search_path; GRANT EXECUTE ...;` e ripristino del corpo

---

## M6 — Deep link: niente piu' scrittura grezza dal client

**Severita':** BLOCCANTE
**Stato:** COMPLETO codice+server (09/10) — `27` eseguito: `scan_poi_gps` gated confermato; acceptance runtime consigliato
**Dipende da:** M3

### Precondizioni
- **M9 deciso** (chi possiede `heat`), perche' l'upsert alimenta qualcosa
- M3 chiuso

### Rami
- **R1 — il heatmap dipende da `user_pois`.** Allora l'upsert va mantenuto ma
  spostato su una tabella senza ricompense (`poi_heatmap_pins`), e `user_pois`
  smette di ricevere righe dal client.
- **R2 — il heatmap puo' dipendere dalla catena verificata.** Allora l'upsert si
  elimina e il deep link passa da `scan_poi_gps`. Piu' semplice, **preferito**.
- **R3 — la heatmap puo' essere deperita.** Valutare prima di aggiungere tabelle.

### Passi
1. Instradare `app/p/[id].tsx` su `scan_poi_gps`, come gli altri due ingressi.
2. Rimuovere `upsert` su `user_pois` (R2) o spostarlo (R1).
3. **Rimuovere `loto_fallback_xp`** da `AsyncStorage` e il `Math.max` in
   `GamificationContext.tsx:74`. Senza questo, la XP resta gonfiabile dal client
   anche dopo aver chiuso il bypass.

### Gate di coerenza
- `upsert` con `onConflict: profile_id, poi_id` **sovrascrive** una riga legittima,
  togliendole `lat`, `lng`, `is_shadowbanned`, `calculated_speed_kmh`. Rimuovendolo
  smetto anche di corrodere i dati: bonus, non solo difetto.
- Il deep link su POI lontano **deve fallire** con l'eccezione di proximity.
  Se resta silenzioso, il fix non c'e'.
- `GamificationContext` con `Math.max` sul fallback: se tolgo il fallback ma lascio
  il `Math.max`, resta un percorso morto. Vanno tolti insieme.

### Rollback
revert del commit; nessuna migrazione di schema in R2

### Eseguito (09/10)
- **Ramo: R2** — confermato da M11 (`pois.heat` non esiste, nessun consumatore;
  la heatmap DaaS viene da `user_pois`).
- **Client — `app/p/[id].tsx`:** il deep link ora instrada su `scan_poi_gps`
  (GPS + proximity/cooldown/anti-speed lato server), come gli altri due ingressi.
  BLE radar in fire-and-forget (`startCrowdRadarScan` riporta già `raw_count`
  internamente). Rimossi: la `rpc('process_crowd_radar')` esplicita,
  l'`upsert` su `user_pois` e la scrittura `loto_fallback_xp`.
- **Client — `loto_fallback_*` eliminato del tutto:** `GamificationContext.tsx`
  (`Math.max` sostituito con lettura diretta del profilo + opzioni `fallback*`
  rimosse), `app/(tabs)/index.tsx` (2 punti: `multiGet` + opzioni),
  `app/(tabs)/profile.tsx` (2 `removeItem`). Grep: 0 occorrenze residue nel codice.
- **`tsc --noEmit`:** 0 errori.
- **Precheck `27` scritto ed ESEGUITO 09/10** (`supabase/diagnostica_fase1/27_m6_scan_functions_precheck.sql`;
  output in `risultato 27_m6_scan.txt`):
  - **`scan_poi_gps` = canonico gated** — `ha_gate_prossimita=true`,
    `search_path=public, pg_temp`, `profile_id`+`auth.uid()`, ledger `impact_tx`.
    Il dossier 04a ("drift escluso") è **confermato**: l'instradamento del deep
    link su `scan_poi_gps` **è** la protezione reale.
  - **`scan_poi` = via ungated confermata** — 881 char, `prosecdef=true` ma
    `search_path=null`, EXECUTE anche ad `anon`, gate/cooldown/anti-speed tutti
    `false`, nessun `impact_tx`. Unico chiamante vivo: `PoiDetailSheet.tsx:576`.
  - Osservazione: `scan_poi_gps` ha `proacl=null` (EXECUTE di default a PUBLIC;
    anon ottiene 'Utente non autenticato', nessuna scrittura) — stessa classe di
    CB-19, da stringere nella convergenza G-06.
- **M6 codice+server COMPLETO 09/10.** Resta un **test di acceptance runtime**
  consigliato (deep link su POI a 500 m → eccezione di proximity, nessuna riga).
- **G-06 (riscontro 09/10, opzione 1):** M6 resta circoscritto al deep link;
  G-06 resta **aperto** come difetto di allineamento/sicurezza e si chiude con la
  **convergenza NFC** (unico chiamante `PoiDetailSheet.tsx:576` → `scan_poi_gps`)
  + hardening `scan_poi`/`scan_poi_gps` — a valle del `27`, non con M6 da solo.

### Accettazione (aggiornata)
- deep link su POI a 500 m: errore di proximity, nessuna riga in `user_pois`
- `loto_fallback_xp` assente da `AsyncStorage` dopo il reload
- XP mostrata == `profiles.total_xp`
- **dipendenza:** che `scan_poi_gps` in cloud abbia davvero il gate — lo dice il `27`

---

## G-06 — Riparazione check-in Partner + drop di `scan_poi` (funzione morta)

**Severita':** ALTA (via di check-in ungated + funzione rotta)
**Stato:** FATTO (09/10) — client riparato + `scan_poi` rimossa (precheck 30, post-check 31 e REST anon verdi)
**Dipende da:** precheck `27` (fatto), precheck `28` (fatto)

### Perimetro (deciso con l'utente 09/10 — "riparazione + drop del morto")
`scan_poi` era il percorso del pulsante NFC/QR dei POI `category='partner'`
(`PoiDetailSheet.tsx:514-524` → `:576`). Il precheck `28` ha però dimostrato che è
una **funzione morta** (vedi "Misurato"): non c'è comportamento funzionante da
preservare. Quindi il pulsante NFC/QR **resta il TRIGGER**, la convalida va su
`scan_poi_gps` (coordinate + cooldown + anti-speed), e `scan_poi` viene **rimosso**
(chiude anche l'esposizione anon, meglio di un REVOKE).

### Misurato (precheck `28`, 09/10)
`scan_poi` è **deployed ma rotto**: l'INSERT usa `user_pois.discovered_at`,
colonna **inesistente** (probe REST `400/42703`; la reale è `visited_at`).
Quindi:
- il pulsante NFC/QR Partner **non ha mai potuto riuscire** (errore catturato a
  `PoiDetailSheet.tsx:592`) → non c'è un comportamento funzionante da preservare;
- l'`UPDATE total_xp` gira a **ogni** chiamata (l'`ON CONFLICT DO NOTHING` non
  lo ferma): farming latente se la colonna venisse riparata senza gate;
- nessun dipendente DB (atteso `oggetti_che_la_usano = 0` nel precheck `30`).

### Passi
1. **Client (fatto 09/10):** `PoiDetailSheet.tsx:576` instradato su
   `scan_poi_gps` con il GPS del dispositivo; BLE radar fire-and-forget allineato
   agli altri ingressi (NFC/QR = trigger, convalida sempre server-side).
2. **Server:** `DROP FUNCTION IF EXISTS public.scan_poi(uuid);` (senza CASCADE).
3. Nessuna modifica a `scan_poi_gps` (resta canonico, gated).

### Artefatti
- Precheck/backup M3: `supabase/diagnostica_fase1/28_scan_poi_hardening_precheck.sql`
  (misurato; output in `risultato 28_scan_poi.txt`)
- Migration di drop: `supabase/migrations/20261009130000_drop_scan_poi_g06.sql`
- Precheck dipendenze: `supabase/diagnostica_fase1/30_drop_scan_poi_precheck.sql`
- Post-check: `supabase/diagnostica_fase1/31_drop_scan_poi_post_apply.sql`
- Client: `components/PoiDetailSheet.tsx` (riga ~576)

### Accettazione
- `scan_poi_residue = 0`, `scan_poi_gps_presente = 1` — FATTO (post-check 31)
- verifica REST anon: `rpc('scan_poi')` → `404`/`PGRST202` — FATTO
- `tsc --noEmit` = 0 errori (fatto)

### Rollback
Ricreare la funzione dal backup `risultato 28_scan_poi.txt` (corpo `CREATE OR
REPLACE FUNCTION`). Nota: è una funzione rotta, ripristino solo dello stato di
fatto.

### Resta aperto (fuori perimetro)
- **Partner indoor:** la convalida ora richiede GPS; un partner indoor con GPS
  debole non potrà convalidare. Decisione di prodotto aperta (NFC firmato /
  `validate_ntag424`).
- Osservazione `scan_poi_gps` `proacl=null` (EXECUTE PUBLIC; anon ottiene
  'Utente non autenticato', nessuna scrittura) da stringere in un passo successivo.
- File sorgente che potrebbero **ricreare** `scan_poi`/`scan_poi_gps` se
  ri-eseguiti (`20260926120000_scan_chain_canonical.sql:329`; root
  `anti_spoofing_scan_poi_gps.sql`): da neutralizzare come già fatto per
  `migration_v22/v23`.

---

# FASE 2 — I PREMI

## M7 — Cold-start, `9999`, e la perdita di storico

**Severita':** BLOCCANTE
**Stato:** FATTO (server) 09/10 — migration applicata, post-check 33 verde; acceptance runtime in-app pendente (decisioni P-D1…P-D3 prese 06/10)
**Dipende da:** M3 (backup), **P-D1 / P-D2 / P-D3 — DECISE (vedi sotto)**
**Moduli uniti:** M7 assorbe i tre difetti T1, T2, T6. **Non si applica in pezzi.**
**Registro:** `VISIONE-ESECUZIONE-CORE-BUSINESS.md` §B (G-01, G-02), §C (P-D1…P-D6)

### Difetti misurati

1. **`20260929160000:127`** — `v_speed_kmh DOUBLE PRECISION := 0`. Non `NULL`.
2. **`:212`** — `IF v_last_global.visited_at IS NOT NULL`. Primo check-in: ramo
   saltato, velocita' `0`, **ricompensa piena** via `:241`.
3. **`:215`** — senza `ELSE`. Tempo `<= 0`: velocita' resta `0`.
4. **`:225`** — `IF v_speed_kmh IS NULL` su una variabile che vale `0`. **Codice
   morto.** La 27/09 lo aveva corretto con un `ELSE` funzionante; il refactor del
   29/09 lo ha rotto.
5. **`:206`** — lo storico filtra `is_shadowbanned IS NOT TRUE`. **Una riga bandita
   sparisce dal calcolo velocita' dello stesso utente**, quindi il check-in successivo
   e' un cold-start e prende ricompensa piena. Da quel momento nessun controllo,
   per sempre.

Il punto 5 e' il piu' grave: **il shadowban premia**. E non genera segnalazioni
perche' il sintomo e' l'app che promette e mantiene.

### Precondizioni
- **M3 chiuso. Bloccante.**
- ~~**D1 decisa**~~ → **P-D1 DECISA (06/10)**: vedi Rami sotto.
- ~~**D2 decisa**~~ → **P-D2 / P-D5 DECISE (06/10)**: vedi Rami sotto.
- **P-D3 DECISA (06/10)**: da 2° check-in, ramo veicolo = **2 XP fissi**
  (`:237-240`), ramo pedone = `COALESCE(pois.xp_reward, 15)` dinamico.
  Nessuna predizione di livello ("20+15=35" era solo illustrativo).

### Rami — P-D1 (DECISA 06/10): primo check-in a freddo

**Scelta: 20 XP letterali, nessun altro premio.**
Il primo check-in (cold start, nessuno storico) assegna:

- `xp = 20` (letterale, non 0)
- `co2_saved = 0`, `tokens_earned = 0`, `calculated_speed_kmh = NULL`
- `is_shadowbanned = FALSE` — il check-in **si registra** (niente lockout)
- `action_type = 'tourist_checkin'` **INVARIANTE** — cambiarlo rompe il
  `FILTER` di `xp_ledger` in `vw_user_dashboard_metrics`
  (`20260925120000_admin_dashboard_hardening.sql:294-296`) → criterio M6.

**Rischio noto accettato:** `signInAnonymously` + replay = farming dei 20 XP
iniziali. Da registrare in `DECISIONI.md` come rischio accettato (non bloccante).

### Rami — P-D2 / P-D5 (DECISE 06/10): come si rappresenta "non valutabile"

**Scelta: `calculated_speed_kmh = NULL`, sentinella `9999` eliminata.**

- `20260929160000:225-227` — codice morto (`IF v_speed_kmh IS NULL` su
  variabile sempre `0`): **rimosso**.
- Struttura: `IF v_speed_measurable THEN <3 tier> ELSE <premio P-D1> END IF`.
- I 3 tier (P-D6) sono **invarianti**: `>130` / `20–130` / ELSE.
- Schema **già pronto**: entrambe le colonne sono nullable (misurato §7.7,
  `STATO-FASE-0.md`) → **nessuna migrazione di schema**.
- R2 terzo stato (R3 = tri-stato su `is_shadowbanned`) **scartato**: ridondante
  con P-D2.

### Artefatti (APPLICATI 09/10)
- Migration: `supabase/migrations/20261009140000_m7_cold_start_no_9999.sql`
  — **applicata**.
- Precheck: `supabase/diagnostica_fase1/32_m7_cold_start_precheck.sql`
  (ESEGUITO 09/10: `init_velocita_zero=true`, `ha_sentinella_9999=true`,
   `ha_speed_measurable=false`, `storico_filtra_shadowban=true`,
   `n_filtri_shadow=2`, `lunghezza=7289` — corpo = canonico 29/09).
- Post-check: `supabase/diagnostica_fase1/33_m7_cold_start_post_apply.sql`
  (ESEGUITO 09/10: `init_velocita_zero=false`, `ha_sentinella_9999=false`,
   `ha_speed_measurable=true`, `storico_filtra_shadowban=false`,
   `n_filtri_shadow=1`, `lunghezza=7322`, firma invariata).
- Evidenze: `risultato 32_m7_cold_start.txt`, `risultato 33_m7_cold_start.txt`.
- Rollback: corpo del 29/09 (`20260929160000_restore_proximity_gate.sql`).
- **Resta aperto (accettazione comportamentale):** nuovo utente → 20 XP /
  `speed=NULL` / riga presente; 2° check-in → velocità valutata; tripper >130 →
  shadowban con storico che continua.

### Passi
1. `CREATE OR REPLACE FUNCTION public.scan_poi_gps(...)` come attuale.
2. Aggiungere `v_speed_measurable BOOLEAN := FALSE;`.
3. `:206` — togliere `AND up.is_shadowbanned IS NOT TRUE` dallo storico
   (punto 5 dei difetti: lo shadowban non deve premiare).
4. `:215` — dentro `IF v_time_diff_hours > 0` assegnare anche `v_speed_measurable
   := TRUE`.
5. Sostituire il blocco `:225` (codice morto, sentinella `9999`) con
   `IF v_speed_measurable THEN <3 tier> ELSE <P-D1: 20 XP> END IF`.
6. Ramo ELSE = P-D1 (`xp=20`, `co2=0`, `tokens=0`, `speed=NULL`,
   `shadowbanned=FALSE`); ramo veicolo/IF = P-D3 (`2 XP` fissi vs pedone
   `COALESCE(xp_reward,15)`); `action_type` resta `tourist_checkin` (P-D4).
7. Verifica post: niente `9999` piu' presente in funzione, migrazione
   idempotente, `xp_ledger` invariato.

### Gate di coerenza
Questo modulo e' quello con piu' superficie di rottura. Le verifiche obbligatorie:

- **Il lockout di R2 non deve poter accadere.** Test: utente nuovo, primo check-in
  in citta' A, secondo check-in in citta' B a 300 km. Il secondo **deve** essere
  valutato sulla velocita', non treated come cold-start.
- **Il bandito non deve diventare premio.** Test: utente che trippa 130 km/h, poi due
  check-in. Il terzo non deve registrare `calculated_speed_kmh = 0`.
- **Nessun totale gia' accumulato si sposta.** Nessun backfill: la funzione cambia
  solo per i check-in futuri. Verificare che nessuna migration tocchi righe esistenti.
- **Il commento di riga 223 va corretto o cancellato.** Se resta, dice una cosa
  falsa e il prossimo lo copiera'. Questo e' il quinto caso di commento bugiardo, e
  non aggiungo un sesto.
- **`v_speed_measurable` e `v_speed_kmh` devono essere coerenti in ogni ramo.** Una
  combinazione sbagliata tra i due e' un premio che nessuno riesce a spiegare.

### Accettazione
- utente nuovo: 1o check-in con 0 premi, `is_shadowbanned = FALSE`, riga presente
- utente 2o check-in: velocita' calcolata e valutata
- utente che trippa 130: `TRUE`, 0 premi, **e** storico che continua a esistere
- `SELECT count(*) FROM user_pois WHERE profile_id = X` cresce a ogni check-in

### Rollback
```sql
-- ripristinare il corpo precedente dal backup di M3, o:
DROP FUNCTION IF EXISTS public.scan_poi_gps(...);
CREATE OR REPLACE FUNCTION public.scan_poi_gps(...) -- corpo del 29/09
```

---

# FASE 3 — CIVICA

## M8 — Trigger circolare e ricompensa differita

**Severita':** ANNULLATO (06/10)
**Stato:** ANNULLATO / differito a Fase 3. Misura M2: **0 trigger utente** —
quindi il ramo R1 ("M2 ha trovato un trigger di promozione a `confirmed`") e'
falso. Resta **CB-04** (`VISIONE-ESECUZIONE-CORE-BUSINESS.md`): nessun codice
scrive mai `status='confirmed'`, quindi il ciclo premio differito non ha
aggancio. Riaprire solo in Fase 3, con `P-D4=R3`.
**Nessuna dipendenza attiva da M4/M2.**

### Precondizioni
- **M4 chiuso.** Non si assegna un reward con la tabella aperta a `UPDATE`: chiunque
  puo' reclamarsene uno.
- **M2 chiuso**, per il ramo R1 sotto.

### Rami
- **R1 — M2 ha trovato un trigger di promozione a `confirmed`.** Il mio sospetto di
  circolarita' e' sbagliato e questo modulo si ridimensiona.
- **R2 — nessun trigger di promozione.** Il filtro `'confirmed'` non puo' diventare
  `'pending_match'` alla cieca: serve sapere se una riga in attesa puo' essere
  promossa piu' volte, altrimenti la terza segnalazione duplica il reward.

### Passi
1. Correggere il filtro del trigger secondo R1/R2.
2. Verificare `matched_report_id` valorizzato.
3. Implementare la ricompensa differita: `impact_transactions` con
   `action_type = 'civic_double_confirm'`, PTI e XP a entrambi, **dentro una
   funzione server**.
4. `FOR UPDATE` sulla riga confermata, per non assegnare due volte in concorrenza.

### Gate di coerenza
- **Un reward per doppia conferma, non per segnalazione.** Il rischio qui e' pagare
  due volte la stessa coppia. Serve una tabella di sati, non un `IF NOT EXISTS` che
  due transazioni simultanee possono entrambe superare.
- Idempotenza: rieseguire il trigger non deve accreditare due volte.
- Il `liters_saved` resta `0` come gli altri check-in: coerenza con la scelta fatta.

### Accettazione
- due segnalazioni analoghe entro 50 m, da due utenti: entrambe `confirmed`, entrambi
  premiati una volta
- terza segnalazione analoga: **nessun** premio aggiuntivo
- `SELECT count(*) FROM impact_transactions WHERE action_type='civic_double_confirm'`
  = 2, non 3

### Rollback
`DROP TRIGGER civic_confirmed ON civic_reports;` e nessuna tabella di sati da creare
in questo modulo

---

## M9 — `grid_cell_50m` non esiste

**Severita':** ALTA
**Stato:** FATTO (client) 09/10 — nessuna migration; `tsc --noEmit` 0 errori. Dipendeva da M2 (chiuso).
**Dipende da:** M2 (R2, gestione errori)

### Esito (09/10)
- **Correzione di premessa (misurata):** `CivicDashboard.tsx` è **codice morto**
  (0 import in tutto il repo; `docs_v2/aree/A8_lessico_e_marchio.md:132`). La
  premessa "due insert per lo stesso dominio" è falsa: l'unica path **viva** è
  `CivicReportSheet` (montata da `community.tsx`). Scelta utente: **fixare comunque
  CivicDashboard e lasciarlo non montato**.
- **Colonne reali (precheck 34, 09/10):** `grid_cell` text nullable; `tenant_id`
  text **nullable senza default**; `status` default **`'pending_match'`**;
  `user_id` **uuid**; nessun `CHECK` su `status`. Nessuna `grid_cell_50m`.
- **Trigger:** 0 trigger in `public`, `civic_confirmed` inesistente (M2/§7j):
  il gate sul trigger è moot, nessun ramo R1/R2 da scegliere.
- **Fix applicati:**
  - `CivicReportSheet.tsx`: `user_id` da `supabase.auth.getUser()` (prop `userId`
    rimossa); rimosso `status:'pending'` (default DB `pending_match`); errore ora
    **mostrato** con `Alert` (R2: non più ingoiato).
  - `community.tsx`: rimossa la prop `userId={''}`.
  - `CivicDashboard.tsx`: `grid_cell_50m` → `grid_cell`; aggiunto `tenant_id`
    (`useTenant`), `status` non forzato (unificato).
- **Acceptance reinterpretata:** "una segnalazione da `CivicDashboard` finisce in
  tabella" non è testabile (componente non montato); l'accettazione runtime si fa
  sulla path viva `CivicReportSheet`. `status` identico (default DB).
- Evidenze: `risultato 34_m9_civic_reports.txt` (+ `34b` trigger).

### Precondizioni
- M2 chiuso

### Rami
- **R1 — l'errore e' gestito e mostrato.** Allimenti e' solo un bug di dato: la
  colonna va rinominata o il client va corretto.
- **R2 — l'errore e' ingoiato.** Il fix e' obbligatorio e deve mostrare un feedback.
  Uno schermo che dice "segnalato" senza aver salvato niente e' peggio del bug.

### Passi
1. Correggere `CivicDashboard` sull'unico nome reale, `grid_cell`.
2. Allineare i due client: `CivicReportSheet` usa `grid_cell` e `tenant_id` e
   funziona; `CivicDashboard` usa `grid_cell_50m` e fallisce. **Due insert diversi
   per lo stesso dominio** vanno unificati.
3. Verificare `status`: `CivicReportSheet` forza `pending`, la colonna ha default
   `pending_match`. **Due stati diversi per lo stesso flusso.**

### Gate di coerenza
- Il trigger cerca `grid_cell = NEW.grid_cell`, quindi la colonna deve esistere e
  essere popolata, altrimenti il match civico non si attiva mai: M8 resta inutile.
- Normalizzare `status` su `pending_match`, o il trigger cerca uno stato che nessuno
  usa.

### Accettazione
- una segnalazione da `CivicDashboard` finisce davvero in tabella
- `status` identico indipendentemente da quale dei due schermi si usa

### Rollback
nessuna migrazione: e' una correzione di client

---

# FASE 4 — BADGE

## M10 — La catena dei badge

**Severita':** MEDIA
**Stato:** FATTO (09/10) — migration `20261009160000_badges_m10.sql` **APPLICATA con successo**; precheck 35/35b e post-check 36 TUTTI VERDI. Refactor client fatto (`tsc` 0 errori). Decisioni: **R1** (unificare su `badges`); badge civici 1/5/10 **fuori da M10**.
**Dipende da:** M4 (stesso pattern di policy)

### Misurato
- `badges`: 3 righe, `req_xp` 500/1000/1500, **0 policy**
- `badge_templates`: **0 righe**
- `user_badges`: 0 righe, **0 policy**, `badge_id` con FK verso **`badge_templates`**
- i 3 id reali stanno in **`badges`**
- `badgeAssignment.ts` calcola il badge da un profilo passato dal client e scrive
  dal browser, **ingoiando l'errore**
- `.select('*, badges(*)')` non puo' funzionare: **non esiste la FK**

### Esito (09/10)
- **Precheck 35 misurato (09/10):**
  - `badges`: id (text PK), name, description, icon, `req_xp` (default 0),
    `req_poi_category`, `created_at`; **3 righe**; 0 policy.
  - `badge_templates`: **0 righe** (tabella morta); 0 policy; grant tutti true.
  - `user_badges`: id (uuid PK), user_id (uuid), badge_id (text), `awarded_at`;
    **0 righe**; **FK `user_badges_badge_id_fkey` → `badge_templates(id)`
    ON DELETE CASCADE**; `UNIQUE (user_id, badge_id)`; 0 policy; grant tutti true.
- **Decisioni (09/10):** **R1** — FK riportata su `badges`; `badge_templates`
  abbandonata e bloccata. Badge civici 1/5/10 di CivicDashboard **fuori** da M10
  (restano costanti client; eventuale persistenza = modulo separato).
- **Migration `20261009160000_badges_m10.sql` (da applyare):** FK →
  `badges.id` (DROP CONSTRAINT esplicito, nome reale); RLS idempotente;
  `badge_templates` bloccata (RLS on, `REVOKE` grant anon/authenticated); policy
  `badges_read_catalog` (SELECT su `badges`) e `user_badges_select_own` /
  `user_badges_insert_own` (`TO authenticated`); funzione **`claim_badges()`**
  server-side (`SECURITY DEFINER`, `search_path` pinnato; legge
  `profiles.total_xp`; upsert idempotente su `(user_id,badge_id)`; EXECUTE solo
  `authenticated`).
- **Refactor client (fatto, `tsc` 0 errori):** `utils/badgeAssignment.ts`
  **eliminato**; `index.tsx` + `profile.tsx` → `rpc('claim_badges')` + embedding
  `badges(*)` (ora funzionante); `communityFeed.ts:32/61` → `badges(name)`.
- **Evidenze:** 35 (`Supabase Snippet Precheck badge...csv`); 35b (RLS pre);
  36 (post-apply).

### Rami
- **R1 — unificare su `badges`.** La FK va riportata su `badges` e
  `badge_templates` si abbandona. 3 righe di catalogo reale, nessuna migrazione di
  contenuto.
- **R2 — migrare le 3 righe in `badge_templates`.** Non ha senso con 0 righe e una
  FK gia' scritta sull'altra tabella. Solo se un altro client usa `badge_templates`.

### Passi
1. Correggere la FK `user_badges.badge_id` -> `badges.id` (R1).
2. `SELECT` pubblica su `badges`. `SELECT` e `INSERT` su `user_badges` solo con
   `auth.uid() = user_id`.
3. **Assegnazione server-side**, dentro una funzione che legge
   `profiles.total_xp` dal DB. Il client non decide: comunica il fatto.
4. **Cancellare `badgeAssignment.ts`.** Finche' resta, scrive dal browser e fa
   sembrare assegnato un badge che il DB ha respinto.

### Gate di coerenza
- **L'ordine conta.** Prima la FK, poi le policy, poi l'assegnazione. Al contrario
  ogni tentativo fallisce in silenzio, che e' esattamente lo stato di oggi.
- **Le policy non si aggiungono, si sostituiscono.** Stessa regola di M4.
- I badge civici di `CivicDashboard` (1/5/10) si calcolano solo al momento
  dell'azione e **non sopravvivono al reload**. Se il requirement e' la persistenza,
  rientrano in questo modulo come righe di `badges`, non come costanti nel client.
- I rank ogni 10 livelli derivano da `total_xp` e **sopravvivono gia'**. Non
  toccarli: funzionano.

### Accettazione
- `SELECT * FROM badges` con RLS attivo restituisce 3 righe
- badge raggiunto -> `user_badges` popolata, e `SELECT` la rilegge
- reload: il badge c'e' ancora
- nessun modulo client scrive in `user_badges`

### Rollback
```sql
DROP POLICY IF EXISTS ... ; -- ripristinare la FK solo se si sa cosa c'era prima
```
La FK va cambiata con `DROP CONSTRAINT` esplicito, verificando prima il nome.

---

# FASE 5 — VERIFICA E DEBITO

## M11 — `heat`: due pesi, una sola colonna

**Severita':** MEDIA (di fatto **BLOCCANTE**: la RPC falliva a runtime)
**Stato:** **COMPLETO 08/10.** R2 applicato
(`20261008160000_process_crowd_radar_no_heat_m11.sql`); post-check `25`
**verde** (`corpo_update=false`, `corpo_tocca_pois=false`,
`corpo_usa_auth_uid=true`, `exec_anon=false`, `exec_authenticated=true`).
`26` **verde**: `crowd_predictions` ha tutte e 5 le colonne dell'INSERT
(`poi_id, reporter_id, raw_count, certified_count, confidence_score`) → la RPC
ora esegue. CB-22 chiusa.

### Misurato (08/10 — corregge la premessa iniziale)
**`pois.heat` NON esiste.** Probe REST (anon): `GET /rest/v1/pois?select=heat`
→ **400**, mentre `select=id/name/crowd_level` → 200; enumerazione `select=*`
elenca le colonne reali (nessun `heat`). Nessuna migration crea la colonna.
Quindi l'UPDATE in `process_crowd_radar` (pre-M5 e M5) **falliva alla prima
chiamata** (`column "heat" does not exist`); il chiamante `app/p/[id].tsx:88`
ha un `try/catch` (riga 99) → **errore silenzioso**: `crowd_predictions` mai
popolata, nessuna heat. Non è "due pesi su una colonna": è una **colonna
fantasma** (→ CB-22). La DaaS heatmap (`vw_daas_heatmap_15min`) viene da
`user_pois`, NON da `pois.heat`.

### Rami
- **R1 — `pois.heat` diventa la fonte.** Richiederebbe di CREARE la colonna;
  il client non la legge (HeatScore locale in `app/(tabs)/map.tsx`). Scartato.
- **R2 — si dichiara legacy / si rimuove la scrittura.** **SCELTO.** La
  colonna non ha consumatori; rimuovere l'UPDATE rende la RPC eseguibile.
- **R3 — doppio consumatore.** Nessun consumatore → non applicabile.

### Passi
1. ~~Decidere R1/R2/R3~~ → **R2** (08/10).
2. Applicare `20261008160000_process_crowd_radar_no_heat_m11.sql`; poi `25`.
3. Verificare le colonne di `crowd_predictions` con `26` (altrimenti la RPC
   fallirebbe ancora per colonna mancante).

### Gate di coerenza
**M11 precede M6.** Con la colonna assente e senza consumatori, "chi possiede
`heat`" è risolto: **nessuno**. M6 può procedere su R2 (deep link via
`scan_poi_gps`, niente upsert `user_pois`).

### Accettazione
la RPC esegue senza errori; `corpo_update=false` e `corpo_tocca_pois=false` (25)

---

## M12 — HeatScore su dispositivo

**Severita':** MEDIA
**Stato:** IN CORSO (09/10) — **R1 FIXATO** in `app/(tabs)/map.tsx`
(`fetchPois`): una sola query da `dayStart` senza limite superiore, split
`fondo` (< boostCutoff, conteggio righe) / `boost` (>= cutoff, +2 con il
`visited_at` reale nel `heatBoostsRef`) → i check-in recenti pre-caricamento
entrano nel conto e decadono come quelli real-time. **Dwell 10 min rimosso**
da `components/PoiDetailSheet.tsx` (era residuo/codice morto: `checkinStartTime`,
`timerLeft`, `handleStartVisitaGPS`, chiavi `@checkin_start_*`, import
`AsyncStorage` mai applicati alla convalida). `tsc --noEmit` 0 errori.
Gate 1 (decadimento usa l'ora corrente) **verificato a livello di codice**
(`map.tsx` tick usa `Date.now()`). **Nota:** il cooldown 12h di
`scan_poi_gps` è distinto (anti-farming, non toccato): il caso "2 check-in"
va osservato su **2 POI diversi**. Restano i 4 casi in-app + gate visivo
(R2 badge/label) da osservare a mano.

### Precondizioni
- `tsc` gia' pulito. **Non basta**: il cloud non vede i colori.

### Rami
- **R1 — i check-in recenti precedenti il caricamento non sono nel fondo.**
  La query iniziale prende `visited_at >= dayStart AND visited_at < boostCutoff`,
  quindi le righe degli ultimi 15 minuti gia' esistenti **non** sono nel fondo, e
  l'evento Realtime le ha viste solo se sono arrivate dopo la sottoscrizione.
  Se sono preesistenti, il boost non parte. **Da verificare a mano**, non da leggere.
- **R2 — il badge copre l'etichetta.** Verifica visiva.

### Passi
1. Check-in singolo: badge 0.
2. Due check-in ravvicinati: boost visibile.
3. Aspettare la finestra: decadimento.
4. Reload con storico in tabella: il fondo deve riflettersi.

### Gate di coerenza
- Il decadimento usa l'ora corrente, non quella del mount.
- Il badge non sposta il layout della label.

### Accettazione
i 4 casi sopra, osservati

### Rollback
revert del commit `c9efa00`

---

# FASE 6 — DOCUMENTAZIONE

## M13 — Igiene documentale

**Severita':** MEDIA
**Stato:** parzialmente chiuso

### Chiuso
- `docs_v2/tooling/autorita.json` **ripristinato** al commit `09d4400`. Le quattro
  chiavi che avevo aggiunto sono rimosse, compresa quella che affermava il cold-start
  come gestito correttamente.
- `TRIAGE-DOCUMENTAZIONE.md` scritto: 124 file classificati.
- Tre file temporanei in root, non tracciati: `LOG-LAVORO.md`,
  `PIANO-LAVORO.md` (superato da questo), `TRIAGE-DOCUMENTAZIONE.md`.

### Aperto
- **M13.1** `docs_v3/catalogo-feature.json` F-SCAN-02 afferma che 9999 non puo'
  passare come zero. **E' falso.** Non lo correggo: non e' di mia competenza e non e'
  tracciato. Va segnalato all'altro agente.
- **M13.2** I 10 file `.sql` di `docs_v2` hanno nomi che mentono. `FIX-BLOCK.sql`
  contiene 24 `SELECT` e nessun fix. Verificato: sono tutti senza DDL e senza DML,
  quindi sicuri da eseguire. Ma `verifica-v6-senza-commenti.sql` a 0,3 KB non
  verifica granche'.
- **M13.3** `storico_chat_vecchia.md` duplicato identico in `docs/` e `docs_v3/`
  (SHA256 `DADEDC8D2AD0...`). Non lo tocco.
- **M13.4** (08/10) `A8_lessico_e_marchio.md` §1.2: correzione **registrata**
  (METODO 7.1), non riscrittura — il refuso `Engine Engine` non e' piu'
  riproducibile in `app.json` (misurato 08/10); la tabella storica del 30/09
  resta invariata. CB-10 chiusa.
- **M13.5** (06/10) Il registro discrepanze vive in
  `VISIONE-ESECUZIONE-CORE-BUSINESS.md` (G-*, CB-*, UX-*). Questo piano lo
  riferenzia, non lo duplica.

---

# MODULI AGGIUNTI — 06/10/2026 (M14…M18)

Nati dalle misure 04a/05a/05b/06/06b/07/08 (`STATO-FASE-0.md` §7g–§7k).
Ordine di esecuzione confermato: **M14 → M4 → M5 → M15 → M11 → M6 → M7 → M9 →
M10 → M16 → M17 → M12 → M13**.

## M14 — Hardening `profiles` (BLOCCANTE — primo modulo di Fase 1)

**Severita':** BLOCCANTE
**Stato (08/10):** SCRIPT + MIGRATION + CLIENT SCRITTI — in attesa di
esecuzione. Precheck parziali già eseguiti dall'agente via REST API (la SELECT
su profiles è globale): `09` = 1 doppione "Save Ks", `09d` = 1 violazione
charset (`Fragolina 🍓`). Tentativo di rename via REST → 0 righe (RLS blocca
l'anon: evidenza a favore del gate 11). Resta, dall'umano nel pannello:
`09c` (rename approvato), `09e` (fix `Fragolina`, approvato 08/10), `09`, `09d`,
`10`, `11`. Poi si applica
`supabase/migrations/20261008120000_profiles_hardening_m14.sql`.
**Aggiornamento 08/10:** 09c, 09e, 09, 09d **eseguiti e verdi** (verificati
anche via REST: 0 duplicati, 0 violazioni); precheck **10 verde** (11/11
funzioni su `profiles` = SECURITY DEFINER → CB-14 chiusa; nuovo emergente
CB-15: `get_user_itineraries` assente dal catalogo). **11 verde** (rls=true,
6 policy, grant tutti true) → **tutti i gate verdi, via libera per
applicare M14**; post-check in `diagnostica_fase1/12_m14_post_apply_verifica.sql`.
**M14 APPLICATA 08/10**: post-check verde (REST anon=0 righe, count=50);
`n_policy=4` invece di 2 (2 policy INSERT/DELETE preesistenti non droppate)
→ censimento con `13_policy_profiles_elenco.sql` **eseguito**: 2 INSERT
duplicate `roles={public}` con check solo su `id` → **CB-16** (vettore
`admin_role` via INSERT, misura 14 in corso; client non ha mai `.insert()`
su profiles). **14 eseguito**: grant INSERT anon/auth/adminrole tutti true
→ vettore confermato aperto; chiusura proposta con
`15_profiles_insert_revoke.sql` (REVOKE INSERT + drop duplicata), **approvato
08/10, in attesa di esecuzione**.
**M14 COMPLETATO 08/10**: 15 eseguito (`false,false,false,1`), verifica REST
`42501 permission denied`, CB-16 chiusa. Prossimo: M4 (serve D4 + backup M3).
**Evidenza:** `STATO-FASE-0.md` §7k (misura 07) + §7g (misura 04a)
**Discrepanze chiuse:** CB-01, CB-02 · **aperte con gate:** CB-14 · **impatti:**
UX-04, CB-12/CB-13 (registrate, non risolte)

Il vettore: `authenticated` (e `anon`) ha `UPDATE` su `profiles.admin_role` e
due policy UPDATE duplicate (`qual = auth.uid() = id`, `with_check` assente) →
`UPDATE profiles SET admin_role='admin' WHERE id = auth.uid()` apre **tutte e 5**
le viste DaaS via `is_loto_admin()`.

### Passi
1. `DROP POLICY` delle policy UPDATE duplicate su `profiles` e riscrittura con
   `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`.
2. `REVOKE UPDATE (admin_role) ON public.profiles FROM anon, authenticated;`
   (colonna-specifica, non l'intera tabella).
3. `count_profiles()` RPC `SECURITY DEFINER` (patch gia' pronta in
   `STATO-FASE-0.md` §8) + rimpiazzo dei conteggi globali:
   `components/PlasticaqquaEventSheet.tsx:24` e
   `app/loto-admin-v2/(dashboard)/page.tsx:31`.
4. `UNIQUE(nickname)` su `profiles` **solo dopo** precheck 0 duplicati;
   gestione `23505` (unique_violation) in
   `components/TouristBaptismModal.tsx:41-46`.

### Gate di coerenza
- **DROP, mai CREATE aggiuntiva**: le policy RLS sono permissive e si combinano
  in OR.
- La riga propria resta leggibile (`vw_user_dashboard_metrics` usa
  `auth.uid() OR is_loto_admin()` — §7j rettificato).
- Verifica: da utente autenticato, `UPDATE ... SET admin_role='admin'` → errore;
  le 5 viste DaaS tornano vuote senza `is_loto_admin()`.

## M15 — Guard famiglia DaaS (ALTA)

**Severita':** ALTA
**Stato:** **COMPLETO 08/10.** Precheck `22`/`23` eseguiti, sonda `08`
rettificata. Gate `20261008150000_daas_views_anon_guard_m15.sql` **applicato**;
post-check `24` **verde** (`anon=false`, `auth/service_role=true`,
`guard=true` × 5, RLS off). Cloud **sicuro**: guard presente su tutte e 5,
`anon` chiuso, `is_loto_admin()` hardened. Residuo di processo = re-run di
`v22/v23` → `CB-09b` (gate ora riasserisce lo stato).
**Evidenza:** §7h (06b): 5 viste, RLS off, proprietario `postgres`, guard unico
`is_loto_admin()`; `A3:76` (rischio re-run `v22/v23/v24`)

1. Verificare che nessuna `GRANT`/ri-migrazione ripristini l'accesso (le
   migrazioni `v22/v23/v24` sono rieseguibili: re-run = riguard).
2. Avere un piano per il singolo punto di caduta (`is_loto_admin()`): se cade,
   cadono tutte e 5.
3. Correggere la sonda 08 (pattern senza prefisso `public.`) — solo rettifica,
   non riscrittura dello storico. **FATTO 08/10.**

### Due fonti in conflitto (revisione locale 08/10)
Le 5 viste sono definite due volte nel repo:
- `20260925120000_admin_dashboard_hardening.sql` (timestampata, **hardened**):
  guard `public.is_loto_admin()` + `is_loto_admin()` con
  `REVOKE ALL FROM PUBLIC` e grant solo a `authenticated, service_role`
  (`SET search_path = public`, senza `pg_temp`);
- `migration_v22/v23/v24_*.sql` (**non collaudate**, ultimo commit le esclude):
  stesse viste ma `GRANT SELECT` a `anon+authenticated(+service_role)`.
Quale sia viva lo dice il precheck 22 (confronto `def_length` 6193/682/1068/
292/2551 di §7j + grant anon). Il rischio re-run è concreto solo per la
seconda famiglia.

### Misura 22 (08/10) — ESITO
| vista | rls | owner | anon | auth | svc | guard | prefisso | def_len |
|---|---|---|---|---|---|---|---|---|
| vw_daas_esg_monthly | false | postgres | **false** | true | true | true | false | 6313 |
| vw_daas_event_attendance | false | postgres | **false** | true | true | true | false | 706 |
| vw_daas_heatmap_15min | false | postgres | **false** | true | true | true | false | 1104 |
| vw_dev_telemetry_daily | false | postgres | **false** | true | true | true | false | 296 |
| vw_user_dashboard_metrics | false | postgres | **false** | true | true | true | false | 2619 |

- **Guard presente in tutte e 5** (`def_usa_is_loto_admin=true`), nessun
  prefisso `public.` reso da `pg_get_viewdef` (coerente con §7j).
- **`anon` NON ha SELECT su nessuna delle 5** → corrisponde ESATTAMENTE ai
  `GRANT SELECT ... TO authenticated, service_role` del file hardened
  `20260925120000_admin_dashboard_hardening.sql` (righe 116/244/269/330/379).
  Quindi le viste cloud sono la **fonte hardened, non `v22/v23/v24`** (che
  concedevano ad `anon`). Passo 1 di M15: **già sicuro nel cloud**.
- **`def_length` = +4…+120 vs §7j** (6313/706/1104/296/2619 vs
  6193/682/1068/292/2551), a grant/guard invariati. NON riproducibile come
  impronta (dipende dalla resa di `pg_get_viewdef`): registrata come CB-21,
  non usarla come hash. Nessun impatto di sicurezza.
- **Rischio residuo:** le `v22/v23/v24` restano rieseguibili; `v22` e `v23`
  concedono SELECT ad `anon` su 4 viste (v24 no) → un re-run riaprirebbe
  `anon`. Vedi **CB-09b**. Neutralizzato dal gate (sotto).

### Misura 23 (08/10) — `is_loto_admin()` ESITO
`prosecdef=true`; `proconfig={"search_path=public"}` (search_path pinnato);
`proacl={postgres, authenticated, service_role}` → **EXECUTE revocato da
PUBLIC**, `anon` assente; `anon_exec=false`, `auth_exec=true`; corpo = repo
`20260925120000` (righe 61-76). Guard **hardened e sicuro** (tutte le
referenze schema-qualificate → sicuro anche senza `pg_temp`).

### Gate M15 (08/10)
Migration `20261008150000_daas_views_anon_guard_m15.sql`: per ciascuna delle 5
viste `REVOKE ALL FROM anon` + `REVOKE ALL FROM PUBLIC` + `GRANT SELECT TO
authenticated, service_role`. **Non** tocca le definizioni (M15 verifica, non
riscrive). Idempotente → no-op sul cloud attuale e ripristino sicuro dopo un
eventuale re-run di `v22/v23`. Post-check `24`.

### Piano SPOF `is_loto_admin()` (baseline chiusa 08/10)
Definizione nota (repo 20260925, righe 61-76): ritorna true se
`auth.role()='service_role'` **oppure** esiste la propria riga profilo con
`admin_role IN ('admin','analyst')`.
- **Modalità di rottura:** (a) `admin_role` rimosso/rinominato → i 5 DaaS
  restano vuoti per gli umani (perdita, non leak); (b) guard alterato a `true`
  → leak a tutti gli `authenticated`; (c) self-promote su `admin_role` → già
  chiuso da M14 (CB-01).
- **Contingenza:** il guard si ripristina da solo ricreando la funzione dal
  file `20260925120000` (righe 61-76) + `GRANT` a `authenticated, service_role`;
  `admin_role` resta scrivibile solo da `postgres` (M14). Da aggiungere una
  verifica (baseline 23) da confrontare nelle prossime misure.

## M16 — `events` / CommunityEventSheet (ALTA)

**Severita':** ALTA
**Stato:** FATTO (09/10) — decisioni prese: **policy SELECT pubblica** su `events`
(confermata dall'utente); **CB-08 CHIUSA** (direttiva 09/10: nessuna nebbia sulla
mappa — POI sempre visibili; `user_pois` SSOT solo per stato visita/XP); **CB-23
CHIUSA (opzione A)** — filtri `event_type` rimossi dai client (i valori reali sono
`eco/social`). **Migration `20261009170000_events_policy_m16.sql` APPLICATA**;
post-check `39` verde; certificazione REST anon (2 righe visibili, INSERT bloccato).
Evidenze `risultato 38/39_m16_events.txt`. CB-03 → CHIUSA.
**Evidenza:** `events` con RLS attiva e **0 policy** e grant DML via PUBLIC →
eventi community vuoti in silenzio (CB-03, chiusa); `user_badges` count rotto
(mock 23/38 — vettore chiuso con M10)

1. Policy `events` (SELECT minima) + decisione CB-08 (source of truth fog of war):
   **DECISA 09/10** — SELECT pubblica `USING (true)`; CB-08 = cloud SSOT stato
   visita, nessun oscuramento client (rimosso).
2. Generalizzazione `PlasticaqquaEventSheet` → props `eventId/nodeId/tenantId`:
   **DEFERITA A FASE 2** (dopo M14→M16), decisione esplorata 06/10.

## M17 — Scansioni di integrita' (orphan) (MEDIA)

**Severita':** MEDIA
**Stato:** FATTO (09/10) — `40` FK-anagrafe + `41` scan ORPHAN eseguiti:
**12/12 = 0** (0 orfani, 0 FK NULL su tutta la catena; evidenze
`risultato 40/41_m17_*.txt`).
Verifiche read-only di coerenza FK/orfani sulle tabelle della catena
reward (`user_pois`, `badges`, `badge_templates`, `user_badges`,
`impact_transactions`) eseguite DOPO le scritture di Fase 1-2.
**Correzione 09/10:** `xp_ledger` come indicato in origine **NON ESISTE**
(0 match nel repo, 42P01 al primo run del 40): sostituita con la catena
reale (elenco sopra). **Nota:** `user_badges`, `impact_transactions`,
`badge_templates` ancora vuote (0 righe) -> riscansionare dopo Fase 2.

## M18 — Contatti & Report (UX, nessun DB nuovo)

**Severita':** MEDIA
**Stato:** decisione di prodotto presa 06/10: voce in
**Profilo → Opzioni → "Contatti e report"**. **Nessuna tab, nessuna voce in
tab bar.** Destinazione del report = **§D** di
`VISIONE-ESECUZIONE-CORE-BUSINESS.md` (4 opzioni ancora aperte:
`admin_alerts` / `b2b_feedbacks` / `civic_reports` / nuova `user_reports`).

---

# MATRICE DIPENDENZE (aggiornata 06/10)

```
M14 (profiles) ──┬──────────► M15 (guard DaaS)     ◄── BLOCCANTE
                 ├──────────► M4  (policy civic)
                 └──────────► M5  (identita')
M1 (grant)  ────────────────► M5
M2 (trigger) ───────────────► M9  (grid_cell)
M3 (backup)  ── (RACCOMANDAZIONE, non piu' bloccante)
P-D1/P-D2/P-D3 (decise) ────► M7  (premi)
M4 (policy)  ───────────────► M10 (badge)
M11 (heat)  ────────────────► M6  (deep link)       ◄── precede
M10 ─────────────────────────► M16 (events) ────────► M17 (orphan scan)
M8  ANNULLATO / differito a Fase 3 (CB-04)
M18 (Contatti & Report) — nessuna dipendenza DB
```

**Ordine eseguibile (confermato 06/10):**
`M14` → `M4` `M5` → `M15` → `M11` → `M6` → `M7` → `M9` → `M10` → `M16` → `M17` → `M12` → `M13` (+ `M18` in parallelo)

---

# DECISIONI PRESE (P-D1…P-D6) — 06/10/2026

Renominate **P-D*** per non collidere con `DECISIONI.md` (D1–D15).
Dettaglio e registro: `VISIONE-ESECUZIONE-CORE-BUSINESS.md` §C.

| id | Domanda | Esito | Evidenza |
|---|---|---|---|
| **P-D1** | Il primo check-in (cold start) come viene premiato? | **20 XP letterali**; `co2=0`, `tokens=0`, `speed=NULL`, `shadowbanned=FALSE`, check-in registrato | `20260929160000:127,212,241` |
| **P-D2** | Come si rappresenta "non valutabile"? | `calculated_speed_kmh = NULL`; sentinella `9999` **eliminata** (codice morto `:225-227`) | colonne gia' nullable (§7.7) — nessuna migrazione schema |
| **P-D3** | Da 2° check-in, quanto si assegna? | veicolo = **2 XP fissi** (`:237-240`); pedone = `COALESCE(pois.xp_reward, 15)` dinamico (15 = fallback NULL). **Nessuna predizione di livello** | `:242`, `utils/levelUtils.ts:81` |
| **P-D4** | `action_type` del check-in? | **`'tourist_checkin'` INVARIANTE** — cambiarlo spezza il `FILTER` di `xp_ledger` in `vw_user_dashboard_metrics` → criterio M6 | `20260925120000:294-296` |
| **P-D5** | Struttura del branch premio? | `IF v_speed_measurable THEN <3 tier> ELSE <premio P-D1> END IF` | sostituisce codice morto |
| **P-D6** | I 3 tier cambiano? | **INVARIANTI**: `>130` / `20–130` / ELSE | `20260929160000:232-245` |
| **P-D7** | Chi puo' modificare il nickname? | **Blocco totale dopo il primo set.** Convalida definitiva: 3-20 char, solo lettere/cifre/spazi (niente speciali), blocklist volgari+riservati, univoco garantito dal DB. ProfileModal: input edit SOLO se nickname e' ancora NULL, poi lucchetto. TouristBaptismModal: stesso validatore | decisione utente 08/10; `utils/nicknameValidation.ts`, CHECK `profiles_nickname_check` in M14 |
| **P-D8** | Chi legge `civic_reports`? (ex D4) | **R3**: SELECT `USING (auth.uid() = user_id OR status = 'confirmed')` — l'autore legge i propri report, tutti leggono i confermati. Con le policy M4 (INSERT propria, UPDATE su pending proprio, nessuna DELETE) la self-conferma resta chiusa | decisione utente 08/10; migration M4 |

**Livello 2** = `EVENTS_UNLOCK_LEVEL = 2` (`utils/levelUtils.ts:13-21`) →
REVEAL "LA VOCE DELLA CITTÀ" + WHISPER `LEVEL_UP_LORE[2]`.

**Rischi accettati da registrare in `DECISIONI.md`:** farming dei 20 XP
iniziali via `signInAnonymously` ripetuto (P-D1); M3 declassato (vedi sotto).

# DECISIONI RESIDUE

| id | Domanda | Serve prima di | Raccomandazione / stato |
|---|---|---|---|
| **D4** | Chi legge `civic_reports`? | M4 | **DECISA 08/10 = R3** (confermati + propri); registrata come **P-D8**. NOTA: la destinazione dei report utente (§D registro visione / UX-01, opzioni 1-4) e' un'ALTRA decisione, resta aperta |
| **D5** | L'identita' del reporter e' fidabile? | dopo M5 | non risolvibile con M5: serve geofence server |
| **D6** | Come si fa il backup? | M3 (ora raccomandazione) | export dashboard, oppure si dichiara di procedere senza — **da confermare esplicitamente** |

---

# COSA NON FACCIO

- Non applico M7 senza **P-D1** (decisa 06/10: 20 XP a freddo, check-in
  registrato, nessun ban) e senza aver dichiarato la posizione su M3
  (declassato a raccomandazione). Il ramo "banna il cold-start" da solo crea
  un lockout permanente — scartato con P-D1.
- Non aggiungo policy. Si sommano in OR. Solo `DROP` e riscrittura.
- Non uso un commento come prova. Cinque casi a oggi, e uno e' mio.
- Non do per verificato un nome di funzione. Quattro volte il nome c'era e la
  funzione no.
- Non tocco `docs/`, `docs_v3/`, ne' l'archivio NotebookLM.
- Non scrivo piu' in `autorita.json`.
- Non committo nulla senza che tu lo chieda.

---

# APPENDICE — SCRIPT

Uno alla volta. Tutti di sola lettura.

## Script A — permessi e configurazione (M1)

```sql
SELECT p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef,
       p.proconfig,
       coalesce(array_to_string(p.proacl, E'\n'), 'nessun GRANT esplicito') AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('process_crowd_radar','scan_poi_gps','scan_poi','process_esg_impact','scan_poi_nfc','calculate_esg_impact')
ORDER BY p.proname;
```

## Script B — trigger completi (M2)

```sql
SELECT c.relname AS tabella,
       t.tgname,
       CASE t.tgtype
         WHEN 2 THEN 'BEFORE ROW'
         WHEN 1 THEN 'BEFORE STATEMENT'
         WHEN 64 THEN 'AFTER ROW'
         WHEN 63 THEN 'AFTER STATEMENT'
         ELSE t.tgtype::text
       END AS momento,
       p.proname AS funzione,
       pg_catalog.pg_get_expr(t.tgargs, t.tgrelid) AS filtro
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
ORDER BY c.relname, t.tgname;
```

## Script C — colonne e valori civici (M2)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'civic_reports'
ORDER BY ordinal_position;

SELECT count(*) AS totale,
       count(*) FILTER (WHERE tenant_id IS NULL) AS senza_tenant,
       count(*) FILTER (WHERE grid_cell IS NULL) AS senza_grid,
       count(*) FILTER (WHERE user_id IS NULL) AS senza_utente
FROM civic_reports;
```

## Script D — is_nullable sulle colonne del reward (per P-D2) — ESEGUITO: entrambe nullable, nessuna migrazione

```sql
SELECT table_name, column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('user_pois','calculated_speed_kmh'),
    ('user_pois','is_shadowbanned'),
    ('user_pois','xp_awarded'),
    ('user_pois','co2_saved')
  )
ORDER BY table_name, column_name;
```

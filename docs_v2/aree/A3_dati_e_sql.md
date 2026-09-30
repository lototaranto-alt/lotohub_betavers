---
id: A3
tipo: area
ambito: catena-dati-canonica-e-script-sql-morti
stato: Vivente
confidenza: Media
owner: Agent
aggiornato: 2026-09-26
evidenza:
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:1
  - supabase/migrations/20260925120000_admin_dashboard_hardening.sql:1
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:221-239
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:189-227
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:87-90
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:381-391
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:322-326
  - docs/codici_morti.md:25
  - .agents/AGENTS.md:36
---

# A3 - Dati e SQL: la catena canonica e gli script morti

> Risponde a: "quale script definisce il check-in, quali sono definitivamente morti, e cosa
> impedisce al DB di essere la SSOT come vuole `AGENTS.md`?"

Confidenza **Media**: la catena canonica e' stata verificata riga per riga, ma i 4 blocker
identificati non sono ancora stati corretti e lo schema cloud non e' stato introspezionato in
questa sessione. Le zone non verificate sono in §2.

---

## 1. Cosa dice il codice

### Due sole cartelle contano

| Cartella | Ruolo | Stato |
|---|---|---|
| `supabase/migrations/` | **canonica**. Unico naming CLI-timestamp, consumata da Supabase CLI | 2 file, entrambe di settembre |
| tutto il resto di `supabase/` | archivio, query di introspezione, seed, script sparsi | **non applicare** |

Le due migration canoniche:

| File | Righe | Committata | Applicata su cloud |
|---|---|---|---|
| `20260925120000_admin_dashboard_hardening.sql` | 381 | sì, in `bb0fa37` | **no** |
| `20260926120000_scan_chain_canonical.sql` | 440 | **no** (non tracciata) | **no** |

### La catena canonica di check-in

`migrations/20260926120000_scan_chain_canonical.sql` e' la SSOT del check-in. Contiene: le colonne
mancanti, `scan_poi_gps` (GPS), `scan_poi` (NFC), la logica anti-spoofing (velocita' > 130 km/h ->
shadowban) resa persistente, e la scrittura del ledger.

**L'ordine di applicazione e' vincolante:**

```
20260925120000_admin_dashboard_hardening.sql     (viste DaaS + telemetria, gate is_loto_admin)
        ->  20260926120000_scan_chain_canonical.sql  (check-in, anti-spoofing, ledger)
        ->  client (utils/dbAggregation.ts, index.tsx)
```

Il motivo e' concreto: `utils/dbAggregation.ts:26` interroga `vw_user_dashboard_metrics`, che esiste
sia nella v23 (morta) che nella hardening (viva). **Senza la hardening il fix client non fallisce:
cade nel fallback silenzioso** `if (error || !data) return profile` e semplicemente non fa nulla.
E' il caso peggiore: nessun errore, nessun dato.

### Quattro definizioni con la stessa firma e semantica opposta

Questa e' la trappola piu' insidiosa dell'area: le funzioni non si distinguono dal nome.

| Script | Cosa fa di diverso | Dove |
|---|---|---|
| `migrations/20260926120000_scan_chain_canonical.sql` | **la canonica** | riga 1 in avanti |
| `supabase/migration_master_reset.sql:504` | `scan_poi_gps` scriveva solo `esg_raw_logs` (tabella inesistente) e **non** `user_pois`: le viste DaaS non ricevevano nulla | riga 504-556 |
| `anti_spoofing_scan_poi_gps.sql` (root) | scriveva colonne inesistenti (`user_id`, `created_at` invece di `profile_id`, `visited_at`): falliva **sempre** | root del repo |
| `migration_v22/v23/v24_daas_*.sql` | fanno `DROP VIEW` + `CREATE VIEW` **senza** gate `is_loto_admin()` e con `GRANT SELECT ... TO anon`: annullerebbero l'hardening | `supabase/` root |

La documentazione lo registra in `docs/codici_morti.md:25-41`, con la correzione: la logica
anti-spoofing che conteneva il vecchio script e' stata **recuperata** e resa persistente nella
catena canonica. Il contenuto e' stato salvato, la funzione no.

**Attenzione: `docs/codici_morti.md` condanna v22 e v23 ma dimentica v24.** Anche
`app_telemetry_events` e `vw_dev_telemetry_daily` esistono gia' in versione hardened dentro
`20260925120000_admin_dashboard_hardening.sql:332,365`. Le tre vanno archiviate insieme.

## 2. Cosa dice la documentazione

### Conformi

- **`docs/codici_morti.md`** (3.7 KB, 26/09) e' il registro piu' recente e utile dell'area. Ha
  pero' due difetti: **dimentica v24**, e contiene **1 carattere U+FFFD** (unico in tutta la
  documentazione, dichiarato nel file stesso come debito preesistente)
- **`supabase/pure_cloud_queries/`** raccoglie 79 script di introspezione usati per capire lo stato
  reale del cloud. Sono strumenti di lettura, non di scrittura: nessun resto

### Non verificate in questa sessione

- **`docs/schema_architecture.md`** (2.6 KB) dichiara di essere la fonte su "tabelle/viste/RPC".
  **Non l'ho confrontato con lo schema reale.** Con un DB che ha almeno 4 definizioni concorrenti
  di `scan_poi_gps`, un documento che si dichiara la fonte sull'architettura senza essere stato
  riconciliato e' un rischio, non una risorsa
- **`docs/logiche_proprietarie.md`** (5 KB) contiene le formule (Haversine, XP/PTI, ESG). Non l'ho
  confrontato con `utils/haversine.ts`, `levelUtils.ts`, `SincroAvventura.ts`
- **Schema cloud non introspezionato.** Le colonne reali sono note da un dump del 25/09 riportato
  in conversazione, non da una verifica fatta qui. `profiles` ha 21 colonne, `user_pois` 11,
  `badges` 6, `user_badges` 4. Va riconsolidato

## 3. Direzione

L'area va verso **una sola catena applicabile, applicata e verificata, con gli script morti
fuori dal perimetro applicabile**.

La regola che la governa e' `AGENTS.md` §7: *"l'architettura del Database e' la singola fonte di
verita' e non deve MAI essere inquinata o forzata per accomodare codice frontend pigro"*. E la
sua conseguenza operativa, che questa area sta ancora imparando: **una funzione con lo stesso nome
in due script non e' un duplicato, e' un conflitto**. Le due copie vanno eliminate, non tollerate.

Direzione in tre passi:

1. **Correggere i 4 blocker della catena canonica** (§4) prima di applicarla
2. **Applicare hardening, poi scan chain**, e verificare che le viste DaaS ricevano dati
3. **Archiviare v22, v23 e v24** e correggere `docs/codici_morti.md` aggiungendo v24

`confidenza: Media` perche' il passo 2 non e' mai avvenuto: **nessuna delle due migration canoniche
e' stata applicata su cloud**. Finche' e' cosi' lo stato reale del DB non e' noto con certezza.

## 4. Buchi e rischi

Tutti i blocker qui sotto sono in `migrations/20260926120000_scan_chain_canonical.sql`, non
applicata. Rigorosamente verificati.

| # | Gravita' | Difetto | Effetto |
|---|---|---|---|
| B1 | **Blocker** | **Nessun `BEGIN`/`COMMIT`** (0/0, contro 1/1 della hardening). ALTER + 2 `CREATE FUNCTION` non atomici | stato parziale se il piano DDL fallisce a meta' |
| B2 | **Blocker** | `EXCEPTION WHEN unique_violation` -> `UPDATE`: le visite ripetute collassano sulla stessa riga (`:221-239`) | se esiste la PK composta `(profile_id, poi_id)`, la heatmap DaaS time-series diventa **1 riga per utente x POI per sempre**. Contraddice l'obiettivo dichiarato a `:70-75`. **La PK composta va rimossa, non accompagnata** |
| B3 | **Blocker** | **Race condition sul cooldown**: check (step 5) e INSERT non sono atomici (`:189-227`) | due richieste concorrenti passano entrambe: **doppio XP**. Il raison d'etre' della migration e' chiudere un exploit XP, e ne lascia uno apero. Serve `pg_advisory_xact_lock` o `SELECT ... FOR UPDATE` sul profilo |
| B4 | **Blocker** | `profiles.tenant_id` aggiunta **senza backfill** (`:87-90`) | le righe esistenti restano a `NULL`, invisibili ai query tenant-filtered di `app/(tabs)/index.tsx:276-286` |
| H1 | **Alto** | la "FASE 2 neutralizzazione" e' **solo un commento** (`:381-391`) e cita `mitigation.sql`, **file inesistente** | non mitiga nulla: riapplicare `migration_master_reset.sql` o `anti_spoofing_scan_poi_gps.sql` sovrascrive silenziosamente la funzione canonica |
| H2 | **Alto** | `scan_poi` (NFC) diventa "finalizzazione" GPS (`:322-326`) | **decisione di prodotto, non tecnica**: se lo scan del tag deve funzionare da solo serve un challenge NFC firmato. Da decidere prima del rilascio |
| - | Medio | `impact_transactions` inserisce sempre `tokens_earned = 0` | il check-in **non accredita mai PTI**. Confermato o no? |
| - | Medio | denominatore velocita' con floor a 36 s | possibili shadowban falsi su scan ravvicinati |
| - | Medio | FASE 3 (controlli) mescolata al DDL; numerazione che salta il 9 | leggibilita' e prevedibilita' dell'ordine di applicazione |
| - | Alto | **`v24` non condannata** in `codici_morti.md` | chi lo riapplica annulla l'hardening della telemetria |

**Nota encoding:** le due migration canoniche hanno **0 caratteri U+FFFD**. Il debito dichiarato in
`codici_morti.md` riguarda quel file, non le migration.

## 5. Cosa NON fare in questa area

- **Non applicare niente da `supabase/` root.** Solo `supabase/migrations/`. Vale per
  `migration_master_reset.sql`, `anti_spoofing_scan_poi_gps.sql`, `v22`, `v23`, `v24` e per tutto
  `supabase/archive_scattered_sql/`
- **Non applicare `migration_v22_daas_vendite.sql` o `v23` o `v24`.** `DROP VIEW` senza gate e con
  `GRANT` ad `anon`: annullano l'hardening committato in `bb0fa37`
- **Non usare `GPS_CHECKIN` o `gps_checkin` come `action_type`.** Il CHECK di
  `impact_transactions` ammette **solo** `tourist_checkin | civic_action | event | refill | unknown`.
  La stringa sbagliata fa fallire l'INSERT
- **Non creare un `UNIQUE (profile_id, poi_id)` su `user_pois`.** Imporrebbe "un POI una volta
  sola nella vita" e distruggerebbe check-in ripetuti, heatmap storiche e conteggi giornalieri. Il
  vincolo e' il cooldown di 12h applicato in procedura
- **Non fidarti del nome della funzione per capire quale e' quella giusta.** Verifica il file.

## 6. Prossima verifica

Correggere B1-B4, poi applicare hardening e scan chain sul cloud, poi eseguire un check-in reale e
verificare che `user_pois` e `impact_transactions` ricevano righe. **L'area resta `Media` finche'
nessuna delle due migration e' stata applicata.**

---

*Area A3 verificata il 26/09/2026. Confidenza Media: catena canonica verificata riga per riga,
stato del DB cloud non verificato.*

# Registro Codici Morti (Dead Code & Archivi)

Registro degli script, componenti, asset e SQL non più attivi o da NON applicare.
Fonti storiche: `SESSION_BOOTSTRAP_RICOSTRUZIONE.md` (§6/§7/§10) e la cartella `archive_dead_code/`.

## Script
- **`write_seed.js`** — archiviato in `archive_dead_code/write_seed.js` (19/09):
  - Generatore Node standalone di seed SQL (scratch dir del brain), NON importato da nulla.
  - Stale rispetto a `supabase/migration_v20_vault_currency_fix.sql`: gli INSERT contengono
    ancora `loto_cost` (`..., 1, false, 0)`) → romperebbe se eseguito post-v20.
  - Contiene un mojibake `�` nei testi whisper (round-trip encoding non pulito).
  - Da NON ripristinare; riallineare solo se un domani servirà un generatore di seed.

## Componenti (stato da validare)
- `components/LevelUpModal.tsx` — asset `assets/images/ranks/rank*.jpg` assenti al 17/09
  (nomi vecchi), non importato. Riaggancio da decidere in next session (vedi NEXT_SESSION_HANDOFF).
- `.temp_profile_modal.tsx` — candidato rimozione.

## SQL (archivio, NON applicare)
- `supabase/migration_v19_gamification_vetrina.sql` — curva `3+FLOOR((xp-40)/150)` incoerente
  con la SSOT `utils/levelUtils.ts` (SESSION_BOOTSTRAP_RICOSTRUZIONE.md §10); sostituita dal
  `calculate_user_level` della migration_v20 (curva LEVEL_THRESHOLDS a 50 livelli).
- `docs/db_migrations/02_gamification_and_events.sql` — badge e curve non allineate alla SSOT.

### Definizioni di check-in superate dalla catena canonica (26/09)
La SSOT del check-in e' ora
`supabase/migrations/20260926120000_scan_chain_canonical.sql`. Le definizioni qui sotto
hanno **firme identiche ma semantica opposta**: riapplicarle sovrascrive la funzione
canonica e reintroduce i bug. Non riapplicare.
- `supabase/migration_master_reset.sql:504` - `scan_poi_gps` scriveva solo `esg_raw_logs`
  (tabella assente dai tipi generati) e **non** `user_pois`: le viste DaaS non ricevevano
  nulla. E' la causa dell'assenza di dati, non un problema di vista.
- `anti_spoofing_scan_poi_gps.sql` - `scan_poi_gps` scriveva colonne inesistenti
  (`user_id`, `created_at` invece di `profile_id`, `visited_at`): falliva sempre.
  La logica anti-spoofing che contiene (velocita' > 130 km/h -> shadowban) e' stata
  recuperata e resa persistente nella catena canonica.
- `supabase/migration_v22_daas_vendite.sql` e `supabase/migration_v23_prestige_card_metrics.sql`
  - **non riapplicare**: fanno `DROP VIEW` + `CREATE VIEW` senza gate `is_loto_admin()` e
  con `GRANT SELECT ... TO anon`, quindi annullerebbero l'hardening gia' committato in
  `migrations/20260925120000_admin_dashboard_hardening.sql` (k-anonimita', tenant_id,
  revoca ad `anon`). Le viste DaaS corrette sono quelle dell'hardening.

### Trap ricorrenti da non ripetere
- `impact_transactions.action_type` ha un CHECK che ammette **solo**
  `tourist_checkin | civic_action | event | refill | unknown`. Valori come
  `GPS_CHECKIN` o `gps_checkin` fanno fallire l'INSERT: usare `tourist_checkin`.
- Non creare un `UNIQUE (profile_id, poi_id)` su `user_pois`: imporrebbe "un POI una volta
  sola nella vita" e distruggerebbe check-in ripetuti, heatmap storiche e conteggi
  giornalieri. Il vincolo e' il cooldown di 12h applicato in procedura.
- `PoiDetailSheet.tsx:576` chiamava `scan_poi(p_poi_id)` senza validare GPS e senza
  confrontare `scannedData` con il POI: qualunque QR assegnava XP. Ora `scan_poi` e' una
  finalizzazione che richiede una visita GPS validata negli ultimi 15 minuti.

### Difetto preesistente di encoding in questo file
Alcune virgolette lunghe in questo file sono gia' corrotte in carattere di sostituzione
U+FFFD (non retta mai: em-dash, freccia e accenti). Da ripulire in un passaggio dedicato.
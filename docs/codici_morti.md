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
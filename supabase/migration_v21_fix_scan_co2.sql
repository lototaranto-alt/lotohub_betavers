-- =========================================================================
-- migration_v21_fix_scan_co2.sql
-- FIX "colonna co2" allo scan dei POI (test in strada APK 1.0.2, 22/09)
-- =========================================================================
-- Root cause: la funzione deployata scan_poi_gps (e process_esg_impact)
-- esegue `UPDATE profiles SET total_co2 = COALESCE(total_co2,0)+...`,
-- ma il DB reale NON ha la colonna profiles.total_co2 (verificato dai tipi
-- generati database.ts -> profiles: Row senza total_co2).
-- => Errore in strada: "column profiles.total_co2 does not exist".
--
-- FIX: aggiunta idempotente delle colonne mancanti. Se esistono gia'
-- (schema storico migration_v2/migration_v4), i comandi no-op non alterano nulla.
-- =========================================================================
-- NOTE: total_liters garantito qui NON perche' serva nel calcolo CO2 dello scan
-- GPS, ma perche' process_esg_impact (scan scontrino partner, index.tsx) lo
-- aggiorna: mancando, fallirebbe anch'esso in prossima release.

-- 1. Colonne cumulative sul profilo (usate da scan_poi_gps e process_esg_impact)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS total_co2   NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_liters NUMERIC(10,2) DEFAULT 0;

-- 2. Allineamento user_pois (colonne gia' presenti nel DB reale, ma garantite
--    per le INSERT delle funzioni di scan: co2_saved / xp_awarded)
ALTER TABLE public.user_pois
    ADD COLUMN IF NOT EXISTS co2_saved NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN DEFAULT FALSE;

-- 3. Verifica finale (da rieseguire = 0 errori => tutto allineato)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND (table_name='profiles' AND column_name IN ('total_co2','total_liters'))
   OR (table_name='user_pois' AND column_name IN ('co2_saved','xp_awarded','is_shadowbanned'))
ORDER BY table_name, column_name;
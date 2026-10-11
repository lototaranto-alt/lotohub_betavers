-- ============================================================================
-- FASE 1 - M11 - 26 - PRECHECK/VERIFICA - colonne di crowd_predictions
-- ============================================================================
-- Sola lettura. Un solo result set (una riga per colonna).
-- Scopo: la RPC process_crowd_radar fa INSERT con le colonne
--   (poi_id, reporter_id, raw_count, certified_count, confidence_score).
--   Se una di queste manca, la RPC fallirebbe ancora dopo M11.
--   `anon` non puo' leggere la tabella (42501), quindi la verifica va fatta
--   dal pannello (postgres).
--
-- ESITO ATTESO: che esistano tutte e 5 le colonne usate dall'INSERT.
-- ============================================================================
SELECT column_name        AS colonna,
       data_type          AS tipo,
       is_nullable        AS nullable,
       column_default     AS default_value
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'crowd_predictions'
 ORDER BY ordinal_position;

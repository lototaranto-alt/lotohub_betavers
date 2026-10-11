-- ============================================================================
-- FASE 1 - G-06 - 31 - POST-APPLY - scan_poi rimosso, scan_poi_gps intatto
-- ============================================================================
-- Sola lettura. UN SOLO result set.
-- Da eseguire DOPO 20261009130000_drop_scan_poi_g06.sql.
--
-- Cosa verifica:
--   scan_poi_residue    = 0   (public.scan_poi non esiste piu' in nessuna firma)
--   scan_poi_gps_presente = 1 (il percorso di check-in riparato resta attivo)
--
-- Verifica indipendente (agente, via REST anon): rpc('scan_poi', {p_poi_id})
--   -> atteso 404 + {"code":"PGRST202", ...} (funzione non trovata).
-- ============================================================================
SELECT
  (SELECT count(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'scan_poi')          AS scan_poi_residue,
  (SELECT count(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'scan_poi_gps')      AS scan_poi_gps_presente;

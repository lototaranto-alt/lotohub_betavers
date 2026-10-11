-- ============================================================================
-- FASE 1 - M7 - 32 - PRECHECK - scan_poi_gps PRIMA della correzione cold-start
-- ============================================================================
-- Sola lettura. UN SOLO result set.
-- Da eseguire PRIMA di 20261009140000_m7_cold_start_no_9999.sql.
--
-- Cosa misura (fingerprint del corpo attuale):
--   lunghezza                = 7289            (dalla misura del precheck 27)
--   init_velocita_zero       = true            (difetto 1: `v_speed_kmh := 0`)
--   ha_sentinella_9999       = true            (difetto 4: codice morto)
--   ha_speed_measurable      = false           (flag assente prima di M7)
--   storico_filtra_shadowban = true            (difetto 5: `up.is_shadowbanned`)
--   n_filtri_shadow          = 2               (cooldown + storico globale)
--   argomenti                = p_poi_id uuid, p_lat double precision,
--                              p_lng double precision
--   prosecdef                = true
--   proconfig                = {search_path=public,pg_temp}
--
-- Se questi valori NON corrispondono, FERMARSI: il corpo deployato e' diverso
-- da quello atteso e la migration M7 sostituirebbe un corpo non misurato.
-- ============================================================================
SELECT
  length(p.prosrc)                                        AS lunghezza,
  p.prosrc ~ 'v_speed_kmh\s+DOUBLE PRECISION\s*:=\s*0'    AS init_velocita_zero,
  p.prosrc ~ '9999'                                       AS ha_sentinella_9999,
  p.prosrc ~ 'v_speed_measurable'                         AS ha_speed_measurable,
  p.prosrc ~ 'up\.is_shadowbanned IS NOT TRUE'            AS storico_filtra_shadowban,
  (length(p.prosrc) - length(replace(p.prosrc, 'is_shadowbanned IS NOT TRUE', '')))
      / length('is_shadowbanned IS NOT TRUE')             AS n_filtri_shadow,
  pg_get_function_identity_arguments(p.oid)               AS argomenti,
  p.prosecdef                                             AS prosecdef,
  p.proconfig                                             AS proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'scan_poi_gps';

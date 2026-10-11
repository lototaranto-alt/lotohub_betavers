-- ============================================================================
-- FASE 1 - M7 - 33 - POST-APPLY - scan_poi_gps DOPO la correzione cold-start
-- ============================================================================
-- Sola lettura. UN SOLO result set.
-- Da eseguire DOPO 20261009140000_m7_cold_start_no_9999.sql.
--
-- Cosa verifica (attesi DOPO):
--   init_velocita_zero       = false   (difetto 1 corretto: non piu' `:= 0`)
--   ha_sentinella_9999       = false   (difetto 4: sentinella rimossa)
--   ha_speed_measurable      = true    (P-D5: flag presente)
--   storico_filtra_shadowban = false   (difetto 5: storico globale senza filtro)
--   n_filtri_shadow          = 1       (resta solo il filtro del cooldown)
--   argomenti                = p_poi_id uuid, p_lat double precision,
--                              p_lng double precision  (FIRMA INVARIATA)
--   prosecdef                = true
--   proconfig                = {search_path=public,pg_temp}
--   lunghezza                <> 7289   (il corpo e' cambiato)
--
-- La firma invariata garantisce che nessun client debba cambiare (M6: il deep
-- link e PoiDetailSheet chiamano con gli stessi 3 argomenti).
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

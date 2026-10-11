-- ============================================================================
-- FASE 1 - M6 - 27 - PRECHECK - stato cloud di scan_poi_gps e scan_poi
--                     (SECURITY DEFINER, grant, search_path, sentinelle gate)
-- ============================================================================
-- Sola lettura. Un solo result set (una riga per funzione; atteso 2 righe).
--
-- Perche' esiste: M6 deve instradare il deep link app/p/[id].tsx sul percorso
--   di check-in UFFICIALE (scan_poi_gps). Prima di scrivere il client va
--   misurato lo stato reale delle DUE funzioni di scan, perche':
--     - scan_poi_gps e' la catena con proximity gate + cooldown + anti-speed;
--     - scan_poi e' la via NFC di PoiDetailSheet.tsx:576, sospetta NON gated
--       (G-06: due percorsi, uno solo dei due protetto).
--
-- Le due fonti nel repo NON concordano, e la piu' vecchia e' stale:
--   anti_spoofing_scan_poi_gps.sql (root, 27/09) usa user_pois.user_id /
--     created_at e pois.base_xp / base_co2: colonne che NON esistono
--     (user_pois reale = profile_id / visited_at, vedi user_pois_schema.sql);
--   supabase/migrations/20260929160000_restore_proximity_gate.sql usa
--     profile_id / visited_at / xp_reward / checkin_radius / coords: e' la
--     versione canonica attesa.
-- Questa misura dice QUAL E' davvero deployata.
--
-- Cosa misura, per ciascuna funzione in (scan_poi_gps, scan_poi):
--   esiste            la funzione e' presente in public?
--   n_overload        quante firme con questo nome (atteso 1)
--   prosecdef         SECURITY DEFINER?
--   proconfig         search_path pinnato? (NULL = no)
--   proacl            chi ha EXECUTE? (NULL = default a PUBLIC, anon compreso)
--   argomenti         firma esatta
--   proprietario      owner
--   caratteri         length(prosrc): dimensione del corpo (no crash finestra)
--   ha_gate_prossimita   contiene 'v_dist_poi_m > v_radius_m' (il gate vero)
--   ha_raggio_default    contiene 'v_default_radius_m' (fallback 80 m)
--   init_velocita_zero   'v_speed_kmh ... := 0' (ramo 9999 morto)
--   ha_ramo_9999         contiene '9999'
--   n_filtri_shadow      occorrenze di 'is_shadowbanned IS NOT TRUE'
--   usa_auth_uid         legge l'identita' dal token (auth.uid())
--   usa_profile_id       INSERT/query con profile_id (schema reale)
--   usa_user_id          INSERT/query con user_id (schema stale -> errore)
--   tocca_user_pois      scrive su user_pois
--   tocca_profiles       aggiorna profiles
--   tocca_impact_tx      scrive su impact_transactions
--
-- ESITO: con esso si decide se M6 lato client basta, o se serve una migration
-- server (proximity gate assente su scan_poi_gps / scan_poi da neutralizzare).
-- ============================================================================
SELECT
  p.proname                                                     AS funzione,
  true                                                          AS esiste,
  count(*) OVER (PARTITION BY p.proname)                        AS n_overload,
  p.prosecdef                                                   AS prosecdef,
  p.proconfig                                                   AS proconfig,
  p.proacl                                                      AS proacl,
  pg_get_function_identity_arguments(p.oid)                     AS argomenti,
  pg_get_userbyid(p.proowner)                                   AS proprietario,
  length(p.prosrc)                                              AS caratteri,
  p.prosrc LIKE '%v_dist_poi_m > v_radius_m%'                   AS ha_gate_prossimita,
  p.prosrc LIKE '%v_default_radius_m%'                          AS ha_raggio_default,
  p.prosrc ~* 'v_speed_kmh[[:space:]]+DOUBLE[[:space:]]+PRECISION[[:space:]]*:?=[[:space:]]*0'
                                                                AS init_velocita_zero,
  p.prosrc LIKE '%9999%'                                        AS ha_ramo_9999,
  (length(p.prosrc)
   - length(replace(p.prosrc, 'is_shadowbanned IS NOT TRUE', '')))
   / length('is_shadowbanned IS NOT TRUE')                      AS n_filtri_shadow,
  p.prosrc LIKE '%auth.uid()%'                                  AS usa_auth_uid,
  p.prosrc LIKE '%profile_id%'                                  AS usa_profile_id,
  p.prosrc LIKE '%user_id%'                                     AS usa_user_id,
  p.prosrc LIKE '%user_pois%'                                   AS tocca_user_pois,
  p.prosrc LIKE '%profiles%'                                    AS tocca_profiles,
  p.prosrc LIKE '%impact_transactions%'                         AS tocca_impact_tx
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('scan_poi_gps', 'scan_poi')
ORDER BY p.proname, argomenti;

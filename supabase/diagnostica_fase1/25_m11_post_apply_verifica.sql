-- ============================================================================
-- FASE 1 - M11 - 25 - POST-APPLY - verifica della migration M11
--                    (process_crowd_radar senza scrittura su pois.heat)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
-- Da eseguire DOPO l'apply di
--   supabase/migrations/20261008160000_process_crowd_radar_no_heat_m11.sql
--
-- VALORI ATTESI:
--   prosecdef              = true
--   search_path_pinnato    = true
--   exec_anon              = false
--   exec_public            = false
--   exec_authenticated     = true
--   corpo_usa_auth_uid     = true
--   corpo_guardia_anonima  = true
--   corpo_update           = false   (nessun UPDATE nel corpo)
--   corpo_tocca_pois       = false   (il corpo non referenzia piu' public.pois)
-- ============================================================================
SELECT
  p.prosecdef                                                     AS prosecdef,
  (p.proconfig IS NOT NULL
     AND array_to_string(p.proconfig, ' ') LIKE '%search_path%')  AS search_path_pinnato,
  has_function_privilege('anon',
     'public.process_crowd_radar(uuid, uuid, integer)', 'EXECUTE') AS exec_anon,
  has_function_privilege('public',
     'public.process_crowd_radar(uuid, uuid, integer)', 'EXECUTE') AS exec_public,
  has_function_privilege('authenticated',
     'public.process_crowd_radar(uuid, uuid, integer)', 'EXECUTE') AS exec_authenticated,
  (pg_get_functiondef(p.oid) LIKE '%auth.uid()%')                 AS corpo_usa_auth_uid,
  (pg_get_functiondef(p.oid) LIKE '%chiamata anonima non consentita%')
                                                                   AS corpo_guardia_anonima,
  (pg_get_functiondef(p.oid) LIKE '%UPDATE%')                     AS corpo_update,
  (pg_get_functiondef(p.oid) LIKE '%pois%')                       AS corpo_tocca_pois
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname  = 'process_crowd_radar';

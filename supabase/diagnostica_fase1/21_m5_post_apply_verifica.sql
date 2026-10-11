-- ============================================================================
-- FASE 1 - M5 - 21 - POST-APPLY - verifica della migration M5
--                    (process_crowd_radar)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
-- Da eseguire DOPO l'apply di
--   supabase/migrations/20261008140000_process_crowd_radar_m5.sql
--
-- VALORI ATTESI:
--   prosecdef                   = true
--   search_path_pinnato         = true   (proconfig contiene search_path)
--   exec_anon                   = false  (R1 chiuso)
--   exec_public                 = false  (R1 chiuso: niente grant PUBLIC)
--   exec_authenticated          = true   (unico chiamante ammesso)
--   corpo_usa_auth_uid          = true   (identita' dal JWT)
--   corpo_usa_p_reporter_id     = false  (parametro ignorato nell'INSERT)
--   corpo_guardia_anonima       = true   (RAISE EXCEPTION presente)
--
-- NOTA: il proprietario (postgres) esegue sempre, indipendente dai grant.
-- ============================================================================
SELECT
  p.prosecdef                                                     AS prosecdef,
  (p.proconfig IS NOT NULL
     AND array_to_string(p.proconfig, ' ') LIKE '%search_path%')  AS search_path_pinnato,
  has_function_privilege('anon',
     'public.process_crowd_radar(uuid, uuid, integer)',
     'EXECUTE')                                                   AS exec_anon,
  has_function_privilege('public',
     'public.process_crowd_radar(uuid, uuid, integer)',
     'EXECUTE')                                                   AS exec_public,
  has_function_privilege('authenticated',
     'public.process_crowd_radar(uuid, uuid, integer)',
     'EXECUTE')                                                   AS exec_authenticated,
  (pg_get_functiondef(p.oid) LIKE '%auth.uid()%')                 AS corpo_usa_auth_uid,
  (pg_get_functiondef(p.oid) LIKE '%VALUES (p_poi_id, p_reporter_id%')
                                                                  AS corpo_usa_p_reporter_id,
  (pg_get_functiondef(p.oid) LIKE '%chiamata anonima non consentita%')
                                                                  AS corpo_guardia_anonima
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname  = 'process_crowd_radar';

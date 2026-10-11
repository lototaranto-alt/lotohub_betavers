-- ============================================================================
-- FASE 1 - M15 - 24 - POST-APPLY - verifica del gate anon sulle 5 viste DaaS
-- ============================================================================
-- Sola lettura. Un solo result set (una riga per vista; attese 5 righe).
-- Da eseguire DOPO l'apply di
--   supabase/migrations/20261008150000_daas_views_anon_guard_m15.sql
--
-- VALORI ATTESI (per tutte e 5 le righe):
--   anon_select   = false
--   auth_select   = true
--   svc_select    = true
--   guard         = true    (il guard is_loto_admin() e' nella definizione)
--   rls_attivo    = false   (invariato; le viste si basano sul guard)
-- NOTA: rispetto al precheck 22 la lunghezza (def_length) puo' variare:
--   non e' un' impronta (vedi CB-21). Non e' un criterio di esito.
-- ============================================================================
SELECT v.viewname                                                         AS vista,
       c.relrowsecurity                                                   AS rls_attivo,
       pg_get_userbyid(c.relowner)                                        AS proprietario,
       has_table_privilege('anon',
         'public.' || v.viewname, 'SELECT')                               AS anon_select,
       has_table_privilege('authenticated',
         'public.' || v.viewname, 'SELECT')                               AS auth_select,
       has_table_privilege('service_role',
         'public.' || v.viewname, 'SELECT')                               AS svc_select,
       (pg_get_viewdef(('public.' || v.viewname)::regclass)
          LIKE '%is_loto_admin%')                                         AS guard
  FROM pg_views v
  JOIN pg_class c
    ON c.relname = v.viewname
   AND c.relnamespace = 'public'::regnamespace
 WHERE v.schemaname = 'public'
   AND v.viewname IN ('vw_daas_esg_monthly',
                      'vw_daas_event_attendance',
                      'vw_daas_heatmap_15min',
                      'vw_dev_telemetry_daily',
                      'vw_user_dashboard_metrics')
 ORDER BY v.viewname;

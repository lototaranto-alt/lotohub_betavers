-- ============================================================================
-- FASE 1 - M15 - 22 - PRECHECK - stato delle 5 viste della famiglia DaaS
-- ============================================================================
-- Sola lettura. Un solo result set (una riga per vista; attese 5 righe).
--
-- Perche' esiste: M15 deve verificare che l'accesso alle viste DaaS non sia
-- riapribile. Le migration v22/v23/v24 sono rieseguibili (DROP VIEW +
-- CREATE + GRANT): un re-run RI-CONCEDE SELECT. La barriera vera e' il guard
-- interno `is_loto_admin()` nel corpo di ogni vista (misurato 06/10, §7j).
-- Qui si misura lo stato cloud attuale: RLS, proprietario, grant per ruolo,
-- e se il guard e' ancora dentro la definizione.
--
-- Valori attesi da §7j (06/10) se la cloud e' coerente coi file:
--   rls_attivo = false per tutte e 5; proprietario = postgres
--   def_usa_is_loto_admin = true per tutte e 5
--   def_usa_prefisso_public = false (pg_get_viewdef NON mette il prefisso)
--   def_length: esg 6193, attendance 682, heatmap 1068, telemetry 292,
--               user_dashboard 2551
--   anon_select atteso (dai file v22/v23): esg/attendance/heatmap/dashboard
--               = true; telemetry = false (v24 concede solo auth+service_role)
--
-- ESITO: baseline per decidere se/come stringere i grant (passo 1 di M15) e
-- per il piano del single-point-of-failure `is_loto_admin()` (script 23).
-- ============================================================================
SELECT v.viewname                                                        AS vista,
       c.relrowsecurity                                                  AS rls_attivo,
       pg_get_userbyid(c.relowner)                                       AS proprietario,
       has_table_privilege('anon',
         'public.' || v.viewname, 'SELECT')                              AS anon_select,
       has_table_privilege('authenticated',
         'public.' || v.viewname, 'SELECT')                              AS auth_select,
       has_table_privilege('service_role',
         'public.' || v.viewname, 'SELECT')                              AS service_role_select,
       (pg_get_viewdef(('public.' || v.viewname)::regclass)
          LIKE '%is_loto_admin%')                                        AS def_usa_is_loto_admin,
       (pg_get_viewdef(('public.' || v.viewname)::regclass)
          LIKE '%public.is_loto_admin%')                                 AS def_usa_prefisso_public,
       length(pg_get_viewdef(('public.' || v.viewname)::regclass))       AS def_length
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

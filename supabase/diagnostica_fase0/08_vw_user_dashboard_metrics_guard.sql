-- 08_vw_user_dashboard_metrics_guard.sql
-- Fase 0 - Diagnostica guard vista vw_user_dashboard_metrics (solo SELECT, read-only)
-- RETTIFICA 08/10 (M15): la probe 5 cercava 'or public.is_loto_admin', pattern
-- falso-negativo: pg_get_viewdef restituisce 'OR is_loto_admin()' SENZA prefisso
-- public. (nemmeno la probe 3 col prefisso assente). Formula corretta: senza
-- 'public.'. Lo storico dei risultati del 06/10 resta in STATO-FASE-0 §7j.
SET statement_timeout = 0;
SET lock_timeout = 0;
SET search_path = public, pg_temp;

-- 1) reloptions della vista
SELECT c.relname,
       n.nspname,
       c.reloptions,
       c.relkind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'vw_user_dashboard_metrics';

-- 2) Lunghezza definizione (pg_get_viewdef)
SELECT 'vw_user_dashboard_metrics' AS view_name,
       length(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)) AS def_length;

-- 3) Cerca occorrenze: is_loto_admin
SELECT 'contains_is_loto_admin' AS check_name,
       position('is_loto_admin' IN lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass))) > 0 AS found,
       substr(lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)), greatest(1, position('is_loto_admin' IN lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)))-40), 80) AS snippet;

-- 4) Cerca occorrenze: auth.uid()
SELECT 'contains_auth_uid' AS check_name,
       position('auth.uid()' IN lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass))) > 0 AS found,
       substr(lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)), greatest(1, position('auth.uid()' IN lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)))-40), 80) AS snippet;

-- 5) Cerca occorrenze: OR is_loto_admin  (rettificato 08/10/M15: senza 'public.')
SELECT 'contains_or_is_loto_admin' AS check_name,
       position('or is_loto_admin' IN lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass))) > 0 AS found,
       substr(lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)), greatest(1, position('or is_loto_admin' IN lower(pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass)))-40), 80) AS snippet;

-- 6) Definizione completa (pretty) - read-only
SELECT pg_get_viewdef('public.vw_user_dashboard_metrics'::regclass, true) AS view_def_pretty;

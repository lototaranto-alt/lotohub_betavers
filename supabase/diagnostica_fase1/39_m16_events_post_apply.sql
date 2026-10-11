-- ============================================================================
-- FASE 1 - M16 - 39 - POST-APPLY - events dopo 20261009170000_events_policy_m16.sql
-- ============================================================================
-- Sola lettura. UN SOLO result set (colonne: sezione | oggetto | valore).
-- Attesi:
--   1_POLICY  events.events_read_public  cmd=SELECT roles={} using=true
--   2_GRANT   anon | SELECT = true       ;  authenticated | SELECT = true
--             (INSERT/UPDATE/DELETE restano false)
--   3_RLS     rls=true  forced=false
--   4_ROWCOUNT count(*) >= 1  (stato invitato: 2)  -- conferma leggibilita'
-- ============================================================================
SELECT '1_POLICY' AS sezione,
       p.tablename || '.' || p.policyname AS oggetto,
       'cmd=' || p.cmd || ' | roles=' || p.roles::text
         || ' | using=' || COALESCE(p.qual, '-') || ' | check=' || COALESCE(p.with_check, '-') AS valore
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'events'

UNION ALL

SELECT '2_GRANT', 'anon | SELECT', has_table_privilege('anon', 'public.events', 'SELECT')::text
UNION ALL
SELECT '2_GRANT', 'authenticated | SELECT', has_table_privilege('authenticated', 'public.events', 'SELECT')::text
UNION ALL
SELECT '2_GRANT', 'anon | INSERT', has_table_privilege('anon', 'public.events', 'INSERT')::text
UNION ALL
SELECT '2_GRANT', 'anon | UPDATE', has_table_privilege('anon', 'public.events', 'UPDATE')::text
UNION ALL
SELECT '2_GRANT', 'anon | DELETE', has_table_privilege('anon', 'public.events', 'DELETE')::text
UNION ALL
SELECT '2_GRANT', 'authenticated | INSERT', has_table_privilege('authenticated', 'public.events', 'INSERT')::text
UNION ALL
SELECT '2_GRANT', 'authenticated | UPDATE', has_table_privilege('authenticated', 'public.events', 'UPDATE')::text
UNION ALL
SELECT '2_GRANT', 'authenticated | DELETE', has_table_privilege('authenticated', 'public.events', 'DELETE')::text

UNION ALL

SELECT '3_RLS', c.relname,
       'rls=' || c.relrowsecurity::text || ' | forced=' || c.relforcerowsecurity::text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'events'

UNION ALL

SELECT '4_ROWCOUNT', 'count(*)', count(*)::text FROM public.events

ORDER BY sezione, oggetto;
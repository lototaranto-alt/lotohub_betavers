-- ============================================================================
-- FASE 1 - M10 - 35b - PRECHECK - stato RLS pre-migration di badges
-- ============================================================================
-- Sola lettura. UN SOLO result set.
-- Il precheck 35 non copriva lo stato RLS. Serve per descrivere il comportamento
-- ATTUALE (con 0 policy: se RLS ON -> tutto negato; se OFF -> tutto aperto).
-- Eseguire PRIMA di 20261009160000_badges_m10.sql.
-- ============================================================================
SELECT c.relname,
       c.relrowsecurity      AS rls_on,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('badges', 'badge_templates', 'user_badges')
ORDER BY c.relname;
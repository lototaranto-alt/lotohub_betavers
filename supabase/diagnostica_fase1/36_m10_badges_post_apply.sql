-- ============================================================================
-- FASE 1 - M10 - 36 - POST-APPLY - catena badge dopo 20261009160000_badges_m10.sql
-- ============================================================================
-- Sola lettura. UN SOLO result set (colonna `sezione`).
-- Attesi:
--   1_FK      oggetto=user_badges_badge_id_fkey, valore=FOREIGN KEY (badge_id)
--             REFERENCES badges(id) ON DELETE CASCADE
--   2_RLS     rls=true su badges, user_badges, badge_templates
--   3_POLICY  badges: badges_read_catalog (select); user_badges: select_own +
--             insert_own (authenticated); badge_templates: NESSUNA
--   4_GRANT   badge_templates | anon/authenticated | SELECT = false (revocato)
--   5_FUNZIONE claim_badges() secdef=true, conflict=true (ON CONFLICT),
--             exec_anon=false, exec_authenticated=true
-- Nota: la colonna "valore" del SELECT 1 e' valorizzata solo quando esiste il
-- vincolo con quel nome (altrimenti riga assente).
-- ============================================================================
SELECT '1_FK' AS sezione,
       'user_badges_badge_id_fkey' AS oggetto,
       pg_get_constraintdef(c.oid) AS valore
FROM pg_constraint c
WHERE c.conrelid = 'public.user_badges'::regclass
  AND c.conname  = 'user_badges_badge_id_fkey'

UNION ALL

SELECT '2_RLS', c.relname,
       'rls=' || c.relrowsecurity::text || ' | forced=' || c.relforcerowsecurity::text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('badges', 'badge_templates', 'user_badges')

UNION ALL

SELECT '3_POLICY', p.tablename || '.' || p.policyname,
       'cmd=' || p.cmd || ' | roles=' || p.roles::text
         || ' | using=' || COALESCE(p.qual, '-') || ' | check=' || COALESCE(p.with_check, '-')
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('badges', 'badge_templates', 'user_badges')

UNION ALL

SELECT '4_GRANT', 'badge_templates | anon | SELECT',
       has_table_privilege('anon', 'public.badge_templates', 'SELECT')::text
UNION ALL
SELECT '4_GRANT', 'badge_templates | authenticated | SELECT',
       has_table_privilege('authenticated', 'public.badge_templates', 'SELECT')::text

UNION ALL

SELECT '5_FUNZIONE', p.proname, 
       'secdef=' || p.prosecdef::text
         || ' | conflict=' || (p.prosrc ~ 'ON CONFLICT')::text
         || ' | exec_anon=' || has_function_privilege('anon', 'public.claim_badges()', 'EXECUTE')::text
         || ' | exec_auth=' || has_function_privilege('authenticated', 'public.claim_badges()', 'EXECUTE')::text
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'claim_badges'

ORDER BY sezione, oggetto;
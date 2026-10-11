-- ============================================================================
-- FASE 1 - M10 - 35 - PRECHECK badge: struttura, policy, vincoli, accesso
-- ============================================================================
-- Sola lettura. UN SOLO result set (colonna `sezione` per orientarsi).
-- Da eseguire PRIMA di qualunque migration/refactor di M10.
--
-- Sezioni:
--   1_COLONNA    -> colonne reali di badges / badge_templates / user_badges
--   2_POLICY     -> policy RLS (atteso: 0 su badges e user_badges)
--   3_CONSTRAINT -> PK/FK/CHECK (l'attuale `user_badges.badge_id -> badge_templates`
--                   e il SUO NOME, che serve al DROP CONSTRAINT esplicito)
--   4_ROWCOUNT   -> righe (atteso badges=3, badge_templates=0, user_badges=0)
--   5_GRANT      -> privilegi tabellari di anon/authenticated
--   6_FUNZIONE   -> funzioni che citano i badge (esiste gia' un server-side?)
--
-- Decisione collegata: R1 (unificare su `badges`, FK riportata su `badges.id`)
-- vs R2 (migrare nel morto `badge_templates`). I fatti sotto la sostengono.
-- ============================================================================
SELECT '1_COLONNA' AS sezione,
       c.table_name || '.' || c.column_name AS oggetto,
       c.data_type || ' | null=' || c.is_nullable || ' | def=' || COALESCE(c.column_default, '-') AS dettaglio
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('badges', 'badge_templates', 'user_badges')

UNION ALL

SELECT '2_POLICY',
       p.tablename || '.' || p.policyname,
       'cmd=' || p.cmd || ' | roles=' || p.roles::text
         || ' | using=' || COALESCE(p.qual, '-') || ' | check=' || COALESCE(p.with_check, '-')
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('badges', 'badge_templates', 'user_badges')

UNION ALL

SELECT '3_CONSTRAINT',
       c.conrelid::regclass::text || '.' || c.conname,
       'type=' || c.contype::text || ' | ' || pg_get_constraintdef(c.oid)
FROM pg_constraint c
WHERE c.connamespace = 'public'::regnamespace
  AND c.conrelid IN ('public.badges'::regclass,
                     'public.badge_templates'::regclass,
                     'public.user_badges'::regclass)

UNION ALL
SELECT '4_ROWCOUNT', 'public.badges',          count(*)::text FROM public.badges
UNION ALL
SELECT '4_ROWCOUNT', 'public.badge_templates', count(*)::text FROM public.badge_templates
UNION ALL
SELECT '4_ROWCOUNT', 'public.user_badges',     count(*)::text FROM public.user_badges

UNION ALL

SELECT '5_GRANT',
       t.tbl || ' | ' || r.role || ' | ' || p.priv,
       'concesso'
FROM (VALUES ('badges'), ('badge_templates'), ('user_badges')) AS t(tbl)
CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(role)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(priv)
WHERE has_table_privilege(r.role, 'public.' || t.tbl, p.priv)

UNION ALL

SELECT '6_FUNZIONE',
       p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
       'secdef=' || p.prosecdef::text || ' | config=' || COALESCE(p.proconfig::text, 'null')
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (p.proname ILIKE '%badge%' OR p.prosrc ILIKE '%user_badges%' OR p.prosrc ILIKE '%badges%')

ORDER BY sezione, oggetto;

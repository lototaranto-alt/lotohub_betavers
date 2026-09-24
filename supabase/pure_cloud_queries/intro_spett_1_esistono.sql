-- ============================================================
-- 1) ESISTONO le tabelle? (base, non fallisce mai)
-- ============================================================
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_badges', 'badges', 'civic_reports', 'user_itineraries', 'impact_transactions')
ORDER BY tablename;
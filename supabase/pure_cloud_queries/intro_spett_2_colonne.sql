-- ============================================================
-- 2) Colonne di user_badges e badges (se presenti)
-- ============================================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('user_badges', 'badges')
ORDER BY table_name, ordinal_position;
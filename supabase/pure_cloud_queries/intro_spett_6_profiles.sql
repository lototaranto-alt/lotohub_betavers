-- ============================================================
-- 6) Colonne REALI per le metriche badge (profili + scan checkin)
-- ============================================================
SELECT 'profiles' AS tabella, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
-- ============================================================
-- 7) Colonne REALI check-in e transazioni (metriche badge/azione)
-- ============================================================
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('user_pois', 'impact_transactions', 'civic_reports', 'events')
ORDER BY table_name, ordinal_position;
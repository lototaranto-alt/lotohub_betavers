-- ============================================================
-- 5) CHI scrive su user_badges (trigger + colonne) ?
-- ============================================================
SELECT event_object_table AS tabella, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('user_badges', 'civic_reports', 'user_pois')
ORDER BY event_object_table, trigger_name;
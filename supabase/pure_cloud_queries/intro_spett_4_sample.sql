-- ============================================================
-- 4) Sample righe user_badges (badge_id reali + data)
-- ============================================================
SELECT ub.user_id, ub.badge_id, ub.awarded_at, b.name AS badge_name
FROM user_badges ub
LEFT JOIN badges b ON b.id = ub.badge_id
LIMIT 20;
-- ============================================================
-- 3b) Quali badge sono stati ASSEGNATI agli utenti (badge_id gia' usati)
-- ============================================================
SELECT badge_id, COUNT(*) AS assegnati
FROM user_badges
GROUP BY badge_id
ORDER BY assegnati DESC;
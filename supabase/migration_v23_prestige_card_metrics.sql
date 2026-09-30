-- =========================================================================
-- migration_v23_prestige_card_metrics.sql
-- ADB 2 - METRICHE PRESTIGE CARD CALCOLATE LATO DB (SSOT)
-- =========================================================================
-- La Prestige Card smette di leggere le colonne statiche di profiles
-- (pois_discovered / total_co2 / total_tokens / total_xp) e legge le
-- metriche CALCOLATE real-time dalle tabelle log:
--   user_pois (poi scoperti, checkin oggi, CO2 da GPS)
--   impact_transactions (PTI, CO2 da ledger, litri, XP)
--   user_badges (badge assegnati)
-- Il client fa UNA query (maybeSingle) invece di 5 query separate.
--
-- Sorgenti REALI (verificate da types/database.ts):
--   user_pois(profile_id, poi_id, visited_at, co2_saved, xp_awarded, is_shadowbanned)
--   impact_transactions(profile_id, co2_saved, liters_saved, tokens_earned, xp_earned, created_at)
--   user_badges(user_id, awarded_at)
--
-- Idempotente: ri-eseguibile (DROP IF EXISTS + CREATE).
-- =========================================================================

-- =========================================================================
-- SEZIONE 2 - METRICHE PRESTIGE CARD PERSONALE (calcolate lato DB, SSOT)
-- =========================================================================

-- 2.1 Vista unica per la Prestige Card: sostituisce la lettura di colonne
--     statiche di profiles (pois_discovered / total_co2 / total_tokens /
--     total_xp) con aggregazioni REALI dalle tabelle log. La card legge UNA
--     riga per-utente (niente piu' 5 query separate nel client).
DROP VIEW IF EXISTS public.vw_user_dashboard_metrics;
CREATE VIEW public.vw_user_dashboard_metrics AS
WITH poi_agg AS (
    SELECT
        profile_id,
        COUNT(DISTINCT poi_id)                       AS pois_discovered,
        COUNT(*) FILTER (WHERE visited_at::date = CURRENT_DATE) AS checkins_today,
        SUM(COALESCE(co2_saved, 0))                  AS co2_saved_gps,
        SUM(COALESCE(xp_awarded, 0))                 AS xp_gps,
        MAX(visited_at)                              AS last_poi_visit
    FROM public.user_pois
    WHERE is_shadowbanned IS NOT TRUE
      AND visited_at IS NOT NULL
    GROUP BY profile_id
),
tx_agg AS (
    SELECT
        profile_id,
        SUM(COALESCE(co2_saved, 0))    AS co2_saved_ledger,
        SUM(COALESCE(liters_saved, 0)) AS liters_saved,
        SUM(COALESCE(tokens_earned, 0)) AS tokens,
        SUM(COALESCE(xp_earned, 0))    AS xp_ledger,
        COUNT(*)                        AS transactions,
        MAX(created_at)                 AS last_tx
    FROM public.impact_transactions
    WHERE created_at IS NOT NULL
    GROUP BY profile_id
),
badge_agg AS (
    SELECT
        user_id,
        COUNT(*) AS badges_count,
        MAX(awarded_at) AS last_badge_at
    FROM public.user_badges
    WHERE awarded_at IS NOT NULL
    GROUP BY user_id
)
SELECT
    p.id                                                    AS profile_id,
    p.nickname,
    COALESCE(poi.pois_discovered, 0)                        AS pois_discovered,
    COALESCE(poi.checkins_today, 0)                         AS checkins_today,
    COALESCE(tx.tokens, 0)                                  AS tokens,
    ROUND((COALESCE(tx.co2_saved_ledger, 0) + COALESCE(poi.co2_saved_gps, 0))::numeric, 2) AS co2_saved,
    COALESCE(tx.liters_saved, 0)                            AS liters_saved,
    COALESCE(tx.xp_ledger, 0) + COALESCE(poi.xp_gps, 0)     AS total_xp,
    COALESCE(bad.badges_count, 0)                           AS badges_count,
    GREATEST(bad.last_badge_at, poi.last_poi_visit, tx.last_tx) AS last_activity_at
FROM public.profiles p
LEFT JOIN poi_agg poi ON poi.profile_id = p.id
LEFT JOIN tx_agg tx   ON tx.profile_id = p.id
LEFT JOIN badge_agg bad ON bad.user_id = p.id;

GRANT SELECT ON public.vw_user_dashboard_metrics TO postgres, anon, authenticated, service_role;
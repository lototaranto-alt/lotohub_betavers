-- =========================================================================
-- migration_v22_daas_vendite.sql
-- ADB 2 - REPORT DAAS VENDIBILI (dati destinati alla vendita alle agenzie)
-- =========================================================================
-- Target (richiesta utente 24/09): dati VENDUTI alle agenzie (DaaS):
--   - Decongestione (PA):      vw_daas_heatmap_15min
--   - Impatto (B2B/Custodi):   vw_daas_esg_monthly
--   - Attivazione (Assoc.):    vw_daas_event_attendance
-- Offuscamento grid 110m + time-bucketing 15 min (SSOT: LOTO_HUB_SSOT_DEFINITIVO.md).
--
-- Sorgenti REALI (verificate da types/database.ts):
--   user_pois(lat, lng, visited_at, co2_saved, xp_awarded, is_shadowbanned, profile_id)
--   impact_transactions(co2_saved, liters_saved, tokens_earned, xp_earned, created_at, profile_id)
--   events(poi_id, event_date, start_time, tenant_id)
--   civic_reports(status, created_at, tenant_id)
--
-- Idempotente: ri-eseguibile (DROP IF EXISTS + CREATE).
-- =========================================================================

-- =========================================================================
-- SEZIONE 1 - REPORT DAAS VENDIBILI (anonimi, offuscati, aggregati)
-- =========================================================================

-- 1.1 HEATMAP DECONGESTIONE (Report PA): griglia ~110m + bucket 15 minuti.
--     Esclusi i check-in shadowbanned. Nessuna colonna identificativa utente.
DROP VIEW IF EXISTS public.vw_daas_heatmap_15min;
CREATE VIEW public.vw_daas_heatmap_15min AS
SELECT
    ROUND(up.lat::numeric, 3)::double precision            AS grid_lat,   -- ~110m cella
    ROUND(up.lng::numeric, 3)::double precision            AS grid_lng,
    DATE_TRUNC('hour', up.visited_at) + INTERVAL '15 min' * (EXTRACT(minute FROM up.visited_at)::int / 15) AS time_block,
    up.poi_id,
    COUNT(*)                                                AS checkins,
    COUNT(DISTINCT up.profile_id)                           AS unique_visitors,
    SUM(COALESCE(up.co2_saved, 0))                          AS co2_saved_kg
FROM public.user_pois up
WHERE up.is_shadowbanned IS NOT TRUE
  AND up.lat IS NOT NULL
  AND up.lng IS NOT NULL
  AND up.visited_at IS NOT NULL
GROUP BY grid_lat, grid_lng, time_block, up.poi_id;

GRANT SELECT ON public.vw_daas_heatmap_15min TO postgres, anon, authenticated, service_role;

-- 1.2 REPORT ESG MENSILE (Report B2B/Custodi): somme reali dal ledger.
--     Nessun coefficiente inventato: le colonne sono quelle prodotte dal
--     motore impatto (`impact_transactions`) e dagli scan (`user_pois`).
DROP VIEW IF EXISTS public.vw_daas_esg_monthly;
CREATE VIEW public.vw_daas_esg_monthly AS
WITH tx_month AS (
    SELECT
        DATE_TRUNC('month', it.created_at) AS month,
        COUNT(*)                                AS checkins,
        COUNT(DISTINCT it.profile_id)           AS active_users,
        SUM(COALESCE(it.co2_saved, 0))          AS co2_saved,
        SUM(COALESCE(it.liters_saved, 0))       AS liters_saved,
        SUM(COALESCE(it.tokens_earned, 0))      AS pti_generated,
        SUM(COALESCE(it.xp_earned, 0))          AS xp_earned
    FROM public.impact_transactions it
    WHERE it.created_at IS NOT NULL
    GROUP BY DATE_TRUNC('month', it.created_at)
),
gps_month AS (
    SELECT
        DATE_TRUNC('month', up.visited_at) AS month,
        COUNT(*)                                AS checkins,
        COUNT(DISTINCT up.profile_id)           AS active_users,
        SUM(COALESCE(up.co2_saved, 0))          AS co2_saved
    FROM public.user_pois up
    WHERE up.is_shadowbanned IS NOT TRUE
      AND up.visited_at IS NOT NULL
    GROUP BY DATE_TRUNC('month', up.visited_at)
),
civic_month AS (
    SELECT
        DATE_TRUNC('month', cr.created_at) AS month,
        COUNT(*) FILTER (WHERE cr.status IN ('confirmed', 'verified', 'resolved')) AS confirmed_reports,
        COUNT(*) FILTER (WHERE cr.status = 'pending_match')                          AS pending_reports
    FROM public.civic_reports cr
    WHERE cr.created_at IS NOT NULL
    GROUP BY DATE_TRUNC('month', cr.created_at)
)
SELECT
    COALESCE(t.month, g.month) AS month,
    COALESCE(t.checkins, 0) + COALESCE(g.checkins, 0)                AS checkins,
    COALESCE(
        (SELECT COUNT(DISTINCT profile_id) FROM (
            SELECT profile_id FROM public.impact_transactions WHERE to_char(created_at, 'YYYY-MM') = to_char(COALESCE(t.month, g.month), 'YYYY-MM')
            UNION
            SELECT profile_id FROM public.user_pois WHERE to_char(visited_at, 'YYYY-MM') = to_char(COALESCE(t.month, g.month), 'YYYY-MM') AND is_shadowbanned IS NOT TRUE
        ) u), 0)                                                   AS active_users,
    COALESCE(t.co2_saved, 0) + COALESCE(g.co2_saved, 0)              AS co2_saved,
    COALESCE(t.liters_saved, 0)                                      AS liters_saved,
    COALESCE(t.pti_generated, 0)                                     AS pti_generated,
    COALESCE(t.xp_earned, 0)                                         AS xp_earned,
    COALESCE(c.confirmed_reports, 0)                                 AS confirmed_reports,
    COALESCE(c.pending_reports, 0)                                   AS pending_reports
FROM tx_month t
FULL JOIN gps_month g   ON t.month = g.month
FULL JOIN civic_month c ON COALESCE(t.month, g.month) = c.month
ORDER BY month DESC;

GRANT SELECT ON public.vw_daas_esg_monthly TO postgres, anon, authenticated, service_role;

-- 1.3 ATTIVAZIONE EVENTI (Report Associazioni): affluenza certificata
--     sui POI legati a eventi pubblici (fisica, da scan GPS).
DROP VIEW IF EXISTS public.vw_daas_event_attendance;
CREATE VIEW public.vw_daas_event_attendance AS
SELECT
    e.id                       AS event_id,
    e.tenant_id,
    e.title                    AS event_title,
    e.event_date,
    e.poi_id,
    COUNT(up.id)               AS checkins,
    COUNT(DISTINCT up.profile_id) AS participants,
    SUM(COALESCE(up.co2_saved, 0)) AS co2_saved
FROM public.events e
LEFT JOIN public.user_pois up
    ON up.poi_id = e.poi_id
    AND up.visited_at::date = COALESCE(e.event_date::date, e.start_time::date)
    AND up.is_shadowbanned IS NOT TRUE
WHERE e.event_type = 'web_public'
GROUP BY e.id, e.tenant_id, e.title, e.event_date, e.poi_id;

GRANT SELECT ON public.vw_daas_event_attendance TO postgres, anon, authenticated, service_role;

-- =========================================================================
-- SEZIONE CONTROLLI (rieseguire = nessun errore => viste DaaS pronte)
-- =========================================================================
SELECT table_name AS vista FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('vw_daas_heatmap_15min','vw_daas_esg_monthly','vw_daas_event_attendance')
ORDER BY table_name;
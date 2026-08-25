-- =========================================================================
-- Modulo Admin Dash: Analitiche Check-in
-- =========================================================================

-- Vista aggregata per il totale dei check-in per ogni POI
CREATE OR REPLACE VIEW public.vw_admin_checkins_analytics AS
SELECT 
    p.id AS poi_id,
    p.name AS poi_name,
    p.category,
    p.is_recommended,
    COUNT(up.poi_id) AS total_checkins,
    MAX(up.visited_at) AS last_checkin
FROM public.pois p
LEFT JOIN public.user_pois up ON p.id = up.poi_id
GROUP BY p.id, p.name, p.category, p.is_recommended;

GRANT SELECT ON public.vw_admin_checkins_analytics TO service_role;

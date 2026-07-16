-- =========================================================================================
-- MASTER RESTORE SCRIPT v2: ASSET POI, METE CONSIGLIATE, ESG & GAMIFICATION
-- =========================================================================================

-- ==========================================
-- 1. RIPRISTINO ASSET GRAFICI E "METE CONSIGLIATE"
-- ==========================================
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Ripopolamento dati immagini e descrizioni (mock) e attivazione Mete Consigliate
UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/tempio.jpg',
    description = 'Antico tempio greco con colonne doriche risalenti al VI sec. a.C. Un tuffo nella Magna Grecia.',
    is_recommended = true
WHERE name ILIKE '%Tempio di Poseidone%';

UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/saturo.jpg',
    description = 'Vasto parco archeologico affacciato sul mare, culla dell antico insediamento spartano.',
    is_recommended = true
WHERE name ILIKE '%Parco Archeologico di Saturo%';

UPDATE public.pois SET image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/placeholder.jpg' WHERE image_url IS NULL;

-- Ricreazione VIEW vw_pois_frontend
DROP VIEW IF EXISTS public.vw_pois_frontend CASCADE;
CREATE VIEW public.vw_pois_frontend AS
SELECT 
    p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius,
    p.loto_quota_max, p.is_accessible, p.is_active,
    p.image_url, p.description, p.short_description, p.is_recommended,
    ST_Y(p.coords::geometry) AS lat, ST_X(p.coords::geometry) AS lng,
    p.territory_id, LOWER(t.name) AS tenant_id
FROM public.pois p
LEFT JOIN public.territories t ON p.territory_id = t.id;

-- Ricreazione RPC get_pois
DROP FUNCTION IF EXISTS get_pois();
CREATE FUNCTION get_pois()
RETURNS TABLE (
    id UUID, name TEXT, category TEXT, layer_name TEXT, xp_reward INTEGER,
    checkin_radius INTEGER, crowd_level INTEGER, has_water BOOLEAN, is_accessible BOOLEAN,
    latitude FLOAT8, longitude FLOAT8, p_iva TEXT, image_url TEXT, description TEXT, is_recommended BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius,
        p.crowd_level, p.has_water, p.is_accessible,
        ST_Y(p.coords::geometry) as latitude, ST_X(p.coords::geometry) as longitude,
        p.p_iva, p.image_url, p.description, p.is_recommended
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 2. RIPRISTINO SFIDE (TENANT EVENTS)
-- ==========================================
DELETE FROM public.tenant_events WHERE tenant_id = 'taranto';

INSERT INTO public.tenant_events (tenant_id, event_type, title, description, short_description, banner_url, icon_emoji, starts_at, ends_at, status) VALUES 
('taranto', 'cultural_night', 'Notte Bianca dei Musei', 'Apertura straordinaria dei musei di Taranto.', 'Musei aperti e performance live', 'https://lotohub.s3.amazonaws.com/events/taranto_notte_bianca.jpg', '🏛️', now() - interval '1 day', now() + interval '5 days', 'active'),
('taranto', 'community_challenge', 'Eco-Passeggiata al Saturo', 'Aiutaci a ripulire il parco archeologico. Bonus XP x3 per i check-in.', 'Pulizia del parco con bonus XP x3', 'https://lotohub.s3.amazonaws.com/events/taranto_eco.jpg', '🌿', now() - interval '2 days', now() + interval '10 days', 'active');


-- ==========================================
-- 3. RIPRISTINO ESG E SCANS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scans ADD COLUMN IF NOT EXISTS mobility_type TEXT DEFAULT 'walk';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS co2_saved NUMERIC(10,4) DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS pti_earned INT DEFAULT 10;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS xp_earned INT DEFAULT 15;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS xp_awarded INT DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'taranto';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS lng NUMERIC;

CREATE OR REPLACE FUNCTION process_scan_esg_and_pti()
RETURNS TRIGGER AS $$
DECLARE
    last_scan_time TIMESTAMP; time_diff_minutes FLOAT; estimated_km NUMERIC; co2_coeff NUMERIC; calculated_co2 NUMERIC;
BEGIN
    SELECT MAX(created_at) INTO last_scan_time FROM scans WHERE user_id = NEW.user_id AND id != NEW.id;
    IF last_scan_time IS NULL THEN estimated_km := 0.5;
    ELSE
        time_diff_minutes := EXTRACT(EPOCH FROM (NEW.created_at - last_scan_time)) / 60;
        estimated_km := CASE WHEN time_diff_minutes > 5 THEN 0.5 ELSE 0.2 END;
    END IF;
    co2_coeff := CASE NEW.mobility_type WHEN 'bike' THEN 0.10 WHEN 'public' THEN 0.08 ELSE 0.12 END;
    calculated_co2 := ROUND((estimated_km * co2_coeff)::numeric, 4);

    NEW.co2_saved := calculated_co2; NEW.pti_earned := 10; NEW.xp_earned := 15;

    UPDATE profiles SET
        total_tokens = COALESCE(total_tokens, 0) + 10,
        total_xp = COALESCE(total_xp, 0) + 15,
        total_co2 = COALESCE(total_co2, 0) + calculated_co2
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scan_esg_pti ON scans;
CREATE TRIGGER trigger_scan_esg_pti BEFORE INSERT ON scans FOR EACH ROW EXECUTE FUNCTION process_scan_esg_and_pti();


-- ==========================================
-- 4. RIPRISTINO VIEW REPORT E HEATMAP
-- ==========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS heatmap_15min_grid AS
SELECT 
  tenant_id, ROUND(lat::numeric, 3) AS grid_lat, ROUND(lng::numeric, 3) AS grid_lng,
  DATE_TRUNC('hour', created_at) + INTERVAL '15 min' * (EXTRACT(minute FROM created_at)::int / 15) AS time_block,
  COUNT(DISTINCT user_id) AS unique_users, COUNT(*) AS total_scans, SUM(COALESCE(co2_saved, 0)) AS co2_saved_block
FROM scans WHERE lat IS NOT NULL AND lng IS NOT NULL
GROUP BY tenant_id, grid_lat, grid_lng, time_block;

CREATE UNIQUE INDEX IF NOT EXISTS idx_heatmap_grid ON heatmap_15min_grid (tenant_id, grid_lat, grid_lng, time_block);

CREATE OR REPLACE VIEW esg_report_monthly AS
WITH scan_stats AS (
  SELECT tenant_id, DATE_TRUNC('month', created_at) AS month, COUNT(*) AS total_scans, COUNT(DISTINCT user_id) AS active_users, SUM(COALESCE(co2_saved, 0)) AS co2_saved
  FROM scans GROUP BY tenant_id, DATE_TRUNC('month', created_at)
), civic_stats AS (
  SELECT tenant_id, DATE_TRUNC('month', created_at) AS month, COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_reports, COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_reports
  FROM civic_reports GROUP BY tenant_id, DATE_TRUNC('month', created_at)
)
SELECT s.tenant_id, s.month, s.active_users, s.total_scans, s.co2_saved, COALESCE(c.confirmed_reports, 0) AS confirmed_reports, COALESCE(c.resolved_reports, 0) AS resolved_reports
FROM scan_stats s
LEFT JOIN civic_stats c ON s.tenant_id = c.tenant_id AND s.month = c.month;

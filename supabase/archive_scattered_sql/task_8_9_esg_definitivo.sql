-- ============================================================
-- SCRIPT DEFINITIVO ESG LEAN (v1.0)
-- Senza PostGIS — pronto per Supabase Free
-- ============================================================

-- 1. SCHEMA scans (colonne ESG)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS mobility_type TEXT DEFAULT 'walk';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS co2_saved NUMERIC(10,4) DEFAULT 0;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS pti_earned INT DEFAULT 10;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS xp_earned INT DEFAULT 15;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'taranto';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS lng NUMERIC;

-- 2. TRIGGER scans: CO2 + PTI + XP
CREATE OR REPLACE FUNCTION process_scan_esg_and_pti()
RETURNS TRIGGER AS $$
DECLARE
    last_scan_time TIMESTAMP;
    time_diff_minutes FLOAT;
    estimated_km NUMERIC;
    co2_coeff NUMERIC;
    calculated_co2 NUMERIC;
BEGIN
    SELECT MAX(created_at) INTO last_scan_time
    FROM scans WHERE user_id = NEW.user_id AND id != NEW.id;

    IF last_scan_time IS NULL THEN
        estimated_km := 0.5;
    ELSE
        time_diff_minutes := EXTRACT(EPOCH FROM (NEW.created_at - last_scan_time)) / 60;
        estimated_km := CASE WHEN time_diff_minutes > 5 THEN 0.5 ELSE 0.2 END;
    END IF;

    co2_coeff := CASE NEW.mobility_type
        WHEN 'bike' THEN 0.10
        WHEN 'public' THEN 0.08
        ELSE 0.12
    END;

    calculated_co2 := ROUND((estimated_km * co2_coeff)::numeric, 4);

    NEW.co2_saved := calculated_co2;
    NEW.pti_earned := 10;
    NEW.xp_earned := 15;

    UPDATE profiles SET
        total_tokens = COALESCE(total_tokens, 0) + 10,
        total_xp = COALESCE(total_xp, 0) + 15,
        total_co2 = COALESCE(total_co2, 0) + calculated_co2
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scan_esg_pti ON scans;
CREATE TRIGGER trigger_scan_esg_pti
    BEFORE INSERT ON scans
    FOR EACH ROW EXECUTE FUNCTION process_scan_esg_and_pti();

-- 3. TRIGGER civic: PTI Due Testimoni
CREATE OR REPLACE FUNCTION award_civic_pti()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending_match' THEN
        UPDATE profiles SET total_tokens = COALESCE(total_tokens, 0) + 50 WHERE id = NEW.user_id;
        IF NEW.matched_report_id IS NOT NULL THEN
            UPDATE profiles SET total_tokens = COALESCE(total_tokens, 0) + 50
            WHERE id = (SELECT user_id FROM civic_reports WHERE id = NEW.matched_report_id);
        END IF;
    END IF;
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        UPDATE profiles SET total_tokens = COALESCE(total_tokens, 0) + 100 WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_civic_pti ON civic_reports;
CREATE TRIGGER trigger_award_civic_pti
    AFTER UPDATE OF status ON civic_reports
    FOR EACH ROW EXECUTE FUNCTION award_civic_pti();

-- 4. HEATMAP GDPR (senza PostGIS)
CREATE MATERIALIZED VIEW IF NOT EXISTS heatmap_15min_grid AS
SELECT 
  tenant_id,
  ROUND(lat::numeric, 3) AS grid_lat,
  ROUND(lng::numeric, 3) AS grid_lng,
  DATE_TRUNC('hour', created_at) + INTERVAL '15 min' * (EXTRACT(minute FROM created_at)::int / 15) AS time_block,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) AS total_scans,
  SUM(COALESCE(co2_saved, 0)) AS co2_saved_block
FROM scans
WHERE lat IS NOT NULL AND lng IS NOT NULL
GROUP BY tenant_id, grid_lat, grid_lng, time_block;

-- FIX OBBLIGATORIO PER POSTGRESQL: Le materialized view richiedono un indice univoco per essere "refreshate" CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_heatmap_grid ON heatmap_15min_grid (tenant_id, grid_lat, grid_lng, time_block);

CREATE OR REPLACE FUNCTION refresh_heatmap()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY heatmap_15min_grid;
END;
$$ LANGUAGE plpgsql;

-- 5. REPORT ESG MENSILE
CREATE OR REPLACE VIEW esg_report_monthly AS
WITH scan_stats AS (
  SELECT 
    tenant_id, DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS total_scans, COUNT(DISTINCT user_id) AS active_users,
    SUM(COALESCE(co2_saved, 0)) AS co2_saved
  FROM scans GROUP BY tenant_id, DATE_TRUNC('month', created_at)
),
civic_stats AS (
  SELECT 
    tenant_id, DATE_TRUNC('month', created_at) AS month,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_reports,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_reports
  FROM civic_reports GROUP BY tenant_id, DATE_TRUNC('month', created_at)
)
SELECT 
  s.tenant_id, s.month, s.active_users, s.total_scans, s.co2_saved,
  COALESCE(c.confirmed_reports, 0) AS confirmed_reports,
  COALESCE(c.resolved_reports, 0) AS resolved_reports
FROM scan_stats s
LEFT JOIN civic_stats c ON s.tenant_id = c.tenant_id AND s.month = c.month
ORDER BY s.month DESC;

-- VERIFICA CORRETTA
SELECT 'OK' AS status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'scans' AND column_name IN ('mobility_type','co2_saved','pti_earned','xp_earned','tenant_id', 'lat', 'lng')) AS scans_cols_attesi_7,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname IN ('trigger_scan_esg_pti','trigger_award_civic_pti')) AS triggers_attesi_2,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'esg_report_monthly') +
  (SELECT COUNT(*) FROM pg_matviews WHERE matviewname = 'heatmap_15min_grid') AS views_attesi_2;

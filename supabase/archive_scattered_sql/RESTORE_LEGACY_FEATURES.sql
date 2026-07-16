-- ============================================================
-- TASK 2: Campi XP e CO2 in profiles
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2 NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Trigger: aggiorna level automaticamente quando total_xp cambia
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := CASE
        WHEN NEW.total_xp >= 5000 THEN 5
        WHEN NEW.total_xp >= 2500 THEN 4
        WHEN NEW.total_xp >= 1000 THEN 3
        WHEN NEW.total_xp >= 500 THEN 2
        ELSE 1
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica solo se il trigger non esiste giÃ 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_level'
    ) THEN
        CREATE TRIGGER trigger_update_level
            BEFORE UPDATE OF total_xp ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_user_level();
    END IF;
END $$;

-- Verifica
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('total_xp', 'total_co2', 'level', 'total_tokens');

-- ============================================================
-- TASK 3: Badge Esplorazione (XP-based)
-- ============================================================

-- 1. Aggiorna i check constraints in sicurezza
DO $$
BEGIN
    -- Rimuovi e ricrea il constraint per CATEGORY
    ALTER TABLE badge_templates DROP CONSTRAINT IF EXISTS badge_templates_category_check;
    ALTER TABLE badge_templates ADD CONSTRAINT badge_templates_category_check 
        CHECK (category IN ('civic_commitment', 'civic_impact', 'exploration'));

    -- Rimuovi e ricrea il constraint per THRESHOLD_TYPE 
    -- (Includiamo i valori storici trovati: confirmed_count, reports_count)
    ALTER TABLE badge_templates DROP CONSTRAINT IF EXISTS badge_templates_threshold_type_check;
    ALTER TABLE badge_templates ADD CONSTRAINT badge_templates_threshold_type_check 
        CHECK (threshold_type IN ('confirmed_count', 'reports_count', 'xp_total'));
END $$;

-- 2. Inserisci badge esplorazione
INSERT INTO badge_templates (id, category, level, threshold_type, threshold_value, pti_bonus, icon_name, color_hex)
VALUES 
('explore_1', 'exploration', 1, 'xp_total', 100, 0, 'map', '#4A90D9'),
('explore_2', 'exploration', 2, 'xp_total', 500, 0, 'compass', '#5BA85C'),
('explore_3', 'exploration', 3, 'xp_total', 1000, 0, 'star', '#D4A017'),
('explore_4', 'exploration', 4, 'xp_total', 2500, 0, 'crown', '#E74C3C'),
('explore_5', 'exploration', 5, 'xp_total', 5000, 0, 'gem', '#9B59B6')
ON CONFLICT (id) DO NOTHING;

-- 3. Localizzazione Taranto
INSERT INTO badge_localizations (tenant_id, badge_template_id, name, description, lore)
VALUES 
('taranto', 'explore_1', 'Viaggiatore', 'Hai mosso i primi passi nella cittÃ  dei due mari.', 'Ogni grande viaggio inizia con un singolo passo.'),
('taranto', 'explore_2', 'Esploratore', 'Le strade di Taranto non hanno piÃ¹ segreti per te.', 'I naviganti antichi conoscevano ogni insenatura.'),
('taranto', 'explore_3', 'Avventuriero', 'Hai scoperto tesori nascosti che pochi conoscono.', 'Solo i piÃ¹ audaci trovano i passaggi segreti.'),
('taranto', 'explore_4', 'Ambasciatore', 'Sei diventato punto di riferimento per altri viandanti.', 'Gli ambasciatori portavano la voce della cittÃ  lontano.'),
('taranto', 'explore_5', 'Leggenda Vivente', 'La tua storia Ã¨ intrecciata con quella di Taranto.', 'Le leggende non muoiono, diventano eternhe.')
ON CONFLICT DO NOTHING;

-- 4. Trigger: assegna badge esplorazione quando total_xp cambia
CREATE OR REPLACE FUNCTION check_and_award_exploration_badges()
RETURNS TRIGGER AS $$
DECLARE
    template RECORD;
    already_has BOOLEAN;
BEGIN
    -- Solo se total_xp Ã¨ aumentato
    IF NEW.total_xp <= OLD.total_xp THEN
        RETURN NEW;
    END IF;

    FOR template IN 
        SELECT * FROM badge_templates 
        WHERE category = 'exploration' 
        ORDER BY level
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = NEW.id AND badge_template_id = template.id
        ) INTO already_has;

        IF NOT already_has AND NEW.total_xp >= template.threshold_value THEN
            INSERT INTO user_badges (user_id, badge_template_id, earned_at)
            VALUES (NEW.id, template.id, now());
            
            -- Notifica (Edge Function puÃ² ascoltare)
            PERFORM pg_notify('badge_awarded', json_build_object(
                'user_id', NEW.id,
                'badge_id', template.id,
                'category', 'exploration',
                'tenant_id', NEW.tenant_id
            )::text);
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger solo se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_award_exploration_badges'
    ) THEN
        CREATE TRIGGER trigger_award_exploration_badges
            AFTER UPDATE OF total_xp ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION check_and_award_exploration_badges();
    END IF;
END $$;

-- Verifica
SELECT bt.id, bt.category, bt.threshold_value, bl.name, bl.description
FROM badge_templates bt
JOIN badge_localizations bl ON bt.id = bl.badge_template_id
WHERE bl.tenant_id = 'taranto' AND bt.category = 'exploration'
ORDER BY bt.level;
-- ============================================================
-- TASK 2B: Collegamento Scans -> XP in Profiles
-- ============================================================

-- 1. Aggiungiamo la colonna xp_awarded alla tabella scans (se non esiste)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS xp_awarded INT DEFAULT 0;

-- 2. Creiamo una funzione che incrementa total_xp nel profilo
CREATE OR REPLACE FUNCTION update_user_xp_from_scans()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorniamo total_xp aggiungendo xp_awarded
    -- Usiamo COALESCE per evitare problemi se total_xp Ã¨ null
    IF NEW.xp_awarded > 0 THEN
        UPDATE profiles
        SET total_xp = COALESCE(total_xp, 0) + NEW.xp_awarded
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attacchiamo il trigger alla tabella scans
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_xp_from_scans'
    ) THEN
        CREATE TRIGGER trigger_update_xp_from_scans
            AFTER INSERT ON scans
            FOR EACH ROW
            EXECUTE FUNCTION update_user_xp_from_scans();
    END IF;
END $$;

-- Verifica che il trigger esista
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_update_xp_from_scans';
-- ============================================================
-- TASK 8: Test "Due Testimoni" (Modulo Civico)
-- ============================================================

-- INSERIMENTO MOCK: Simula 2 segnalazioni nella stessa cella da 2 utenti diversi
-- (Sostituisci gli UUID con ID reali presenti nella tua tabella profiles, oppure
--  lascia che il database generi errore se non esistono per vedere se la logica di base Ã¨ in piedi)

/*
INSERT INTO civic_reports (user_id, tenant_id, category, description, latitude, longitude, grid_cell, status)
VALUES 
  ('USER_ID_1', 'taranto', 'barrier', 'Buca pericolosa', 40.470, 17.240, '40.470_17.240', 'pending_match'),
  ('USER_ID_2', 'taranto', 'barrier', 'Buca pericolosa in strada', 40.470, 17.240, '40.470_17.240', 'pending_match');

-- VERIFICA RISULTATO
-- Entrambe le segnalazioni dovrebbero ora avere status = 'confirmed'
SELECT id, user_id, category, status, grid_cell 
FROM civic_reports 
WHERE grid_cell = '40.470_17.240';
*/


-- ============================================================
-- TASK 9: Creazione Vista Report ESG (Architettura Stateless)
-- ============================================================

-- Abbiamo corretto la query originale che interrogava la vecchia tabella 'discoveries'.
-- Ora interroga 'scans' per l'affluenza, 'civic_reports' per il civico e 'profiles' per la CO2.
-- Usiamo le CTE (Common Table Expressions) per evitare moltiplicazioni errate della CO2.

CREATE OR REPLACE VIEW esg_report_monthly AS
WITH scan_stats AS (
  SELECT 
    tenant_id, 
    DATE_TRUNC('month', created_at) AS month, 
    COUNT(*) AS total_scans, 
    COUNT(DISTINCT user_id) AS active_users
  FROM scans
  GROUP BY tenant_id, DATE_TRUNC('month', created_at)
),
civic_stats AS (
  SELECT 
    tenant_id, 
    DATE_TRUNC('month', created_at) AS month, 
    COUNT(*) AS confirmed_reports
  FROM civic_reports
  WHERE status = 'confirmed'
  GROUP BY tenant_id, DATE_TRUNC('month', created_at)
),
co2_stats AS (
  -- La CO2 totale Ã¨ calcolata sommando i valori attuali dei profili afferenti a quel tenant
  SELECT 
    tenant_id, 
    SUM(COALESCE(total_co2, 0)) AS co2_saved
  FROM profiles
  GROUP BY tenant_id
)
SELECT 
  s.tenant_id,
  s.month,
  s.active_users,
  s.total_scans,
  COALESCE(c.co2_saved, 0) AS co2_saved,
  COALESCE(civ.confirmed_reports, 0) AS confirmed_reports
FROM scan_stats s
LEFT JOIN civic_stats civ ON s.tenant_id = civ.tenant_id AND s.month = civ.month
LEFT JOIN co2_stats c ON s.tenant_id = c.tenant_id;

-- Verifica creazione della vista
SELECT * FROM esg_report_monthly;
-- ============================================================
-- SCRIPT DEFINITIVO ESG LEAN (v1.0)
-- Senza PostGIS â€” pronto per Supabase Free
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
-- Tenant "borgo-test" (piccolo comune, solo turismo)
INSERT INTO tenants (id, display_name, slug, primary_color, secondary_color, city_name, region, center_lat, center_lng, default_zoom, status, features)
VALUES ('borgo-test', 'Borgo Antico', 'borgo-antico', '#2E8B57', '#F5F5DC', 'Borgo Antico', 'Puglia', 40.5000, 17.8000, 14, 'active', '{
    "civic_module": false,
    "gamification": true,
    "events": false,
    "community_challenges": false,
    "ble_heatmap": false,
    "premium_boost": false
}')
ON CONFLICT (id) DO UPDATE SET features = EXCLUDED.features;

INSERT INTO tenant_localizations (tenant_id, locale, onboarding_title, onboarding_subtitle, onboarding_cta, points_name, points_name_plural, civic_module_name, events_tab_name, events_empty_state)
VALUES ('borgo-test', 'it', 'Benvenuto nel Borgo', 'Scopri i segreti di un paese che vive nel tempo.', 'Inizia', 'Punti', 'Punti', 'Segnalazioni', 'Eventi', 'Nessun evento programmato')
ON CONFLICT (tenant_id, locale) DO UPDATE SET onboarding_title = EXCLUDED.onboarding_title;

-- ============================================================
-- MASTER SCRIPT RESET & SEED L.O.T.O. HUB
-- Questo script pialla le tabelle corrotte e reinstalla l'intera 
-- architettura in ordine corretto, popolandola con dati realistici.
-- ============================================================

-- -----------------------------------------------------------
-- 0. DROP DI SICUREZZA (Cascade per eliminare dipendenze)
-- -----------------------------------------------------------
DROP VIEW IF EXISTS civic_reports_pending CASCADE;
DROP VIEW IF EXISTS user_badges_complete CASCADE;
DROP VIEW IF EXISTS global_impact_leaderboard CASCADE;
DROP VIEW IF EXISTS goal_progress CASCADE;
DROP VIEW IF EXISTS active_tenant_events CASCADE;

DROP TABLE IF EXISTS goal_participations CASCADE;
DROP TABLE IF EXISTS collective_goals CASCADE;
DROP TABLE IF EXISTS civic_reports CASCADE;
DROP TABLE IF EXISTS discoveries CASCADE;
DROP TABLE IF EXISTS whispers CASCADE;
DROP TABLE IF EXISTS pois CASCADE;
DROP TABLE IF EXISTS civic_legacy CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS tenant_events CASCADE;
DROP TABLE IF EXISTS tenant_associations CASCADE;
DROP TABLE IF EXISTS tenant_badge_overrides CASCADE;
DROP TABLE IF EXISTS badge_localizations CASCADE;
DROP TABLE IF EXISTS badge_templates CASCADE;
DROP TABLE IF EXISTS tenant_localizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- -----------------------------------------------------------
-- 1. TENANTS & LOCALIZZAZIONI
-- -----------------------------------------------------------
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    primary_color TEXT DEFAULT '#E74C3C',
    secondary_color TEXT DEFAULT '#2C3E50',
    logo_url TEXT,
    favicon_url TEXT,
    city_name TEXT NOT NULL,
    region TEXT,
    country TEXT DEFAULT 'IT',
    timezone TEXT DEFAULT 'Europe/Rome',
    center_lat NUMERIC(10,8),
    center_lng NUMERIC(10,8),
    default_zoom INT DEFAULT 13,
    features JSONB DEFAULT '{
        "civic_module": true,
        "gamification": true,
        "events": true,
        "community_challenges": true,
        "ble_heatmap": false,
        "premium_boost": true
    }',
    max_pois INT DEFAULT 50,
    max_partners INT DEFAULT 20,
    max_events_active INT DEFAULT 5,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'archived')),
    trial_ends_at TIMESTAMPTZ,
    agency_id UUID,
    revenue_share_percent NUMERIC(5,2) DEFAULT 20.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_localizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    locale TEXT DEFAULT 'it',
    onboarding_title TEXT,
    onboarding_subtitle TEXT,
    onboarding_cta TEXT,
    points_name TEXT DEFAULT 'PTI',
    points_name_plural TEXT DEFAULT 'PTI',
    civic_module_name TEXT DEFAULT 'Segnalazioni Civiche',
    civic_submit_button TEXT DEFAULT 'Invia Segnalazione',
    civic_success_message TEXT DEFAULT 'Grazie per il tuo impegno!',
    events_tab_name TEXT DEFAULT 'Eventi',
    events_empty_state TEXT DEFAULT 'Nessun evento attivo',
    UNIQUE(tenant_id, locale)
);

CREATE TABLE tenant_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    category TEXT CHECK (category IN ('disability', 'environment', 'culture', 'sport', 'neighborhood')),
    contact_email TEXT,
    contact_phone TEXT,
    can_moderate_reports BOOLEAN DEFAULT false,
    can_create_events BOOLEAN DEFAULT false,
    dashboard_access_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, slug)
);

-- -----------------------------------------------------------
-- 2. BADGE TEMPLATES
-- -----------------------------------------------------------
CREATE TABLE badge_templates (
    id TEXT PRIMARY KEY,
    category TEXT CHECK (category IN ('civic_commitment', 'civic_impact')),
    level INT NOT NULL,
    threshold_type TEXT CHECK (threshold_type IN ('reports_count', 'confirmed_count', 'resolved_count')),
    threshold_value INT NOT NULL,
    pti_bonus INT DEFAULT 0,
    icon_name TEXT DEFAULT 'shield',
    color_hex TEXT DEFAULT '#4A90D9'
);

CREATE TABLE badge_localizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    badge_template_id TEXT NOT NULL REFERENCES badge_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    lore TEXT,
    UNIQUE(tenant_id, badge_template_id)
);

-- -----------------------------------------------------------
-- 3. PROFILI E GAMIFICATION
-- -----------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id TEXT REFERENCES tenants(id),
    nickname TEXT,
    email TEXT,
    avatar_url TEXT,
    total_co2 NUMERIC(10,2) DEFAULT 0,
    total_tokens INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_template_id TEXT NOT NULL REFERENCES badge_templates(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    shared_count INT DEFAULT 0,
    UNIQUE(user_id, badge_template_id)
);

CREATE TABLE civic_legacy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    type TEXT CHECK (type IN ('tree', 'bench', 'mural', 'restoration')),
    description TEXT,
    location TEXT,
    impact_value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------
-- 4. POIS, WHISPERS E DISCOVERIES
-- -----------------------------------------------------------
CREATE TABLE pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    lat NUMERIC(10,8) NOT NULL,
    lng NUMERIC(10,8) NOT NULL,
    address TEXT,
    nfc_tag_id TEXT,
    qr_payload TEXT,
    ble_signature JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE whispers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    audio_url TEXT,
    rarity INT CHECK (rarity BETWEEN 1 AND 5),
    unlock_condition TEXT DEFAULT 'tap',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    poi_id UUID REFERENCES pois(id) ON DELETE SET NULL,
    whisper_id UUID REFERENCES whispers(id) ON DELETE SET NULL,
    rarity INT CHECK (rarity BETWEEN 1 AND 5),
    discovered_at TIMESTAMPTZ DEFAULT now(),
    shared_social BOOLEAN DEFAULT false,
    UNIQUE(user_id, whisper_id)
);

-- -----------------------------------------------------------
-- 5. CIVIC REPORTS E EVENTS
-- -----------------------------------------------------------
CREATE TABLE civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    grid_cell_50m TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('barrier', 'degradation', 'lighting', 'accessibility', 'other')),
    description TEXT,
    photo_url TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(10,8),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'pending_match', 'confirmed', 'verified', 'rejected', 'resolved')),
    matched_report_id UUID REFERENCES civic_reports(id),
    match_confidence NUMERIC(3,2),
    points_awarded INT DEFAULT 0,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE collective_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('quarter', 'city', 'association')),
    target_type TEXT CHECK (target_type IN ('scans', 'reports', 'co2', 'users', 'collective')),
    target_value INT,
    current_value INT DEFAULT 0,
    unit TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    reward_badge_id TEXT REFERENCES badge_templates(id),
    reward_pti_bonus INT DEFAULT 0,
    reward_partner_offer TEXT,
    geojson_boundary JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE goal_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES collective_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contribution INT DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(goal_id, user_id)
);

CREATE TABLE tenant_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('community_challenge', 'timed_bonus', 'scavenger_hunt', 'cultural_night', 'partner_takeover', 'seasonal')),
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    banner_url TEXT,
    icon_emoji TEXT DEFAULT '🎯',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT,
    target_type TEXT CHECK (target_type IN ('scans', 'reports', 'co2', 'users', 'collective')),
    target_value INT,
    current_value INT DEFAULT 0,
    reward_badge_id TEXT REFERENCES badge_templates(id),
    reward_pti_bonus INT DEFAULT 0,
    reward_partner_offer TEXT,
    geojson_boundary JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------
-- 6. INDICI
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tenant_localizations_tenant ON tenant_localizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_associations_tenant ON tenant_associations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_badge_localizations_tenant ON badge_localizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pois_tenant ON pois(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whiper_tenant ON whispers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_tenant ON civic_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_user ON civic_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status ON civic_reports(status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_grid ON civic_reports(grid_cell_50m, category, status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_created ON civic_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_discoveries_user ON discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_collective_goals_tenant ON collective_goals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_goal_participations_goal ON goal_participations(goal_id);
CREATE INDEX IF NOT EXISTS idx_tenant_events_tenant ON tenant_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_events_dates ON tenant_events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- -----------------------------------------------------------
-- 7. FUNZIONI E TRIGGERS (Due Testimoni)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_civic_reports_updated_at ON civic_reports;
CREATE TRIGGER update_civic_reports_updated_at BEFORE UPDATE ON civic_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION check_for_match()
RETURNS TRIGGER AS $$
DECLARE
    match_id UUID;
    match_lat NUMERIC;
    match_lng NUMERIC;
    match_distance NUMERIC;
BEGIN
    SELECT id, latitude, longitude INTO match_id, match_lat, match_lng
    FROM civic_reports
    WHERE grid_cell_50m = NEW.grid_cell_50m
      AND category = NEW.category
      AND status IN ('submitted', 'pending_match')
      AND id != NEW.id
      AND user_id != NEW.user_id
      AND created_at > now() - interval '7 days'
    ORDER BY created_at DESC
    LIMIT 1;

    IF match_id IS NOT NULL THEN
        match_distance := SQRT(POWER(NEW.latitude - match_lat, 2) + POWER(NEW.longitude - match_lng, 2)) * 111000;
        IF match_distance < 50 THEN
            UPDATE civic_reports SET status = 'confirmed', matched_report_id = NEW.id, match_confidence = 0.9 WHERE id = match_id;
            NEW.status := 'confirmed';
            NEW.matched_report_id := match_id;
            NEW.match_confidence := 0.9;
        ELSE
            NEW.status := 'pending_match';
        END IF;
    ELSE
        NEW.status := 'pending_match';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_match_report ON civic_reports;
CREATE TRIGGER trigger_match_report BEFORE INSERT ON civic_reports FOR EACH ROW EXECUTE FUNCTION check_for_match();

-- -----------------------------------------------------------
-- 8. ROW LEVEL SECURITY E POLICY ANONIME
-- -----------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE collective_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_legacy ENABLE ROW LEVEL SECURITY;

-- Fallback per Auth Anonimo (Fondamentale per Expo Go senza Login)
-- Questo permette all'app di scaricare i POI e i Tenant senza che l'utente sia loggato
DROP POLICY IF EXISTS "tenants_anon_read" ON tenants;
CREATE POLICY "tenants_anon_read" ON tenants FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "tenant_localizations_public_read" ON tenant_localizations;
CREATE POLICY "tenant_localizations_public_read" ON tenant_localizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "pois_anon_read" ON pois;
CREATE POLICY "pois_anon_read" ON pois FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "tenant_events_anon_read" ON tenant_events;
CREATE POLICY "tenant_events_anon_read" ON tenant_events FOR SELECT USING (status IN ('active', 'scheduled', 'completed'));

DROP POLICY IF EXISTS "whispers_public_read" ON whispers;
CREATE POLICY "whispers_public_read" ON whispers FOR SELECT USING (true);

-- -----------------------------------------------------------
-- 9. POPOLAMENTO (IL "VIVO E POPOLATO" DI TARANTO)
-- -----------------------------------------------------------
INSERT INTO tenants (id, display_name, slug, primary_color, secondary_color, city_name, region, center_lat, center_lng, default_zoom)
VALUES ('taranto', 'L.O.T.O. Taranto', 'taranto', '#E74C3C', '#2C3E50', 'Taranto', 'Puglia', 40.4735, 17.2340, 14);

INSERT INTO tenant_localizations (tenant_id, locale, points_name, points_name_plural, civic_module_name, events_tab_name)
VALUES ('taranto', 'it', 'PTI', 'Token di Impatto Civico (PTI)', 'Monitoraggio Civico', 'Sfide Attive');

INSERT INTO tenant_associations (tenant_id, name, slug, category, can_moderate_reports, can_create_events)
VALUES 
('taranto', 'Diseducation', 'diseducation', 'culture', true, true),
('taranto', 'Rete Tracce', 'rete-tracce', 'neighborhood', true, true);

INSERT INTO badge_templates (id, category, level, threshold_type, threshold_value, pti_bonus) VALUES 
('civic_1', 'civic_commitment', 1, 'reports_count', 1, 50),
('civic_2', 'civic_commitment', 2, 'reports_count', 5, 100),
('impact_1', 'civic_impact', 1, 'confirmed_count', 1, 25);

INSERT INTO badge_localizations (tenant_id, badge_template_id, name, description, lore) VALUES 
('taranto', 'civic_1', 'Sentinella del Borgo', 'Hai alzato lo sguardo sulle mura della città.', 'Nel 706 a.C. i coloni spartani...'),
('taranto', 'civic_2', 'Esploratore dei Due Mari', 'Hai camminato dove i mari si incontrano.', 'I naviganti magnogreci...'),
('taranto', 'impact_1', 'Eco del Golfo', 'La tua voce ha trovato risonanza.', 'Nell''antro del dio Taras...');

INSERT INTO pois (tenant_id, name, description, category, lat, lng, address, is_active) VALUES 
('taranto', 'Castello Aragonese', 'Fortezza sul mare', 'monumento', 40.4735, 17.2325, 'Piazza Castello', true),
('taranto', 'Duomo di San Cataldo', 'Cattedrale storica', 'monumento', 40.4740, 17.2310, 'Via Duomo', true),
('taranto', 'Mena Mena', 'Birrificio Culturale', 'food', 40.4728, 17.2330, 'Via Cava', true),
('taranto', 'Lungomare', 'Passeggiata iconica', 'natura', 40.4715, 17.2340, 'Viale Virgilio', true);

-- Eventi sparsi sulla mappa per simulare vita (usiamo coordinate leggermente diverse dai POI)
INSERT INTO tenant_events (tenant_id, event_type, title, short_description, icon_emoji, starts_at, ends_at, target_type, target_value, status, geojson_boundary) VALUES 
('taranto', 'community_challenge', 'Rianima Via Duomo', 'Segnala 10 buche in Via Duomo per aiutare la comunità.', '🏛️', now() - interval '1 day', now() + interval '5 days', 'reports', 10, 'active', '{"type": "Point", "coordinates": [17.2315, 40.4742]}'),
('taranto', 'timed_bonus', 'Clean-Up Tamburi', 'Aiuta Rete Tracce a ripulire il quartiere.', '♻️', now() - interval '2 hours', now() + interval '2 days', 'scans', 50, 'active', '{"type": "Point", "coordinates": [17.2280, 40.4850]}'),
('taranto', 'cultural_night', 'Notte Magno-Greca', 'Scopri il museo MArTA stasera in compagnia.', '🏺', now(), now() + interval '12 hours', 'users', 100, 'active', '{"type": "Point", "coordinates": [17.2360, 40.4720]}');

-- -----------------------------------------------------------
-- 10. LE VISTE (BLOCCO 3A - Risoluzione Errore)
-- -----------------------------------------------------------
CREATE VIEW active_tenant_events AS
SELECT * FROM tenant_events WHERE status = 'active' AND starts_at <= now() AND ends_at >= now() ORDER BY ends_at;

CREATE VIEW goal_progress AS
SELECT g.id, g.title, g.target_value, g.current_value, ROUND(g.current_value::numeric / NULLIF(g.target_value, 0) * 100, 1) AS progress_pct, g.status, COUNT(gp.user_id) AS participants_count
FROM collective_goals g LEFT JOIN goal_participations gp ON g.id = gp.goal_id GROUP BY g.id;

CREATE VIEW global_impact_leaderboard AS
SELECT p.id AS user_id, p.nickname, p.total_co2, p.total_tokens,
    COALESCE(c.verified_reports, 0) AS verified_reports,
    COALESCE(s.validated_scans_30d, 0) AS recent_scans,
    (COALESCE(s.validated_scans_30d, 0) * 1) + (p.total_tokens * 0.1) + (COALESCE(c.verified_reports, 0) * 5) + (COALESCE(p.total_co2, 0) * 0.01) AS impact_score,
    ROW_NUMBER() OVER (ORDER BY (COALESCE(s.validated_scans_30d, 0) * 1) + (p.total_tokens * 0.1) + (COALESCE(c.verified_reports, 0) * 5) + (COALESCE(p.total_co2, 0) * 0.01) DESC) AS rank
FROM profiles p
LEFT JOIN (SELECT user_id, COUNT(id) AS verified_reports FROM civic_reports WHERE status IN ('confirmed', 'verified', 'resolved') GROUP BY user_id) c ON p.id = c.user_id
LEFT JOIN (SELECT user_id, COUNT(id) AS validated_scans_30d FROM discoveries WHERE discovered_at > now() - interval '30 days' GROUP BY user_id) s ON p.id = s.user_id
ORDER BY impact_score DESC;

CREATE VIEW user_badges_complete AS
SELECT p.id AS user_id, p.nickname,
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p.id AND badge_template_id IN (SELECT id FROM badge_templates WHERE category = 'civic_commitment')) AS commitment_badges,
    (SELECT COUNT(*) FROM user_badges WHERE user_id = p.id AND badge_template_id IN (SELECT id FROM badge_templates WHERE category = 'civic_impact')) AS impact_badges,
    (SELECT COUNT(*) FROM civic_reports WHERE user_id = p.id) AS total_reports,
    (SELECT COUNT(*) FROM civic_reports WHERE user_id = p.id AND status IN ('confirmed', 'verified', 'resolved')) AS confirmed_reports
FROM profiles p;

CREATE VIEW civic_reports_pending AS
SELECT cr.*, p.nickname, p.total_tokens
FROM civic_reports cr JOIN profiles p ON cr.user_id = p.id
WHERE cr.status = 'pending_match' ORDER BY cr.created_at DESC;

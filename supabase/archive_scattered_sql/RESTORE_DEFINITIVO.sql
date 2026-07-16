DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, public;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;
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
    icon_emoji TEXT DEFAULT 'ðŸŽ¯',
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
('taranto', 'civic_1', 'Sentinella del Borgo', 'Hai alzato lo sguardo sulle mura della cittÃ .', 'Nel 706 a.C. i coloni spartani...'),
('taranto', 'civic_2', 'Esploratore dei Due Mari', 'Hai camminato dove i mari si incontrano.', 'I naviganti magnogreci...'),
('taranto', 'impact_1', 'Eco del Golfo', 'La tua voce ha trovato risonanza.', 'Nell''antro del dio Taras...');

INSERT INTO pois (tenant_id, name, description, category, lat, lng, address, is_active) VALUES 
('taranto', 'Castello Aragonese', 'Fortezza sul mare', 'monumento', 40.4735, 17.2325, 'Piazza Castello', true),
('taranto', 'Duomo di San Cataldo', 'Cattedrale storica', 'monumento', 40.4740, 17.2310, 'Via Duomo', true),
('taranto', 'Mena Mena', 'Birrificio Culturale', 'food', 40.4728, 17.2330, 'Via Cava', true),
('taranto', 'Lungomare', 'Passeggiata iconica', 'natura', 40.4715, 17.2340, 'Viale Virgilio', true);

-- Eventi sparsi sulla mappa per simulare vita (usiamo coordinate leggermente diverse dai POI)
INSERT INTO tenant_events (tenant_id, event_type, title, short_description, icon_emoji, starts_at, ends_at, target_type, target_value, status, geojson_boundary) VALUES 
('taranto', 'community_challenge', 'Rianima Via Duomo', 'Segnala 10 buche in Via Duomo per aiutare la comunitÃ .', 'ðŸ›ï¸', now() - interval '1 day', now() + interval '5 days', 'reports', 10, 'active', '{"type": "Point", "coordinates": [17.2315, 40.4742]}'),
('taranto', 'timed_bonus', 'Clean-Up Tamburi', 'Aiuta Rete Tracce a ripulire il quartiere.', 'â™»ï¸', now() - interval '2 hours', now() + interval '2 days', 'scans', 50, 'active', '{"type": "Point", "coordinates": [17.2280, 40.4850]}'),
('taranto', 'cultural_night', 'Notte Magno-Greca', 'Scopri il museo MArTA stasera in compagnia.', 'ðŸº', now(), now() + interval '12 hours', 'users', 100, 'active', '{"type": "Point", "coordinates": [17.2360, 40.4720]}');

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
-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - V2 (Persistenza & Impact)
-- =========================================================================

-- 1. Estensione della tabella PROFILES con statistiche kumulative
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2 FLOAT8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_liters FLOAT8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;

-- 2. Creazione Tabella IMPACT_TRANSACTIONS per audit trail certificato
CREATE TABLE IF NOT EXISTS impact_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dettaglio Impatto Singolo Evento (Dati calcolati lato server)
    co2_saved FLOAT8 NOT NULL,
    liters_saved FLOAT8 NOT NULL,
    tokens_earned INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    
    -- Metadati Contesto
    is_takeaway BOOLEAN DEFAULT false,
    party_size INTEGER DEFAULT 1,
    action_type TEXT DEFAULT 'FB_AUDIT', -- es: FB_AUDIT, BEACON_REFILL, QR_CHECKIN
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS per le transazioni
ALTER TABLE impact_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
ON impact_transactions FOR SELECT 
USING (auth.uid() = profile_id);

-- La creazione avviene solo tramite Edge Functions (Service Role) 
-- o via frontend se consentito (per ora apriamo per test, poi restringeremo)
CREATE POLICY "Users can insert own transactions" 
ON impact_transactions FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- 4. Funzione Atomica per il calcolo e aggiornamento (RPC)
CREATE OR REPLACE FUNCTION process_esg_impact(
    user_id UUID,
    p_co2 FLOAT8,
    p_liters FLOAT8,
    p_tokens INTEGER,
    p_xp INTEGER,
    p_takeaway BOOLEAN,
    p_party_size INTEGER
) RETURNS VOID AS $$
BEGIN
    -- A. Aggiorna il profilo cumulativo
    UPDATE profiles
    SET 
        total_xp = total_xp + p_xp,
        total_co2 = total_co2 + p_co2,
        total_liters = total_liters + p_liters,
        total_tokens = total_tokens + p_tokens,
        updated_at = now()
    WHERE id = user_id;

    -- B. Registra la transazione di dettaglio
    INSERT INTO impact_transactions (
        profile_id, co2_saved, liters_saved, tokens_earned, xp_earned, is_takeaway, party_size
    ) VALUES (
        user_id, p_co2, p_liters, p_tokens, p_xp, p_takeaway, p_party_size
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - V3 (Identity & Profile)
-- =========================================================================

-- 1. Estensione della tabella PROFILES con datti IdentitÃ  & Context
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS is_cruise BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_accessibility_needs BOOLEAN DEFAULT false;

-- 2. Commenti per documentazione schema
COMMENT ON COLUMN profiles.is_cruise IS 'Flag per identificare passeggeri di navi da crociera (Hub Costa/MSC)';
COMMENT ON COLUMN profiles.has_accessibility_needs IS 'Flag per attivare percorsi inclusivi e avvisi barriere';

-- 3. Nota: Nessuna modifica necessaria all'RPC process_esg_impact 
-- in quanto i parametri di calcolo ESG rimangono separati dai metadati di identitÃ .
-- 1. Aggiornamento Tabella Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2 DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_liters_water DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

-- 2. Tabella Transazioni Anti-Frode
CREATE TABLE IF NOT EXISTS public.impact_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    poi_id UUID,
    receipt_hash TEXT UNIQUE, 
    tokens_earned INTEGER,
    co2_saved DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.1 Tabella Geofencing Fallback (Richiamata nel frontend da index.tsx)
CREATE TABLE IF NOT EXISTS public.location_pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    poi_id UUID,
    coords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Funzione ESG con Moltiplicatore Party-Size
CREATE OR REPLACE FUNCTION process_esg_impact(
    user_id UUID,
    p_co2 DECIMAL,
    p_liters DECIMAL,
    p_tokens INTEGER,
    p_xp INTEGER,
    p_takeaway BOOLEAN,
    p_party_size INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        total_co2 = total_co2 + p_co2,
        total_liters_water = total_liters_water + p_liters,
        total_tokens = total_tokens + p_tokens,
        party_size = p_party_size
    WHERE id = user_id;

    INSERT INTO public.impact_transactions (profile_id, co2_saved, tokens_earned)
    VALUES (user_id, p_co2, p_tokens);
END;
$$ LANGUAGE plpgsql;
-- ==============================================================
-- LOTO HUB - MIGRATION V5: ECO-SISTEMA FLOW & REFILL
-- Questo script istanzia la logica "Anti-Grosse" (Anti-Crowding)
-- Aggiunge campi affollamento, idrici e aggiorna get_pois()
-- ==============================================================

-- 1. Aggiungere le colonne mancanti alla tabella POIS
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS crowd_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_water BOOLEAN DEFAULT FALSE;

-- 2. Mocking Data per il Test
-- Mettiamo il "Castello" in stato "Molto Affollato" (85%)
UPDATE public.pois 
SET crowd_level = 85 
WHERE name ILIKE '%Castel%';

-- Mettiamo la "Fontana" con acqua e zero folla
UPDATE public.pois 
SET has_water = TRUE, crowd_level = 10 
WHERE name ILIKE '%Fontana%';

-- 3. Aggiornare l'RPC get_pois()
-- PoichÃ© stiamo cambiando il tipo di ritorno della tabella, Postgres richiede il DROP preventivo
DROP FUNCTION IF EXISTS get_pois();

CREATE FUNCTION get_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pois() IS 'Restituisce i POI con dati di affollamento e disponibilitÃ  idrica per la logica Anti-Grosse.';
-- ==============================================================
-- LOTO HUB - MIGRATION V6: SMART ROUTING & EVENTS
-- Aggiunge campi per la Governance del Flusso Turistico (Alternative)
-- ==============================================================

-- 1. Aggiungere le colonne Smart alla tabella POIS
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS alternative_poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Mockup di deviazione: Il "Castello" devia sulla "Fontana" se Ã¨ pieno
UPDATE public.pois 
SET alternative_poi_id = (SELECT id FROM public.pois WHERE name ILIKE '%Fontana%' LIMIT 1)
WHERE name ILIKE '%Castel%';

-- Segniamo un POI come sempre consigliato per popolare la Home
UPDATE public.pois 
SET is_recommended = true
WHERE name ILIKE '%Piazza%';

-- E per coerenza, se la profile non ha experience_level (lo mettiamo via app, ma nel dubbio proviamo ad aggiungerlo al volo)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'Ospite Loto';

-- 2. Creazione Tabella EVENTI
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono vedere gli eventi" ON public.events FOR SELECT USING (true);


-- 3. Nuovo RPC get_smart_pois()
-- Restituisce solo i POI raccomandati o quelli saturi in modo da gestire l'UI della Vetrina.
DROP FUNCTION IF EXISTS get_smart_pois();

CREATE FUNCTION get_smart_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        p.alternative_poi_id,
        p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva
    FROM public.pois p
    WHERE p.is_active = true 
      AND (p.is_recommended = true OR p.crowd_level >= 80)
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_smart_pois() IS 'Directory Intelligente: Restituisce solo i luoghi consigliati o quelli in stato di sovraffollamento che necessitano di avvisi UI.';
-- MIGRATION V7: Wizard & Roles Overhaul
-- Aggiunge campi fondamentali alla tabella profiles per gestire il redirect del wizard e l'accessibilitÃ 

-- 1. Aggiungiamo i campi per il Wizard e l'AccessibilitÃ  se non esistono
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_completed') THEN
        ALTER TABLE profiles ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accessibility_mode') THEN
        ALTER TABLE profiles ADD COLUMN accessibility_mode BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'flow_role') THEN
        ALTER TABLE profiles ADD COLUMN flow_role TEXT DEFAULT 'LOTO Explorer';
    END IF;
    
    -- Assicuriamoci che party_size esista e sia valorizzato di default a 1
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'party_size') THEN
        ALTER TABLE profiles ADD COLUMN party_size INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. Assicuriamo che RLS consenta l'aggiornamento a se stessi
-- (Aggiungere o modificare policy se necessario, in genere l'utente puÃ² aggiornare il proprio record)
DROP POLICY IF EXISTS "Gli utenti possono aggiornare il proprio profilo" ON profiles;
CREATE POLICY "Gli utenti possono aggiornare il proprio profilo"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- NOTA: In Supabase, per eseguire un redirect immediato all'avvio dell'app basato su profile_completed,
-- il frontend leggerÃ  la riga su `profiles` corrispondente a `auth.uid()`. Se profile_completed = false, andrÃ  a /wizard.
-- FIX: Assicuriamoci che i valori NULL non rompano l'algoritmo di Smart Routing
DROP FUNCTION IF EXISTS get_smart_pois();

CREATE FUNCTION get_smart_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT,
    loto_quota_max INTEGER,
    current_occupancy INTEGER,
    pending_occupancy INTEGER
) AS $$
BEGIN
    PERFORM the_reaper_cleanup();

    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        p.alternative_poi_id,
        p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        COALESCE(p.loto_quota_max, 50) as loto_quota_max,
        COALESCE(p.current_occupancy, 0) as current_occupancy,
        COALESCE(p.pending_occupancy, 0) as pending_occupancy
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY ((COALESCE(p.current_occupancy, 0) + COALESCE(p.pending_occupancy, 0))::float / GREATEST(COALESCE(p.loto_quota_max, 50), 1)) ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =========================================================================
-- LOTO HUB - MIGRATION V8: HYBRID VALIDATION & LOTO-TRUST (SPRINT A)
-- Architettura per la Validazione Ibrida, Intent Logic e The Reaper
-- =========================================================================

-- 1. ESTENSIONE SCHEMA
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS loto_quota_max INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_dwell_time INTEGER DEFAULT 30; -- minuti

-- 2. TABELLA ACTIVE SESSIONS
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'expired')) DEFAULT 'pending',
    validation_confidence TEXT CHECK (validation_confidence IN ('GPS_SILENT', 'QR_FORCED', 'MANUAL')),
    party_size INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_poi ON public.active_sessions(poi_id, status);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono vedere le sessioni" ON public.active_sessions FOR SELECT USING (true);
CREATE POLICY "Gli utenti possono inserire sessioni" ON public.active_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Gli utenti possono aggiornare le proprie sessioni" ON public.active_sessions FOR UPDATE USING (auth.uid() = user_id);

-- 3. THE REAPER (Pulizia e Sincronizzazione Totale senza Drift)
-- Questa funzione innesca la pulizia e ricalcola i contatori in modo assoluto.
CREATE OR REPLACE FUNCTION the_reaper_cleanup()
RETURNS void AS $$
BEGIN
    -- 3.1 Manda in 'expired' le prenotazioni pending vecchie di 20 minuti
    UPDATE public.active_sessions
    SET status = 'expired'
    WHERE status = 'pending' AND created_at < timezone('utc'::text, now()) - interval '20 minutes';

    -- 3.2 Manda in 'completed' le sessioni attive il cui dwell_time Ã¨ scaduto
    UPDATE public.active_sessions
    SET status = 'completed'
    WHERE status = 'active' AND expires_at < timezone('utc'::text, now());

    -- 3.3 Sincronizzazione granitica dei contatori (no drift)
    UPDATE public.pois p
    SET 
        current_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'active'), 0),
        pending_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'pending'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. BOOKING E VALIDAZIONE
CREATE OR REPLACE FUNCTION book_poi_visit(p_user_id UUID, p_poi_id UUID, p_party_size INTEGER)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Pulizia pre-inserimento per avere dati freschi
    PERFORM the_reaper_cleanup();

    INSERT INTO public.active_sessions (user_id, poi_id, status, party_size)
    VALUES (p_user_id, p_poi_id, 'pending', p_party_size)
    RETURNING id INTO v_session_id;

    -- Ricalcola contatori
    PERFORM the_reaper_cleanup();

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION validate_checkin(p_session_id UUID, p_validation_confidence TEXT)
RETURNS void AS $$
DECLARE
    v_poi_id UUID;
    v_dwell_time INTEGER;
BEGIN
    -- Trova il POI e il suo dwell_time
    SELECT a.poi_id, p.average_dwell_time 
    INTO v_poi_id, v_dwell_time
    FROM public.active_sessions a
    JOIN public.pois p ON p.id = a.poi_id
    WHERE a.id = p_session_id;

    -- Passa a status active e imposta scadenza
    UPDATE public.active_sessions
    SET status = 'active',
        validation_confidence = p_validation_confidence,
        expires_at = timezone('utc'::text, now()) + (v_dwell_time || ' minutes')::interval
    WHERE id = p_session_id;

    -- Ricalcola
    PERFORM the_reaper_cleanup();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. UPGRADE SMART POIS (Saturazione Reale)
-- Sovrascriviamo la funzione get_smart_pois per lanciare il Reaper
-- e ordinare i risultati per saturazione reale.
DROP FUNCTION IF EXISTS get_smart_pois();

CREATE FUNCTION get_smart_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT,
    loto_quota_max INTEGER,
    current_occupancy INTEGER,
    pending_occupancy INTEGER
) AS $$
BEGIN
    -- L'Auto-Trigger del Reaper! Ogni volta che un utente apre l'app, il database si pulisce.
    PERFORM the_reaper_cleanup();

    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        p.alternative_poi_id,
        p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        p.loto_quota_max,
        p.current_occupancy,
        p.pending_occupancy
    FROM public.pois p
    WHERE p.is_active = true
    -- Mostriamo solo POI non saturi (> 100%), oppure possiamo mostrarli tutti per far vedere che sono pieni
    -- Il sorting metterÃ  quelli MENO saturi in cima
    ORDER BY ((p.current_occupancy + p.pending_occupancy)::float / GREATEST(p.loto_quota_max, 1)) ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- FIX EMERGENZA: "UPDATE requires a WHERE clause"
-- Aggiunta della clausola WHERE p.id IS NOT NULL per aggirare le policy di safeupdate.

CREATE OR REPLACE FUNCTION the_reaper_cleanup()
RETURNS void AS $$
BEGIN
    -- 3.1 Manda in 'expired' le prenotazioni pending vecchie di 20 minuti
    UPDATE public.active_sessions
    SET status = 'expired'
    WHERE status = 'pending' AND created_at < timezone('utc'::text, now()) - interval '20 minutes';

    -- 3.2 Manda in 'completed' le sessioni attive il cui dwell_time Ã¨ scaduto
    UPDATE public.active_sessions
    SET status = 'completed'
    WHERE status = 'active' AND expires_at < timezone('utc'::text, now());

    -- 3.3 Sincronizzazione granitica dei contatori (no drift)
    UPDATE public.pois p
    SET 
        current_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'active'), 0),
        pending_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'pending'), 0)
    WHERE p.id IS NOT NULL; -- FIX: Clausola WHERE per soddisfare le regole di safeupdate
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =========================================================================
-- LOTO HUB - MIGRATION V9: GOVERNANCE MOBILITY & PARKING
-- Aggiunge il supporto per il Bivio Decisionale e i Parcheggi Strategici
-- =========================================================================

-- 1. Aggiunta Colonne Mobility alla tabella POIS
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS recommended_parking_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parking_bonus_xp INTEGER DEFAULT 10;

-- 2. Inserimento del Parcheggio Strategico Mock (Porto Antico)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.pois WHERE layer_name = 'parking' AND name = 'Park Porto Antico') THEN
        INSERT INTO public.pois (name, category, layer_name, checkin_radius, has_water, coords, loto_quota_max, xp_reward)
        VALUES ('Park Porto Antico', 'free', 'parking', 200, false, ST_SetSRID(ST_MakePoint(17.2285, 40.4720), 4326), 300, 10);
    END IF;
END $$;

-- 3. Link: Suggeriamo il parcheggio a chi va al Castello (Simulazione)
UPDATE public.pois 
SET recommended_parking_id = (SELECT id FROM public.pois WHERE layer_name = 'parking' LIMIT 1)
WHERE name ILIKE '%Castel%' OR name ILIKE '%Duomo%';

-- 4. Aggiornamento RPC: get_smart_pois (Home)
DROP FUNCTION IF EXISTS get_smart_pois();
CREATE FUNCTION get_smart_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT,
    loto_quota_max INTEGER,
    current_occupancy INTEGER,
    pending_occupancy INTEGER,
    recommended_parking_id UUID,
    parking_bonus_xp INTEGER
) AS $$
BEGIN
    PERFORM the_reaper_cleanup();

    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius, p.crowd_level,
        p.has_water, p.alternative_poi_id, p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        COALESCE(p.loto_quota_max, 50) as loto_quota_max,
        COALESCE(p.current_occupancy, 0) as current_occupancy,
        COALESCE(p.pending_occupancy, 0) as pending_occupancy,
        p.recommended_parking_id,
        COALESCE(p.parking_bonus_xp, 10) as parking_bonus_xp
    FROM public.pois p
    WHERE p.is_active = true AND p.layer_name != 'parking' -- Non mostriamo il parcheggio nella lista principale
    ORDER BY ((COALESCE(p.current_occupancy, 0) + COALESCE(p.pending_occupancy, 0))::float / GREATEST(COALESCE(p.loto_quota_max, 50), 1)) ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Aggiornamento RPC: get_pois (Esplora)
DROP FUNCTION IF EXISTS get_pois();
CREATE FUNCTION get_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT,
    loto_quota_max INTEGER,
    current_occupancy INTEGER,
    pending_occupancy INTEGER,
    recommended_parking_id UUID,
    parking_bonus_xp INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius, p.crowd_level,
        p.has_water, p.alternative_poi_id, p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        COALESCE(p.loto_quota_max, 50) as loto_quota_max,
        COALESCE(p.current_occupancy, 0) as current_occupancy,
        COALESCE(p.pending_occupancy, 0) as pending_occupancy,
        p.recommended_parking_id,
        COALESCE(p.parking_bonus_xp, 10) as parking_bonus_xp
    FROM public.pois p
    WHERE p.is_active = true AND p.layer_name != 'parking'
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =========================================================================
-- MIGRATION V10: TABULA RASA & PRODUCTION SEED
-- Questo script rade al suolo i POI finti e inietta la "LOTO Taranto V1".
-- Le coordinate sono esatte (fino a 6 decimali).
-- Categorie consolidate: free, partner, secret (per non frammentare la UI).
-- =========================================================================

-- 1. Aggiungiamo il flag per l'AccessibilitÃ  (derivato dai tuoi dati)
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT TRUE;

-- 2. TABULA RASA: Pulizia profonda (CASCADE elimina anche le sessioni legate ai vecchi POI)
TRUNCATE TABLE public.pois CASCADE;

-- 3. INIEZIONE DATI DI PRODUZIONE (Usando la geometria PostGIS ST_MakePoint e i nomi colonne reali)
-- Nota: La Longitudine (X) va prima della Latitudine (Y) in ST_MakePoint(Lon, Lat).

-- ==================================================
-- CATEGORIA: FREE (Siti Culturali e Naturali gratuiti)
-- ==================================================
INSERT INTO public.pois (name, category, layer_name, loto_quota_max, xp_reward, is_accessible, coords) VALUES 
('Castello Aragonese', 'free', 'layer-loto-free', 150, 50, TRUE, ST_SetSRID(ST_MakePoint(17.234050, 40.472850), 4326)),
('Tempio di Poseidone', 'free', 'layer-loto-free', 200, 30, TRUE, ST_SetSRID(ST_MakePoint(17.233480, 40.473110), 4326)),
('Duomo di San Cataldo', 'free', 'layer-loto-free', 100, 40, TRUE, ST_SetSRID(ST_MakePoint(17.228560, 40.476050), 4326)),
('Concattedrale Gran Madre di Dio', 'free', 'layer-loto-free', 120, 30, TRUE, ST_SetSRID(ST_MakePoint(17.270319, 40.461886), 4326)),
('Monumento al Marinaio', 'free', 'layer-loto-free', 500, 20, TRUE, ST_SetSRID(ST_MakePoint(17.232500, 40.474500), 4326)),
('Ponte Girevole', 'free', 'layer-loto-free', 500, 20, TRUE, ST_SetSRID(ST_MakePoint(17.234900, 40.473200), 4326)),
('Parco delle Mura Greche', 'free', 'layer-loto-free', 300, 30, TRUE, ST_SetSRID(ST_MakePoint(17.258000, 40.469000), 4326)),
('Oasi Palude La Vela', 'free', 'layer-loto-free', 80, 50, TRUE, ST_SetSRID(ST_MakePoint(17.324253, 40.473394), 4326)),
('Fontanella Piazza Fontana', 'free', 'layer-loto-free', 1000, 10, TRUE, ST_SetSRID(ST_MakePoint(17.230500, 40.481500), 4326)),
('Isola di San Pietro', 'free', 'layer-loto-free', 60, 40, FALSE, ST_SetSRID(ST_MakePoint(17.151200, 40.454500), 4326)),
('Parco Archeol. Collepasso', 'free', 'layer-loto-free', 200, 30, TRUE, ST_SetSRID(ST_MakePoint(17.274893, 40.468426), 4326));

-- ==================================================
-- CATEGORIA: SECRET (Luoghi Ipogei o Nascosti)
-- ==================================================
INSERT INTO public.pois (name, category, layer_name, loto_quota_max, xp_reward, is_accessible, coords) VALUES 
('Museo Ipogeo Spartano', 'secret', 'layer-loto-secrets', 30, 50, FALSE, ST_SetSRID(ST_MakePoint(17.230192, 40.474561), 4326)),
('Parco Archeologico di Saturo', 'secret', 'layer-loto-secrets', 150, 50, TRUE, ST_SetSRID(ST_MakePoint(17.311742, 40.354148), 4326));

-- ==================================================
-- CATEGORIA: PARTNER (Siti B2B)
-- ==================================================
INSERT INTO public.pois (name, category, layer_name, loto_quota_max, xp_reward, is_accessible, coords) VALUES 
('MuDi - Museo Diocesano', 'partner', 'layer-loto-partners', 100, 30, TRUE, ST_SetSRID(ST_MakePoint(17.228800, 40.476200), 4326)),
('Canneto Beach', 'partner', 'layer-loto-partners', 100, 30, TRUE, ST_SetSRID(ST_MakePoint(17.376850, 40.348450), 4326)),
('Lido Fatamorgana', 'partner', 'layer-loto-partners', 100, 30, TRUE, ST_SetSRID(ST_MakePoint(17.404500, 40.347200), 4326)),
('Borgo Valle Rita', 'partner', 'layer-loto-partners', 100, 30, TRUE, ST_SetSRID(ST_MakePoint(16.890500, 40.505200), 4326));

-- =========================================================================
-- Aggiorniamo l'RPC get_pois() per estrarre anche il nuovo campo is_accessible
-- =========================================================================
DROP FUNCTION IF EXISTS get_pois();

CREATE FUNCTION get_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    is_accessible BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        p.is_accessible,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =========================================================================
-- MIGRATION V11: FIX "METE CONSIGLIATE" E ALLINEAMENTO RPC
-- 1. Reimposta il flag is_recommended su alcune mete chiave.
-- 2. Aggiorna l'RPC get_pois() per restituire TUTTI i campi necessari alla Home.
-- =========================================================================

-- 1. Rimettiamo "Mete Consigliate" su 3 POI strategici per far riapparire la sezione in Home
UPDATE public.pois 
SET is_recommended = true
WHERE name IN ('Castello Aragonese', 'Oasi Palude La Vela', 'MuDi - Museo Diocesano');

-- 2. Aggiorniamo get_pois() affinchÃ© restituisca TUTTI i campi, inclusi quelli di Governance
DROP FUNCTION IF EXISTS get_pois();

CREATE FUNCTION get_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    is_accessible BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        p.is_accessible,
        p.alternative_poi_id,
        p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =========================================================================
-- MIGRATION V12: SECURITY LINTER FIX
-- Risolve i warning di sicurezza mostrati dal Security Advisor di Supabase
-- =========================================================================

-- 1. FIX: RLS Disabled in Public -> location_pings
-- Questa tabella raccoglie i ping GPS offline, deve essere protetta!
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

-- Permettiamo agli utenti autenticati di inserire i propri ping
CREATE POLICY "Utenti inseriscono i propri ping" 
ON public.location_pings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = profile_id);

-- Permettiamo agli utenti autenticati di leggere solo i propri ping
CREATE POLICY "Utenti leggono i propri ping" 
ON public.location_pings FOR SELECT 
TO authenticated 
USING (auth.uid() = profile_id);


-- 2. FIX: Anonymous Sign-Ins Allowed
-- Molte tabelle usavano "TO authenticated, anon" omettevano il ruolo, 
-- esponendo i dati a utenti non loggati. Chiudiamo le falle.

-- PROFILES: Solo utenti loggati
DROP POLICY IF EXISTS "Gli utenti possono visualizzare solo il proprio profilo" ON public.profiles;
CREATE POLICY "Gli utenti possono visualizzare solo il proprio profilo" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- ACTIVE_SESSIONS: Solo utenti loggati
DROP POLICY IF EXISTS "Sessioni visibili a tutti" ON public.active_sessions;
CREATE POLICY "Utenti vedono solo le proprie sessioni" 
ON public.active_sessions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- IMPACT_TRANSACTIONS: Solo utenti loggati
DROP POLICY IF EXISTS "Gli utenti vedono solo le proprie transazioni" ON public.impact_transactions;
CREATE POLICY "Gli utenti vedono solo le proprie transazioni" 
ON public.impact_transactions FOR SELECT 
TO authenticated
USING (auth.uid() = profile_id);

-- EVENTS: Solo utenti loggati
DROP POLICY IF EXISTS "Tutti possono vedere gli eventi" ON public.events;
CREATE POLICY "Solo utenti autenticati vedono gli eventi" 
ON public.events FOR SELECT 
TO authenticated
USING (true);

-- Nota per 'public.spatial_ref_sys':
-- Ãˆ una tabella di sistema creata automaticamente da PostGIS per mappare la geometria terrestre.
-- NON abilitare la RLS su questa tabella altrimenti rompi i calcoli matematici del database. 
-- Ãˆ un falso positivo del Security Advisor, puoi ignorarlo tranquillamente.

-- Nota per 'public.pois':
-- Lasciamo intenzionalmente la Policy aperta ad "anon" (Anonymous) su questa tabella,
-- perchÃ© vogliamo che i turisti possano vedere la mappa e i luoghi di Taranto
-- *prima* di essere costretti a fare login o registrarsi!
-- =========================================================================
-- MIGRATION V13: SPRINT 3 DATABASE SCHEMAS (Scalable Data Foundations)
-- =========================================================================

-- 1. Estensione PostGIS (giÃ  abilitata, ma per sicurezza)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabella Territori (public.territories)
CREATE TABLE IF NOT EXISTS public.territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    boundaries GEOMETRY(MultiPolygon, 4326) NOT NULL, -- Poligoni PostGIS dei confini (es. Taranto, Lecce)
    colors JSONB NOT NULL, -- Configurazione colori ({primary, secondary, etc})
    assets JSONB NOT NULL, -- URL statici di loghi e grafiche del tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_colors_format CHECK (jsonb_typeof(colors) = 'object'),
    CONSTRAINT check_assets_format CHECK (jsonb_typeof(assets) = 'object')
);

CREATE INDEX IF NOT EXISTS territories_spatial_idx ON public.territories USING GIST(boundaries);

-- Abilitiamo Row Level Security (RLS) per i territori
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Policy di sola lettura pubblica (necessaria per il funzionamento client multi-tenant "Camaleonte")
DROP POLICY IF EXISTS "Allow anonymous read on territories" ON public.territories;
CREATE POLICY "Allow anonymous read on territories" ON public.territories FOR SELECT USING (true);


-- 3. Estensione tabella public.pois per supportare il multi-tenancy spaziale
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL;


-- 4. Funzione Trigger per assegnare e validare il territorio del POI
CREATE OR REPLACE FUNCTION assign_and_validate_poi_territory_fn()
RETURNS TRIGGER AS $$
DECLARE
    found_territory_id UUID;
BEGIN
    -- Cerca il territorio attivo in cui ricadono le coordinate del POI (Cast a geometry per ST_Within)
    SELECT id INTO found_territory_id
    FROM public.territories
    WHERE ST_Within(NEW.coords::geometry, boundaries)
    LIMIT 1;

    -- Se le coordinate non ricadono in nessun territorio registrato, solleva un errore (Dogma Geofencing)
    IF found_territory_id IS NULL THEN
        RAISE EXCEPTION 'Errore di geofencing: Le coordinate geografiche del POI non ricadono in nessun territorio attivo registrato.';
    END IF;

    -- Imposta il territory_id associato
    NEW.territory_id := found_territory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger su INSERT o UPDATE delle coordinate del POI
DROP TRIGGER IF EXISTS trigger_assign_and_validate_poi_territory ON public.pois;
CREATE TRIGGER trigger_assign_and_validate_poi_territory
BEFORE INSERT OR UPDATE OF coords ON public.pois
FOR EACH ROW
EXECUTE FUNCTION assign_and_validate_poi_territory_fn();


-- 5. RPC per permettere l'inserimento semplificato dei POI da parte delle Web Agency (lat, lon decimali)
CREATE OR REPLACE FUNCTION insert_poi_standardized(
    p_name TEXT,
    p_category TEXT,
    p_layer_name TEXT,
    p_loto_quota_max INTEGER,
    p_xp_reward INTEGER,
    p_is_accessible BOOLEAN,
    p_latitude FLOAT8,
    p_longitude FLOAT8
)
RETURNS UUID AS $$
DECLARE
    new_poi_id UUID;
BEGIN
    INSERT INTO public.pois (
        name, 
        category, 
        layer_name, 
        loto_quota_max, 
        xp_reward, 
        is_accessible, 
        coords
    ) VALUES (
        p_name,
        p_category,
        p_layer_name,
        p_loto_quota_max,
        p_xp_reward,
        p_is_accessible,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    )
    RETURNING id INTO new_poi_id;

    RETURN new_poi_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION insert_poi_standardized IS 'Consente l''inserimento di un POI inserendo latitudine/longitudine in decimali. Il trigger compilerÃ  automaticamente il territory_id.';


-- 6. Tabella Vault Multimediale (public.media_vault)
CREATE TABLE IF NOT EXISTS public.media_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    media_path VARCHAR(512) NOT NULL, -- Percorso privato del file all'interno di Supabase Storage
    loto_cost INTEGER NOT NULL CHECK (loto_cost >= 0),
    media_type VARCHAR(50) NOT NULL, -- es. 'audio', 'video'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Abilitiamo RLS per media_vault
ALTER TABLE public.media_vault ENABLE ROW LEVEL SECURITY;

-- Tutti gli utenti autenticati possono consultare i metadati dei contenuti del vault
DROP POLICY IF EXISTS "Allow authenticated read on media_vault" ON public.media_vault;
CREATE POLICY "Allow authenticated read on media_vault" ON public.media_vault FOR SELECT USING (auth.role() = 'authenticated');


-- 7. Tabella Storico Sblocchi (public.user_unlocked_media)
CREATE TABLE IF NOT EXISTS public.user_unlocked_media (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media_vault(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL, -- Memorizzato per le future analitiche DaaS B2B (porta aperta)
    PRIMARY KEY (profile_id, media_id)
);

-- Abilitiamo RLS per user_unlocked_media
ALTER TABLE public.user_unlocked_media ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere esclusivamente il proprio storico degli sblocchi
DROP POLICY IF EXISTS "Users can view their own unlocked media" ON public.user_unlocked_media;
CREATE POLICY "Users can view their own unlocked media" ON public.user_unlocked_media FOR SELECT USING (auth.uid() = profile_id);


-- 8. RPC Transazionale sblocca_media
-- Consente l'acquisto atomico del contenuto scalando i token dal saldo dell'utente in un'unica transazione.
CREATE OR REPLACE FUNCTION sblocca_media(p_media_id UUID)
RETURNS TABLE (
    unlocked BOOLEAN,
    media_path TEXT,
    message TEXT
) AS $$
DECLARE
    v_profile_id UUID;
    v_loto_cost INTEGER;
    v_user_balance INTEGER;
    v_poi_id UUID;
    v_territory_id UUID;
    v_media_path TEXT;
    v_already_unlocked BOOLEAN;
BEGIN
    -- 1. Recupera l'utente connesso
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Utente non autenticato.'::TEXT;
        RETURN;
    END IF;

    -- 2. Recupera i dettagli del media
    SELECT poi_id, media_path, loto_cost INTO v_poi_id, v_media_path, v_loto_cost
    FROM public.media_vault
    WHERE id = p_media_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Contenuto multimediale non trovato.'::TEXT;
        RETURN;
    END IF;

    -- 3. Recupera il territorio associato al POI per tracciamento statistico (porta aperta)
    SELECT territory_id INTO v_territory_id
    FROM public.pois
    WHERE id = v_poi_id;

    -- 4. Controlla si il media Ã¨ giÃ  sbloccato
    SELECT EXISTS (
        SELECT 1 FROM public.user_unlocked_media
        WHERE profile_id = v_profile_id AND media_id = p_media_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN QUERY SELECT TRUE, v_media_path, 'Contenuto giÃ  sbloccato in precedenza.'::TEXT;
        RETURN;
    END IF;

    -- 5. Recupera il saldo punti (total_tokens) dal profilo dell'utente
    SELECT total_tokens INTO v_user_balance
    FROM public.profiles
    WHERE id = v_profile_id;

    IF v_user_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Profilo utente non trovato o saldo non inizializzato.'::TEXT;
        RETURN;
    END IF;

    -- 6. Verifica la copertura del saldo
    IF v_user_balance < v_loto_cost THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Saldo punti (LOTO PTI) insufficiente.'::TEXT;
        RETURN;
    END IF;

    -- 7. Detrazione atomica dei token (LOTO Economy)
    UPDATE public.profiles
    SET total_tokens = total_tokens - v_loto_cost
    WHERE id = v_profile_id;

    -- 8. Registrazione sblocco
    INSERT INTO public.user_unlocked_media (profile_id, media_id, territory_id)
    VALUES (v_profile_id, p_media_id, v_territory_id);

    RETURN QUERY SELECT TRUE, v_media_path, 'Sblocco effettuato con successo.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Anti-Cheat: Trigger di plausibilitÃ  velocitÃ  su registrazione check-in
-- Calcola la velocitÃ  dello spostamento tra check-in consecutivi (user_pois) ed interrompe l'operazione in caso di cheating.
CREATE OR REPLACE FUNCTION verify_checkin_speed_plausibility_fn()
RETURNS TRIGGER AS $$
DECLARE
    last_poi_coords GEOGRAPHY;
    last_visited_time TIMESTAMP WITH TIME ZONE;
    new_poi_coords GEOGRAPHY;
    distance_meters FLOAT8;
    time_diff_seconds FLOAT8;
    speed_kmh FLOAT8;
    max_speed_threshold FLOAT8 := 130.0; -- Soglia massima velocitÃ  in km/h (previene il "teletrasporto" fittizio)
BEGIN
    -- Recupera le coordinate geografiche del POI corrente
    SELECT coords INTO new_poi_coords
    FROM public.pois
    WHERE id = NEW.poi_id;

    -- Recupera l'ultimo check-in dello stesso utente
    SELECT p.coords, up.visited_at 
    INTO last_poi_coords, last_visited_time
    FROM public.user_pois up
    JOIN public.pois p ON p.id = up.poi_id
    WHERE up.profile_id = NEW.profile_id
    ORDER BY up.visited_at DESC
    LIMIT 1;

    -- Se esiste un check-in precedente, calcola la velocitÃ  media di transito
    IF FOUND AND last_visited_time IS NOT NULL THEN
        distance_meters := ST_Distance(new_poi_coords, last_poi_coords);
        time_diff_seconds := EXTRACT(EPOCH FROM (NEW.visited_at - last_visited_time));

        IF time_diff_seconds > 0 THEN
            speed_kmh := (distance_meters / time_diff_seconds) * 3.6;

            -- Se lo spostamento supera la soglia su una distanza significativa (>500m), solleva eccezione
            IF speed_kmh > max_speed_threshold AND distance_meters > 500 THEN
                RAISE EXCEPTION 'Blocco Sicurezza (Anti-Cheat): VelocitÃ  di spostamento tra check-in non plausibile (%.2f km/h).', speed_kmh;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verify_checkin_speed ON public.user_pois;
CREATE TRIGGER trigger_verify_checkin_speed
BEFORE INSERT ON public.user_pois
FOR EACH ROW
EXECUTE FUNCTION verify_checkin_speed_plausibility_fn();


-- 10. Vista DaaS Privacy-First (Materialized View per le MunicipalitÃ )
-- Aggrega i passaggi con approssimazione spaziale ~110m (ST_SnapToGrid) e time-bucketing a 15 minuti.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daas_anonymous_mobility_features AS
SELECT 
    p.territory_id,
    ST_SnapToGrid(p.coords::geometry, 0.001)::geography as grid_coords,
    -- Arrotondamento timestamp a scaglioni di 15 minuti per GDPR time-bucketing
    (date_trunc('hour', up.visited_at) + 
     (EXTRACT(minute FROM up.visited_at)::int / 15 * 15) * interval '1 minute')::timestamp with time zone as time_bucket,
    COUNT(DISTINCT up.profile_id) as unique_users_count,
    COUNT(*) as total_passages_count
FROM public.user_pois up
JOIN public.pois p ON p.id = up.poi_id
WHERE p.territory_id IS NOT NULL
GROUP BY p.territory_id, grid_coords, time_bucket;

-- Indice unico necessario per l'aggiornamento concorrente (pg_cron REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX IF NOT EXISTS daas_mobility_idx ON public.daas_anonymous_mobility_features (territory_id, grid_coords, time_bucket);

-- Concessione permessi di lettura
GRANT SELECT ON public.daas_anonymous_mobility_features TO authenticated;
GRANT SELECT ON public.daas_anonymous_mobility_features TO service_role;

-- 11. Trigger per Creazione Automatica Profilo (V3 Zero-PII)
-- Garantisce che ogni utente inserito in auth.users abbia immediatamente un profilo, prevenendo Race Conditions sul frontend.
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, profile_completed, total_tokens)
  VALUES (
    NEW.id,
    FALSE,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user_fn();

-- =========================================================================
-- Popolamento Iniziale Territori (Taranto e Lecce)
-- =========================================================================
INSERT INTO public.territories (name, boundaries, colors, assets)
VALUES (
    'Taranto',
    ST_GeomFromText('MULTIPOLYGON(((16.80 40.30, 17.50 40.30, 17.50 40.55, 16.80 40.55, 16.80 40.30)))', 4326),
    '{"primary": "#4A5D23", "secondary": "#D96C4A", "background": "#F9F6EE", "card": "#FFFFFF", "text": "#1F1F1F", "tint": "#4A5D23"}'::jsonb,
    '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/splash.png"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.territories (name, boundaries, colors, assets)
VALUES (
    'Lecce',
    ST_GeomFromText('MULTIPOLYGON(((18.05 40.25, 18.29 40.25, 18.29 40.45, 18.05 40.45, 18.05 40.25)))', 4326),
    '{"primary": "#C5A059", "secondary": "#6E5032", "background": "#FAF8F5", "card": "#FFFFFF", "text": "#2A2521", "tint": "#C5A059"}'::jsonb,
    '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/splash.png"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- Collegamento Retroattivo POIs esistenti al loro Territorio Spaziale
-- =========================================================================
UPDATE public.pois SET coords = coords;

-- =========================================================================
-- Popolamento Iniziale Media Vault
-- =========================================================================
DO $$
DECLARE
    v_castello_id UUID;
    v_ipogeo_id UUID;
    v_saturo_id UUID;
BEGIN
    SELECT id INTO v_castello_id FROM public.pois WHERE name = 'Castello Aragonese' LIMIT 1;
    SELECT id INTO v_ipogeo_id FROM public.pois WHERE name = 'Ipogeo Spartano - Casa della Marchesa' LIMIT 1;
    SELECT id INTO v_saturo_id FROM public.pois WHERE name = 'Parco Archeologico di Saturo' LIMIT 1;

    -- Inserimento contenuti Castello Aragonese
    IF v_castello_id IS NOT NULL THEN
        -- Controlla se il media esiste giÃ  per evitare duplicati
        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_castello_id AND title = 'Audio-Guida: Il Segreto delle Mura del Castello') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_castello_id,
                'Audio-Guida: Il Segreto delle Mura del Castello',
                'audio/castello_mura_secret.mp3',
                15,
                'audio'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_castello_id AND title = 'Video Premium: Riprese Drone Canale Navigabile') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_castello_id,
                'Video Premium: Riprese Drone Canale Navigabile',
                'video/castello_drone.mp4',
                30,
                'video'
            );
        END IF;
    END IF;

    -- Inserimento contenuti Ipogeo Spartano
    IF v_ipogeo_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_ipogeo_id AND title = 'Audio-Guida: La Necropoli Nascosta') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_ipogeo_id,
                'Audio-Guida: La Necropoli Nascosta',
                'audio/ipogeo_necropoli.mp3',
                25,
                'audio'
            );
        END IF;
    END IF;

    -- Inserimento contenuti Parco Archeologico di Saturo
    IF v_saturo_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_saturo_id AND title = 'Audio-Guida: Il Tempio di Saturo e il Culto dell''Acqua') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_saturo_id,
                'Audio-Guida: Il Tempio di Saturo e il Culto dell''Acqua',
                'audio/saturo_tempio.mp3',
                20,
                'audio'
            );
        END IF;
    END IF;
END $$;
-- =========================================================================
-- Modulo A: MVP Wizard & Database Alignment (V14)
-- Aggiunge campi per l'identitÃ  del turista (User Persona) e il punto di rientro.
-- =========================================================================

-- 1. Aggiungiamo i nuovi campi se non esistono
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_persona') THEN
        ALTER TABLE profiles ADD COLUMN user_persona TEXT CHECK (user_persona IN ('Standard', 'Senior', 'â™¿'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'return_point_type') THEN
        ALTER TABLE profiles ADD COLUMN return_point_type TEXT CHECK (return_point_type IN ('Cruise', 'Hotel', 'Station'));
    END IF;
END $$;
-- MIGRATION: User Itineraries

CREATE TABLE IF NOT EXISTS public.user_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    selected_pois JSONB NOT NULL,
    mobility_type TEXT NOT NULL,
    potential_xp INTEGER DEFAULT 0,
    co2_saved NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itineraries"
    ON public.user_itineraries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries"
    ON public.user_itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
    ON public.user_itineraries FOR UPDATE
    USING (auth.uid() = user_id);

-- RPC for secure itinerary creation
CREATE OR REPLACE FUNCTION public.create_itinerary(
  p_title TEXT,
  p_pois JSONB,
  p_mobility TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_base_xp INTEGER;
  v_mobility_xp INTEGER;
  v_total_xp INTEGER;
  v_poi_count INTEGER;
  v_co2 NUMERIC;
  v_itinerary_id UUID;
BEGIN
  -- Recupera l'utente
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autorizzato';
  END IF;

  -- Verifica se il JSONB Ã¨ un array
  IF jsonb_typeof(p_pois) != 'array' THEN
    RAISE EXCEPTION 'p_pois deve essere un array JSON';
  END IF;

  v_poi_count := jsonb_array_length(p_pois);

  -- Calcolo sicuro backend
  v_base_xp := v_poi_count * 10;
  
  IF p_mobility = 'walk' OR p_mobility = 'bike' THEN
    v_mobility_xp := v_poi_count * 15;
    v_co2 := v_poi_count * 0.12;
  ELSIF p_mobility = 'bus' THEN
    v_mobility_xp := v_poi_count * 8;
    v_co2 := v_poi_count * 0.06;
  ELSE
    v_mobility_xp := 0;
    v_co2 := 0;
  END IF;

  v_total_xp := v_base_xp + v_mobility_xp;

  -- Inserimento
  INSERT INTO public.user_itineraries (
    user_id, title, selected_pois, mobility_type, potential_xp, co2_saved, status
  )
  VALUES (
    v_user_id, p_title, p_pois, p_mobility, v_total_xp, v_co2, 'pending'
  )
  RETURNING id INTO v_itinerary_id;

  RETURN v_itinerary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for fetching user itineraries
CREATE OR REPLACE FUNCTION public.get_user_itineraries()
RETURNS TABLE (
    id UUID,
    title TEXT,
    selected_pois JSONB,
    mobility_type TEXT,
    potential_xp INTEGER,
    co2_saved NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.selected_pois,
    i.mobility_type,
    i.potential_xp,
    i.co2_saved,
    i.status,
    i.created_at
  FROM public.user_itineraries i
  WHERE i.user_id = auth.uid()
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- MIGRATION: Media, Ticker and Whitelabel Config

-- 1. Aggiungere le colonne mancanti alla tabella POIS
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Aggiungere la colonna Ticker alla tabella TERRITORIES
ALTER TABLE public.territories
ADD COLUMN IF NOT EXISTS ticker_text TEXT;

-- 3. Inserimento del Ticker iniziale (Mockup) per il territorio di Taranto
-- Il testo puÃ² essere modificato dal pannello Supabase, poi in futuro una RPC notturna lo sovrascriverÃ  in base ai dati reali.
UPDATE public.territories
SET ticker_text = 'ðŸƒ TARANTO COMMUNITY TODAY: 1.240 Liters saved â€¢ 45kg Plastic â€¢ 12kg COâ‚‚'
WHERE name ILIKE 'Taranto';

-- 4. Creazione sicura del bucket Storage (se non esiste)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loto-media', 'loto-media', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Policy Storage per permettere la lettura pubblica
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'loto-media' );

-- 6. Policy Storage per permettere a utenti anonimi/autenticati di caricare (solo a scopo di sviluppo/setup iniziale)
-- NOTA: In produzione questa policy andrebbe ristretta solo agli admin!
CREATE POLICY "Enable insert for all users"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'loto-media' );

CREATE POLICY "Enable update for all users"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'loto-media' );
-- MIGRATION V17: FIX RPC PER INCLUDERE MEDIA

-- 1. Aggiorniamo get_pois()
DROP FUNCTION IF EXISTS get_pois();

CREATE FUNCTION get_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    crowd_level INTEGER,
    has_water BOOLEAN,
    is_accessible BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT,
    image_url TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        p.crowd_level,
        p.has_water,
        p.is_accessible,
        p.alternative_poi_id,
        p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        p.image_url,
        p.description
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aggiorniamo get_pois_with_status()
DROP FUNCTION IF EXISTS get_pois_with_status(UUID);

CREATE OR REPLACE FUNCTION get_pois_with_status(p_profile_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    latitude FLOAT8,
    longitude FLOAT8,
    is_visited BOOLEAN,
    crowd_level INTEGER,
    has_water BOOLEAN,
    is_accessible BOOLEAN,
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    image_url TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.layer_name, 
        p.xp_reward, 
        p.checkin_radius,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        EXISTS (
            SELECT 1 FROM user_pois up 
            WHERE up.poi_id = p.id AND up.profile_id = p_profile_id
        ) as is_visited,
        p.crowd_level,
        p.has_water,
        p.is_accessible,
        p.alternative_poi_id,
        p.is_recommended,
        p.image_url,
        p.description
    FROM public.pois p
    WHERE p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TABLE tenants (
    id TEXT PRIMARY KEY, -- 'taranto', 'bari', 'lecce', 'demo'
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
    agency_id UUID, -- REFERENCES agencies(id) in futuro
    revenue_share_percent NUMERIC(5,2) DEFAULT 20.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_localizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT REFERENCES tenants(id),
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

CREATE TABLE tenant_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT REFERENCES tenants(id),
    event_type TEXT CHECK (event_type IN (
        'community_challenge', 'timed_bonus', 'scavenger_hunt', 
        'cultural_night', 'partner_takeover', 'seasonal'
    )),
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    banner_url TEXT,
    icon_emoji TEXT DEFAULT 'ðŸŽ¯',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT,
    target_type TEXT CHECK (target_type IN ('scans', 'reports', 'co2', 'users', 'collective')),
    target_value INT,
    current_value INT DEFAULT 0,
    reward_badge_id TEXT, -- REFERENCES badge_templates(id)
    reward_pti_bonus INT DEFAULT 0,
    reward_partner_offer TEXT,
    geojson_boundary JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID, -- REFERENCES auth.users(id)
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE VIEW active_tenant_events AS
SELECT * FROM tenant_events
WHERE status = 'active'
  AND starts_at <= now()
  AND ends_at >= now()
ORDER BY ends_at;

CREATE TABLE tenant_badge_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT REFERENCES tenants(id),
    badge_template_id TEXT, -- REFERENCES badge_templates(id)
    custom_name TEXT,
    custom_description TEXT,
    custom_lore TEXT,
    custom_icon TEXT,
    custom_threshold_value INT,
    is_enabled BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, badge_template_id)
);

CREATE TABLE tenant_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT REFERENCES tenants(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    category TEXT CHECK (category IN (
        'disability', 'environment', 'culture', 'sport', 'neighborhood'
    )),
    contact_email TEXT,
    contact_phone TEXT,
    can_moderate_reports BOOLEAN DEFAULT false,
    can_create_events BOOLEAN DEFAULT false,
    dashboard_access_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, slug)
);
-- POPOLAMENTO MOCK TENANT TARANTO (Ottimizzato per modello iCapital/Peeripato)

-- 1. Inserimento Tenant (Taranto)
INSERT INTO tenants (id, display_name, slug, primary_color, secondary_color, city_name, region, center_lat, center_lng, default_zoom)
VALUES (
    'taranto',
    'L.O.T.O. Taranto',
    'taranto',
    '#E74C3C', -- Rosso L.O.T.O.
    '#2C3E50', -- Blu scuro istituzionale
    'Taranto',
    'Puglia',
    40.4735, -- Centro mappa (CittÃ  Vecchia)
    17.2340,
    14
) ON CONFLICT (id) DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    center_lat = EXCLUDED.center_lat,
    center_lng = EXCLUDED.center_lng;

-- 2. Localizzazione (Ridefinizione in ottica "Sensore Urbano")
INSERT INTO tenant_localizations (tenant_id, locale, points_name, points_name_plural, civic_module_name, events_tab_name)
VALUES (
    'taranto',
    'it',
    'Token',
    'Token di Impatto Civico (PTI)', -- I punti diventano "Token di Impatto"
    'Monitoraggio Civico Distribuito',
    'Sfide e Rigenerazione'
) ON CONFLICT (tenant_id, locale) DO UPDATE SET 
    points_name_plural = EXCLUDED.points_name_plural;

-- 3. Inserimento Associazioni Locali (Nodi Attivi sul territorio)
INSERT INTO tenant_associations (tenant_id, name, slug, category, can_moderate_reports, can_create_events)
VALUES 
    ('taranto', 'Diseducation', 'diseducation', 'culture', true, true),
    ('taranto', 'Rete Tracce', 'rete-tracce', 'neighborhood', true, true)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- 4. Inserimento Eventi e Sfide (Rigenerazione, Frugal Innovation)
INSERT INTO tenant_events (tenant_id, event_type, title, short_description, icon_emoji, starts_at, ends_at, target_type, target_value)
VALUES 
    (
        'taranto', 
        'community_challenge', 
        'Sfida Templare NFC', 
        'Attivazione Patrimonio Fisico: trova i tag nascosti nella CittÃ  Vecchia.', 
        'ðŸ›¡ï¸', 
        now() - interval '1 day', 
        now() + interval '7 days',
        'scans',
        500
    ),
    (
        'taranto', 
        'community_challenge', 
        'Loto Clean-Up Rete Tracce', 
        'Monitoraggio del decoro nel quartiere Tamburi.', 
        'â™»ï¸', 
        now(), 
        now() + interval '3 days',
        'reports',
        100
    ),
    (
        'taranto', 
        'partner_takeover', 
        'Aperitivo Zero-Friction', 
        'Incontro con gli esercenti (Startup Urbane) del centro storico.', 
        'ðŸ¹', 
        now(), 
        now() + interval '2 days',
        'users',
        50
    );
-- ============================================================
-- MIGRATION V19 - GAMIFICATION VETRINA & FAST-TRACK XP
-- Aggiunge logiche di sicurezza (RPC) per il Vault e la curva XP
-- ============================================================

-- 1. AGGIUNTA COLONNE A MEDIA_VAULT E PROFILES
ALTER TABLE public.media_vault 
ADD COLUMN IF NOT EXISTS required_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. FUNZIONE PER CALCOLO LIVELLO (FAST-TRACK 1-3)
CREATE OR REPLACE FUNCTION public.calculate_user_level(xp INT) 
RETURNS INT AS $$
DECLARE
    lvl INT;
BEGIN
    -- Fast Track Livelli 1-3
    IF xp < 30 THEN
        RETURN 1;
    ELSIF xp < 90 THEN  -- 30 + 60
        RETURN 2;
    ELSIF xp < 190 THEN -- 90 + 100
        RETURN 3;
    ELSE
        -- Dal Livello 4 in poi, servono 150 XP fissi a livello (o formula a piacere)
        lvl := 3 + FLOOR((xp - 40) / 150);
        IF lvl > 50 THEN
            RETURN 50;
        END IF;
        RETURN lvl;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC SICURA PER LA VETRINA DEI P.O.I.
-- Restituisce i media oscurando l'URL se non si ha il livello/premium
CREATE OR REPLACE FUNCTION public.get_poi_vetrina(p_poi_id UUID, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    poi_id UUID,
    title TEXT,
    description TEXT,
    media_type TEXT,
    thumbnail_url TEXT,
    required_level INT,
    is_premium_only BOOLEAN,
    is_unlocked BOOLEAN,
    media_url TEXT
) AS $$
DECLARE
    v_user_xp INT;
    v_user_level INT;
    v_is_premium BOOLEAN;
BEGIN
    -- Recupera dati utente
    SELECT total_xp, is_premium INTO v_user_xp, v_is_premium 
    FROM public.profiles 
    WHERE public.profiles.id = p_user_id;
    
    -- Se utente non trovato, usiamo default
    IF v_user_xp IS NULL THEN
        v_user_xp := 0;
        v_is_premium := false;
    END IF;
    
    v_user_level := public.calculate_user_level(v_user_xp);

    RETURN QUERY
    SELECT 
        mv.id,
        mv.poi_id,
        mv.title,
        mv.description,
        mv.media_type,
        mv.thumbnail_url,
        mv.required_level,
        mv.is_premium_only,
        -- Calcolo is_unlocked
        (v_user_level >= mv.required_level AND (mv.is_premium_only = false OR v_is_premium = true)) AS is_unlocked,
        -- Offuscamento URL per sicurezza
        CASE 
            WHEN (v_user_level >= mv.required_level AND (mv.is_premium_only = false OR v_is_premium = true)) 
            THEN mv.media_url
            ELSE NULL 
        END AS media_url
    FROM public.media_vault mv
    WHERE mv.poi_id = p_poi_id
    ORDER BY mv.required_level ASC, mv.is_premium_only ASC, mv.created_at ASC;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


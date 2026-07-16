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
    icon_emoji TEXT DEFAULT '🎯',
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

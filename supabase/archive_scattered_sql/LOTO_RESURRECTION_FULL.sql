-- =========================================================================================
-- LOTO HUB - RESURRECTION FULL MASTER SCRIPT
-- =========================================================================================
-- Questo script ricostruisce interamente le logiche andate perdute (DaaS, Anti-Cheat, ESG, Gamification)

-- ==========================================
-- MODULO 1: PROFILO E IDENTITÀ
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_co2 NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_liters_water INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flow_role TEXT DEFAULT 'LOTO Explorer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_level INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS party_size INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_cruise BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_accessibility_needs BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accessibility_mode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_persona TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS return_point_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobility_baseline TEXT;

-- Bulletproof Trigger Profilo
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, total_tokens) VALUES (NEW.id, 0);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Ignorato errore struttura profilo per garantire login: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user_fn();


-- ==========================================
-- MODULO 2: TABELLE TRANSAZIONALI E CODE
-- ==========================================

-- 2.1 Impact Transactions (Scans)
CREATE TABLE IF NOT EXISTS public.impact_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receipt_hash TEXT UNIQUE,
    co2_saved NUMERIC(10,4) DEFAULT 0,
    liters_saved INT DEFAULT 0,
    tokens_earned INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    action_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2.2 User Unlocked Media
CREATE TABLE IF NOT EXISTS public.user_unlocked_media (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (profile_id, media_id)
);

-- 2.3 Active Sessions (Code)
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    poi_id UUID NOT NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'expired')) DEFAULT 'pending',
    validation_confidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2.4 User Itineraries
CREATE TABLE IF NOT EXISTS public.user_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    mobility_type TEXT,
    potential_xp INT DEFAULT 0,
    co2_saved NUMERIC(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ==========================================
-- MODULO 3: VETRINA E POI
-- ==========================================
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS alternative_poi_id UUID;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS p_iva TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS current_occupancy INT DEFAULT 0;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS pending_occupancy INT DEFAULT 0;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT true;

ALTER TABLE public.media_vault ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.media_vault ADD COLUMN IF NOT EXISTS required_level INTEGER DEFAULT 1;
ALTER TABLE public.media_vault ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN DEFAULT false;

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


-- ==========================================
-- MODULO 4: RPC E MOTORE LOGICO
-- ==========================================

-- 4.1 get_pois (Base)
DROP FUNCTION IF EXISTS get_pois();
CREATE OR REPLACE FUNCTION get_pois()
RETURNS TABLE (
    id UUID, name TEXT, category TEXT, layer_name TEXT, xp_reward INTEGER,
    checkin_radius INTEGER, crowd_level INTEGER, has_water BOOLEAN, is_accessible BOOLEAN,
    latitude FLOAT8, longitude FLOAT8, p_iva TEXT, image_url TEXT, description TEXT, is_recommended BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius,
        p.current_occupancy as crowd_level, false as has_water, p.is_accessible,
        ST_Y(p.coords::geometry) as latitude, ST_X(p.coords::geometry) as longitude,
        p.p_iva, p.image_url, p.description, p.is_recommended
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 process_esg_impact (Motore ESG)
DROP FUNCTION IF EXISTS process_esg_impact(NUMERIC, INT, INT, INT, INT, UUID, TEXT);
CREATE OR REPLACE FUNCTION process_esg_impact(
    p_co2 NUMERIC, p_liters INT, p_tokens INT, p_xp INT, p_party_size INT, p_user_id UUID, p_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_final_co2 NUMERIC; v_final_liters INT; v_final_tokens INT; v_final_xp INT;
BEGIN
    v_final_co2 := p_co2 * p_party_size;
    v_final_liters := p_liters * p_party_size;
    v_final_tokens := p_tokens;
    v_final_xp := p_xp;

    UPDATE public.profiles SET
        total_co2 = COALESCE(total_co2, 0) + v_final_co2,
        total_liters_water = COALESCE(total_liters_water, 0) + v_final_liters,
        total_tokens = COALESCE(total_tokens, 0) + v_final_tokens,
        total_xp = COALESCE(total_xp, 0) + v_final_xp
    WHERE id = p_user_id;

    INSERT INTO public.impact_transactions (profile_id, receipt_hash, co2_saved, liters_saved, tokens_earned, xp_earned)
    VALUES (p_user_id, p_hash, v_final_co2, v_final_liters, v_final_tokens, v_final_xp);

    RETURN json_build_object('success', true, 'xp_earned', v_final_xp);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 get_poi_vetrina (Lucchetti Gamification)
DROP FUNCTION IF EXISTS get_poi_vetrina(UUID, UUID);
CREATE OR REPLACE FUNCTION get_poi_vetrina(p_poi_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_xp INTEGER; v_user_level INTEGER; v_is_premium BOOLEAN; v_result JSON;
BEGIN
    SELECT COALESCE(total_xp, 0), COALESCE(is_premium, false) INTO v_total_xp, v_is_premium FROM public.profiles WHERE id = p_user_id;
    IF v_total_xp < 30 THEN v_user_level := 1;
    ELSIF v_total_xp < 100 THEN v_user_level := 2;
    ELSE v_user_level := 3 + FLOOR((v_total_xp - 100) / 150);
    END IF;

    SELECT json_agg(json_build_object(
        'id', mv.id, 'title', mv.title, 'description', mv.description, 'media_type', mv.media_type,
        'loto_cost', mv.loto_cost, 'required_level', mv.required_level, 'is_premium_only', mv.is_premium_only,
        'media_path', CASE WHEN v_is_premium = true OR (mv.is_premium_only = false AND v_user_level >= mv.required_level) THEN mv.media_path ELSE NULL END,
        'is_unlocked', CASE WHEN v_is_premium = true OR (mv.is_premium_only = false AND v_user_level >= mv.required_level) THEN true ELSE false END
    )) INTO v_result FROM public.media_vault mv WHERE mv.poi_id = p_poi_id;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- MODULO 5: THE REAPER & ANTI-CHEAT
-- ==========================================
DROP FUNCTION IF EXISTS the_reaper_cleanup();
CREATE OR REPLACE FUNCTION the_reaper_cleanup()
RETURNS void AS $$
BEGIN
    -- Scadenza code pending
    UPDATE public.active_sessions SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND created_at < now() - interval '20 minutes';

    -- Ricalcolo occupancy rigoroso su POIS (non esclude parcheggi qui, li esclude get_smart_pois)
    UPDATE public.pois p SET
        current_occupancy = COALESCE((SELECT count(*) FROM public.active_sessions WHERE poi_id = p.id AND status = 'active'), 0),
        pending_occupancy = COALESCE((SELECT count(*) FROM public.active_sessions WHERE poi_id = p.id AND status = 'pending'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- MODULO 6: DAAS MATERIALIZED VIEW
-- ==========================================
-- Crea tabella scans fittizia se non esiste, usata per heatmap
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, lat NUMERIC, lng NUMERIC, created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), co2_saved NUMERIC, tenant_id TEXT
);

CREATE MATERIALIZED VIEW IF NOT EXISTS public.daas_anonymous_mobility_features AS
SELECT 
  tenant_id, 
  ST_Y(ST_SnapToGrid(ST_MakePoint(lng, lat), 0.001)) AS grid_lat, 
  ST_X(ST_SnapToGrid(ST_MakePoint(lng, lat), 0.001)) AS grid_lng,
  DATE_TRUNC('hour', created_at) + INTERVAL '15 min' * (EXTRACT(minute FROM created_at)::int / 15) AS time_block,
  COUNT(DISTINCT user_id) AS unique_users, 
  COUNT(*) AS total_scans, 
  SUM(COALESCE(co2_saved, 0)) AS co2_saved_block
FROM public.scans WHERE lat IS NOT NULL AND lng IS NOT NULL
GROUP BY tenant_id, grid_lat, grid_lng, time_block;


-- ==========================================
-- MODULO 7: DATI MOCK
-- ==========================================
UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/tempio.jpg', description = 'Antico tempio greco con colonne doriche.', is_recommended = true
WHERE name ILIKE '%Tempio di Poseidone%';

UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/saturo.jpg', description = 'Vasto parco archeologico sul mare.', is_recommended = true
WHERE name ILIKE '%Parco Archeologico di Saturo%';

UPDATE public.pois SET image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/placeholder.jpg' WHERE image_url IS NULL;

DELETE FROM public.tenant_events WHERE tenant_id = 'taranto';
INSERT INTO public.tenant_events (tenant_id, event_type, title, description, short_description, banner_url, icon_emoji, starts_at, ends_at, status) VALUES 
('taranto', 'cultural_night', 'Notte Bianca dei Musei', 'Apertura straordinaria dei musei di Taranto.', 'Musei aperti e performance live', 'https://lotohub.s3.amazonaws.com/events/taranto_notte_bianca.jpg', '🏛️', now() - interval '1 day', now() + interval '5 days', 'active'),
('taranto', 'community_challenge', 'Eco-Passeggiata al Saturo', 'Aiutaci a ripulire il parco archeologico.', 'Pulizia del parco con bonus XP x3', 'https://lotohub.s3.amazonaws.com/events/taranto_eco.jpg', '🌿', now() - interval '2 days', now() + interval '10 days', 'active');

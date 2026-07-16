-- =========================================================================
-- SCRIPT DEFINITIVO DI GUARIGIONE DEL DATABASE (SPRINT 3)
-- Risolve la discrepanza tra vecchie tabelle (lat/lng) e nuove tabelle spaziali
-- =========================================================================

-- 1. Pulizia chirurgica delle vecchie tabelle dipendenti
DROP MATERIALIZED VIEW IF EXISTS public.daas_anonymous_mobility_features CASCADE;
DROP TABLE IF EXISTS public.user_unlocked_media CASCADE;
DROP TABLE IF EXISTS public.media_vault CASCADE;
DROP TABLE IF EXISTS public.user_pois CASCADE;
DROP TABLE IF EXISTS public.whispers CASCADE;
DROP TABLE IF EXISTS public.pois CASCADE;
DROP TABLE IF EXISTS public.territories CASCADE;

-- 2. Creazione della tabella Territori
CREATE TABLE public.territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    boundaries GEOMETRY(MultiPolygon, 4326) NOT NULL,
    colors JSONB NOT NULL,
    assets JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX territories_spatial_idx ON public.territories USING GIST(boundaries);

-- 3. Creazione della tabella POI DEFINITIVA (Sprint 3)
CREATE TABLE public.pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('free', 'partner', 'secret')),
    layer_name TEXT NOT NULL, 
    xp_reward INTEGER NOT NULL DEFAULT 0,
    checkin_radius INTEGER DEFAULT 50,
    loto_quota_max INTEGER DEFAULT 50,
    is_accessible BOOLEAN DEFAULT true,
    coords GEOGRAPHY(POINT, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);
CREATE INDEX pois_coords_idx ON public.pois USING GIST(coords);

-- 4. Ricreiamo il Trigger Geofencing
CREATE OR REPLACE FUNCTION assign_and_validate_poi_territory_fn() RETURNS TRIGGER AS $$
DECLARE found_territory_id UUID;
BEGIN
    SELECT id INTO found_territory_id FROM public.territories WHERE ST_Within(NEW.coords::geometry, boundaries) LIMIT 1;
    IF found_territory_id IS NULL THEN RAISE EXCEPTION 'Errore di geofencing: Coordinate fuori dai territori attivi.'; END IF;
    NEW.territory_id := found_territory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_and_validate_poi_territory
BEFORE INSERT OR UPDATE OF coords ON public.pois
FOR EACH ROW EXECUTE FUNCTION assign_and_validate_poi_territory_fn();

-- 5. Creazione Tabella Vault Multimediale
CREATE TABLE public.media_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    media_path VARCHAR(512) NOT NULL,
    loto_cost INTEGER NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User_Pois e Storico
CREATE TABLE public.user_pois (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (profile_id, poi_id)
);

CREATE TABLE public.user_unlocked_media (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media_vault(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
    PRIMARY KEY (profile_id, media_id)
);

-- 7. Popolamento Territori Base
INSERT INTO public.territories (name, boundaries, colors, assets) VALUES 
('Taranto', ST_GeomFromText('MULTIPOLYGON(((16.80 40.30, 17.50 40.30, 17.50 40.55, 16.80 40.55, 16.80 40.30)))', 4326), '{"primary": "#4A5D23", "secondary": "#D96C4A", "background": "#F9F6EE", "card": "#FFFFFF", "text": "#1F1F1F", "tint": "#4A5D23"}'::jsonb, '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/splash.png"}'::jsonb),
('Lecce', ST_GeomFromText('MULTIPOLYGON(((18.05 40.25, 18.29 40.25, 18.29 40.45, 18.05 40.45, 18.05 40.25)))', 4326), '{"primary": "#C5A059", "secondary": "#6E5032", "background": "#FAF8F5", "card": "#FFFFFF", "text": "#2A2521", "tint": "#C5A059"}'::jsonb, '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/splash.png"}'::jsonb);


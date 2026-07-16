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


-- ==========================================
-- 3.5 CREAZIONE VISTA FRONTEND
-- (Converte PostGIS coords in lat/lng per la UI e fa il fallback di tenant_id)
-- ==========================================
CREATE OR REPLACE VIEW public.vw_pois_frontend AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.layer_name,
    p.xp_reward,
    p.checkin_radius,
    p.loto_quota_max,
    p.is_accessible,
    p.is_active,
    ST_Y(p.coords::geometry) AS lat,
    ST_X(p.coords::geometry) AS lng,
    p.territory_id,
    LOWER(t.name) AS tenant_id
FROM public.pois p
LEFT JOIN public.territories t ON p.territory_id = t.id;

GRANT SELECT ON public.vw_pois_frontend TO authenticated, anon;

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



-- ==========================================
-- 8. INSERIMENTO DEI POI SULLA MAPPA
-- ==========================================
-- =========================================================================
-- MIGRATION V10: TABULA RASA & PRODUCTION SEED
-- Questo script rade al suolo i POI finti e inietta la "LOTO Taranto V1".
-- Le coordinate sono esatte (fino a 6 decimali).
-- Categorie consolidate: free, partner, secret (per non frammentare la UI).
-- =========================================================================

-- 1. Aggiungiamo il flag per l'Accessibilità (derivato dai tuoi dati)
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


-- ==========================================
-- 9. INSERIMENTO MEDIA VAULT
-- ==========================================
DO $$
DECLARE
    v_castello_id UUID;
    v_ipogeo_id UUID;
    v_saturo_id UUID;
BEGIN
    SELECT id INTO v_castello_id FROM public.pois WHERE name = 'Castello Aragonese' LIMIT 1;
    SELECT id INTO v_ipogeo_id FROM public.pois WHERE name = 'Ipogeo Spartano - Casa della Marchesa' LIMIT 1;
    SELECT id INTO v_saturo_id FROM public.pois WHERE name = 'Parco Archeologico di Saturo' LIMIT 1;

    IF v_castello_id IS NOT NULL THEN
        INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
        VALUES (v_castello_id, 'Audio-Guida: Il Segreto delle Mura', 'audio/castello_mura_secret.mp3', 15, 'audio'),
               (v_castello_id, 'Video Premium: Riprese Drone', 'video/castello_drone.mp4', 30, 'video');
    END IF;

    IF v_ipogeo_id IS NOT NULL THEN
        INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
        VALUES (v_ipogeo_id, 'Audio-Guida: La Necropoli Nascosta', 'audio/ipogeo_necropoli.mp3', 25, 'audio');
    END IF;

    IF v_saturo_id IS NOT NULL THEN
        INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
        VALUES (v_saturo_id, 'Audio-Guida: Tempio di Saturo', 'audio/saturo_tempio.mp3', 20, 'audio');
    END IF;
END $$;


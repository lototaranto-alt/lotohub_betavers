-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - Seeding Taranto
-- Tabella Primaria: POIS (Spatial Data & XP Rewards)
-- =========================================================================

-- 1. Creazione Tabella POIS (se non esiste)
-- Utilizziamo GEOGRAPHY(POINT) per calcoli accurati di geofencing (metri).
CREATE TABLE IF NOT EXISTS pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('free', 'partner', 'secret')),
    
    -- Configurazione Mapbox Studio
    layer_name TEXT NOT NULL, 
    
    -- Logica ESG & XP (Pilota Taranto)
    xp_reward INTEGER NOT NULL,
    checkin_radius INTEGER DEFAULT 50, -- Raggio in metri per validazione geofenching
    
    -- Dati Spaziali (PostGIS)
    coords GEOGRAPHY(POINT, 4326) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Index Spaziale per query performanti (es. POI più vicini)
CREATE INDEX IF NOT EXISTS pois_coords_idx ON pois USING GIST(coords);

-- 3. Iniezione Dati Pilota (Lista Definitiva Taranto)

-- Troncamento (opzionale, per pulizia seeding durante i test)
-- TRUNCATE TABLE pois;

-- 3.1 CATEGORIA: FREE (15 XP - layer-loto-free)
INSERT INTO pois (name, category, layer_name, xp_reward, coords) VALUES 
('Castello Aragonese', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2341, 40.4727), 4326)),
('Tempio di Poseidone', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2335, 40.4731), 4326)),
('Duomo San Cataldo', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2301, 40.4761), 4326)),
('Concattedrale Gran Madre di Dio', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2612, 40.4595), 4326)),
('Monumento al Marinaio', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2325, 40.4745), 4326)),
('Ponte Girevole', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2349, 40.4732), 4326)),
('Mura Greche', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2580, 40.4690), 4326)),
('Palude La Vela', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.3100, 40.4800), 4326)),
('Piazza Fontana', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2305, 40.4815), 4326)),
('Parco Archeologico Collepasso', 'free', 'layer-loto-free', 15, ST_SetSRID(ST_MakePoint(17.2645, 40.4565), 4326));

-- 3.2 CATEGORIA: PARTNER (50 XP - layer-loto-partners)
INSERT INTO pois (name, category, layer_name, xp_reward, coords) VALUES 
('Museo Diocesano MuDi', 'partner', 'layer-loto-partners', 50, ST_SetSRID(ST_MakePoint(17.2288, 40.4762), 4326)),
('Canneto Beach', 'partner', 'layer-loto-partners', 50, ST_SetSRID(ST_MakePoint(17.3755, 40.3478), 4326)),
('Fatamorgana', 'partner', 'layer-loto-partners', 50, ST_SetSRID(ST_MakePoint(17.4037, 40.3465), 4326)),
('Valle Rita', 'partner', 'layer-loto-partners', 50, ST_SetSRID(ST_MakePoint(16.8905, 40.5052), 4326));

-- 3.3 CATEGORIA: SECRET (100 XP - layer-loto-secrets)
INSERT INTO pois (name, category, layer_name, xp_reward, coords) VALUES 
('Ipogeo Spartano - Casa della Marchesa', 'secret', 'layer-loto-secrets', 100, ST_SetSRID(ST_MakePoint(17.2313, 40.4766), 4326)),
('Parco Archeologico di Saturo', 'secret', 'layer-loto-secrets', 100, ST_SetSRID(ST_MakePoint(17.3113, 40.3538), 4326)),
('Isola San Pietro', 'secret', 'layer-loto-secrets', 100, ST_SetSRID(ST_MakePoint(17.1512, 40.4545), 4326));

-- =========================================================================
-- Documentazione:
-- Per recuperare i POI dal frontend con tipizzazione LotoPOI:
-- SELECT id, name, category, layer_name, xp_reward, checkin_radius, 
--        ST_X(coords::geometry) as longitude, ST_Y(coords::geometry) as latitude
-- FROM pois WHERE is_active = true;
-- =========================================================================

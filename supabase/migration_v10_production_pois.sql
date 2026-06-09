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

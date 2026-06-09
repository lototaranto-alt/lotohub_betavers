-- =========================================================================
-- MIGRATION V11: FIX "METE CONSIGLIATE" E ALLINEAMENTO RPC
-- 1. Reimposta il flag is_recommended su alcune mete chiave.
-- 2. Aggiorna l'RPC get_pois() per restituire TUTTI i campi necessari alla Home.
-- =========================================================================

-- 1. Rimettiamo "Mete Consigliate" su 3 POI strategici per far riapparire la sezione in Home
UPDATE public.pois 
SET is_recommended = true
WHERE name IN ('Castello Aragonese', 'Oasi Palude La Vela', 'MuDi - Museo Diocesano');

-- 2. Aggiorniamo get_pois() affinché restituisca TUTTI i campi, inclusi quelli di Governance
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

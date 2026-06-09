-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - RPC Functions
-- Funzione: get_pois() - Recupero POI tipizzati per Mapbox
-- =========================================================================

CREATE OR REPLACE FUNCTION get_pois()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    layer_name TEXT,
    xp_reward INTEGER,
    checkin_radius INTEGER,
    latitude FLOAT8,
    longitude FLOAT8
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
        ST_X(p.coords::geometry) as longitude
    FROM pois p
    WHERE p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commento per documentazione
COMMENT ON FUNCTION get_pois() IS 'Restituisce la lista dinamica dei POI attivi mappando le coordinate spaziali in latitudine e longitudine decimali per il frontend.';

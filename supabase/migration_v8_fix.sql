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

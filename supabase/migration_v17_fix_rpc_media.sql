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

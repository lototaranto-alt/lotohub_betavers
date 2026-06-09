-- =========================================================================
-- LOTO HUB - MIGRATION V9: GOVERNANCE MOBILITY & PARKING
-- Aggiunge il supporto per il Bivio Decisionale e i Parcheggi Strategici
-- =========================================================================

-- 1. Aggiunta Colonne Mobility alla tabella POIS
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS recommended_parking_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parking_bonus_xp INTEGER DEFAULT 10;

-- 2. Inserimento del Parcheggio Strategico Mock (Porto Antico)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.pois WHERE layer_name = 'parking' AND name = 'Park Porto Antico') THEN
        INSERT INTO public.pois (name, category, layer_name, checkin_radius, has_water, coords, loto_quota_max, xp_reward)
        VALUES ('Park Porto Antico', 'free', 'parking', 200, false, ST_SetSRID(ST_MakePoint(17.2285, 40.4720), 4326), 300, 10);
    END IF;
END $$;

-- 3. Link: Suggeriamo il parcheggio a chi va al Castello (Simulazione)
UPDATE public.pois 
SET recommended_parking_id = (SELECT id FROM public.pois WHERE layer_name = 'parking' LIMIT 1)
WHERE name ILIKE '%Castel%' OR name ILIKE '%Duomo%';

-- 4. Aggiornamento RPC: get_smart_pois (Home)
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
    pending_occupancy INTEGER,
    recommended_parking_id UUID,
    parking_bonus_xp INTEGER
) AS $$
BEGIN
    PERFORM the_reaper_cleanup();

    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius, p.crowd_level,
        p.has_water, p.alternative_poi_id, p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        COALESCE(p.loto_quota_max, 50) as loto_quota_max,
        COALESCE(p.current_occupancy, 0) as current_occupancy,
        COALESCE(p.pending_occupancy, 0) as pending_occupancy,
        p.recommended_parking_id,
        COALESCE(p.parking_bonus_xp, 10) as parking_bonus_xp
    FROM public.pois p
    WHERE p.is_active = true AND p.layer_name != 'parking' -- Non mostriamo il parcheggio nella lista principale
    ORDER BY ((COALESCE(p.current_occupancy, 0) + COALESCE(p.pending_occupancy, 0))::float / GREATEST(COALESCE(p.loto_quota_max, 50), 1)) ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Aggiornamento RPC: get_pois (Esplora)
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
    alternative_poi_id UUID,
    is_recommended BOOLEAN,
    latitude FLOAT8,
    longitude FLOAT8,
    p_iva TEXT,
    loto_quota_max INTEGER,
    current_occupancy INTEGER,
    pending_occupancy INTEGER,
    recommended_parking_id UUID,
    parking_bonus_xp INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.layer_name, p.xp_reward, p.checkin_radius, p.crowd_level,
        p.has_water, p.alternative_poi_id, p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva,
        COALESCE(p.loto_quota_max, 50) as loto_quota_max,
        COALESCE(p.current_occupancy, 0) as current_occupancy,
        COALESCE(p.pending_occupancy, 0) as pending_occupancy,
        p.recommended_parking_id,
        COALESCE(p.parking_bonus_xp, 10) as parking_bonus_xp
    FROM public.pois p
    WHERE p.is_active = true AND p.layer_name != 'parking'
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

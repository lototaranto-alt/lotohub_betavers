-- ==============================================================
-- LOTO HUB - MIGRATION V5: ECO-SISTEMA FLOW & REFILL
-- Questo script istanzia la logica "Anti-Grosse" (Anti-Crowding)
-- Aggiunge campi affollamento, idrici e aggiorna get_pois()
-- ==============================================================

-- 1. Aggiungere le colonne mancanti alla tabella POIS
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS crowd_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_water BOOLEAN DEFAULT FALSE;

-- 2. Mocking Data per il Test
-- Mettiamo il "Castello" in stato "Molto Affollato" (85%)
UPDATE public.pois 
SET crowd_level = 85 
WHERE name ILIKE '%Castel%';

-- Mettiamo la "Fontana" con acqua e zero folla
UPDATE public.pois 
SET has_water = TRUE, crowd_level = 10 
WHERE name ILIKE '%Fontana%';

-- 3. Aggiornare l'RPC get_pois()
-- Poiché stiamo cambiando il tipo di ritorno della tabella, Postgres richiede il DROP preventivo
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
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva
    FROM public.pois p
    WHERE p.is_active = true
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pois() IS 'Restituisce i POI con dati di affollamento e disponibilità idrica per la logica Anti-Grosse.';

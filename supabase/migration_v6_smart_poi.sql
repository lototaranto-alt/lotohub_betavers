-- ==============================================================
-- LOTO HUB - MIGRATION V6: SMART ROUTING & EVENTS
-- Aggiunge campi per la Governance del Flusso Turistico (Alternative)
-- ==============================================================

-- 1. Aggiungere le colonne Smart alla tabella POIS
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS alternative_poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Mockup di deviazione: Il "Castello" devia sulla "Fontana" se è pieno
UPDATE public.pois 
SET alternative_poi_id = (SELECT id FROM public.pois WHERE name ILIKE '%Fontana%' LIMIT 1)
WHERE name ILIKE '%Castel%';

-- Segniamo un POI come sempre consigliato per popolare la Home
UPDATE public.pois 
SET is_recommended = true
WHERE name ILIKE '%Piazza%';

-- E per coerenza, se la profile non ha experience_level (lo mettiamo via app, ma nel dubbio proviamo ad aggiungerlo al volo)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'Ospite Loto';

-- 2. Creazione Tabella EVENTI
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono vedere gli eventi" ON public.events FOR SELECT USING (true);


-- 3. Nuovo RPC get_smart_pois()
-- Restituisce solo i POI raccomandati o quelli saturi in modo da gestire l'UI della Vetrina.
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
        p.alternative_poi_id,
        p.is_recommended,
        ST_Y(p.coords::geometry) as latitude,
        ST_X(p.coords::geometry) as longitude,
        p.p_iva
    FROM public.pois p
    WHERE p.is_active = true 
      AND (p.is_recommended = true OR p.crowd_level >= 80)
    ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_smart_pois() IS 'Directory Intelligente: Restituisce solo i luoghi consigliati o quelli in stato di sovraffollamento che necessitano di avvisi UI.';

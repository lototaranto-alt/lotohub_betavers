-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - Gamification & Visits
-- Tabella: USER_POIS (Tracciamento esplorazione)
-- =========================================================================

-- 1. Creazione Tabella USER_POIS
-- Relazione molti-a-molti tra profili e punti di interesse.
CREATE TABLE IF NOT EXISTS user_pois (
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (profile_id, poi_id)
);

-- RLS per protezione dati visita
ALTER TABLE user_pois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visits" ON user_pois FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can register their own visits" ON user_pois FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- 2. Funzione RPC avanzata: get_pois_with_status
-- Restituisce i POI con lo stato di visita dell'utente attuale.
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
    is_visited BOOLEAN
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
        ) as is_visited
    FROM pois p
    WHERE p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commento documentazione
COMMENT ON FUNCTION get_pois_with_status(UUID) IS 'Recupera tutti i P.O.I. attivi incrociandoli con lo stato di visita per lo specifico utente, decodificando Lat/Lng.';

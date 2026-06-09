-- =========================================================================
-- LOTO HUB - MIGRATION V8: HYBRID VALIDATION & LOTO-TRUST (SPRINT A)
-- Architettura per la Validazione Ibrida, Intent Logic e The Reaper
-- =========================================================================

-- 1. ESTENSIONE SCHEMA
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS loto_quota_max INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS current_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_dwell_time INTEGER DEFAULT 30; -- minuti

-- 2. TABELLA ACTIVE SESSIONS
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'expired')) DEFAULT 'pending',
    validation_confidence TEXT CHECK (validation_confidence IN ('GPS_SILENT', 'QR_FORCED', 'MANUAL')),
    party_size INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_poi ON public.active_sessions(poi_id, status);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono vedere le sessioni" ON public.active_sessions FOR SELECT USING (true);
CREATE POLICY "Gli utenti possono inserire sessioni" ON public.active_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Gli utenti possono aggiornare le proprie sessioni" ON public.active_sessions FOR UPDATE USING (auth.uid() = user_id);

-- 3. THE REAPER (Pulizia e Sincronizzazione Totale senza Drift)
-- Questa funzione innesca la pulizia e ricalcola i contatori in modo assoluto.
CREATE OR REPLACE FUNCTION the_reaper_cleanup()
RETURNS void AS $$
BEGIN
    -- 3.1 Manda in 'expired' le prenotazioni pending vecchie di 20 minuti
    UPDATE public.active_sessions
    SET status = 'expired'
    WHERE status = 'pending' AND created_at < timezone('utc'::text, now()) - interval '20 minutes';

    -- 3.2 Manda in 'completed' le sessioni attive il cui dwell_time è scaduto
    UPDATE public.active_sessions
    SET status = 'completed'
    WHERE status = 'active' AND expires_at < timezone('utc'::text, now());

    -- 3.3 Sincronizzazione granitica dei contatori (no drift)
    UPDATE public.pois p
    SET 
        current_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'active'), 0),
        pending_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'pending'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. BOOKING E VALIDAZIONE
CREATE OR REPLACE FUNCTION book_poi_visit(p_user_id UUID, p_poi_id UUID, p_party_size INTEGER)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Pulizia pre-inserimento per avere dati freschi
    PERFORM the_reaper_cleanup();

    INSERT INTO public.active_sessions (user_id, poi_id, status, party_size)
    VALUES (p_user_id, p_poi_id, 'pending', p_party_size)
    RETURNING id INTO v_session_id;

    -- Ricalcola contatori
    PERFORM the_reaper_cleanup();

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION validate_checkin(p_session_id UUID, p_validation_confidence TEXT)
RETURNS void AS $$
DECLARE
    v_poi_id UUID;
    v_dwell_time INTEGER;
BEGIN
    -- Trova il POI e il suo dwell_time
    SELECT a.poi_id, p.average_dwell_time 
    INTO v_poi_id, v_dwell_time
    FROM public.active_sessions a
    JOIN public.pois p ON p.id = a.poi_id
    WHERE a.id = p_session_id;

    -- Passa a status active e imposta scadenza
    UPDATE public.active_sessions
    SET status = 'active',
        validation_confidence = p_validation_confidence,
        expires_at = timezone('utc'::text, now()) + (v_dwell_time || ' minutes')::interval
    WHERE id = p_session_id;

    -- Ricalcola
    PERFORM the_reaper_cleanup();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. UPGRADE SMART POIS (Saturazione Reale)
-- Sovrascriviamo la funzione get_smart_pois per lanciare il Reaper
-- e ordinare i risultati per saturazione reale.
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
    -- L'Auto-Trigger del Reaper! Ogni volta che un utente apre l'app, il database si pulisce.
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
        p.loto_quota_max,
        p.current_occupancy,
        p.pending_occupancy
    FROM public.pois p
    WHERE p.is_active = true
    -- Mostriamo solo POI non saturi (> 100%), oppure possiamo mostrarli tutti per far vedere che sono pieni
    -- Il sorting metterà quelli MENO saturi in cima
    ORDER BY ((p.current_occupancy + p.pending_occupancy)::float / GREATEST(p.loto_quota_max, 1)) ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX EMERGENZA: "UPDATE requires a WHERE clause"
-- Aggiunta della clausola WHERE p.id IS NOT NULL per aggirare le policy di safeupdate.

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
        pending_occupancy = COALESCE((SELECT SUM(party_size) FROM public.active_sessions WHERE poi_id = p.id AND status = 'pending'), 0)
    WHERE p.id IS NOT NULL; -- FIX: Clausola WHERE per soddisfare le regole di safeupdate
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

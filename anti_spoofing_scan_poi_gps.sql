-- =================================================================================
-- L.O.T.O. HUB - Motore Anti-Spoofing GPS & Assegnazione XP (scan_poi_gps)
-- =================================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION public.scan_poi_gps(
    p_poi_id UUID,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_last_poi_checkin TIMESTAMP;
    v_last_global_checkin RECORD;
    v_poi_data RECORD;
    v_distance_meters DOUBLE PRECISION;
    v_time_diff_hours DOUBLE PRECISION;
    v_speed_kmh DOUBLE PRECISION := 0;
    
    v_is_shadowbanned BOOLEAN := FALSE;
    v_xp_awarded INT := 0;
    v_co2_saved DOUBLE PRECISION := 0;
    
    v_new_total_xp INT;
    v_result JSONB;
BEGIN
    -- Sicurezza: Ottieni l'utente autenticato direttamente dal token
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    -- 1. Ottieni i dati base del POI
    SELECT base_xp, base_co2 INTO v_poi_data
    FROM public.pois
    WHERE id = p_poi_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'POI non trovato';
    END IF;

    -- 2. Controllo Cooldown: 12 ore sullo STESSO POI
    SELECT created_at INTO v_last_poi_checkin
    FROM public.user_pois
    WHERE user_id = v_user_id AND poi_id = p_poi_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_poi_checkin IS NOT NULL AND (NOW() - v_last_poi_checkin) < INTERVAL '12 hours' THEN
        RAISE EXCEPTION 'Cooldown attivo. Puoi rifare check-in in questo POI tra 12 ore.';
    END IF;

    -- 3. Controllo Velocità / Anti-Spoofing GLOBALE
    SELECT created_at, lat, lng INTO v_last_global_checkin
    FROM public.user_pois
    WHERE user_id = v_user_id AND lat IS NOT NULL AND lng IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_global_checkin.created_at IS NOT NULL THEN
        v_distance_meters := ST_Distance(
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(v_last_global_checkin.lng, v_last_global_checkin.lat), 4326)::geography
        );
        
        v_time_diff_hours := EXTRACT(EPOCH FROM (NOW() - v_last_global_checkin.created_at)) / 3600.0;
        
        IF v_time_diff_hours > 0 THEN
            v_speed_kmh := (v_distance_meters / 1000.0) / v_time_diff_hours;
        ELSE
            v_speed_kmh := 9999;
        END IF;
    END IF;

    -- 4. Scenari Mobilità
    IF v_speed_kmh > 130 THEN
        -- Shadowban (Nessun errore mostrato all'utente per mitigare farming, ma XP = 0)
        v_is_shadowbanned := TRUE;
        v_xp_awarded := 0;
        v_co2_saved := 0;
    ELSIF v_speed_kmh >= 20 AND v_speed_kmh <= 130 THEN
        -- Check-in Veicolare (XP si, CO2 no perché non hanno camminato)
        v_xp_awarded := COALESCE(v_poi_data.base_xp, 15);
        v_co2_saved := 0;
    ELSE
        -- Check-in Pedonale perfetto
        v_xp_awarded := COALESCE(v_poi_data.base_xp, 15);
        v_co2_saved := COALESCE(v_poi_data.base_co2, 0);
    END IF;

    -- 5. Aggiorna i dati nel database
    INSERT INTO public.user_pois (user_id, poi_id, lat, lng, created_at)
    VALUES (v_user_id, p_poi_id, p_lat, p_lng, NOW());

    UPDATE public.profiles
    SET 
        total_xp = COALESCE(total_xp, 0) + v_xp_awarded,
        total_co2 = COALESCE(total_co2, 0) + v_co2_saved
    WHERE id = v_user_id
    RETURNING total_xp INTO v_new_total_xp;

    -- 6. Ritorno ottimistico
    v_result := jsonb_build_object(
        'status', 'success',
        'xp_awarded', v_xp_awarded,
        'co2_saved', v_co2_saved,
        'new_total_xp', v_new_total_xp,
        'speed_kmh', v_speed_kmh,
        'shadowbanned', v_is_shadowbanned
    );

    RETURN v_result;

END;
$$;

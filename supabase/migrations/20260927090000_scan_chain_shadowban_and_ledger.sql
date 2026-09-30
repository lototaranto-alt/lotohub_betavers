-- =============================================================================
--  L.O.T.O. HUB - Scansione GPS: esclusione shadowbanned + scrittura sul ledger
-- =============================================================================
--  Perche' questa migration esiste
--  ---------------------------------
--  La funzione attiva public.scan_poi_gps (v4 MASTER) e' stata verificata
--  token per token contro il corpo restituito dal cloud: i due corpi sono
--  identici. Questo file e' quindi l'unico riferimento per le modifiche.
--
--  Difetti corretti in questa migration
--  ------------------------------------
--  1. I controlli di cooldown (12h) e di anti-spoofing globale leggevano
--     public.user_pois SENZA il filtro is_shadowbanned. Un check-in marchiato
--     shadowbanned entrava quindi nel calcolo di quello successivo:
--       - una riga shadowbanned lontana dal proprio POI fa scattare a sua volta
--         il shadowbanned sul check-in successivo, e cosi' di seguito
--       - una riga shadowbanned sullo STESSO POI attiva il cooldown di 12 ore
--     L'impatto e' sempre e solo sullo stesso utente: la funzione deriva
--     l'utente da auth.uid() e non accetta un profile_id esterno, quindi
--     nessuno puo' avvelenare le righe di un altro. Non e' una vulnerabilita'
--     e non permette a nessuno di bloccare altri utenti. E' un bug di
--     robustezza: chi si auto-marchia shadowbanned non capisce perche' poi non
--     riesce piu' a fare check-in.
--
--  2. public.scan_poi_gps non scriveva MAI su public.impact_transactions.
--     Il ledger era a zero righe. Di conseguenza:
--       - vw_user_dashboard_metrics.total_xp leggeva 0 anche con check-in validi
--       - vw_daas_esg_monthly leggeva il ledger, quindi era sempre vuota
--     La correzione registra cio' che la funzione gia' calcolava e non
--     scriveva. Non introduce alcuna regola di business nuova.
--
--  3. La stessa cecita' esiste in verify_checkin_speed_plausibility_fn
--     (migration_v13_sprint3_database.sql:225), che legge l'ultima riga senza
--     filtrare shadowbanned. NON pero' un problema attivo: la query sui trigger
--     di public.user_pois non ha restituito alcuna riga, quindi quel trigger non
--     e' deployato nel cloud e la funzione non viene mai chiamata. Non viene
--     corretta qui di proposito: creare una funzione senza trigger aggiungerebbe
--     un oggetto orfano, cioe' il difetto che questa sessione sta eliminando.
--     Se un giorno quel trigger venisse deployato, va corretto insieme a qui.
--
--  Perche' il ledger e' forward-only
--  ---------------------------------
--  public.user_pois non persiste lo scenario di mobilita' (pedonale / veicolare),
--  che e' l'unico dato che determina la Loto PTI. Le 5 righe di user_pois
--  gia' presenti non possono essere convertite in righe di ledger senza
--  inventare il valore, quindi NON vengono recuperate. Da questa migration in
--  poi il ledger registra ogni check-in.
--
--  Valori scelti e da dove derivano
--  ---------------------------------
--    tokens_earned = v_pti_awarded   -> 10 pedonale, 1 veicolare, 0 se shadowbanned
--    xp_earned    = v_xp_awarded    -> gia' accreditato dal ramo mobile della funzione
--    co2_saved    = v_co2_saved     -> 1.5 pedonale, 0 veicolare
--    liters_saved = 0               -> gli litri appartengono alle azioni civiche:
--                                       vw_daas_civic_ledger_month li somma filtrando
--                                       action_type = 'civic_action'. Un check-in
--                                       turistico non e' un'azione civica. La
--                                       colonna e' NOT NULL, quindi va valorizzata.
--    action_type  = 'tourist_checkin'-> valore ammesso dal CHECK
--                                       impact_transactions_action_type_check
--                                       (migration v22) ed e' quello su cui
--                                      filtrano vw_daas_esg_monthly e la vista
--                                       dashboard.
--    tenant_id    = pois.tenant_id  -> lo stesso tenant che attribuisce
--                                       vw_daas_heatmap_15min (hardening:85).
--                                       profiles non ha tenant_id, quindi il POI
--                                       e' l'unica fonte reale disponibile.
--
--  Le righe shadowbanned NON vengono scritte: impact_transactions non ha una
--  colonna is_shadowbanned, quindi un check-in fraudolento finirebbe nel
--  report DaaS come riga da tutti zeri. Coerente con il fatto che il ledger
--  non deve contenere dati palesemente falsi.
--
--  Compatibilita': la funzione resta SECURITY DEFINER come prima, e resta
--  richiesto auth.uid(). Nessun grant cambia in questa migration.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
--  public.scan_poi_gps: esclusione shadowbanned + scrittura sul ledger
-- -----------------------------------------------------------------------------
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
    v_profile_id UUID;
    v_last_poi_checkin TIMESTAMP;
    v_last_global_checkin RECORD;
    v_poi_data RECORD;
    v_distance_meters DOUBLE PRECISION;
    v_time_diff_hours DOUBLE PRECISION;
    v_speed_kmh DOUBLE PRECISION := 0;

    v_is_shadowbanned BOOLEAN := FALSE;
    v_xp_awarded INT := 0;
    v_pti_awarded INT := 0;
    v_co2_saved DOUBLE PRECISION := 0;

    v_new_total_xp INT;
    v_result JSONB;
BEGIN
    -- 1. Utente autenticato
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    -- 2. Dati base del POI. tenant_id serve per il ledger; la versione
    --    precedente leggeva solo xp_reward.
    SELECT xp_reward, tenant_id INTO v_poi_data
    FROM public.pois
    WHERE id = p_poi_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'POI non trovato';
    END IF;

    -- 3. Cooldown 12 ore sullo stesso POI, ignorando le righe shadowbanned
    SELECT visited_at INTO v_last_poi_checkin
    FROM public.user_pois
    WHERE profile_id = v_profile_id
      AND poi_id = p_poi_id
      AND is_shadowbanned IS NOT TRUE
    ORDER BY visited_at DESC
    LIMIT 1;

    IF v_last_poi_checkin IS NOT NULL AND (NOW() - v_last_poi_checkin) < INTERVAL '12 hours' THEN
        RAISE EXCEPTION 'Cooldown attivo. Puoi rifare check-in in questo specifico POI tra 12 ore.';
    END IF;

    -- 4. Anti-spoofing globale, ignorando le righe shadowbanned
    SELECT up.visited_at, ST_Y(p.coords::geometry) as prev_lat, ST_X(p.coords::geometry) as prev_lng
    INTO v_last_global_checkin
    FROM public.user_pois up
    JOIN public.pois p ON p.id = up.poi_id
    WHERE up.profile_id = v_profile_id
      AND up.is_shadowbanned IS NOT TRUE
    ORDER BY up.visited_at DESC
    LIMIT 1;

    IF v_last_global_checkin.visited_at IS NOT NULL THEN
        v_distance_meters := ST_Distance(
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(v_last_global_checkin.prev_lng, v_last_global_checkin.prev_lat), 4326)::geography
        );

        v_time_diff_hours := EXTRACT(EPOCH FROM (NOW() - v_last_global_checkin.visited_at)) / 3600.0;

        IF v_time_diff_hours > 0 THEN
            v_speed_kmh := (v_distance_meters / 1000.0) / v_time_diff_hours;
        ELSE
            v_speed_kmh := 9999;
        END IF;
    END IF;

    -- 5. Scenari Mobilita'. Logica invariata rispetto alla v4 attiva:
    --    stesse soglie, stessi premi. Le uniche modifiche sono i filtri
    --    is_shadowbanned ai passi 3 e 4 e l'INSERT sul ledger al passo 6b.
    IF v_speed_kmh > 130 THEN
        -- Shadowban (Teletrasporto)
        v_is_shadowbanned := TRUE;
        v_xp_awarded := 0;
        v_pti_awarded := 0;
        v_co2_saved := 0;
    ELSIF v_speed_kmh >= 20 AND v_speed_kmh <= 130 THEN
        -- Check-in Veicolare (In Macchina) -> Penalita' ecologica
        v_xp_awarded := 2; -- Pochi XP
        v_pti_awarded := 1; -- Pochissimi Loto Points (PTI)
        v_co2_saved := 0.0; -- Nessun risparmio CO2
    ELSE
        -- Check-in Pedonale (Punteggio pieno Eco-Passi)
        v_xp_awarded := COALESCE(v_poi_data.xp_reward, 15);
        v_pti_awarded := 10; -- PTI pieni
        v_co2_saved := 1.5; -- CO2 evitata per aver camminato
    END IF;

    -- 6. Registra il check-in
    INSERT INTO public.user_pois (
        profile_id, poi_id, visited_at,
        is_shadowbanned, xp_awarded, co2_saved,
        calculated_speed_kmh, lat, lng
    )
    VALUES (
        v_profile_id, p_poi_id, NOW(),
        v_is_shadowbanned, v_xp_awarded, v_co2_saved,
        v_speed_kmh, p_lat, p_lng
    );

    -- 6b. Ledger di impatto. Solo per check-in non shadowbanned.
    --     tenant_id arriva da v_poi_data, che la SELECT INTO del passo 2 ha
    --     popolato con (xp_reward, tenant_id).
    IF NOT v_is_shadowbanned THEN
        INSERT INTO public.impact_transactions (
            profile_id, co2_saved, liters_saved,
            tokens_earned, xp_earned, action_type, tenant_id
        )
        VALUES (
            v_profile_id, v_co2_saved, 0,
            v_pti_awarded, v_xp_awarded, 'tourist_checkin', v_poi_data.tenant_id
        );
    END IF;

    -- 7. Contatori ESG sul profilo. Invariati.
    UPDATE public.profiles
    SET
        total_xp = COALESCE(total_xp, 0) + v_xp_awarded,
        total_tokens = COALESCE(total_tokens, 0) + v_pti_awarded,
        total_co2 = COALESCE(total_co2, 0) + v_co2_saved
    WHERE id = v_profile_id
    RETURNING total_xp INTO v_new_total_xp;

    -- 8. Risposta all'app. Invariata.
    v_result := jsonb_build_object(
        'status', 'success',
        'xp_awarded', v_xp_awarded,
        'pti_awarded', v_pti_awarded,
        'co2_saved', v_co2_saved,
        'new_total_xp', v_new_total_xp,
        'speed_kmh', v_speed_kmh,
        'shadowbanned', v_is_shadowbanned
    );

    RETURN v_result;

END;
$$;

COMMIT;

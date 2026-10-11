-- =============================================================================
--  L.O.T.O. HUB - M7: cold-start, ramo 9999 e perdita di storico in scan_poi_gps
-- =============================================================================
--  tipo: sostituisce SOLO il corpo della funzione (stessa firma, RETURN JSONB)
--  Non tocca lo schema: entrambe le colonne del reward sono gia' nullable.
-- =============================================================================
--  Decisioni applicate (P-D1…P-D6, 06/10 - PIANO-LAVORO-MODULARE.md §DECISIONI)
--  ---------------------------------------------------------------------------
--  P-D1  primo check-in (velocita' non misurabile):
--        xp = 20 (letterale), co2 = 0, tokens = 0, calculated_speed_kmh = NULL,
--        is_shadowbanned = FALSE, check-in REGISTRATO (nessun lockout).
--  P-D2  "non valutabile" = calculated_speed_kmh NULL. Sentinella 9999 ELIMINATA.
--  P-D3  dal 2o check-in: veicolo = 2 XP fissi; pedone = COALESCE(xp_reward, 15).
--  P-D4  action_type resta INVARIANTE 'tourist_checkin' (xp_ledger, M6/G-08).
--  P-D5  struttura: IF v_speed_measurable THEN <3 tier> ELSE <P-D1> END IF.
--  P-D6  i 3 tier NON cambiano: >130 / 20-130 / ELSE.
--
--  Difetti corretti (numerazione della sezione M7 del piano)
--  ---------------------------------------------------------
--  1. `v_speed_kmh DOUBLE PRECISION := 0` inizializzata a 0 (non NULL):
--     ora non e' piu' inizializzata; il ramo non misurabile la lascia NULL.
--  2. `IF v_last_global.visited_at IS NOT NULL` saltava il calcolo della velocita'
--     al primo check-in e cadeva nel ramo pedonale (ricompensa piena):
--     ora il ramo non misurabile applica P-D1 (20 XP), non il premio pedonale.
--  3. `IF v_time_diff_hours > 0` senza ELSE: quando il tempo non era > 0 la
--     velocita' restava 0 (misurabile per errore) -> ora e' un ramo non
--     misurabile esplicito (v_speed_measurable).
--  4. `IF v_speed_kmh IS NULL THEN v_speed_kmh := 9999` era CODICE MORTO (la
--     variabile non era mai NULL). Rimosso con la sentinella.
--  5. Lo storico anti-spoofing filtrava `up.is_shadowbanned IS NOT TRUE`:
--     una riga bandita spariva, quindi il check-in successivo era un cold-start
--     e prendeva ricompensa piena. Il filtro sulla SOLA riga shadowbanned e'
--     ora rimosso dallo storico globale (il shadowban non deve premiare).
--     Il filtro resta invece sul cooldown (18x): un POI bandito non deve
--     bloccare il check-in legittimo successivo.
--  6. Il commento della sentinella 9999 (ex riga 223) e' CANCELLATO: era falso.
--
--  Non-regressione
--  ---------------
--  - Nessun backfill, nessun UPDATE/DELETE su righe esistenti: cambia solo il
--    comportamento dei check-in futuri.
--  - Le 3 soglie e i relativi premi restano IDENTICI (P-D6/P-D3).
--  - action_type non cambia (P-D4): xp_ledger continua a contare.
--
--  Prima dell'apply: diagnostica_fase1/32_m7_cold_start_precheck.sql
--    (atteso: init_velocita_zero=true, ha_sentinella_9999=true,
--             ha_speed_measurable=false, storico_filtra_shadowban=true,
--             n_filtri_shadow=2, lunghezza=7289).
--  Dopo l'apply: diagnostica_fase1/33_m7_cold_start_post_apply.sql
--    (atteso: init_velocita_zero=false, ha_sentinella_9999=false,
--             ha_speed_measurable=true, storico_filtra_shadowban=false,
--             n_filtri_shadow=1, firma invariata).
--
--  Rollback: ripristinare il corpo del 29/09 dal backup,
--    supabase/migrations/20260929160000_restore_proximity_gate.sql
--    (stessa firma; CREATE OR REPLACE).
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.scan_poi_gps(
    p_poi_id UUID,
    p_lat    DOUBLE PRECISION,
    p_lng    DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_profile_id       UUID;
    v_last_poi_checkin TIMESTAMP;
    v_last_global      RECORD;
    v_poi_data         RECORD;

    v_user_geog        GEOGRAPHY;
    v_dist_poi_m       DOUBLE PRECISION;
    v_dist_last_m      DOUBLE PRECISION;
    v_radius_m         DOUBLE PRECISION;
    v_time_diff_hours  DOUBLE PRECISION;

    -- M7 (difetto 1): NON inizializzata a 0. Se non misurabile resta NULL.
    v_speed_kmh        DOUBLE PRECISION;
    -- M7 (P-D5): dice se la velocita' e' stata calcolata e va valutata.
    v_speed_measurable BOOLEAN := FALSE;

    v_is_shadowbanned  BOOLEAN := FALSE;
    v_xp_awarded       INT := 0;
    v_pti_awarded      INT := 0;
    v_co2_saved        DOUBLE PRECISION := 0;

    v_new_total_xp     INT;
    v_result           JSONB;

    -- Q24: fallback quando il POI non ha un raggio proprio.
    v_default_radius_m CONSTANT DOUBLE PRECISION := 80;
BEGIN
    -- 1. Utente autenticato
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    -- 2. Dati base del POI (coords e checkin_radius servono al proximity gate).
    SELECT xp_reward, tenant_id, coords, checkin_radius
      INTO v_poi_data
      FROM public.pois
     WHERE id = p_poi_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'POI non trovato';
    END IF;

    -- 2b. Coordinate assenti: non verificabile, non si registra.
    IF p_lat IS NULL OR p_lng IS NULL THEN
        RAISE EXCEPTION 'Coordinate mancanti: check-in non verificabile';
    END IF;
    IF v_poi_data.coords IS NULL THEN
        RAISE EXCEPTION 'POI senza coordinate: check-in non verificabile';
    END IF;

    -- 3. PROXIMITY GATE.
    v_radius_m   := COALESCE(v_poi_data.checkin_radius, v_default_radius_m);
    IF v_radius_m IS NULL OR v_radius_m <= 0 THEN
        RAISE EXCEPTION 'POI senza raggio di check-in valido: check-in non verificabile';
    END IF;

    v_user_geog  := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    v_dist_poi_m := ST_Distance(v_user_geog, v_poi_data.coords::geography);

    IF v_dist_poi_m > v_radius_m THEN
        RAISE EXCEPTION
            'Sei troppo distante dal POI per il check-in (distanza: % m, massimo % m)',
            ROUND(v_dist_poi_m::numeric, 1),
            ROUND(v_radius_m::numeric, 1);
    END IF;

    -- 4. Cooldown 12 ore sullo stesso POI, ignorando le righe shadowbanned.
    SELECT visited_at INTO v_last_poi_checkin
    FROM public.user_pois
    WHERE profile_id = v_profile_id
      AND poi_id = p_poi_id
      AND is_shadowbanned IS NOT TRUE
    ORDER BY visited_at DESC
    LIMIT 1;

    IF v_last_poi_checkin IS NOT NULL
       AND (NOW() - v_last_poi_checkin) < INTERVAL '12 hours' THEN
        RAISE EXCEPTION 'Cooldown attivo. Puoi rifare check-in in questo specifico POI tra 12 ore.';
    END IF;

    -- 5. Anti-spoofing globale. La posizione precedente e' quella dichiarata
    --    dall'utente al check-in precedente (up.lat/up.lng).
    --    M7 (difetto 5): NIENTE filtro is_shadowbanned qui. Una riga bandita
    --    deve continuare a contare per la velocita', altrimenti il check-in
    --    successivo diventa un cold-start e prende ricompensa piena (il
    --    shadowban premierebbe). Il cooldown sopra mantiene il suo filtro.
    SELECT up.visited_at, up.lat AS prev_lat, up.lng AS prev_lng
      INTO v_last_global
    FROM public.user_pois up
    WHERE up.profile_id = v_profile_id
      AND up.lat IS NOT NULL
      AND up.lng IS NOT NULL
    ORDER BY up.visited_at DESC
    LIMIT 1;

    IF v_last_global.visited_at IS NOT NULL THEN
        v_time_diff_hours := EXTRACT(EPOCH FROM (NOW() - v_last_global.visited_at)) / 3600.0;

        -- M7 (difetto 3): la misurabilita' e' un flag esplicito, non un valore
        -- di ritorno ambiguo. Solo qui, con tempo > 0 e coordinate presenti,
        -- la velocita' e' calcolabile.
        IF v_time_diff_hours > 0 THEN
            v_dist_last_m := ST_Distance(
                v_user_geog,
                ST_SetSRID(ST_MakePoint(v_last_global.prev_lng, v_last_global.prev_lat), 4326)::geography
            );
            v_speed_kmh := (v_dist_last_m / 1000.0) / v_time_diff_hours;
            v_speed_measurable := TRUE;
        END IF;
    END IF;

    -- 6. Scenari di mobilita'. P-D5: IF misurabile THEN <3 tier> ELSE <P-D1>.
    IF v_speed_measurable THEN
        -- I 3 tier sono INVARIATI (P-D6).
        IF v_speed_kmh > 130 THEN
            v_is_shadowbanned := TRUE;
            v_xp_awarded  := 0;
            v_pti_awarded := 0;
            v_co2_saved   := 0;
        ELSIF v_speed_kmh >= 20 AND v_speed_kmh <= 130 THEN
            v_xp_awarded  := 2;                                   -- P-D3: veicolo fisso
            v_pti_awarded := 1;
            v_co2_saved   := 0.0;
        ELSE
            v_xp_awarded  := COALESCE(v_poi_data.xp_reward, 15); -- P-D3: pedone dinamico
            v_pti_awarded := 10;
            v_co2_saved   := 1.5;
        END IF;
    ELSE
        -- P-D1: primo check-in / velocita' non misurabile. Registra, non boccia.
        v_xp_awarded      := 20;
        v_pti_awarded     := 0;
        v_co2_saved       := 0;
        v_speed_kmh       := NULL;
        v_is_shadowbanned := FALSE;
    END IF;

    -- 7. Registra il check-in
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

    -- 7b. Ledger di impatto. Solo per check-in non shadowbanned. P-D4: type invariato.
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

    -- 8. Contatori ESG sul profilo. Invariati.
    UPDATE public.profiles
    SET
        total_xp     = COALESCE(total_xp, 0) + v_xp_awarded,
        total_tokens = COALESCE(total_tokens, 0) + v_pti_awarded,
        total_co2    = COALESCE(total_co2, 0) + v_co2_saved
    WHERE id = v_profile_id
    RETURNING total_xp INTO v_new_total_xp;

    -- 9. Risposta all'app. new_total_xp e' l'unica chiave letta dal client.
    v_result := jsonb_build_object(
        'status',        CASE
            WHEN v_is_shadowbanned THEN 'shadowbanned'
            WHEN v_speed_kmh >= 20 THEN 'vehicle'
            ELSE 'pedestrian'
        END,
        'success',       NOT v_is_shadowbanned,
        'xp_awarded',    v_xp_awarded,
        'pti_awarded',   v_pti_awarded,
        'co2_saved',     v_co2_saved,
        'new_total_xp',  v_new_total_xp,
        'speed_kmh',     v_speed_kmh,
        'shadowbanned',  v_is_shadowbanned,
        'distance_m',    ROUND(v_dist_poi_m::numeric, 1),
        'radius_m',      ROUND(v_radius_m::numeric, 1)
    );

    RETURN v_result;

END;
$$;

COMMIT;

-- =============================================================================
--  Dopo l'applicazione: verifiche in sola lettura.
-- =============================================================================
--  SELECT prosrc FROM pg_proc
--   WHERE proname = 'scan_poi_gps' AND pronamespace = 'public'::regnamespace;
--  -- atteso: NON contiene '9999'; contiene 'v_speed_measurable';
--  --         lo storico globale NON filtra 'up.is_shadowbanned IS NOT TRUE'.
-- =============================================================================

-- =============================================================================
--  L.O.T.O. HUB - Ripristino del proximity gate in scan_poi_gps
-- =============================================================================
--  task: A3-T12  |  tipo: additiva, sostituisce SOLO il corpo della funzione
-- =============================================================================
--  Perche' questa migration esiste
--  ---------------------------------
--  public.scan_poi_gps non controlla piu' la distanza dal POI. Il raggio di
--  check-in non e' letto, le coordinate del POI non sono lette, e la funzione
--  registra il check-in da qualsiasi punto del pianeta.
--
--  Perche' e' un bug e non una scelta di prodotto: le altre quattro protezioni
--  della catena sono tutte presenti e tutte corrette (anti-velocita' a 130 km/h,
--  cooldown 12h, shadowbanned silenzioso ma reversibile, filtri is_shadowbanned
--  sui controlli). Il proximity gate e' l'unica che manca, ed e' l'unica che
--  rende vera la premessa delle altre. Le altre proteggono il VALORE di una
--  visita; questa verifica che la visita ci sia stata. E la riga che ne deriva
--  finisce in user_pois, che alimenta la heatmap DaaS venduta alla PA.
--
--  Il bug era invisibile perche' nessuno dei due lo dichiarava:
--  PoiDetailSheet.tsx:147 fa `if (error) throw error` e basta. La funzione
--  restituiva un JSONB con status 'success' senza sollevare nulla, quindi il
--  client eseguiva onCheckIn(poi) e mostrava il check-in riuscito.
--
--
--  Difetti corretti in questa migration
--  ------------------------------------
--  1. PROXIMITY GATE (il difetto principale). La distanza fra la posizione
--     dichiarata e le coordinate del POI viene calcolata e confrontata con il
--     raggio del POI. Se supera, si solleva un'eccezione.
--
--     Perche' un'eccezione e non un valore di ritorno: il client controlla
--     SOLO `error`. Una risposta tipo {status:'troppo_lontano'} passerebbe
--     inosservata e l'app mostrerebbe comunque il check-in riuscito. Con
--     l'eccezione, PoiDetailSheet.tsx:162 mostra l'Alert 'Errore GPS' con la
--     distanza reale e la riga non viene scritta.
--
--  2. COORDINATE NULL. Se il client manda p_lat o p_lng nulli, il confronto
--     distanza > raggio produce NULL, che in SQL non e' vero: il controllo
--     passerebbe e il check-in verrebbe accettato. Il buco era aperto anche
--     per questa via, ed e' della stessa classe del difetto principale.
--     Stesso ragione per un POI con coords null: senza coordinate non c'e'
--     niente da verificare, quindi non e' verificabile e non si registra.
--
--  3. search_path SU security definer. La funzione del 27/09 e' SECURITY
--     DEFINER senza SET search_path. Chi riesce a creare un oggetto in uno
--     schema che precede public puo' dirottare le risoluzioni dei nomi
--     non qualificati dentro la funzione che gira con i permessi del
--     proprietario. Il corpo e' tutto in public.* gia', ma il difetto va
--     chiuso comunque: e' il default corretto e non costa nulla.
--
--  4. ANTI-SPOOFING SU coords ASSENTI. Il 27/09 ricavava la posizione
--     precedente unendola a pois.coords. Se quel POI non ha coordinate,
--     prev_lat/prev_lng sono null, la distanza e' null, la velocita' e' null,
--     e `IF v_speed_kmh > 130` su un null non e' vero: il check-in cascava
--     nell'ELSE e prendeva XP e CO2 pieni, a qualunque velocita'. Il 27/09
--     usava gia' up.lat/up.lng altrove, quindi qui si usa direttamente
--     quelli: la posizione precedente e' quella dichiarata dall'utente al
--     check-in precedente, e non dipende dallo stato del POI. Se la velocita'
--     resta non calcolabile si usa 9999, che e' il valore che il 27/09 usava
--     gia' quando il tempo non era calcolabile, e porta allo shadowbanned.
--
--
--  Cosa NON e' cambiato, e perche'
--  ---------------------------------
--  Il raggio di questa migration e' ripristinare l'integrita' del check-in.
--  Non e' una revisione delle ricompense, e i valori premiali sono quindi
--  rimasti IDENTICI a quelli del 27/09, anche dove sono sospetti:
--
--   - v_co2_saved = 1.5 fisso per il pedonale, invece di leggere
--     pois.base_co2 come faceva la canonica del 26/09. Il CO2 risparmiato
--     non dipende dal POI. NON e' stato toccato: cambiare i numeri che gli
--     utenti vedono e' una decisione di prodotto, non un fix, e farlo di
--     nascosto cambierebbe i totali gia' accumulati.
--   - v_xp_awarded = 2 e v_pti_awarded = 1 per il veicolare, 10 PTI per il
--     pedonale: valori cablati, non letti da pois.
--
--  Questi due punti sono segnalati come decisioni aperte e non come bug
--  riparati qui. Se il CO2 deve venire da base_co2, e' una migration
--  separata e va detto ad alta voce.
--
--  Il fallback del raggio resta 80 m, identico alla canonica. E' il parametro
--  indicato da Q24, e Q24 non e' un blocco: si applica SOLO quando il POI non
--  ha un checkin_radius proprio. Quando arriva la risposta, si cambia la
--  riga seguente e nient'altro.
--
--
--  Effetti attesi dopo l'applicazione
--  ---------------------------------
--  - Un check-in entro il raggio continua a funzionare identicamente.
--  - Un check-in fuori dal raggio viene respinto con la distanza in chiaro.
--  - user_pois smette di accettare posizioni arbitrarie, quindi anche la
--    heatmap DaaS smette di accettarle.
--  - Le protezioni gia' presenti non cambiano comportamento.
--
--  Come si verifica
--  ----------------
--  Un check-in da un POI dove si e' davvero deve riuscire. Un check-in verso
--  un POI lontano deve essere respinto, e non deve scrivere nessuna riga.
--  Il test negativo e' pulito perche' la riga viene rifiutata: non sporca
--  il dato, a differenza di un check-in che riesce quando non doveva.
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
    v_speed_kmh        DOUBLE PRECISION := 0;

    v_is_shadowbanned  BOOLEAN := FALSE;
    v_xp_awarded       INT := 0;
    v_pti_awarded      INT := 0;
    v_co2_saved        DOUBLE PRECISION := 0;

    v_new_total_xp     INT;
    v_result           JSONB;

    -- Q24: fallback quando il POI non ha un raggio proprio. Singolo punto
    -- di modifica, il resto della funzione non lo usa.
    v_default_radius_m CONSTANT DOUBLE PRECISION := 80;
BEGIN
    -- 1. Utente autenticato
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    -- 2. Dati base del POI. coords e checkin_radius servono al proximity
    --    gate del passo 3; il 27/09 li leggeva solo per xp_reward e tenant_id.
    SELECT xp_reward, tenant_id, coords, checkin_radius
      INTO v_poi_data
      FROM public.pois
     WHERE id = p_poi_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'POI non trovato';
    END IF;

    -- 2b. Coordinate assenti dal lato client o dal POI: senza coordinate non
    --     c'e' niente da confrontare, e un confronto con NULL non e' vero,
    --     quindi passerebbe. Non e' verificabile, quindi non si registra.
    IF p_lat IS NULL OR p_lng IS NULL THEN
        RAISE EXCEPTION 'Coordinate mancanti: check-in non verificabile';
    END IF;
    IF v_poi_data.coords IS NULL THEN
        RAISE EXCEPTION 'POI senza coordinate: check-in non verificabile';
    END IF;

    -- 3. PROXIMITY GATE: il raggio e' quello del POI.
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
    --    dall'utente al check-in precedente (up.lat/up.lng), non quella del
    --    POI: se il POI non ha coordinate la velocita' resta non calcolabile,
    --    e non deve cadere nell'ELSE come ricompensa piena.
    SELECT up.visited_at, up.lat AS prev_lat, up.lng AS prev_lng
      INTO v_last_global
    FROM public.user_pois up
    WHERE up.profile_id = v_profile_id
      AND up.is_shadowbanned IS NOT TRUE
      AND up.lat IS NOT NULL
      AND up.lng IS NOT NULL
    ORDER BY up.visited_at DESC
    LIMIT 1;

    IF v_last_global.visited_at IS NOT NULL THEN
        v_time_diff_hours := EXTRACT(EPOCH FROM (NOW() - v_last_global.visited_at)) / 3600.0;

        IF v_time_diff_hours > 0 THEN
            v_dist_last_m := ST_Distance(
                v_user_geog,
                ST_SetSRID(ST_MakePoint(v_last_global.prev_lng, v_last_global.prev_lat), 4326)::geography
            );
            v_speed_kmh := (v_dist_last_m / 1000.0) / v_time_diff_hours;
        END IF;

        -- 9999 = non calcolabile. Stessa scelta del 27/09 per il tempo non
        -- calcolabile, e stessa classe di risposta: si puo' solo essere lontani.
        IF v_speed_kmh IS NULL THEN
            v_speed_kmh := 9999;
        END IF;
    END IF;

    -- 6. Scenari di mobilita'. Soglie e premi INVARIATI rispetto al 27/09:
    --    stessi numeri, cosi' nessun totale gia' accumulato si sposta.
    IF v_speed_kmh > 130 THEN
        v_is_shadowbanned := TRUE;
        v_xp_awarded  := 0;
        v_pti_awarded := 0;
        v_co2_saved   := 0;
    ELSIF v_speed_kmh >= 20 AND v_speed_kmh <= 130 THEN
        v_xp_awarded  := 2;
        v_pti_awarded := 1;
        v_co2_saved   := 0.0;
    ELSE
        v_xp_awarded  := COALESCE(v_poi_data.xp_reward, 15);
        v_pti_awarded := 10;
        v_co2_saved   := 1.5;
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

    -- 7b. Ledger di impatto. Solo per check-in non shadowbanned.
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

    -- 9. Risposta all'app.
    --    new_total_xp e' l'UNICA chiave che il client legge
    --    (PoiDetailSheet.tsx:150 e :579). Nessuna delle altre e' consumata.
    --    distance e radius sono aggiunte diagnostiche, nessun lettore esiste
    --    e nessun lettore puo' rompersi: sono chiavi in piu'.
    --    status e' reso onesto rispetto al 27/09, che restituiva sempre
    --    'success' anche su uno shadowban silenzioso.
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
--  Dopo l'applicazione: due query di controllo, una sola lettura ciascuna.
--  Nessuna scrive, e sono le uniche che servono per credere al fix.
-- =============================================================================
--  SELECT prosrc FROM pg_proc
--   WHERE proname = 'scan_poi_gps' AND pronamespace = 'public'::regnamespace;
--  -- atteso: contiene 'v_dist_poi_m > v_radius_m' e 'SET search_path'
--
--  SELECT count(*) FROM public.user_pois
--   WHERE profile_id = auth.uid() AND visited_at > now() - interval '1 hour';
--  -- atteso DOPO un test respinto: stessa riga di PRIMA, non una in piu'.
-- =============================================================================

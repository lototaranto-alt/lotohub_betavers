-- 1. RIMOZIONE ECONOMIA PTI DAL VAULT MULTIMEDIALE (SSOT: XP = Progressive Disclosure, PTI = solo impatto civico)
-- Le colonne required_level / is_premium_only introdotte da migration_v19 diventano l'unico gate di sblocco.
ALTER TABLE public.media_vault
    DROP COLUMN IF EXISTS loto_cost;

-- 2. ALLINEAMENTO LIVELLI: calculate_user_level replica esattamente la curva SSOT del frontend (utils/levelUtils.ts LEVEL_THRESHOLDS)
-- Il client usa calculateLevel() con questa stessa curva: nessuna divergenza client/server sul "Livello Insufficiente".
CREATE OR REPLACE FUNCTION public.calculate_user_level(xp INT)
RETURNS INT AS $$
DECLARE
    v_xp INT := GREATEST(COALESCE(xp, 0), 0);
    v_level INT := 1;
    v_min_xp INT[] := ARRAY[
        0, 30, 90, 180, 300, 450, 630, 840, 1080, 1350, 1650, 2080, 2540, 3030, 3550,
        4100, 4680, 5290, 5930, 6600, 7300, 8230, 9190, 10180, 11200, 12250, 13330,
        14440, 15580, 16750, 17950, 19180, 20440, 21730, 23050, 24400, 25780, 27190,
        28630, 30100, 31600, 33130, 34690, 36280, 37900, 39550, 41230, 42940, 44680, 46450
    ];
BEGIN
    FOR i IN 1..50 LOOP
        IF v_xp >= v_min_xp[i] THEN
            v_level := i;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    RETURN v_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RISCRITTURA RPC sblocca_media: gate Livello + Premium validati SERVER-SIDE, nessuna spesa di token
CREATE OR REPLACE FUNCTION public.sblocca_media(p_media_id UUID)
RETURNS TABLE (
    unlocked BOOLEAN,
    media_path TEXT,
    message TEXT
) AS $$
DECLARE
    v_profile_id UUID;
    v_user_xp INT;
    v_user_level INT;
    v_required_level INT;
    v_is_premium_only BOOLEAN;
    v_user_is_premium BOOLEAN;
    v_poi_id UUID;
    v_territory_id UUID;
    v_media_path TEXT;
    v_already_unlocked BOOLEAN;
BEGIN
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Utente non autenticato.'::TEXT;
        RETURN;
    END IF;

    SELECT poi_id, media_path, COALESCE(required_level, 1), COALESCE(is_premium_only, FALSE)
        INTO v_poi_id, v_media_path, v_required_level, v_is_premium_only
    FROM public.media_vault
    WHERE id = p_media_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Contenuto multimediale non trovato.'::TEXT;
        RETURN;
    END IF;

    SELECT territory_id INTO v_territory_id
    FROM public.pois
    WHERE id = v_poi_id;

    SELECT EXISTS (
        SELECT 1 FROM public.user_unlocked_media
        WHERE profile_id = v_profile_id AND media_id = p_media_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN QUERY SELECT TRUE, v_media_path, 'Contenuto già sbloccato in precedenza.'::TEXT;
        RETURN;
    END IF;

    SELECT total_xp, COALESCE(is_premium, FALSE)
        INTO v_user_xp, v_user_is_premium
    FROM public.profiles
    WHERE id = v_profile_id;

    IF v_user_xp IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Profilo utente non trovato.'::TEXT;
        RETURN;
    END IF;

    v_user_level := public.calculate_user_level(v_user_xp);

    IF v_user_level < v_required_level THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT,
            format('Livello insufficiente: richiesto Livello %s, attuale %s.', v_required_level, v_user_level);
        RETURN;
    END IF;

    IF v_is_premium_only AND NOT v_user_is_premium THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Contenuto Premium: riservato agli utenti L.O.T.O. ELITE.'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.user_unlocked_media (profile_id, media_id, territory_id)
    VALUES (v_profile_id, p_media_id, v_territory_id);

    RETURN QUERY SELECT TRUE, v_media_path, 'Sblocco effettuato con successo.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ALLINEAMENTO get_poi_vetrina allo schema reale (via colonne fantasma) + masking del media_path finché non sbloccato
DROP FUNCTION IF EXISTS public.get_poi_vetrina(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_poi_vetrina(p_poi_id UUID, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    poi_id UUID,
    title TEXT,
    media_path TEXT,
    media_type VARCHAR,
    required_level INT,
    is_premium_only BOOLEAN,
    is_unlocked BOOLEAN
) AS $$
DECLARE
    v_user_xp INT;
    v_user_level INT;
    v_user_is_premium BOOLEAN;
BEGIN
    SELECT total_xp, COALESCE(is_premium, FALSE)
        INTO v_user_xp, v_user_is_premium
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_user_xp IS NULL THEN
        v_user_xp := 0;
    END IF;

    v_user_level := public.calculate_user_level(v_user_xp);

    RETURN QUERY
    SELECT
        mv.id,
        mv.poi_id,
        mv.title,
        CASE WHEN (v_user_level >= COALESCE(mv.required_level, 1))
                   AND (COALESCE(mv.is_premium_only, FALSE) = FALSE OR v_user_is_premium)
             THEN mv.media_path
             ELSE NULL END,
        mv.media_type,
        COALESCE(mv.required_level, 1),
        COALESCE(mv.is_premium_only, FALSE),
        EXISTS (
            SELECT 1 FROM public.user_unlocked_media uum
            WHERE uum.media_id = mv.id AND uum.profile_id = p_user_id
        )
    FROM public.media_vault mv
    WHERE mv.poi_id = p_poi_id
    ORDER BY COALESCE(mv.required_level, 1) ASC, COALESCE(mv.is_premium_only, FALSE) ASC, mv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
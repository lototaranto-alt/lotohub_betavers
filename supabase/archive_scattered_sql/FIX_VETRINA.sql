-- =========================================================================================
-- FIX BUG VETRINA: COLONNA DESCRIPTION MANCANTE IN MEDIA_VAULT
-- =========================================================================================

-- 1. Aggiunta delle colonne gamification a media_vault (inclusa la mancante description)
ALTER TABLE public.media_vault ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.media_vault ADD COLUMN IF NOT EXISTS required_level INTEGER DEFAULT 1;
ALTER TABLE public.media_vault ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN DEFAULT false;

-- Aggiunta colonna premium al profilo (se mancante)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;


-- 2. Ricreazione sicura dell'RPC get_poi_vetrina
DROP FUNCTION IF EXISTS get_poi_vetrina(UUID, UUID);

CREATE OR REPLACE FUNCTION get_poi_vetrina(p_poi_id UUID, p_profile_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_xp INTEGER;
    v_user_level INTEGER;
    v_is_premium BOOLEAN;
    v_result JSON;
BEGIN
    -- 1. Ottenere XP totali e status premium dell'utente
    SELECT COALESCE(total_xp, 0), COALESCE(is_premium, false)
    INTO v_total_xp, v_is_premium
    FROM public.profiles
    WHERE id = p_profile_id;

    -- 2. Calcolo Livello (Logica Fast-Track)
    -- Livello 1: 0 - 29 XP
    -- Livello 2: 30 - 99 XP
    -- Livello 3: 100+ XP (poi scala esponenzialmente)
    IF v_total_xp < 30 THEN
        v_user_level := 1;
    ELSIF v_total_xp < 100 THEN
        v_user_level := 2;
    ELSE
        -- Logica standard dal livello 3 in poi (es: base 50 XP per livello)
        v_user_level := 3 + FLOOR((v_total_xp - 100) / 150);
    END IF;

    -- 3. Generare l'array JSON dei media filtrati per accesso
    SELECT json_agg(
        json_build_object(
            'id', mv.id,
            'title', mv.title,
            'description', mv.description,
            'media_type', mv.media_type,
            'loto_cost', mv.loto_cost,
            'required_level', mv.required_level,
            'is_premium_only', mv.is_premium_only,
            -- SECURITY CORE: l'URL in chiaro viene passato SOLO se sbloccato
            'media_path', 
                CASE 
                    WHEN v_is_premium = true THEN mv.media_path
                    WHEN mv.is_premium_only = true THEN NULL
                    WHEN v_user_level >= mv.required_level THEN mv.media_path
                    ELSE NULL
                END,
            'is_unlocked',
                CASE 
                    WHEN v_is_premium = true THEN true
                    WHEN mv.is_premium_only = true THEN false
                    WHEN v_user_level >= mv.required_level THEN true
                    ELSE false
                END
        )
    )
    INTO v_result
    FROM public.media_vault mv
    WHERE mv.poi_id = p_poi_id;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

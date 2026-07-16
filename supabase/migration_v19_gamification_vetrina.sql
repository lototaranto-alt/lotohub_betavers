-- ============================================================
-- MIGRATION V19 - GAMIFICATION VETRINA & FAST-TRACK XP
-- Aggiunge logiche di sicurezza (RPC) per il Vault e la curva XP
-- ============================================================

-- 1. AGGIUNTA COLONNE A MEDIA_VAULT E PROFILES
ALTER TABLE public.media_vault 
ADD COLUMN IF NOT EXISTS required_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. FUNZIONE PER CALCOLO LIVELLO (FAST-TRACK 1-3)
CREATE OR REPLACE FUNCTION public.calculate_user_level(xp INT) 
RETURNS INT AS $$
DECLARE
    lvl INT;
BEGIN
    -- Fast Track Livelli 1-3
    IF xp < 30 THEN
        RETURN 1;
    ELSIF xp < 90 THEN  -- 30 + 60
        RETURN 2;
    ELSIF xp < 190 THEN -- 90 + 100
        RETURN 3;
    ELSE
        -- Dal Livello 4 in poi, servono 150 XP fissi a livello (o formula a piacere)
        lvl := 3 + FLOOR((xp - 40) / 150);
        IF lvl > 50 THEN
            RETURN 50;
        END IF;
        RETURN lvl;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC SICURA PER LA VETRINA DEI P.O.I.
-- Restituisce i media oscurando l'URL se non si ha il livello/premium
CREATE OR REPLACE FUNCTION public.get_poi_vetrina(p_poi_id UUID, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    poi_id UUID,
    title TEXT,
    description TEXT,
    media_type TEXT,
    thumbnail_url TEXT,
    required_level INT,
    is_premium_only BOOLEAN,
    is_unlocked BOOLEAN,
    media_url TEXT
) AS $$
DECLARE
    v_user_xp INT;
    v_user_level INT;
    v_is_premium BOOLEAN;
BEGIN
    -- Recupera dati utente
    SELECT total_xp, is_premium INTO v_user_xp, v_is_premium 
    FROM public.profiles 
    WHERE public.profiles.id = p_user_id;
    
    -- Se utente non trovato, usiamo default
    IF v_user_xp IS NULL THEN
        v_user_xp := 0;
        v_is_premium := false;
    END IF;
    
    v_user_level := public.calculate_user_level(v_user_xp);

    RETURN QUERY
    SELECT 
        mv.id,
        mv.poi_id,
        mv.title,
        mv.description,
        mv.media_type,
        mv.thumbnail_url,
        mv.required_level,
        mv.is_premium_only,
        -- Calcolo is_unlocked
        (v_user_level >= mv.required_level AND (mv.is_premium_only = false OR v_is_premium = true)) AS is_unlocked,
        -- Offuscamento URL per sicurezza
        CASE 
            WHEN (v_user_level >= mv.required_level AND (mv.is_premium_only = false OR v_is_premium = true)) 
            THEN mv.media_url
            ELSE NULL 
        END AS media_url
    FROM public.media_vault mv
    WHERE mv.poi_id = p_poi_id
    ORDER BY mv.required_level ASC, mv.is_premium_only ASC, mv.created_at ASC;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

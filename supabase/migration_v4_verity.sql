-- 1. Aggiornamento Tabella Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2 DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_liters_water DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

-- 2. Tabella Transazioni Anti-Frode
CREATE TABLE IF NOT EXISTS public.impact_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    poi_id UUID,
    receipt_hash TEXT UNIQUE, 
    tokens_earned INTEGER,
    co2_saved DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.1 Tabella Geofencing Fallback (Richiamata nel frontend da index.tsx)
CREATE TABLE IF NOT EXISTS public.location_pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    poi_id UUID,
    coords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Funzione ESG con Moltiplicatore Party-Size
CREATE OR REPLACE FUNCTION process_esg_impact(
    user_id UUID,
    p_co2 DECIMAL,
    p_liters DECIMAL,
    p_tokens INTEGER,
    p_xp INTEGER,
    p_takeaway BOOLEAN,
    p_party_size INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        total_co2 = total_co2 + p_co2,
        total_liters_water = total_liters_water + p_liters,
        total_tokens = total_tokens + p_tokens,
        party_size = p_party_size
    WHERE id = user_id;

    INSERT INTO public.impact_transactions (profile_id, co2_saved, tokens_earned)
    VALUES (user_id, p_co2, p_tokens);
END;
$$ LANGUAGE plpgsql;

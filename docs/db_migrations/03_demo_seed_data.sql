-- ==========================================
-- SCRIPT MOCKUP DEMO PARTNER (Giovedì)
-- Genera un utente con dati realistici e "Wow Effect"
-- ==========================================

-- 0. Prepariamo la tabella profiles (nel caso non sia stata lanciata la migrazione v4)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pois_discovered INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1;

-- 1. Popoliamo la Community (Impact Transactions) per far girare il Ticker
-- Dati realistici ma contenuti (schema v2)
INSERT INTO public.impact_transactions (profile_id, tokens_earned, xp_earned, co2_saved)
SELECT 
    id AS profile_id,
    50, -- Tokens
    15, -- XP
    1.2 -- CO2
FROM public.profiles
LIMIT 10;

-- 2. Diamo al primo utente registrato (o a tutti) un boost per la demo
UPDATE public.profiles 
SET 
    total_tokens = 150,
    total_xp = 350,
    pois_discovered = 8,
    party_size = 2
WHERE id IN (
    SELECT id FROM public.profiles LIMIT 5
);

-- 3. Assegniamo i Badge "Eco Warrior" e "Pioniere" al primo utente
INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, 'eco_warrior' FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, 'pioniere' FROM public.profiles LIMIT 1
ON CONFLICT DO NOTHING;

-- Ricarichiamo schema
NOTIFY pgrst, 'reload schema';

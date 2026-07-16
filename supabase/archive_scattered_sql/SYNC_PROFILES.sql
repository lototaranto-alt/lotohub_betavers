-- =========================================================================================
-- SYNC PROFILES FIX (V2)
-- =========================================================================================
-- Questo script prende tutti gli utenti attualmente loggati (in auth.users) 
-- e ricrea la loro riga nella tabella public.profiles, dato che il reset l'aveva svuotata!

INSERT INTO public.profiles (id, total_tokens, total_xp, total_co2, total_liters_water, experience_level, is_premium, flow_role)
SELECT id, 0, 0, 0, 0, 1, false, 'LOTO Explorer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

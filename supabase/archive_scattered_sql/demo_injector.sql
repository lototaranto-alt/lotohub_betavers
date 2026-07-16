-- ============================================================
-- SCRIPT INIEZIONE DEMO: Trasforma il tuo Profilo Anonimo
-- Esegui questo script in Supabase per riempire la tua app
-- di dati finti ma realistici (PTI, Badge, Storico) perfetti 
-- per una presentazione.
-- ============================================================

-- 1. TRASFORMA TUTTI GLI UTENTI ANONIMI IN PROFILI DEMO ("ELITE")
INSERT INTO public.profiles (id, tenant_id, nickname, total_co2, total_tokens, total_xp, status)
SELECT 
    id, 
    'taranto', 
    'Gianni Demo', 
    124.5, -- CO2 Risparmiata
    350,   -- PTI accumulati
    2500,  -- XP (Livello alto)
    'active'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    tenant_id = 'taranto',
    nickname = 'Gianni Demo',
    total_co2 = 124.5,
    total_tokens = 350,
    total_xp = 2500;

-- 2. ASSEGNA I BADGE (Sblocca il medagliere)
-- Diamo al tuo utente i badge "civic_1" e "impact_1"
INSERT INTO public.user_badges (user_id, badge_template_id)
SELECT id, 'civic_1' FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.user_badges (user_id, badge_template_id)
SELECT id, 'impact_1' FROM auth.users
ON CONFLICT DO NOTHING;

-- 3. INIETTA LEGACY CIVICA (I tre archi "Impatto Permanente")
INSERT INTO public.civic_legacy (user_id, type, description, location, impact_value)
SELECT id, 'tree', 'Albero Piantato', 'Via Roma', 50 FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.civic_legacy (user_id, type, description, location, impact_value)
SELECT id, 'bench', 'Panchina Restaurata', 'Piazza Garibaldi', 30 FROM auth.users
ON CONFLICT DO NOTHING;

-- 4. INIETTA SCOPERTE (Discoveries) per far salire lo scan rate
-- Prendiamo il primo POI disponibile e fingiamo che tu l'abbia visitato
INSERT INTO public.discoveries (user_id, poi_id, rarity, discovered_at)
SELECT u.id, p.id, 3, now() - interval '2 days'
FROM auth.users u
CROSS JOIN (SELECT id FROM pois WHERE tenant_id = 'taranto' LIMIT 1) p
ON CONFLICT DO NOTHING;

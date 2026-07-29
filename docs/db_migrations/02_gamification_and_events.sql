-- ==========================================
-- SCRIPT GAMIFICATION & COMMUNITY EVENTS
-- LOTO HUB Co-Xperience Engine
-- ==========================================

-- 1. TABELLA BADGES (Catalogo)
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    req_xp INT DEFAULT 0,
    req_poi_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELLA USER_BADGES (Sblocchi utente)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 3. TABELLA EVENTS (Community)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    event_type TEXT, -- es. 'eco', 'explore', 'social'
    is_premium BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VISTA VW_COLLECTIVE_IMPACT (Per la Bacheca Cooperativa)
-- Sostituisce la logica PVP. Calcola lo sforzo congiunto dell'intera community.
CREATE OR REPLACE VIEW public.vw_collective_impact AS
SELECT 
    COUNT(DISTINCT it.profile_id) AS total_explorers_today,
    COALESCE(SUM(it.tokens_earned), 0) AS total_pti_generated,
    COALESCE(SUM(it.co2_saved), 0) AS total_co2_saved,
    COALESCE(SUM(it.liters_saved), 0) AS total_water_saved,
    (SELECT COUNT(*) FROM public.scans) AS total_checkins
FROM public.impact_transactions it;

-- ==========================================
-- INSERIMENTO DATI INIZIALI (MOCK DA SOSTITUIRE I VECCHI)
-- ==========================================

-- Inseriamo 3 Badge Base
INSERT INTO public.badges (id, name, icon, description, req_xp)
VALUES 
('eco_warrior', 'Eco Warrior', 'eco', 'Hai dimostrato un amore profondo per l''ambiente urbano.', 500),
('pioniere', 'Pioniere', 'explore', 'Uno dei primi esploratori a tracciare la via.', 1000),
('custode', 'Custode LOTO', 'verified-user', 'Hai sbloccato il tuo primo finanziamento civico.', 1500)
ON CONFLICT (id) DO NOTHING;

-- Inseriamo 2 Eventi Base
INSERT INTO public.events (id, tenant_id, title, description, event_date, event_type, is_premium)
VALUES 
('ev_plasticaqqua', 'taranto', 'Incontro Plasticaqquà', 'Incontro speciale con i ragazzi per discutere i prossimi interventi sul territorio.', NOW() + INTERVAL '2 days', 'eco', false),
('ev_passeggiata', 'taranto', 'Passeggiata Inaccessibilità', 'Tracciamo percorsi accessibili in città partendo da Diseducation.', NOW() + INTERVAL '1 day', 'social', false)
ON CONFLICT (id) DO NOTHING;

-- Ricarichiamo schema cache per l'API REST di Supabase
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- Modulo Admin Dash: Setup POIs (Mete Consigliate & Vista Amministratore)
-- =========================================================================

-- 1. Aggiungiamo la colonna is_recommended (se non esiste) alla tabella pois
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- 2. Creiamo una Vista specifica per il Pannello Admin
-- Questa vista decodifica le coordinate spaziali di PostGIS in lat/lng,
-- così il frontend (Next.js) può leggerle facilmente senza RPC dedicate.
CREATE OR REPLACE VIEW public.vw_admin_pois AS
SELECT 
    id,
    name,
    category,
    layer_name,
    loto_quota_max,
    xp_reward,
    is_accessible,
    is_active,
    is_recommended,
    territory_id,
    created_at,
    ST_Y(coords::geometry) AS latitude,
    ST_X(coords::geometry) AS longitude
FROM public.pois;

-- Permettiamo al Service Role (usato dall'Admin Panel) di interrogare la vista
GRANT SELECT ON public.vw_admin_pois TO service_role;
-- =========================================================================
-- Modulo Admin Dash: Update Events Table
-- =========================================================================

-- Rinominare event_date in start_time se necessario, o aggiungere le colonne mancanti
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'web_public';

-- (Opzionale) Copiare event_date su start_time per retrocompatibilità se si volesse deprecare event_date
-- UPDATE public.events SET start_time = event_date WHERE start_time IS NULL;
-- =========================================================================
-- Modulo Admin Dash: Tabella Shadow Feedback B2B ("Whispers")
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.b2b_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT, -- es. 'accoglienza', 'pulizia', 'prezzo'
    is_premium_unlocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (solo il service_role Admin o l'utente che lo ha creato possono vederli)
ALTER TABLE public.b2b_feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy pubblica per permettere agli utenti di inserire i whisper anonimi (se autenticati)
CREATE POLICY "Utenti possono inserire i propri whisper" 
ON public.b2b_feedbacks FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- La lettura pubblica non è permessa (solo per partner Premium, che verrà gestita via RPC o view separata)
-- =========================================================================
-- Modulo Admin Dash: Aggiornamento Tabella Profiles (Anti-Cheat & Ban)
-- =========================================================================

-- Aggiungiamo la colonna is_banned per la gestione della moderazione
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
-- =========================================================================
-- Modulo Admin Dash: Analitiche Check-in
-- =========================================================================

-- Vista aggregata per il totale dei check-in per ogni POI
CREATE OR REPLACE VIEW public.vw_admin_checkins_analytics AS
SELECT 
    p.id AS poi_id,
    p.name AS poi_name,
    p.category,
    p.is_recommended,
    COUNT(up.poi_id) AS total_checkins,
    MAX(up.visited_at) AS last_checkin
FROM public.pois p
LEFT JOIN public.user_pois up ON p.id = up.poi_id
GROUP BY p.id, p.name, p.category, p.is_recommended;

GRANT SELECT ON public.vw_admin_checkins_analytics TO service_role;

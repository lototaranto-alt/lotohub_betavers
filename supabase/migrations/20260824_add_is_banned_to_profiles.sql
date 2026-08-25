-- =========================================================================
-- Modulo Admin Dash: Aggiornamento Tabella Profiles (Anti-Cheat & Ban)
-- =========================================================================

-- Aggiungiamo la colonna is_banned per la gestione della moderazione
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

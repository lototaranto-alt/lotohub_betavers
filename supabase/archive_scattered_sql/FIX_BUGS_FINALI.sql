-- =========================================================================================
-- FIX BUG: POI INFINITI E SEZIONI SCOMPARSE
-- =========================================================================================

-- 1. FIX POI INFINITI: Aggiunta "colonne fantasma"
-- Le colonne p_iva e pec non erano presenti in NESSUN file originale (probabilmente 
-- create a mano su Supabase). Siccome le funzioni (es. get_pois) le cercano, il 
-- caricamento andava in crash. Le ricreiamo ora ufficialmente.
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS p_iva TEXT;
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS pec TEXT;

-- 2. FIX SEGNALAZIONI CIVICHE SCOMPARSE: Permessi & Feature Flags
-- Se avevi saltato le mie 3 righe di "GRANT" nel messaggio precedente, l'app non
-- riusciva a leggere la tabella 'tenants' (42501). Senza il tenant, le Feature Flags
-- (useFeatureFlags.ts) disattivavano di default le Segnalazioni Civiche.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Assicuriamoci anche esplicitamente che il tenant abbia il modulo civico attivo
UPDATE public.tenants 
SET features = '{"events": true, "civic_module": true, "gamification": true, "ble_heatmap": false, "premium_boost": false, "community_challenges": true}'::jsonb
WHERE id = 'taranto';

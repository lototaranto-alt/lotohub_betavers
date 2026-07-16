-- =========================================================================================
-- IL COMANDO MAGICO: RELOAD DELLA CACHE DI SUPABASE (PostgREST)
-- =========================================================================================

-- Quando facciamo un DROP SCHEMA CASCADE e ricreiamo tutto, il database sottostante (Postgres)
-- è perfetto, ma lo strato API di Supabase (PostgREST) rimane "incantato" e usa una cache vecchia!
-- Questo causa errori assurdi come:
-- 1. "permission denied" (non sa dei nuovi permessi)
-- 2. "column non exist" (non vede le nuove colonne)
-- 3. Viste come vw_pois_frontend che sembrano invisibili all'app.

-- Questo singolo comando forza Supabase a rileggere tutto il database da zero.
NOTIFY pgrst, 'reload schema';

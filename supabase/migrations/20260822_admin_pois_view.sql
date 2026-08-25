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

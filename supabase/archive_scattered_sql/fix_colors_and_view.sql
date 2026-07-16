-- ==========================================
-- FIX VISTA E COLORI TENANT
-- Assicura che i colori verdi di Taranto siano corretti
-- ==========================================

UPDATE public.tenants
SET 
  primary_color = '#4A5D23',
  secondary_color = '#D96C4A',
  logo_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png'
WHERE slug = 'taranto';

-- Per sicurezza, ricreiamo la vista senza restrizioni RLS
DROP VIEW IF EXISTS public.vw_pois_frontend;
CREATE VIEW public.vw_pois_frontend AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.layer_name,
    p.xp_reward,
    p.checkin_radius,
    p.loto_quota_max,
    p.is_accessible,
    p.is_active,
    ST_Y(p.coords::geometry) AS lat,
    ST_X(p.coords::geometry) AS lng,
    p.territory_id,
    LOWER(t.name) AS tenant_id
FROM public.pois p
LEFT JOIN public.territories t ON p.territory_id = t.id;

GRANT SELECT ON public.vw_pois_frontend TO authenticated, anon;

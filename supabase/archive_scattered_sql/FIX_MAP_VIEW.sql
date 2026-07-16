-- =========================================================================================
-- FIX BUG MAPPA: VISTA FRONTEND MANCANTE
-- =========================================================================================

-- 1. Ripristino la colonna tenant_id che era stata creata a mano su Supabase in passato
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'taranto';

-- 2. Ricreiamo la View "vw_pois_frontend" che la mappa usa per scaricare i POI.
-- Anche questa View era stata creata manualmente su Supabase in passato per decodificare
-- le coordinate spaziali PostGIS (coords) in lat/lng semplici per il frontend (map.tsx).
CREATE OR REPLACE VIEW public.vw_pois_frontend AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.layer_name,
    p.xp_reward,
    p.checkin_radius,
    p.crowd_level,
    p.has_water,
    p.is_accessible,
    p.is_recommended,
    p.loto_quota_max,
    p.current_occupancy,
    p.pending_occupancy,
    p.recommended_parking_id,
    p.parking_bonus_xp,
    p.p_iva,
    p.pec,
    p.tenant_id,
    p.is_active,
    -- Decodifica PostGIS essenziale per map.tsx
    ST_Y(p.coords::geometry) AS lat,
    ST_X(p.coords::geometry) AS lng
FROM public.pois p;

-- 3. Riapplichiamo esplicitamente i permessi per sicurezza
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

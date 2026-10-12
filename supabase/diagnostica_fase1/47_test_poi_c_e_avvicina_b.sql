-- 47_pending_test_poi_c.sql
-- Prolunga la finestra di test check-in/crowd (12/10):
--  1. TEST C: nuovo POI con le coordinate di TEST A (gia' convalidate ieri),
--     nuovissimo id -> cooldown 12h per-POI NON attivo -> check-in pulito subito.
--  2. TEST B: coordinate portate a quelle di A (era "troppo distante"),
--     raggio 500 m per assorbire il drift; l'id resta lo stesso.
--  Riuso coordinate = meno POI finti in produzione; riconoscibili da 'TEST HeatScore '.
--
-- NON e' una migration: dati di test, reversibili col cleanup in fondo.
-- Restituisce 1 result set (leggi il nomignolo "esito").
--
-- Esegui nel SQL Editor di Supabase.

do $$
declare
    v_id_c uuid := gen_random_uuid();
begin
    -- 1) TEST B: avvicinato alle coordinate di A (raggio 500)
    update public.pois set
        coords        = ST_SetSRID(ST_MakePoint(17.269757, 40.450613), 4326),
        checkin_radius = 500
    where name = 'TEST HeatScore B';

    -- 2) TEST C: nuovo POI, coordinate di A, raggio 500
    insert into public.pois
        (id, name, category, layer_name, xp_reward, checkin_radius, loto_quota_max,
         is_accessible, is_active, is_recommended, tenant_id, coords)
    values
        (v_id_c, 'TEST HeatScore C', 'monument', 'layer-loto-monuments',
         50, 500, 100, true, true, false, 'taranto',
         ST_SetSRID(ST_MakePoint(17.269757, 40.450613), 4326));
end $$;

-- Esito (singolo result set)
select id, name,
       ST_Y(coords::geometry) as lat,
       ST_X(coords::geometry) as lng,
       checkin_radius,
       case when name = 'TEST HeatScore C' then 'NUOVO - check-in pulito'
            when name = 'TEST HeatScore B' then 'AVVICINATO - raggio 500'
            else 'esistente' end as stato_test
from public.pois
where name like 'TEST HeatScore %'
order by name;

-- ---------------------------------------------------------------------------
-- CLEANUP (quando avrai finito l'acceptance):
-- delete from public.pois where name like 'TEST HeatScore %';
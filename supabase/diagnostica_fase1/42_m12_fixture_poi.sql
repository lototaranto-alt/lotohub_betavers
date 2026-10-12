-- 42_m12_fixture_poi.sql
-- Fixture di test M12 (HeatScore): 2 POI temporanei intorno al punto reale
-- indicato dall'utente: 40.450613, 17.269757 (~116 m dal
-- "Centro Acquatico e Piscine Olimpioniche del Salinella", 40.4502/17.2685).
--
-- Il punto e' INTERNO al palazzo: GPS meno preciso -> checkin_radius = 300 m
-- per assorbire il drift e far riuscire entrambi i check-in da fermo.
-- La velocita' anti-cheat non e' falsata: si calcola sul movimento dell'utente
-- (lat/lng dei check-in), non sulla distanza dal POI.
--
-- NON e' una migration: dati di test, reversibili col cleanup in fondo.
-- I POI sono riconoscibili dal prefisso 'TEST HeatScore '.
--
-- Esegui nel SQL Editor di Supabase. Restituisce 2 righe (id + coordinate).

insert into public.pois
    (id, name, category, layer_name, xp_reward, checkin_radius, loto_quota_max,
     is_accessible, is_active, is_recommended, tenant_id, coords)
values
    (gen_random_uuid(), 'TEST HeatScore A', 'monument', 'layer-loto-monuments',
     50, 300, 100, true, true, false, 'taranto',
     ST_SetSRID(ST_MakePoint(17.269757, 40.450613), 4326)),
    (gen_random_uuid(), 'TEST HeatScore B', 'attraction', 'layer-loto-attractions',
     50, 300, 100, true, true, false, 'taranto',
     ST_SetSRID(ST_MakePoint(17.269815, 40.450660), 4326))
returning id, name,
          ST_Y(coords::geometry) as lat,
          ST_X(coords::geometry) as lng;

-- ---------------------------------------------------------------------------
-- CLEANUP (esegui DOPO aver finito l'acceptance M12):
-- delete from public.pois where name like 'TEST HeatScore %';

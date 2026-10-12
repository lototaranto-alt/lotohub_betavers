-- V1 — Cosa vede la mappa in questo momento: righe di vw_poi_crowd_now per i POI test.
-- Uso: eseguire nel pannello SQL PRIMA di aprire la scheda POI (baseline), poi rileggere
-- dopo la scansione multi-BLE per confrontare (uno script = un solo result set).
select v.poi_id,
       v.devices,          -- somma device visti nella finestra 60m
       v.reporters,        -- conteggio DISTINCT reporter (k-anonimato)
       v.certified,        -- massimo liv. fiducia: 1=non certificato, 2=certificato
       v.last_seen,        -- ultima osservazione entro la finestra
       p.name
from public.vw_poi_crowd_now v
left join public.pois p on p.id = v.poi_id
order by v.last_seen desc nulls last;
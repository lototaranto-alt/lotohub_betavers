-- V2 — Comportamento certified/devices con PIÙ BLE: aggregato raw di crowd_predictions
-- negli ultimi 60 minuti. Uso: eseguire DOPO aver aperto la scheda del POI test mentre
-- compagna/smartwatch/PC hanno il BLE attivo (la scansione scrive righe).
-- Uno script = un solo result set.
select cp.poi_id,
       count(*)                                        as scansioni,
       count(distinct cp.reporter_id)                  as reporter_distinti,
       sum(cp.raw_count)                               as device_totali_visti,
       max(cp.certified_count)::int                    as certified_max,
       min(cp.certified_count)::int                    as certified_min,
       max(cp.confidence_score)::int                   as confidence_max,
       max(cp.created_at)                              as ultima_scansione
from public.crowd_predictions cp
where cp.created_at > now() - interval '60 minutes'
group by cp.poi_id
order by 1;
-- ==========================================
-- RIPRISTINO LOGICA DINAMICA (METE CONSIGLIATE E FLUSSI)
-- ==========================================

-- 1. Impostiamo due mete come 'Consigliate' per popolare la prima sezione in Home
UPDATE public.pois 
SET is_recommended = true
WHERE name ILIKE '%Ipogeo%' OR name ILIKE '%MuDi%';

-- 2. Simuliamo l'algoritmo Anti-Crowding sul Castello Aragonese (Affollamento critico > 80%)
UPDATE public.pois 
SET crowd_level = 85
WHERE name ILIKE '%Castello Aragonese%';

-- 3. Assegniamo al Castello un'alternativa sicura (Tempio di Poseidone) per il Routing
UPDATE public.pois 
SET alternative_poi_id = (SELECT id FROM public.pois WHERE name ILIKE '%Tempio di Poseidone%' LIMIT 1)
WHERE name ILIKE '%Castello Aragonese%';

-- 4. Aggiungiamo il tag 'Bonus Idrico' (Stazione Refill) a un paio di POI
UPDATE public.pois 
SET has_water = true
WHERE name ILIKE '%Tempio%' OR name ILIKE '%Saturo%';

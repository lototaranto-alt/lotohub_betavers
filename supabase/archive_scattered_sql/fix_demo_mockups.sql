-- ==========================================
-- FIX MOCKUP VISIVI PER DEMO (IMMAGINI REALI)
-- ==========================================

-- 1. Castello Aragonese: Torna in "Mete Consigliate" con immagine e livello affollamento
UPDATE public.pois SET 
    is_recommended = true,
    crowd_level = 85,
    has_water = false,
    image_url = 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1000&auto=format&fit=crop',
    description = 'Imponente fortezza marittima che protegge la citta da secoli. Tappa fondamentale per conoscere la storia di Taranto.'
WHERE name ILIKE '%Castello Aragonese%';

-- 2. Museo Ipogeo Spartano: Aggiunta immagine e Mete Consigliate
UPDATE public.pois SET 
    is_recommended = true,
    image_url = 'https://images.unsplash.com/photo-1544256729-e0d8fa099ce6?q=80&w=1000&auto=format&fit=crop',
    description = 'Scopri i segreti nascosti sotto le vie della Citta Vecchia in questo misterioso museo sotterraneo.'
WHERE name ILIKE '%Ipogeo%';

-- 3. MuDi - Museo Diocesano: Immagine reale
UPDATE public.pois SET 
    image_url = 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1000&auto=format&fit=crop'
WHERE name ILIKE '%MuDi%';

-- 4. Tempio di Poseidone: Immagine reale e Bonus Idrico
UPDATE public.pois SET 
    has_water = true,
    image_url = 'https://images.unsplash.com/photo-1560931758-c6f932e6fb1c?q=80&w=1000&auto=format&fit=crop'
WHERE name ILIKE '%Tempio%';

-- 5. Sostituisce eventuali link finti (s3.amazonaws.com o placeholder vuoti) con belle immagini di fallback marittime
UPDATE public.pois SET 
    image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop' 
WHERE image_url ILIKE '%s3.amazonaws.com%' OR image_url ILIKE '%placeholder.jpg%';

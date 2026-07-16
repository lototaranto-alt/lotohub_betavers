-- =========================================================================================
-- RIPRISTINO POI & MEDIA VAULT (Nessun Bypass Frontend)
-- =========================================================================================

-- 1. RIPRISTINO IMMAGINI POI E METE CONSIGLIATE
-- L'utente vuole le immagini rimosse da tutti i POI tranne il Museo (MuDi).
-- Le mete consigliate devono essere Castello Aragonese e MuDi.

UPDATE public.pois SET image_url = NULL, is_recommended = false;

UPDATE public.pois 
SET image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/mudi.jpg', 
    is_recommended = true
WHERE name ILIKE '%MuDi%';

UPDATE public.pois 
SET is_recommended = true
WHERE name ILIKE '%Castello Aragonese%';


-- 2. NUOVO P.O.I. DEMO TGT E PODCAST
-- Creiamo un POI temporaneo per la demo e gli agganciamo il podcast
INSERT INTO public.pois (name, category, layer_name, loto_quota_max, xp_reward, is_accessible, is_active, coords)
VALUES (
    'Demo TGT - Gigante di Pietra', 
    'secret', 
    'layer-loto-secrets', 
    100, 
    50, 
    TRUE,
    TRUE,
    ST_SetSRID(ST_MakePoint(17.2432, 40.4711), 4326) -- Coordinate centro Taranto
) ON CONFLICT DO NOTHING;

DELETE FROM public.media_vault WHERE title ILIKE '%Gigante di Pietra%';
INSERT INTO public.media_vault (poi_id, title, description, media_path, loto_cost, media_type, required_level, is_premium_only)
VALUES (
    (SELECT id FROM public.pois WHERE name = 'Demo TGT - Gigante di Pietra' LIMIT 1),
    'Il Gigante di Pietra', 
    'Podcast esclusivo. Ascolta il mito del guardiano.', 
    'demo/gigante_pietra.mp3', -- PERCORSO RELATIVO (per il bucket loto-vault)
    0, 
    'audio',
    1,
    false
);

-- 3. ARCHIVIO ARAGONESI
-- Ripristiniamo l'archivio sul Castello Aragonese con un path relativo per il bucket
DELETE FROM public.media_vault WHERE title ILIKE '%Aragonesi%';
INSERT INTO public.media_vault (poi_id, title, description, media_path, loto_cost, media_type, required_level, is_premium_only)
VALUES (
    (SELECT id FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1),
    'I Segreti degli Aragonesi', 
    'Documento criptato. Sblocca per simulare lo scaricamento di sicurezza.', 
    'demo/archivio_aragonesi.pdf', -- PERCORSO RELATIVO (per il bucket loto-vault)
    50, 
    'pdf',
    2,
    false
);

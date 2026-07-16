-- ============================================================
-- SEED DATA - DATI DI BASE PER TESTARE L'APP
-- ============================================================

-- 1. Inserimento Territori Base (Serve al frontend per i colori)
INSERT INTO public.territories (name, boundaries, colors, assets)
VALUES (
    'Taranto',
    ST_GeomFromText('MULTIPOLYGON(((17.20 40.40, 17.30 40.40, 17.30 40.50, 17.20 40.50, 17.20 40.40)))', 4326),
    '{"primary": "#4A5D23", "secondary": "#D96C4A", "background": "#F9F6EE", "card": "#FFFFFF", "text": "#1F1F1F", "tint": "#4A5D23"}'::jsonb,
    '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/splash.png"}'::jsonb
),
(
    'Lecce',
    ST_GeomFromText('MULTIPOLYGON(((18.10 40.30, 18.20 40.30, 18.20 40.40, 18.10 40.40, 18.10 40.30)))', 4326),
    '{"primary": "#8A1C1C", "secondary": "#D4AF37", "background": "#FDFBF7", "card": "#FFFFFF", "text": "#2C2C2C", "tint": "#8A1C1C"}'::jsonb,
    '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/splash.png"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- 2. Inserimento Tenants Gamification/Civic
INSERT INTO public.tenants (id, display_name, slug, city_name, features)
VALUES (
    'taranto', 'Comune di Taranto', 'taranto', 'Taranto',
    '{"events": true, "civic_module": true, "gamification": true, "ble_heatmap": false, "premium_boost": false, "community_challenges": true}'::jsonb
),
(
    'lecce', 'Comune di Lecce', 'lecce', 'Lecce',
    '{"events": true, "civic_module": false, "gamification": true, "ble_heatmap": true, "premium_boost": true, "community_challenges": false}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 3. Inserimento POI (MuDi, Castello Aragonese e Demo TGT)
INSERT INTO public.pois (id, name, category, layer_name, loto_quota_max, xp_reward, is_accessible, is_active, is_recommended, image_url, tenant_id, coords)
VALUES 
(
    gen_random_uuid(), 'MuDi - Museo Diocesano', 'museum', 'layer-museums', 100, 50, TRUE, TRUE, TRUE, 
    'https://lotohub.s3.amazonaws.com/tenants/taranto/mudi.jpg', 'taranto',
    ST_SetSRID(ST_MakePoint(17.2289, 40.4735), 4326)
),
(
    gen_random_uuid(), 'Castello Aragonese', 'monument', 'layer-monuments', 200, 100, TRUE, TRUE, TRUE,
    NULL, 'taranto',
    ST_SetSRID(ST_MakePoint(17.2345, 40.4722), 4326)
),
(
    gen_random_uuid(), 'Demo TGT - Gigante di Pietra', 'secret', 'layer-loto-secrets', 100, 50, TRUE, TRUE, FALSE,
    NULL, 'taranto',
    ST_SetSRID(ST_MakePoint(17.2432, 40.4711), 4326)
);

-- 4. Inserimento Media Vault
INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type, required_level, is_premium_only)
VALUES 
(
    (SELECT id FROM public.pois WHERE name = 'Demo TGT - Gigante di Pietra' LIMIT 1),
    'Il Gigante di Pietra', 'demo/gigante_pietra.mp3', 0, 'audio', 1, false
),
(
    (SELECT id FROM public.pois WHERE name = 'Castello Aragonese' LIMIT 1),
    'I Segreti degli Aragonesi', 'demo/archivio_aragonesi.pdf', 50, 'pdf', 2, false
);

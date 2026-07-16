-- ==========================================
-- FIX SEED: Ripristino Asset Grafici Originali
-- ==========================================

-- 1. Ripristino del tenant (Mappa e Confini)
UPDATE public.tenants
SET 
  mapbox_style = 'mapbox://styles/lotohub/cmnww4mp8003r01sabgy4c0fr',
  center = '{"latitude": 40.473, "longitude": 17.243}',
  boundaries = '{"type": "MultiPolygon", "coordinates": [[[[16.80, 40.30], [17.50, 40.30], [17.50, 40.55], [16.80, 40.55], [16.80, 40.30]]]]}'
WHERE slug = 'taranto';

-- 2. Ripristino della localizzazione (Colori LOTO, Logo S3)
UPDATE public.tenant_localizations
SET 
  colors = '{"primary": "#4A5D23", "secondary": "#D96C4A", "background": "#F9F6EE", "card": "#FFFFFF", "text": "#1F1F1F", "tint": "#4A5D23"}',
  assets = '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/splash.png"}'
WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'taranto' LIMIT 1) 
  AND language_code = 'it';

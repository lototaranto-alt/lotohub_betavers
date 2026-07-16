-- ==========================================
-- SEED DATA: Inserimento del Tenant "Taranto"
-- ==========================================

-- 1. Inseriamo il record principale in `tenants`
INSERT INTO public.tenants (id, slug, name, center, boundaries, mapbox_style)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'taranto', 
  'Taranto', 
  '{"latitude": 40.4711, "longitude": 17.2432}', 
  '{"type": "MultiPolygon", "coordinates": [[[[17.15, 40.40], [17.35, 40.40], [17.35, 40.55], [17.15, 40.55], [17.15, 40.40]]]]}', 
  'mapbox://styles/mapbox/streets-v11'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Inseriamo i dati di localizzazione, grafica e token in `tenant_localizations`
INSERT INTO public.tenant_localizations (tenant_id, language_code, colors, assets, ticker_text, pti_name)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'it', 
  '{"primary": "#0D9488", "secondary": "#14B8A6", "background": "#F0FDFA", "text": "#1F2937"}', 
  '{"logo": "https://example.com/logo-taranto.png", "icon": "https://example.com/icon-taranto.png"}', 
  'Benvenuti su L.O.T.O. Taranto! Esplora la città e raccogli Punti Civici.', 
  'Punti Civici'
)
ON CONFLICT (tenant_id, language_code) DO NOTHING;

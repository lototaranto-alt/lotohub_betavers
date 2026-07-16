-- ==========================================
-- RIPRISTINO ESATTO DEL LAVORO ORIGINALE (NO INVENZIONI)
-- ==========================================

-- 1. Ripristino Eventi originali (dal file populate_taranto_mock.sql)
DELETE FROM public.tenant_events WHERE tenant_id = 'taranto';

INSERT INTO public.tenant_events (tenant_id, event_type, title, short_description, icon_emoji, starts_at, ends_at)
VALUES 
    (
        'taranto', 
        'community_challenge', 
        'Sfida Templare NFC', 
        'Attivazione Patrimonio Fisico: trova i tag nascosti nella Città Vecchia.', 
        '??', 
        now() - interval '1 day', 
        now() + interval '7 days'
    ),
    (
        'taranto', 
        'community_challenge', 
        'Loto Clean-Up Rete Tracce', 
        'Monitoraggio del decoro nel quartiere Tamburi.', 
        '??', 
        now(), 
        now() + interval '3 days'
    ),
    (
        'taranto', 
        'partner_takeover', 
        'Aperitivo Zero-Friction', 
        'Incontro con gli esercenti (Startup Urbane) del centro storico.', 
        '??', 
        now(), 
        now() + interval '2 days'
    );

-- 2. Ripristino Dinamiche di Flusso originali (da migration_v5_flow, v6_smart_poi, v11_fix_home_pois)
-- Prima resettiamo a zero
UPDATE public.pois 
SET crowd_level = 20, has_water = false, alternative_poi_id = NULL, is_recommended = false;

-- Ripristino sovraffollamento Castello (v5)
UPDATE public.pois 
SET crowd_level = 85 
WHERE name ILIKE '%Castel%';

-- Ripristino Fontana con Bonus Idrico (v5)
UPDATE public.pois 
SET has_water = TRUE, crowd_level = 10 
WHERE name ILIKE '%Fontana%';

-- Ripristino Routing intelligente Castello -> Fontana (v6)
UPDATE public.pois 
SET alternative_poi_id = (SELECT id FROM public.pois WHERE name ILIKE '%Fontana%' LIMIT 1)
WHERE name ILIKE '%Castel%';

-- Ripristino Mete Consigliate esatte originali (v6 + v11)
UPDATE public.pois 
SET is_recommended = true
WHERE name ILIKE '%Piazza%' 
   OR name IN ('Castello Aragonese', 'Oasi Palude La Vela', 'MuDi - Museo Diocesano');

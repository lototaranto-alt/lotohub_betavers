-- POPOLAMENTO MOCK TENANT TARANTO (Ottimizzato per modello iCapital/Peeripato)

-- 1. Inserimento Tenant (Taranto)
INSERT INTO tenants (id, display_name, slug, primary_color, secondary_color, city_name, region, center_lat, center_lng, default_zoom)
VALUES (
    'taranto',
    'L.O.T.O. Taranto',
    'taranto',
    '#E74C3C', -- Rosso L.O.T.O.
    '#2C3E50', -- Blu scuro istituzionale
    'Taranto',
    'Puglia',
    40.4735, -- Centro mappa (Città Vecchia)
    17.2340,
    14
) ON CONFLICT (id) DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    center_lat = EXCLUDED.center_lat,
    center_lng = EXCLUDED.center_lng;

-- 2. Localizzazione (Ridefinizione in ottica "Sensore Urbano")
INSERT INTO tenant_localizations (tenant_id, locale, points_name, points_name_plural, civic_module_name, events_tab_name)
VALUES (
    'taranto',
    'it',
    'Token',
    'Token di Impatto Civico (PTI)', -- I punti diventano "Token di Impatto"
    'Monitoraggio Civico Distribuito',
    'Sfide e Rigenerazione'
) ON CONFLICT (tenant_id, locale) DO UPDATE SET 
    points_name_plural = EXCLUDED.points_name_plural;

-- 3. Inserimento Associazioni Locali (Nodi Attivi sul territorio)
INSERT INTO tenant_associations (tenant_id, name, slug, category, can_moderate_reports, can_create_events)
VALUES 
    ('taranto', 'Diseducation', 'diseducation', 'culture', true, true),
    ('taranto', 'Rete Tracce', 'rete-tracce', 'neighborhood', true, true)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- 4. Inserimento Eventi e Sfide (Rigenerazione, Frugal Innovation)
INSERT INTO tenant_events (tenant_id, event_type, title, short_description, icon_emoji, starts_at, ends_at, target_type, target_value)
VALUES 
    (
        'taranto', 
        'community_challenge', 
        'Sfida Templare NFC', 
        'Attivazione Patrimonio Fisico: trova i tag nascosti nella Città Vecchia.', 
        '🛡️', 
        now() - interval '1 day', 
        now() + interval '7 days',
        'scans',
        500
    ),
    (
        'taranto', 
        'community_challenge', 
        'Loto Clean-Up Rete Tracce', 
        'Monitoraggio del decoro nel quartiere Tamburi.', 
        '♻️', 
        now(), 
        now() + interval '3 days',
        'reports',
        100
    ),
    (
        'taranto', 
        'partner_takeover', 
        'Aperitivo Zero-Friction', 
        'Incontro con gli esercenti (Startup Urbane) del centro storico.', 
        '🍹', 
        now(), 
        now() + interval '2 days',
        'users',
        50
    );

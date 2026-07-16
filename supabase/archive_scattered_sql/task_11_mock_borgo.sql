-- Tenant "borgo-test" (piccolo comune, solo turismo)
INSERT INTO tenants (id, display_name, slug, primary_color, secondary_color, city_name, region, center_lat, center_lng, default_zoom, status, features)
VALUES ('borgo-test', 'Borgo Antico', 'borgo-antico', '#2E8B57', '#F5F5DC', 'Borgo Antico', 'Puglia', 40.5000, 17.8000, 14, 'active', '{
    "civic_module": false,
    "gamification": true,
    "events": false,
    "community_challenges": false,
    "ble_heatmap": false,
    "premium_boost": false
}')
ON CONFLICT (id) DO UPDATE SET features = EXCLUDED.features;

INSERT INTO tenant_localizations (tenant_id, locale, onboarding_title, onboarding_subtitle, onboarding_cta, points_name, points_name_plural, civic_module_name, events_tab_name, events_empty_state)
VALUES ('borgo-test', 'it', 'Benvenuto nel Borgo', 'Scopri i segreti di un paese che vive nel tempo.', 'Inizia', 'Punti', 'Punti', 'Segnalazioni', 'Eventi', 'Nessun evento programmato')
ON CONFLICT (tenant_id, locale) DO UPDATE SET onboarding_title = EXCLUDED.onboarding_title;

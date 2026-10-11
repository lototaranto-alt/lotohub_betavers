-- ============================================================================
-- FASE 0 - MISURA 3d - RIGHE DELLE TABELLE ANCORA NON CONTATE
-- ============================================================================
-- Sola lettura. Un solo result set.
--
-- Perche': la misura 1 ha contato 9 tabelle, ma 03b ha rivelato che ne
-- esistono 24. Questa conta le 14 che mancano.
--
-- Gi'a noto dalla misura 1, quindi non ripetuto:
--   profiles 50 | whispers 26 | user_pois 5 | territories 2 | tenants 2 |
--   loto_squads 0 | civic_reports 0 | scans 0 | user_badges 0
--
-- Cosa serve:
--   tenant_events e events  -> esistono due tabelle eventi, mai contate
--   badge_templates/badges  -> lo schema dei badge
--   user_unlocked_media     -> media sbloccati
--   crowd_predictions, poi_ble_fingerprints, system_logs, ecc. -> mai viste
-- ============================================================================

SELECT 'badge_templates'    AS t, count(*) AS righe FROM public.badge_templates
UNION ALL SELECT 'badges',              count(*) FROM public.badges
UNION ALL SELECT 'events',              count(*) FROM public.events
UNION ALL SELECT 'impact_transactions', count(*) FROM public.impact_transactions
UNION ALL SELECT 'media_vault',         count(*) FROM public.media_vault
UNION ALL SELECT 'pois',                count(*) FROM public.pois
UNION ALL SELECT 'tenant_events',       count(*) FROM public.tenant_events
UNION ALL SELECT 'tenant_localizations',count(*) FROM public.tenant_localizations
UNION ALL SELECT 'user_unlocked_media', count(*) FROM public.user_unlocked_media
UNION ALL SELECT 'app_telemetry_events',count(*) FROM public.app_telemetry_events
UNION ALL SELECT 'b2b_feedbacks',       count(*) FROM public.b2b_feedbacks
UNION ALL SELECT 'crowd_predictions',   count(*) FROM public.crowd_predictions
UNION ALL SELECT 'poi_ble_fingerprints',count(*) FROM public.poi_ble_fingerprints
UNION ALL SELECT 'system_logs',         count(*) FROM public.system_logs
ORDER BY righe DESC;

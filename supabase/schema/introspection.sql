-- ============================================================================
-- L.O.T.O. HUB - Pack di introspezione (fallback manuale, SQL Editor)
-- Generato da scripts/dump-db.ps1. Eseguire le sezioni separatamente e salvare
-- i risultati in supabase/schema/. NON e' un dump completo: per la SSOT usare
-- il backend Cli o PgDump.
-- ============================================================================

-- 1) FUNZIONI (corpi completi, incl. SECURITY DEFINER e search_path)
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY p.proname;

-- 2) POLICY RLS + stato RLS per tabella
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) COLONNE (tipi reali, per confrontare col codice)
SELECT table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4) VINCOLI (PK, FK, UNIQUE come receipt_hash, CHECK)
SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid, true) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- 5) GRANT espliciti
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- 6) VISTE e relative definizioni
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7) ESTENSIONI
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- ============================================================================
-- 8) AUDIT RAPIDO (domande aperte dell'audit integrita' dati)
-- ============================================================================

-- 8a) Esiste profiles.total_co2? (la mappa SSOT dice di NO)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles' AND column_name IN ('total_co2','total_xp','total_tokens','pois_discovered','party_size');

-- 8b) Colonne reali di user_pois (la mappa cita calculated_speed_kmh, is_shadowbanned, xp_awarded, co2_saved)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='user_pois'
ORDER BY ordinal_position;

-- 8c) Quale definizione di scan_poi_gps e' realmente deployata?
SELECT pg_get_functiondef(p.oid) AS scan_poi_gps_definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='scan_poi_gps';

-- 8d) Firme delle RPC chiamate dal client ma senza definizione nel repo
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname IN
      ('scan_poi','process_crowd_radar','process_esg_impact','sblocca_media','join_squad',
       'recover_loto_pass','validate_ntag424_sdm','rpc_sync_adventure_distance','create_itinerary')
ORDER BY p.proname;

-- 8e) Vincolo UNIQUE anti-double-spend su impact_transactions
SELECT conname, pg_get_constraintdef(oid, true) AS definition
FROM pg_constraint
WHERE connamespace='public'::regnamespace AND conrelid='public.impact_transactions'::regclass;

-- 8f) user_id vs profile_id: verifica convenzione sulle tabelle chiave
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('user_pois','impact_transactions','scans','poi_ble_fingerprints')
  AND column_name IN ('user_id','profile_id')
ORDER BY table_name, column_name;

-- 8g) Esistono le tabelle citate dalla mappa SSOT?
SELECT c.relname AS object_name,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'matview' ELSE c.relkind::text END AS kind
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('scans','loto_squads','crowd_predictions','impact_transactions',
                    'esg_raw_logs','poi_ble_fingerprints','vw_pois_frontend',
                    'vw_collective_impact','vw_admin_checkins_analytics')
ORDER BY c.relname;

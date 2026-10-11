-- ============================================================================
-- FASE 1 - M16 - 38 - PRECHECK - stato di public.events
-- ============================================================================
-- Sola lettura. UN SOLO result set (colonne: sezione | oggetto | valore).
-- Obiettivo: verificare la premessa M16 ("RLS attiva + 0 policy -> fog of war
-- vuoto") e accertare che le 3 letture client siano possibili dopo una policy
-- SELECT (colonne event_type/start_time/poi_id; embedding pois(name) richiede
-- la FK events.poi_id -> pois.id).
-- I client (grep 09/10):
--   index.tsx:385        select('*')  eq event_type='web_public',  gte start_time
--   community.tsx:75     select('*, pois(name)') eq event_type='nodo_community'
--   PoiDetailSheet.tsx:178 select('*') eq poi_id  (ordine start_time)
-- Nessun INSERT/UPDATE/insert nel client su events (grep 09/10).
-- ============================================================================
SELECT 'EVENTS_RLS' AS sezione,
       c.relname AS oggetto,
       'rls=' || c.relrowsecurity::text || ' | forced=' || c.relforcerowsecurity::text AS valore
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'events'

UNION ALL

SELECT 'EVENTS_COLUMNS', string_agg(a.attname, ', ' ORDER BY a.attnum),
       string_agg(format_type(a.atttypid, a.atttypmod), ', ' ORDER BY a.attnum)
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'events'
  AND a.attnum > 0 AND NOT a.attisdropped

UNION ALL

SELECT 'EVENTS_POLICY', p.policyname,
       'cmd=' || p.cmd || ' | roles=' || p.roles::text
         || ' | using=' || COALESCE(p.qual, '-') || ' | check=' || COALESCE(p.with_check, '-')
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'events'

UNION ALL

SELECT 'EVENTS_GRANT', rg.grantee || ' | ' || rg.privilege_type,
       rg.is_grantable::text
FROM information_schema.role_table_grants rg
WHERE rg.table_schema = 'public' AND rg.table_name = 'events'
  AND rg.grantee IN ('anon', 'authenticated')

UNION ALL

SELECT 'EVENTS_ROWCOUNT', 'count(*)', count(*)::text FROM public.events

UNION ALL

SELECT 'EVENTS_EVENT_TYPES', 'distinct event_type',
       string_agg(DISTINCT event_type::text, ', ')
FROM public.events

UNION ALL

SELECT 'EVENTS_FK', con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'public.events'::regclass
  AND con.contype = 'f'

UNION ALL

SELECT 'EVENTS_PK', con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'public.events'::regclass
  AND con.contype = 'p'

UNION ALL

SELECT 'EVENTS_INDEX', ic.relname,
       string_agg(a.attname, ', ' ORDER BY u.ord)
FROM pg_index idx
JOIN pg_class ic ON ic.oid = idx.indexrelid
JOIN pg_class c ON c.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN LATERAL unnest(idx.indkey::smallint[]) WITH ORDINALITY u(attnum, ord) ON true
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = u.attnum
WHERE n.nspname = 'public' AND c.relname = 'events'
GROUP BY ic.relname

ORDER BY sezione, oggetto;
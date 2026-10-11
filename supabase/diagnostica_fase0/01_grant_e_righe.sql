-- ============================================================================
-- FASE 0 - MISURA 1 - GRANT PER RUOLO E RIGHE
-- ============================================================================
-- Sola lettura. Nessun INSERT/UPDATE/DELETE. Non serve salvarlo nel Supabase
-- SQL Editor: eseguilo e incolla l'output grezzo dei due result set.
--
-- Perche' questa e' la prima misura:
-- fino ad ora sono state lette le POLICY, mai i GRANT. Sono due cose diverse.
-- Una policy ammette la riga, il GRANT concede il privilegio. Se anon non ha
-- il privilegio su una tabella, la sua policy permissiva e' inerte e la
-- gravita' scende da critico a teorico. Questa query riordina tutte le
-- misure successive.
--
-- Lettura dell'output:
--   rls_attivo  = 1 significa che l'RLS e' attivo sulla tabella
--   anon_*      = 1 significa che la chiave pubblica lo puo' fare
--   Se anon_insert = 1 su una tabella con policy aperta, e' scrittura pubblica
-- ============================================================================

SELECT
  c.relname                                     AS tabella,
  c.relrowsecurity                              AS rls_attivo,
  has_table_privilege('anon',          c.oid, 'SELECT') AS anon_select,
  has_table_privilege('anon',          c.oid, 'INSERT') AS anon_insert,
  has_table_privilege('anon',          c.oid, 'UPDATE') AS anon_update,
  has_table_privilege('anon',          c.oid, 'DELETE') AS anon_delete,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select,
  has_table_privilege('authenticated', c.oid, 'INSERT') AS auth_insert
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'profiles', 'civic_reports', 'scans', 'user_pois', 'user_badges',
    'media_vault', 'whispers', 'territories', 'tenants', 'loto_squads'
  )
ORDER BY anon_insert DESC, anon_update DESC, anon_select DESC, c.relname;

SELECT 'profiles'      AS tabella, count(*) AS righe FROM public.profiles
UNION ALL SELECT 'civic_reports', count(*) FROM public.civic_reports
UNION ALL SELECT 'scans',         count(*) FROM public.scans
UNION ALL SELECT 'user_pois',     count(*) FROM public.user_pois
UNION ALL SELECT 'user_badges',   count(*) FROM public.user_badges
UNION ALL SELECT 'whispers',      count(*) FROM public.whispers
UNION ALL SELECT 'territories',   count(*) FROM public.territories
UNION ALL SELECT 'tenants',       count(*) FROM public.tenants
UNION ALL SELECT 'loto_squads',   count(*) FROM public.loto_squads
ORDER BY righe DESC;

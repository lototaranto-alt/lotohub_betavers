-- ============================================================================
-- FASE 1 - M14 - PRECHECK 11 - stato RLS e grant di profiles
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste: le misure della Fase 0 (07) hanno censito le POLICY di
-- profiles ma non hanno registrato se la RLS e' ATTIVA sulla tabella.
-- Policy con RLS spenta sono inerti: tutto quello che misura la 07 e'
-- allora solo "permesso di grant", non "policy che filtra".
-- In piu' serve lo stato dei grant di tabella prima del REVOKE di M14.
--
-- Cosa misura:
--   rls_attivo           relrowsecurity: la RLS e' abilitata?
--   rls_forzato          relforcerowsecurity: il proprietario e' soggetto?
--   n_policy             quante policy ci sono su profiles (tutte)
--   auth_select/update   has_table_privilege per authenticated
--   anon_update          has_table_privilege UPDATE per anon
--
-- ESITO: da leggere insieme a 07. Se rls_attivo = false, le policy misurate
-- in 07 non filtrano nulla e M14 deve anche ENABLE ROW LEVEL SECURITY
-- (la migration lo fa gia', ma bisogna saperlo).
-- ============================================================================

SELECT
  c.relrowsecurity                                                 AS rls_attivo,
  c.relforcerowsecurity                                            AS rls_forzato,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles')        AS n_policy,
  has_table_privilege('authenticated', 'public.profiles', 'SELECT') AS auth_select,
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') AS auth_update,
  has_table_privilege('anon', 'public.profiles', 'SELECT')          AS anon_select,
  has_table_privilege('anon', 'public.profiles', 'UPDATE')          AS anon_update
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles';

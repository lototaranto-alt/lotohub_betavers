-- ============================================================================
-- FASE 1 - M14 - 12 - POST-APPLY - verifica dell'esito della migration
-- ============================================================================
-- Sola lettura. Un solo result set, una riga. Da eseguire DOPO
-- 20261008120000_profiles_hardening_m14.sql.
--
-- Valori attesi (baseline precheck 11: rls=true, 6 policy, grant tutti true):
--   rls_attivo            = true      (era gia' true, resta)
--   n_policy              = 2 -> **CORRETTO 08/10: misurato 4** (2 proprie +
--                           2 preesistenti NON droppate: il DROP di M14 copre
--                           solo cmd SELECT/UPDATE/ALL -> le altre sono
--                           INSERT/DELETE; censite con 13_policy_profiles_elenco)
--   n_policy_own          = 2         (profiles_select_own + profiles_update_own)
--   auth_update_tabella   = false     (REVOKE UPDATE a tabella piena)
--   auth_update_adminrole = false     (revoca puntuale colonna di escalation)
--   auth_update_nickname  = true      (re-GRANT colonna client)
--   anon_update           = false     (anon non scrive piu')
--   anon_select_grant     = true      (il grant SELECT non si tocca: la
--                                      visibilita' la filtra la policy TO
--                                      authenticated; REST anon deve tornare
--                                      0 righe)
--   uniq_ok / check_ok    = true      (vincoli nickname presenti)
--   count_profiles_ok     = true      (RPC creata)
--   righe_profiles        = 50        (nessuna riga persa)
-- ============================================================================
SELECT
  (SELECT c.relrowsecurity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles')          AS rls_attivo,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles')          AS n_policy,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname IN ('profiles_select_own', 'profiles_update_own'))
                                                                     AS n_policy_own,
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
                                                                     AS auth_update_tabella,
  has_column_privilege('authenticated', 'public.profiles', 'admin_role', 'UPDATE')
                                                                     AS auth_update_adminrole,
  has_column_privilege('authenticated', 'public.profiles', 'nickname', 'UPDATE')
                                                                     AS auth_update_nickname,
  has_table_privilege('anon', 'public.profiles', 'UPDATE')           AS anon_update,
  has_table_privilege('anon', 'public.profiles', 'SELECT')           AS anon_select_grant,
  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.profiles'::regclass
             AND contype = 'u' AND conname = 'profiles_nickname_key')
                                                                     AS uniq_ok,
  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.profiles'::regclass
             AND contype = 'c' AND conname = 'profiles_nickname_check')
                                                                     AS check_ok,
  to_regprocedure('public.count_profiles()') IS NOT NULL             AS count_profiles_ok,
  (SELECT count(*) FROM public.profiles)                             AS righe_profiles;

-- ============================================================================
-- FASE 1 - M4 - 18 - POST-APPLY - verifica della migration M4
--                    (civic_reports RLS)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
-- Da eseguire DOPO l'apply di
--   supabase/migrations/20261008130000_civic_reports_rls_m4.sql
--
-- VALORI ATTESI:
--   rls_attivo            = true
--   n_policy              = 3        (le nostre 3, niente altro)
--   n_policy_select       = 1
--   n_policy_insert       = 1
--   n_policy_update       = 1
--   n_policy_delete       = 0        (nessuna DELETE: RLS nega a tutti)
--   n_policy_all          = 0        (la vecchia "Civic access" e' via)
--   n_policy_pubbliche    = 0        (nessuna policy con ruolo public)
--   n_policy_anon         = 0        (nessuna policy per il ruolo anon)
--   vecchia_civic_access  = false    (DROP riuscito)
--   righe_totali          = 0        (M4 non tocca i dati)
--
-- Se n_policy > 3: ci sono policy duplicate non droppate -> indagare.
-- ============================================================================
SELECT
  (SELECT c.relrowsecurity
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'civic_reports')      AS rls_attivo,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports')          AS n_policy,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports' AND cmd='SELECT')
                                                                     AS n_policy_select,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports' AND cmd='INSERT')
                                                                     AS n_policy_insert,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports' AND cmd='UPDATE')
                                                                     AS n_policy_update,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports' AND cmd='DELETE')
                                                                     AS n_policy_delete,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports' AND cmd='ALL')
                                                                     AS n_policy_all,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports'
      AND 'public' = ANY (roles))                                    AS n_policy_pubbliche,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='civic_reports'
      AND 'anon' = ANY (roles))                                      AS n_policy_anon,
  EXISTS (SELECT 1 FROM pg_policies
           WHERE schemaname='public' AND tablename='civic_reports'
             AND policyname='Civic access')                          AS vecchia_civic_access,
  (SELECT count(*) FROM public.civic_reports)                        AS righe_totali;

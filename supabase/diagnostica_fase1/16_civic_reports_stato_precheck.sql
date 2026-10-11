-- ============================================================================
-- FASE 1 - M4 - 16 - PRECHECK - stato di civic_reports (RLS, policy, grant,
--                    dati, schema effettivo)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste: M4 deve DROPpare le policy SELECT/INSERT/UPDATE esistenti
-- (i nomi reali non sono nel Git) e crearne di nuove secondo D4 = R3
-- (decisa 08/10: legge chiunque i confermati + l'autore i propri pending).
-- Prima del drop serve il baseline.
--
-- Cosa misura:
--   rls_attivo / rls_forzato      ENABLE ROW LEVEL SECURITY attuale
--   n_policy (+ per cmd)          quante policy e di che tipo
--   auth_*/anon_*                 has_table_privilege SELECT/INSERT/UPDATE
--   righe_totali / per_stato      distribuzione degli status reali
--                                 (il file d'archivio dice CHECK IN
--                                 submitted/pending_match/confirmed/... ma
--                                 CivicReportSheet:50 scrive 'pending':
--                                 per_stato dice quali valori ESISTONO)
--   n_tenant_null                 gate M4: righe senza tenant (invisibili a
--                                 una policy con tenant)
--   has_grid_cell / has_grid_cell_50m
--                                 i due insert client usano nomi diversi
--                                 (CivicReportSheet:47 usa grid_cell,
--                                 CivicDashboard:83 usa grid_cell_50m):
--                                 serve sapere quale colonna esiste
--   has_status_check              esiste un CHECK su status?
--
-- ESITO: baseline registrato + input per scrivere la migration M4.
-- ============================================================================
SELECT
  (SELECT c.relrowsecurity
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'civic_reports')      AS rls_attivo,
  (SELECT c.relforcerowsecurity
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'civic_reports')      AS rls_forzato,
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
  has_table_privilege('authenticated','public.civic_reports','SELECT')  AS auth_select,
  has_table_privilege('authenticated','public.civic_reports','INSERT')  AS auth_insert,
  has_table_privilege('authenticated','public.civic_reports','UPDATE')  AS auth_update,
  has_table_privilege('anon','public.civic_reports','SELECT')           AS anon_select,
  has_table_privilege('anon','public.civic_reports','INSERT')           AS anon_insert,
  has_table_privilege('anon','public.civic_reports','UPDATE')           AS anon_update,
  (SELECT count(*) FROM public.civic_reports)                          AS righe_totali,
  (SELECT jsonb_object_agg(status, cnt)
     FROM (SELECT COALESCE(status,'<null>') AS status, count(*) AS cnt
             FROM public.civic_reports GROUP BY 1) s)                  AS per_stato,
  (SELECT count(*) FROM public.civic_reports WHERE tenant_id IS NULL)  AS n_tenant_null,
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='civic_reports'
             AND column_name='grid_cell')                              AS has_grid_cell,
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='civic_reports'
             AND column_name='grid_cell_50m')                          AS has_grid_cell_50m,
  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid='public.civic_reports'::regclass AND contype='c')
                                                                     AS has_status_check;

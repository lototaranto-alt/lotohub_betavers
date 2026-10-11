-- ============================================================================
-- FASE 1 - G-06 - 30 - PRECHECK/DEPENDENZE - prima del DROP di scan_poi
-- ============================================================================
-- Sola lettura. UN SOLO result set.
-- Da eseguire PRIMA di 20261009130000_drop_scan_poi_g06.sql.
--
-- Cosa verifica:
--   argomenti            = p_poi_id uuid      (firma attesa)
--   prosecdef            = true
--   proconfig            = null              (invariato da 28, misurato)
--   proacl               = {=X/postgres,  postgres=X/postgres,
--                           anon=X/postgres, authenticated=X/postgres}
--   oggetti_che_la_usano = 0                 (nessun dipendente: DROP senza CASCADE)
--
-- Se oggetti_che_la_usano > 0: FERMARSI. Il DROP senza CASCADE fallirebbe (o
-- servirebbe CASCADE, che qui NON si vuole). Elencare i dipendenti prima.
-- ============================================================================
SELECT
  pg_get_function_identity_arguments(p.oid)                        AS argomenti,
  p.prosecdef                                                      AS prosecdef,
  p.proconfig                                                      AS proconfig,
  p.proacl                                                         AS proacl,
  (SELECT count(*) FROM pg_depend d
     WHERE d.refclassid = 'pg_proc'::regclass
       AND d.refobjid   = p.oid)                                   AS oggetti_che_la_usano
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'scan_poi'
ORDER BY argomenti;

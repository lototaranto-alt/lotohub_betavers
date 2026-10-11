-- ============================================================================
-- FASE 0 - MISURA 2 - CORPO DEPLOYATO DI scan_poi
-- ============================================================================
-- Sola lettura. Nessun INSERT/UPDATE/DELETE.
--
-- Perche' e' al secondo posto ma resta la misura piu' importante:
--   - SECURITY DEFINER con anon in EXECUTE (misurato in Fase 0, Script A)
--   - e' sulla strada principale del check-in: PoiDetailSheet.tsx:576
--   - le righe di scans sono 0, quindi o non scrive, o non e' mai riuscito
--   - non ne e' MAI stato letto il corpo
--
-- Leggo pg_get_functiondef: cio' che restituisce e' il corpo effettivamente
-- deployato su Supabase, non quello nei file di migrazione. Serve anche per
-- escludere drift in un colpo solo.
-- ============================================================================

SELECT
  p.proname                                  AS funzione,
  pg_get_function_result(p.oid)               AS tipo_ritorno,
  p.prosecdef                                AS security_definer,
  pg_get_function_arguments(p.oid)            AS argomenti,
  pg_get_functiondef(p.oid)                   AS corpo_deployato
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'scan_poi'
ORDER BY p.oid;

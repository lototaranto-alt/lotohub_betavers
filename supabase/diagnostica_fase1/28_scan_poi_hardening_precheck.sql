-- ============================================================================
-- FASE 1 - G-06 - 28 - PRECHECK - stato di public.scan_poi
--                        (ACL, search_path) + BACKUP M3 del corpo
-- ============================================================================
-- Sola lettura. Un solo result set (una riga per overload; atteso 1).
--
-- Perche' esiste: la migration 20261009120000_scan_poi_hardening_g06.sql
-- tocca SOLO i privilegi e il search_path (non il corpo), ma il METODO
-- richiede il backup M3 prima di qualunque scrittura sulla funzione. Qui si
-- cattura la definizione deployata (= backup), piu' lo stato ACL/config che
-- serve al ROLLBACK esatto.
--
-- Cosa misura:
--   prosecdef     = SECURITY DEFINER?
--   proconfig     = search_path pinnato? (NULL = no -> vettore)
--   proacl        = chi ha EXECUTE? (atteso: =X + anon + authenticated + owner)
--   argomenti     = firma esatta per GRANT/REVOKE/ALTER
--   proprietario  = owner
--   definizione   = pg_get_functiondef = BACKUP COMPLETO (M3)
--
-- ATTESO (dal precheck 27, 09/10): prosecdef=true, proconfig=null,
--   proacl={=X/postgres, postgres=X/postgres, anon=X/postgres,
--           authenticated=X/postgres}, argomenti=p_poi_id uuid.
--
-- ESITO: baseline + backup; con esso si applica la migration G-06.
-- ============================================================================
SELECT
  p.prosecdef                                            AS prosecdef,
  p.proconfig                                            AS proconfig,
  p.proacl                                               AS proacl,
  pg_get_function_identity_arguments(p.oid)              AS argomenti,
  pg_get_userbyid(p.proowner)                            AS proprietario,
  pg_get_functiondef(p.oid)                              AS definizione
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'scan_poi'
ORDER BY argomenti;

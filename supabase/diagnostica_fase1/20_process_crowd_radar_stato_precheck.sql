-- ============================================================================
-- FASE 1 - M5 - 20 - PRECHECK - stato di process_crowd_radar
--                    (SECURITY DEFINER, grant, search_path)
--                    + BACKUP M3 del corpo della funzione
-- ============================================================================
-- Sola lettura. Un solo result set (una riga per overload; atteso 1 solo).
--
-- Perche' esiste: M5 deve
--   R1: REVOKE EXECUTE da anon  (la severita' dipende da proacl misurato qui)
--   R2: aggiungere SET search_path = public, pg_temp  (da proconfig)
--   passo 1/2: sostituire p_reporter_id con auth.uid() dentro il corpo ->
--              il corpo va CENSITO PRIMA (backup M3: la cloud non e'
--              riproducibile dalle migration, questo e' l'unico backup)
--
-- Cosa misura:
--   prosecdef     = la funzione e' SECURITY DEFINER?
--   proconfig     = search_path pinnato? (NULL = no -> R2 aperto)
--   proacl        = chi ha EXECUTE? (NULL = EXECUTE di default a PUBLIC,
--                   anon compreso -> R1 aperto; altrimenti leggere le righe)
--   argomenti     = firma esatta per costruire REVOKE/ALTER (M5)
--   proprietario  = proprietario della funzione
--   definizione   = pg_get_functiondef = BACKUP COMPLETO (M3)
--
-- Gate client già verificato localmente: unico chiamante
-- app/p/[id].tsx:88 passa session.user.id (sessione obbligatoria alla riga
-- 85) -> coincide con auth.uid() per costruzione (JWT sub).
--
-- ESITO: baseline + backup; con esso si scrive la migration M5.
-- ============================================================================
SELECT
  p.prosecdef                                            AS prosecdef,
  p.proconfig                                            AS proconfig,
  p.proacl                                               AS proacl,
  pg_get_function_identity_arguments(p.oid)              AS argomenti,
  pg_get_function_result(p.oid)                          AS ritorno,
  pg_get_userbyid(p.proowner)                            AS proprietario,
  pg_get_functiondef(p.oid)                              AS definizione
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname  = 'process_crowd_radar'
 ORDER BY argomenti;

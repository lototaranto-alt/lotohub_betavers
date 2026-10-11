-- ============================================================================
-- FASE 1 - M15 - 23 - PRECHECK - stato di is_loto_admin() (single point of
--                    failure della famiglia DaaS)
-- ============================================================================
-- Sola lettura. Un solo result set (una riga; atteso 1 overload).
--
-- Perche' esiste: le 5 viste DaaS hanno come UNICO guard `is_loto_admin()`.
-- Se cade lui (es. alterato, senza search_path, o con ritorno NULL per gli
-- admin), cadono tutte e 5 insieme. M15 passo 2 = "avere un piano per il
-- single point of fallimento": prima serve il suo stato attuale.
--
-- Cosa misura:
--   prosecdef      SECURITY DEFINER? (precheck 10 diceva true)
--   proconfig      search_path pinnato?
--   proacl         grant EXECUTE (NULL = PUBLIC di default)
--   definizione    pg_get_functiondef = corpo esatto (backup + lettura logica)
--   anon/auth_exec EXECUTE effettivo per ruolo
--
-- ESITO: stato del guard + materiale per il piano di contingenza.
-- ============================================================================
SELECT
  p.prosecdef                                        AS prosecdef,
  p.proconfig                                        AS proconfig,
  p.proacl                                           AS proacl,
  pg_get_function_identity_arguments(p.oid)          AS argomenti,
  pg_get_function_result(p.oid)                      AS ritorno,
  pg_get_userbyid(p.proowner)                        AS proprietario,
  has_function_privilege('anon',
     'public.is_loto_admin()', 'EXECUTE')            AS anon_exec,
  has_function_privilege('authenticated',
     'public.is_loto_admin()', 'EXECUTE')            AS auth_exec,
  pg_get_functiondef(p.oid)                          AS definizione
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname  = 'is_loto_admin';

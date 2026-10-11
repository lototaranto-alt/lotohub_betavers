-- ============================================================================
-- FASE 0 - MISURA 06 - FUNZIONE is_loto_admin()
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
-- Zero righe = la funzione non esiste (allora il guard delle viste non e'
-- quello che sembra, e va cercato il vero).
--
-- Perche' esiste: la misura 05b ha mostrato che vw_daas_heatmap_15min e'
-- leggibile da ogni `authenticated`, e l'unica barriera e'
-- `WHERE is_loto_admin()`. Tutta la famiglia DaaS probabilmente regge su
-- questa funzione. NON e' mai stata misurata.
--
-- Il rischio che va chiuso: se la funzione decide leggendo `profiles.admin_role`
-- dell'utente corrente, e `profiles` ha grant RWUD per anon+authenticated con
-- policy UPDATE, allora un utente che riesce a scrivere il proprio admin_role
-- e metterlo 'admin' salta il guard di tutte le viste.
--
-- Cosa misura:
--   prosecdef       SECURITY DEFINER -> decidono i permessi della funzione,
--                   non quelli di chi la chiama. Con `is_loto_admin` dentro
--                   una vista, e' la differenza fra "guard" e "decorazione".
--   proprietario    chi possiede la funzione (di solito postgres)
--   search_path     assente su una DEFINER = vettore da incapsulare
--   acl             se NULL, EXECUTE e' di default a PUBLIC (regola: il
--                   permissivo non si vede negli ACL, si vede nella mancanza)
--   anon_exec/auth_exec  la conferma esplicita di quel default
--   legge_admin_role     legge la colonna che controlla l'accesso
--   legge_profiles       da quale tabella
--   usa_auth_uid         se NON usa auth.uid(), non sta identificando chi
--                        chiama: e' un altro segnale
--   corpo            troncata a 1200, come da difesa dello script 04
--
-- SE `anon_exec` o `auth_exec` E' true E `prosecdef` E' true, la funzione e'
-- chiamabile da chiunque e decide coi diritti di chi la possiede: da leggere
-- subito il corpo.
-- ============================================================================

SELECT
  p.proname                                                   AS funzione,
  p.prosecdef                                                 AS security_definer,
  pg_get_userbyid(p.proowner)                                 AS proprietario,
  coalesce(array_to_string(p.proconfig, ', '), 'ASSENTE')     AS search_path,
  coalesce(p.proacl::text, 'NULL = EXECUTE di default a PUBLIC') AS acl,
  has_function_privilege('anon', 'public.is_loto_admin()', 'EXECUTE')       AS anon_exec,
  has_function_privilege('authenticated', 'public.is_loto_admin()', 'EXECUTE') AS auth_exec,
  p.prosrc LIKE '%admin_role%'                                AS legge_admin_role,
  p.prosrc LIKE '%profiles%'                                  AS legge_profiles,
  p.prosrc LIKE '%auth.uid%'                                  AS usa_auth_uid,
  p.prosrc ~* '\m(boolean|bool)\M'                            AS ritorna_boolean,
  length(p.prosrc)                                            AS lunghezza_corpo,
  length(p.prosrc) > 1200                                     AS troncata,
  left(p.prosrc, 1200)                                        AS corpo
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'is_loto_admin'
ORDER BY p.oid;

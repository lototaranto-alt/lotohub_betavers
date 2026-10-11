-- ============================================================================
-- FASE 0 - MISURA 07 - profiles: l'utente puo' scrivere il proprio admin_role?
-- ============================================================================
-- Sola lettura. Un solo result set, una riga per policy.
--
-- Perche' esiste: la misura 06 ha mostrato che is_loto_admin() decide cosi':
--     WHERE p.id = auth.uid() AND p.admin_role IN ('admin','analyst')
-- e lo fa da SECURITY DEFINER con proprietario postgres, quindi bypassando
-- l'RLS di profiles. L'unica barriera rimasta e' che l'utente non riesca a
-- scriverlo. Questo script chiude la domanda.
--
-- Si sa gia' da misure precedenti (non si ricalcola qui):
--   - profiles ha grant RWUD per anon e authenticated (1b, 3b)
--   - profiles ha DUE policy UPDATE duplicate (3c)
--   - zero trigger utente in public (M2)
--
-- Cosa manca, e che questo script misura:
--   qual / with_check     le condizioni. `qual` = cosa deve valere PRIMA.
--                         `with_check` = cosa deve valere DOPO l'update:
--                         e' li che una policy dovrebbe impedire di
--                         scrivere un admin_role illegittimo.
--   auth_update_admin_role il permesso di COLONNA: un grant a livello di
--                         tabella non basta, se la colonna e' revocata la
--                         policy non serve.
--   vincoli_check         un vincolo CHECK su admin_role potrebbe
--                         limitare i valori ammessi indipendentemente
--                         dalla policy.
--   default / not_null    meno decisivi, ma se la colonna ha default
--                         'viewer' e NOT NULL resta comunque scrivibile.
--
-- L'ESITO E' DUE BIT:
--   qual ammette la propria riga  E  colonna aggiornabile  ->  APERTO
--   uno dei due negativo                                 ->  CHIUSO
--
-- Comandi attesi in polcmd: r=SELECT, a=INSERT, w=UPDATE, d=DELETE, *=ALL.
-- Non si filtra su polcmd per non perdere una policy UPDATE scritta come ALL.
-- ============================================================================

SELECT
  pol.polname                                                        AS policy,
  pol.polcmd::text                                                   AS comando,
  array_to_string(pol.polroles::regrole[], ', ')                     AS ruoli,
  coalesce(pg_get_expr(pol.polqual, pol.polrelid), 'nessuna')         AS qual,
  coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), 'nessuna')    AS with_check,

  has_column_privilege('authenticated', 'public.profiles', 'admin_role', 'UPDATE')
                                                                     AS auth_update_admin_role,
  has_column_privilege('authenticated', 'public.profiles', 'admin_role', 'SELECT')
                                                                     AS auth_select_admin_role,
  has_column_privilege('anon', 'public.profiles', 'admin_role', 'UPDATE')
                                                                     AS anon_update_admin_role,

  coalesce((
    SELECT string_agg(pg_get_constraintdef(k.oid), ' | ')
      FROM pg_constraint k
     WHERE k.conrelid = c.oid
       AND k.contype  = 'c'
       AND pg_get_constraintdef(k.oid) LIKE '%admin_role%'
  ), 'nessuno')                                                      AS vincoli_check_admin_role,

  coalesce((
    SELECT pg_get_expr(d.adbin, d.adrelid)
      FROM pg_attrdef d
      JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
     WHERE d.adrelid = c.oid
       AND a.attname = 'admin_role'
  ), 'nessuno')                                                      AS default_admin_role,

  coalesce((
    SELECT a.attnotnull
      FROM pg_attribute a
     WHERE a.attrelid = c.oid
       AND a.attname = 'admin_role'
  ), false)                                                          AS admin_role_not_null

FROM pg_policy pol
JOIN pg_class c      ON c.oid  = pol.polrelid
JOIN pg_namespace n  ON n.oid  = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
ORDER BY pol.polcmd, pol.polname;

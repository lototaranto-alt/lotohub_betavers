-- ============================================================================
-- FASE 1 - M14 - 15 - SCRITTURA - chiusura vettore CB-16 (INSERT -> admin_role)
-- ============================================================================
-- SCRITTURA, APPROVATA dall'umano il 08/10 ("ottimo procediamo").
-- Un solo result set (alla fine): stato atteso dopo l'esecuzione.
--
-- Perche' (misure 13 + 14, esiti 08/10):
--   13: 2 policy INSERT duplicate ("Users can insert their own profile" e
--       la stessa con il punto), roles={public}, with_check = (auth.uid()=id)
--       -> il check VINCOLA SOLO l'id: una riga propria inserita con
--       admin_role = 'admin' lo supera -> 5 viste DaaS (classe 7k).
--   14: grant INSERT = true per anon E authenticated, anche sulla colonna
--       admin_role -> vettore percorribile (servono: grant, riga propria
--       assente - altrimenti 23505 sul PK).
--   Grep client 08/10: NESSUN .insert() su profiles (app, components,
--       context, utils, loto-admin-v2/src, supabase/functions): la riga la
--       crea solo il trigger handle_new_user / create_profile_for_new_user_fn,
--       entrambi SECURITY DEFINER (proprietario = chi ha fatto la migration,
--       postgres) -> un REVOKE sui ruoli client NON li tocca.
--
-- Cosa fa (ogni passo idempotente):
--   1. REVOKE INSERT sulla tabella da anon e authenticated ->
--        chiude ogni INSERT client, admin_role compreso; l'INSERT policy
--        diventa inerte (nessun grant) e resta documentata come regola
--        "riga propria" nel caso venisse riconcesso in futuro.
--   2. DROP della duplicata col punto (rumore: due policy identiche).
--
-- ATTENZIONE (da tenere a mente se un giorno si ri-concede INSERT):
--   un WITH CHECK su sola id non protegge le colonne -> riconcedendo
--   INSERT bisogna revocare almeno la colonna admin_role
--   (REVOKE INSERT (admin_role) ...).
--
-- ESITO atteso del result set:
--   anon_insert=false, auth_insert=false, auth_insert_adminrole=false,
--   n_policy_insert=1 (resta solo senza punto)
-- DOPO: l'agente verifica via REST con un INSERT anon su id a caso:
--   atteso errore "permission denied for table profiles" (prima era
--   "violates row-level security policy"); in ogni caso 0 righe create
--   perche' anon ha auth.uid() = NULL e il with_check non puo' passare.
-- ============================================================================

REVOKE INSERT ON public.profiles FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

SELECT
  has_table_privilege('anon', 'public.profiles', 'INSERT')          AS anon_insert,
  has_table_privilege('authenticated', 'public.profiles', 'INSERT') AS auth_insert,
  has_column_privilege('authenticated', 'public.profiles', 'admin_role', 'INSERT')
                                                                    AS auth_insert_adminrole,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND cmd = 'INSERT')                                           AS n_policy_insert;

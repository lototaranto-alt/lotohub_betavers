-- ============================================================================
-- FASE 1 - M14 - 14 - PRECHECK - privilegi INSERT su profiles (vettore
--                     admin_role via INSERT)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste (analisi del censimento policy 13, esito in
-- "Supabase Snippet Migration RLS and Policy Post-Check for profiles.csv"):
--   restano 2 policy INSERT duplicate ("Users can insert their own profile"
--   e "...profile." con il punto), roles = {public},
--   with_check = (auth.uid() = id).
--   Il with_check VINCOLA SOLO l'id: una riga propria inserita con
--   admin_role = 'admin' soddisfa il check -> escalatione verso le 5 viste
--   DaaS se (e solo se) il ruolo ha il PRIVILEGIO di INSERT e la riga
--   propria non esiste ancora (altrimenti 23505 sul PK).
--   M14 ha chiuso il vettore UPDATE (REVOKE + policy own-row), non quello
--   INSERT: qui si misura se e' percorribile.
--
-- Cosa misura:
--   anon_insert / auth_insert        has_table_privilege INSERT
--   auth_insert_adminrole            has_column_privilege INSERT su admin_role
--
-- Contesto grep client 08/10: nessun .insert() su profiles in tutto
--   l'app (solo select/update): la creazione della riga passa dal trigger
--   handle_new_user (SECURITY DEFINER, proprietario -> non toccato da un
--   REVOKE sui ruoli client).
-- ============================================================================
SELECT
  has_table_privilege('anon', 'public.profiles', 'INSERT')          AS anon_insert,
  has_table_privilege('authenticated', 'public.profiles', 'INSERT') AS auth_insert,
  has_column_privilege('authenticated', 'public.profiles', 'admin_role', 'INSERT')
                                                                    AS auth_insert_adminrole;

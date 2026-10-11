-- ============================================================================
-- FASE 1 - M14 - PRECHECK 10 - quali funzioni public sono SECURITY DEFINER
-- ============================================================================
-- Sola lettura. Un solo result set, una riga per funzione.
--
-- Perche' esiste: M14 restringe le policy SELECT/UPDATE di profiles alla
-- propria riga (auth.uid() = id). Le funzioni chiamate dal client
-- (recover_loto_pass, join_squad, get_user_itineraries, ...) non sono
-- nel Git (lacuna nota: il cloud non e' riproducibile dalle migration),
-- quindi non so se girano come DEFINER (bypassano l'RLS, nessun impatto)
-- o come INVOKER (usano i permessi dell'utente: se leggono il profilo di
-- UN ALTRO utente, con la policy ristretta si rompono).
--
-- Cosa misura:
--   tocca_profiles  true se il corpo della funzione contiene 'profiles'
--   security_definer true = SECURITY DEFINER (bypassa RLS dell'utente)
--
-- ESITO (gate M14):
--   tutte le funzioni con tocca_profiles = true hanno
--   security_definer = true  -> la policy ristretta e' sicura da applicare
--   almeno una INVOKER con tocca_profiles = true -> FERMARSI e rivedere
--   la policy di M14 prima di applicarla (dichiarare la funzione).
--
-- Ordinato: prima le funzioni toccano profiles, poi le INVOKER.
-- ============================================================================

SELECT
  p.proname                                                        AS funzione,
  pg_get_function_identity_arguments(p.oid)                        AS argomenti,
  (pg_get_functiondef(p.oid) LIKE '%profiles%')                    AS tocca_profiles,
  p.prosecdef                                                      AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY tocca_profiles DESC, security_definer ASC, p.proname;

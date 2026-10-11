-- ============================================================================
-- FASE 0 - MISURA 3b - GRANT SU TUTTE LE TABELLE PUBLIC
-- ============================================================================
-- Sola lettura. Un solo result set.
--
-- Perche' esiste: la misura 1b ha coperto 10 tabelle scelte a mano. La
-- misura 3 ha poi scoperto che ne esistono altre (pois, app_telemetry_events,
-- b2b_feedbacks, impact_transactions). Questa estende il censimento a TUTTE
-- le tabelle e viste di public, senza elenco.
--
-- Ordinamento per gravita' decrescente: se la coda venisse tagliata, si
-- perde il blocco delle tabelle bloccate, non quelle aperte.
--
-- Legenda:
--   rls = y  RLS attivo / n  non lo e'
--   anon  = privilegi della chiave pubblica
--   auth  = privilegi dell'utente loggato
--     R = SELECT   W = INSERT   U = UPDATE   D = DELETE   - = non concesso
--
-- Cosa deve far capire:
--   RLS=y e qualsiasi W  -> l'argine e' la policy, che va letta (03c)
--   RLS=n e qualsiasi W  -> nessun argine, scrittura pubblica reale
-- ============================================================================

SELECT
  c.relname AS t,
  CASE c.relkind WHEN 'r' THEN 'tbl'
                 WHEN 'v' THEN 'vista'
                 WHEN 'm' THEN 'matv'
                 ELSE c.relkind::text END AS tipo,
  CASE WHEN c.relrowsecurity THEN 'y' ELSE 'n' END AS rls,
  concat(
    CASE WHEN has_table_privilege('anon', c.oid, 'SELECT')          THEN 'R' ELSE '-' END,
    CASE WHEN has_table_privilege('anon', c.oid, 'INSERT')          THEN 'W' ELSE '-' END,
    CASE WHEN has_table_privilege('anon', c.oid, 'UPDATE')          THEN 'U' ELSE '-' END,
    CASE WHEN has_table_privilege('anon', c.oid, 'DELETE')          THEN 'D' ELSE '-' END
  ) AS anon,
  concat(
    CASE WHEN has_table_privilege('authenticated', c.oid, 'SELECT') THEN 'R' ELSE '-' END,
    CASE WHEN has_table_privilege('authenticated', c.oid, 'INSERT') THEN 'W' ELSE '-' END,
    CASE WHEN has_table_privilege('authenticated', c.oid, 'UPDATE') THEN 'U' ELSE '-' END,
    CASE WHEN has_table_privilege('authenticated', c.oid, 'DELETE') THEN 'D' ELSE '-' END
  ) AS auth
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'v', 'm')
  AND c.relname NOT LIKE 'pg\_%'
ORDER BY anon DESC, c.relname;

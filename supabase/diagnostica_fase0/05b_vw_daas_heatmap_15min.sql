-- ============================================================================
-- FASE 0 - MISURA 05b - VISTA vw_daas_heatmap_15min
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
-- Zero righe = la vista non esiste.
--
-- Perche' esiste: 03b ha mostrato che le 5 viste vw_daas_* hanno R---
-- per `authenticated`. master_business_brief.md:43 dice che il DaaS e'
-- riservato al personale autorizzato, ma quel documento e' ARCHIVIO demotuo
-- (vedi HANDOFF.md section 7): quindi non partiamo da quello.
-- Si parte da due fatti misurati:
--   1. queste viste sono leggibili da ogni `authenticated`, ossia da
--      qualunque utente anonimo dell'app che si autentica;
--   2. la domanda vera e' cosa contengono e da dove lo leggono.
--
-- Cosa c'e' da scoprire:
--   definizione         quali tabelle espone e se c'e' identificante
--   proprietario        con i suoi diritti gira la vista
--   rls_attivo          sulla vista (sulla tabella sottostante si vede
--                       dalla definizione)
--   reloptions          security_invoker=true -> le policy della tabella
--                       valgono anche per la vista (PG15+)
--   lunghezza/troncata  stessa difesa della 05a: il corpo non deve
--                       esplodere la finestra
--
-- Il confronto con la 05a serve a capire se le due famiglie di viste
-- sono costruite nello stesso modo o se quella DaaS e' piu' aperta.
-- ============================================================================

WITH v AS (
  SELECT
    c.relname,
    c.relrowsecurity,
    c.relforcerowsecurity,
    c.reloptions,
    pg_get_userbyid(c.relowner) AS proprietario,
    pg_get_viewdef(c.oid, true)  AS def
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'vw_daas_heatmap_15min'
)
SELECT
  relname                                                        AS vista,
  relrowsecurity                                                 AS rls_attivo,
  relforcerowsecurity                                            AS rls_forzato,
  array_to_string(reloptions, ', ')                              AS reloptions,
  proprietario,
  length(def)                                                    AS lunghezza_def,
  length(def) > 1200                                             AS troncata,
  left(def, 1200)                                                AS definizione,
  (def !~* '\m(group\s+by|join|limit|union|distinct|offset)\M'
   AND def !~* '\m(count|sum|avg|min|max|stddev|row_number|rank)\s*\(')
                                                                 AS aggiornabile_stima,
  has_table_privilege('anon', 'public.vw_daas_heatmap_15min', 'SELECT')       AS anon_sel,
  has_table_privilege('anon', 'public.vw_daas_heatmap_15min', 'UPDATE')       AS anon_upd,
  has_table_privilege('authenticated', 'public.vw_daas_heatmap_15min', 'SELECT') AS auth_sel,
  has_table_privilege('authenticated', 'public.vw_daas_heatmap_15min', 'UPDATE') AS auth_upd
FROM v;

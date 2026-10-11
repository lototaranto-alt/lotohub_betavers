-- ============================================================================
-- FASE 0 - MISURA 05a - VISTA vw_collective_impact
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
-- Zero righe = la vista non esiste.
--
-- Perche' esiste: 03b ha mostrato che questa vista ha RLS DISATTIVATO e
-- grant RWUD da anon, e la leggono community.tsx:99 e index.tsx:450.
-- Non basta sapere che esiste: serve cosa espone e se e' aggiornabile.
--
-- Il dubbio concreto: una vista semplice (una tabella, niente GROUP BY /
-- JOIN / LIMIT) e' AGGIORNABILE. Le scritture passano con i diritti del
-- PROPRIETARIO della vista e bypassano l'RLS della tabella sottostante.
-- Se anon ha UPDATE sulla vista e il proprietario e' un ruolo con diritti,
-- e' un bypass dell'RLS. Le colonne lo dicono:
--
--   rls_attivo/rls_forzato   RLS sulla vista stessa
--   proprietario             e' il suo diritto che viene usato in scrittura
--   reloptions               'security_invoker=true' (PG15+) = la vista
--                            rispetta le policy dell'utente; assente o false
--                            = la vista gira come il proprietario
--   aggiornabile_stima       false se la definizione contiene GROUP BY, JOIN,
--                            LIMIT, UNION, DISTINCT, OFFSET o aggregati
--   anon_upd/auth_upd        il grant visto in 03b, qui agganciato al dubbio
--   definizione              troncata a 1200 + flag `troncata`: se e' lunga
--                            non deve crashare la finestra (lezione dello
--                            script 04, che e' esploso per l'uscita lunga)
--
-- UNA NOTA DI METODO: se `troncata` esce true, la definizione va riletta a
-- fette con uno script dedicato. Non si deduce niente da mezzo corpo.
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
    AND c.relname = 'vw_collective_impact'
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
  has_table_privilege('anon', 'public.vw_collective_impact', 'SELECT') AS anon_sel,
  has_table_privilege('anon', 'public.vw_collective_impact', 'UPDATE') AS anon_upd,
  has_table_privilege('authenticated', 'public.vw_collective_impact', 'SELECT') AS auth_sel,
  has_table_privilege('authenticated', 'public.vw_collective_impact', 'UPDATE') AS auth_upd
FROM v;

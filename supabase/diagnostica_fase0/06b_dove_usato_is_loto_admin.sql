-- ============================================================================
-- FASE 0 - MISURA 06b - DOVE VIENE USATO is_loto_admin()
-- ============================================================================
-- Sola lettura. Un solo result set, una riga per oggetto.
--
-- Perche' esiste: la 05b ha mostrato il guard dentro vw_daas_heatmap_15min.
-- Ma la barriera conta quanto e' estesa: se e' l'unica che regge un solo
-- oggetto e' un problema locale, se regge tutta la famiglia DaaS e'
-- un singolo punto di fallimento. La misura 06 dice se il guard regge,
-- questa dice quanto ci deve reggere.
--
-- Cerca la stringa `is_loto_admin` in TUTTI i viewdef di `public`, non solo
-- nelle vw_daas_*: un guard puo' essere posizionato dove non ci si aspetta.
-- Il corpo e' troncato a 250 caratteri: qui interessa L'ELENCO, non la
-- definizione (che si legge con 05a/05b dove serve).
--
-- Zero righe = nessun oggetto usa la funzione: allora il guard di 05b e'
-- altrove o la funzione non esiste, e la 06 lo chiarisce.
-- ============================================================================

SELECT
  c.relname                                                       AS oggetto,
  c.relkind                                                       AS tipo,
  pg_get_userbyid(c.relowner)                                     AS proprietario,
  length(pg_get_viewdef(c.oid, true))                             AS lunghezza_def,
  left(pg_get_viewdef(c.oid, true), 250)                          AS inizio_definizione,
  c.relrowsecurity                                                AS rls_attivo
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND pg_get_viewdef(c.oid, true) LIKE '%is_loto_admin%'
ORDER BY c.relname;

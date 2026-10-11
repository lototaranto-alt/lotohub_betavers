-- ============================================================================
-- FASE 0 - MISURA 3c - SOLO LE POLICY APERTE
-- ============================================================================
-- Sola lettura. Un solo result set (vedi regola: uno script = un result set).
--
-- Perche' esiste: lo script 03 produceva due result set e l'uno veniva
-- perduto. Questo e' il result set mancante, riemesso da solo.
--
-- Cosa filtra: le policy che concedono accesso ampio.
--   - condizione di lettura che e' letteralmente vera  -> ogni riga visibile
--   - condizione di scrittura letteralmente vera       -> ogni riga scrivibile
--   - qualunque policy con cmd INSERT/UPDATE/DELETE/ALL
--
-- Se torna righe, sono argine. Se non torna righe, nessuna tabella public
-- ha policy aperta e l'intera sicurezza e' nel GRANT (misura 03b).
--
-- Legenda:
--   cmd  = SELECT / INSERT / UPDATE / DELETE / ALL
--   tipo = P permissive (si somma in OR) / R restrictive
--   qual = condizione di lettura, TRUE = visibile ovunque
--   chk  = condizione di scrittura, TRUE = scrivibile ovunque, '-' se assente
--   ruoli = 0 mostrato come PUBLIC
-- ============================================================================

SELECT
  rel.relname AS t,
  pol.polname AS policy,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE pol.polcmd::text
  END AS cmd,
  CASE WHEN pol.polpermissive THEN 'P' ELSE 'R' END AS tipo,
  (SELECT string_agg(CASE WHEN oid = 0 THEN 'PUBLIC'
                          ELSE pg_get_userbyid(oid) END, ',')
     FROM unnest(pol.polroles) AS r(oid)) AS ruoli,
  CASE
    WHEN coalesce(pg_get_expr(pol.polqual, pol.polrelid), 'null') = 'null' THEN '-'
    WHEN regexp_replace(pg_get_expr(pol.polqual, pol.polrelid), '[()]', '', 'g') = 'true'
      THEN 'TRUE'
    ELSE left(pg_get_expr(pol.polqual, pol.polrelid), 40)
  END AS qual,
  CASE
    WHEN pol.polwithcheck IS NULL THEN '-'
    WHEN regexp_replace(pg_get_expr(pol.polwithcheck, pol.polrelid), '[()]', '', 'g') = 'true'
      THEN 'TRUE'
    ELSE left(pg_get_expr(pol.polwithcheck, pol.polrelid), 40)
  END AS chk
FROM pg_policy pol
JOIN pg_class rel ON rel.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND (
        regexp_replace(pg_get_expr(pol.polqual, pol.polrelid), '[()]', '', 'g') = 'true'
     OR (pol.polwithcheck IS NOT NULL
         AND regexp_replace(pg_get_expr(pol.polwithcheck, pol.polrelid), '[()]', '', 'g') = 'true')
     OR pol.polcmd IN ('a', 'w', 'd', '*')
  )
ORDER BY pol.polcmd DESC, rel.relname, pol.polname;

-- ============================================================================
-- FASE 0 - MISURA 1b - GRANT PER RUOLO (VERSIONE COMPATTA)
-- ============================================================================
-- Sola lettura. Serve perche' la versione larga (01_grant_e_righe.sql) ha
-- un result set da 8 colonne che viene tagliato dall'impaginazione quando
-- lo incolli. Questa restituisce 4 colonne.
--
-- Legenda:
--   rls   = y  l'RLS e' attivo / n  non lo e'
--   anon  = privilegi della chiave pubblica
--   auth  = privilegi dell'utente loggato
--   Per ciascuno:
--     R = SELECT   (leggere)
--     W = INSERT   (scrivere)
--     U = UPDATE   (aggiornare)
--     D = DELETE   (cancellare)
--     - = privilegio non concesso
--
-- Cosa decide questa misura:
--   policy aperta + grant W = scrittura pubblica reale
--   policy aperta + nessun grant = la policy e' inerte, gravita' teorica
-- ============================================================================

SELECT
  c.relname AS t,
  CASE WHEN c.relrowsecurity THEN 'y' ELSE 'n' END AS rls,
  concat(
    CASE WHEN has_table_privilege('anon', c.oid, 'SELECT') THEN 'R' ELSE '-' END,
    CASE WHEN has_table_privilege('anon', c.oid, 'INSERT') THEN 'W' ELSE '-' END,
    CASE WHEN has_table_privilege('anon', c.oid, 'UPDATE') THEN 'U' ELSE '-' END,
    CASE WHEN has_table_privilege('anon', c.oid, 'DELETE') THEN 'D' ELSE '-' END
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
  AND c.relkind = 'r'
  AND c.relname IN (
    'profiles', 'civic_reports', 'scans', 'user_pois', 'user_badges',
    'media_vault', 'whispers', 'territories', 'tenants', 'loto_squads'
  )
ORDER BY anon DESC, c.relname;

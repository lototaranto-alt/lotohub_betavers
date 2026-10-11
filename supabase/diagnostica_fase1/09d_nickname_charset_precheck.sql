-- ============================================================================
-- FASE 1 - M14 - PRECHECK 09d - nickname che violerebbero il CHECK futuro
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste: P-D7 (08/10) impone una convalida definitiva del nick:
--   lunghezza 3-20, solo lettere (anche accentate), spazi e cifre,
--   niente caratteri speciali. La migration M14 aggiungera' un CHECK
--   con quella regex: un CHECK valida TUTTE le righe esistenti e fallisce
--   se anche solo una viola.
--
-- Cosa misura:
--   n_conformi          nickname NON nulli che passano gia' la regex
--   n_violazioni        nickname NON nulli che la falliscono
--   esempi_violazioni   fino a 20 esempi (nickname -> per capire cosa resta
--                       da rinominare prima del CHECK, regola METODO 7.1:
--                       si registrano le correzioni, non si cancella)
--
-- ESITO:
--   n_violazioni = 0  -> il CHECK entra nella migration M14
--   n_violazioni > 0  -> prima si decide il rename di quelle righe
--                        (script 09c-like), poi il CHECK
-- ============================================================================

SELECT
  count(*) FILTER (WHERE p.nickname ~ '^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$')
                                                        AS n_conformi,
  count(*) FILTER (WHERE NOT (p.nickname ~ '^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$'))
                                                        AS n_violazioni,
  coalesce(
    string_agg(DISTINCT p.nickname, ' | ' ORDER BY p.nickname)
      FILTER (WHERE NOT (p.nickname ~ '^[A-Za-z0-9 àèéìòùÀÈÉÌÒÙ]{3,20}$')),
    'nessuna'
  )                                                     AS esempi_violazioni
FROM public.profiles p
WHERE p.nickname IS NOT NULL;

-- ============================================================================
-- FASE 1 - M14 - PRECHECK 09 - nickname duplicati in profiles
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste: M14 aggiunge il vincolo UNIQUE su profiles.nickname.
-- Un vincolo UNIQUE fallisce (e blocca la migration) se esistono gia'
-- duplicati. Questo script va eseguito PRIMA della migration: se
-- gruppi_duplicati > 0, M14 si ferma e i duplicati vanno risolti a mano.
--
-- Cosa misura:
--   gruppi_duplicati  quante coppie/piu' righe condividono lo stesso nickname
--                     (case-sensitive, come fara' il vincolo UNIQUE)
--   nickname_coinvolti l'elenco (max 50) dei nickname duplicati
--
-- ESITO:
--   0  -> si applica M14
--   >0 -> NON si applica: elenco da risolvere prima
-- ============================================================================

SELECT
  count(*)                                                    AS gruppi_duplicati,
  coalesce(
    string_agg(d.nickname, ', ' ORDER BY d.nickname),
    'nessuno'
  )                                                           AS nickname_coinvolti
FROM (
  SELECT nickname
    FROM public.profiles
   WHERE nickname IS NOT NULL
   GROUP BY nickname
   HAVING count(*) > 1
) d;

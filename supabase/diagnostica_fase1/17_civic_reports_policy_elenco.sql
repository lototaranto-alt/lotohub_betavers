-- ============================================================================
-- FASE 1 - M4 - 17 - PRECHECK - censimento policy di civic_reports
--                    (funge anche da BACKUP M3 delle definizioni)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga per policy.
--
-- Perche' esiste: M4 fa DROP dinamico di TUTTE le policy SELECT/UPDATE/INSERT
-- di civic_reports (i nomi non sono nel Git). Prima del drop va censito e
-- conservato tutto: questo output E' il backup (M3, ora raccomandazione, con
-- rischio residuo documentato in PIANO: se una policy non e' qui, si perde).
--
-- Le policy attuali si dice "Civic access" / "Civic Reports Access"
-- (FIX_5_BUGS.sql:33, ma e' un file d'archivio: il nome reale lo da' questa
-- query).
--
-- ESITO: incollare l'output; con 16 diventa il baseline di M4.
-- ============================================================================
SELECT policyname,
       cmd,
       roles,
       qual,
       with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'civic_reports'
 ORDER BY cmd, policyname;

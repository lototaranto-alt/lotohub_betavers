-- ============================================================================
-- FASE 1 - M14 - 13 - POST-APPLY - censimento delle policy di profiles
-- ============================================================================
-- Sola lettura. Un solo result set, una riga per policy.
--
-- Perche' esiste: il post-check 12 ha dato n_policy = 4, non 2 come atteso
-- (le 2 create da M14 + 2 preesistenti che il DROP dinamico NON ha toccato:
-- il DROP di M14 colpisce solo cmd SELECT/UPDATE/ALL, quindi le restanti
-- devono essere INSERT o DELETE). Correzione registrata: aspettativa 2,
-- misurato 4.
--
-- Cosa misura: nome, comando, ruoli, qual e with_check di OGNI policy
-- su profiles. Serve per capire:
--   - chi puo' INSERT (se anon/authenticated con qual debole -> da vedere)
--   - chi puo' DELETE (se puo' cancellare righe altrui -> rischio)
--   - se le 2 extra sono innocue (OWNER/service role) -> M14 resta pulita
--
-- ESITO: da leggere e registrare. Se una policy INSERT/DELETE ammette
-- righe NON proprie, deciderla (tenere con qual riga propria / droppare).
-- ============================================================================
SELECT policyname,
       cmd,
       roles,
       qual,
       with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'profiles'
 ORDER BY cmd, policyname;

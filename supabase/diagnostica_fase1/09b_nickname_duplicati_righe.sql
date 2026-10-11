-- ============================================================================
-- FASE 1 - M14 - PRECHECK 09b - quali righe hanno il nickname duplicato
-- ============================================================================
-- Sola lettura. Un solo result set, una riga per profilo coinvolto.
--
-- Perche' esiste: il precheck 09 ha trovato 1 gruppo duplicato ("Save Ks").
-- Prima di scrivere la correzione (rename della/e riga/e secondaria/e) serve
-- vedere le righe: chi e' nato prima, quali id, se sono account diversi.
--
-- Regola di correzione (METODO 7.1): non si cancellano righe. Si tiene il
-- nickname alla riga piu' vecchia e le altre vengono rinominate con suffisso
-- derivato dall'id (deciso dopo aver visto l'output).
--
-- ESITO: righe elencate = si propone il rename. 0 righe = il gruppo e'
-- sparito tra un check e l'altro (rifare 09).
-- ============================================================================

SELECT
  p.id,
  p.nickname,
  p.created_at,
  (p.id = auth.uid())                                      AS e_mia_riga,
  row_number() OVER (ORDER BY p.created_at ASC, p.id ASC)   AS ordine_antichita
FROM public.profiles p
WHERE p.nickname IN (
  SELECT nickname
    FROM public.profiles
   WHERE nickname IS NOT NULL
   GROUP BY nickname
  HAVING count(*) > 1
)
ORDER BY p.nickname, p.created_at, p.id;

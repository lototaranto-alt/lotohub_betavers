-- ============================================================================
-- FASE 1 - M14 - 09e - CORREZIONE - violazione charset del nickname (P-D7)
-- ============================================================================
-- SCRITTURA (una sola), APPROVATA dall'umano il 08/10 ("semaforo verde").
-- Un solo result set con RETURNING: id, nickname vecchio, nickname nuovo.
--
-- Contesto (precheck 09d, eseguito via REST il 08/10 su 50 righe):
--   1 violazione del futuro CHECK profiles_nickname_check
--     3a11bab3-6220-4e3c-bfb0-93390c1b04e2  'Fragolina <emoji U+1F353>'
--     (emoji = 4 byte UTF-8, non ammessa dal charset P-D7)
--   Tutti gli altri 4 nickname conformi; 45 righe con nickname NULL
--   (il CHECK non le tocca: NULL non viola).
--
-- Correzione proposta: si rimuove SOLO l'emoji, si tiene il nome base
--   'Fragolina ' -> 'Fragolina'   (verificato libero l'08/10)
--
-- Guardie (tutte devono valere, altrimenti 0 righe e nessun danno):
--   1. la riga ha ancora esattamente il nickname con l'emoji
--      (emoji costruita con chr(127827) = U+1F353, niente byte speciali
--       nel file: il pattern viene verificato anche via codice punto)
--   2. nessun'altra riga si chiama gia' 'Fragolina'
-- Idempotente: rieseguita dopo il primo successo -> 0 righe.
--
-- DOPO: rilanciare 09d (deve dare n_violazioni = 0).
-- ============================================================================

UPDATE public.profiles
   SET nickname = 'Fragolina'
 WHERE id = '3a11bab3-6220-4e3c-bfb0-93390c1b04e2'
   AND nickname = 'Fragolina ' || chr(127827)
   AND NOT EXISTS (
         SELECT 1 FROM public.profiles alt
          WHERE alt.nickname = 'Fragolina'
            AND alt.id <> public.profiles.id
       )
RETURNING id, nickname;

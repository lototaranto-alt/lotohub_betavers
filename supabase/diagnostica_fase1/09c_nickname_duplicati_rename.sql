-- ============================================================================
-- FASE 1 - M14 - 09c - CORREZIONE - rename del doppione "Save Ks"
-- ============================================================================
-- SCRITTURA (una sola, approvata dall'umano il 08/10). Un solo result set
-- con RETURNING: id, nickname vecchio, nickname nuovo.
--
-- Contesto (09b): due righe con "Save Ks"
--   ordine 1  166b7412-...  2026-08-26  -> TENEWE il nickname
--   ordine 2  4181f0ac-...  2026-09-09  -> RINOMINATA in "Save Ks 4181f0"
--
-- Guardie (tutte devono valere, altrimenti 0 righe e nessun danno):
--   1. la riga target ha ancora esattamente il nickname "Save Ks"
--   2. esiste ancora ALMENO UN'ALTRA riga con lo stesso nickname
--   3. esiste una riga con lo stesso nickname PIU VECCHIA della target
-- Idempotente: rieseguita dopo il primo successo -> 0 righe.
--
-- Nessuna cancellazione di riga: solo il suffisso derivato dall'id (6 char).
--
-- DOPO: rilanciare 09 (deve dare gruppi_duplicati = 0).
--
-- NOTA 08/10: tentata l'equivalente via REST API (stesse guardie) ->
--   0 righe aggiornate: la RLS blocca l'UPDATE dell'anon. Resta da eseguire
--   QUI nel pannello SQL con l'utente autenticato.
-- ============================================================================

UPDATE public.profiles
   SET nickname = nickname || ' ' || left(id::text, 6)
 WHERE id = '4181f0ac-0ad3-4f76-8efe-03509b38a21b'
   AND nickname = 'Save Ks'
   AND EXISTS (
         SELECT 1 FROM public.profiles alt
          WHERE alt.nickname = 'Save Ks'
            AND alt.id <> public.profiles.id
      )
   AND EXISTS (
         SELECT 1 FROM public.profiles older
          WHERE older.nickname = 'Save Ks'
            AND older.id <> public.profiles.id
            AND (older.created_at, older.id) < (public.profiles.created_at, public.profiles.id)
      )
RETURNING id, nickname;

-- V6 - IL MOLTIPLICATORE E' DAVVERO MORTO
-- Da eseguire TUTTO insieme, in un colpo solo, nel SQL Editor.
-- NON eseguire le tre righe separatamente: il terzo parametro di set_config
-- e' is_local = true, quindi vale solo per la transazione corrente. Eseguendo
-- la chiamata in un'altra esecuzione, auth.uid() torna a essere NULL e la
-- funzione solleva 'nessuna identita'' in sessione'.
--
-- Nota sul ROLLBACK in fondo: la funzione scrive davvero una riga nel ledger e
-- modifica i saldi del profilo scelto. impact_transactions e' append-only per
-- progetto, quindi una riga di prova non si cancella "pulito". Con ROLLBACK
-- vedi comunque i valori ma non resta nulla. Metti COMMIT solo se vuoi tenere
-- la prova.

BEGIN;

-- 1. Sessione con un utente reale del DB, cosi' auth.uid() non e' NULL.
SELECT set_config('request.jwt.claim.sub',
                  (SELECT id::text FROM public.profiles LIMIT 1), true);

-- 2. Chiamata con party_size spinto a 999999.
SELECT public.process_esg_impact(
    1.0,        -- p_co2
    1,          -- p_liters
    1,          -- p_tokens
    1,          -- p_xp
    false,      -- p_takeaway
    999999,     -- p_party_size  <-- moltiplicatore spinto
    'test_hash' -- p_hash
);

-- 3. Lettura dell'ultima riga del ledger.
SELECT co2_saved, liters_saved, tokens_earned, xp_earned,
       party_size_reported, created_at
  FROM public.impact_transactions
 ORDER BY created_at DESC
 LIMIT 1;

ROLLBACK;  -- <- togli o metti COMMIT


-- ============================================================================
-- LETTURA DEL RISULTATO
-- ============================================================================
-- La riga finale deve mostrare:
--
--   co2_saved          = 1.0     <- NON 1000000. Il tetto ha funzionato.
--   liters_saved       = 1       <- NON 999999.
--   tokens_earned      = 1
--   xp_earned          = 1
--   party_size_reported = 999999 <- quello che il client AVEVA chiesto.
--
-- Il contrasto fra 999999 e 1.0 nella stessa riga e' il risultato corretto:
-- mostra in una riga sola cosa il client pretendeva e cosa ha ottenuto.
-- Se co2_saved tornasse 1000000, la neutralizzazione NON starebbe funzionando
-- e va fermata subito.
--
-- ---------------------------------------------------------------------------
-- SE COMPARE UN ERRORE
-- ---------------------------------------------------------------------------
-- 'nessuna identita'' in sessione'
--   set_config non e' arrivato alla stessa transazione della chiamata. Esegui
--   tutto il blocco in un'unica esecuzione, non rigolla per rigolla.
--
-- 'profiles' vuota o id::text NULL
--   non c'e' nessun profilo nel DB. Sostituisci con un id reale:
--   SELECT set_config('request.jwt.claim.sub',
--                     'UUID-VERO', true);
--
-- 'null value in column "party_size_reported"'
--  BUG CORRETTO il 30/09: la colonna e' NOT NULL e la funzione inseriva
--   p_party_size grezzo. Se persiste, stai eseguendo una versione vecchia
--   della migration: riapplicala.
--
-- 'function process_esg_impact(...) does not exist'
--   La migration 20260930180000 non e' stata applicata. Applicala prima.

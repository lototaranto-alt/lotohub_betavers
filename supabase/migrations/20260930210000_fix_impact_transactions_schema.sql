-- =============================================================================
-- 20260930210000 - Correttivo: allinea process_esg_impact allo schema REALE
-- =============================================================================
-- PERCHE' ESISTE UN FILE SEPARATO E NON ABBIAMO MODIFICATO QUELLO PRECEDENTE.
-- La 20260930180000 e' GIA' APPLICATA nel cloud: la funzione esiste e fallisce
-- dentro l'INSERT. Supabase non riesegue una migration gia' registrata, quindi
-- correggere il file vecchio non avrebbe cambiato nulla. Questo file e' il
-- delta. La 20260930180000 e' stata comunque corretta in parallelo, cosi' un
-- ambiente che parte da zero nasce gia' con lo schema giusto.
--
-- IL SINTOMO.
--   ERROR 42703: column "receipt_hash" of relation "impact_transactions"
--   does not exist
--   CONTEXT: PL/pgSQL function process_esg_impact(...) line 37
--
-- LA CAUSA.
--   La tabella impact_transactions ESISTE gia' nel cloud, creata fuori dal
--   repository, e il suo schema non e' quello che il repo si aspettava. Il
--   CREATE TABLE IF NOT EXISTS della 30180000 ha quindi fatto nothing: la
--   tabella c'era, l'ha saltata, e la funzione ha cominciato a scrivere
--   dentro uno schema che non conosceva.
--
--   Cinque differenze misurate il 30/09 fra il repo e il cloud:
--     1. la colonna dell'hash si chiama 'hash', non 'receipt_hash'
--     2. co2_saved e liters_saved sono DOUBLE PRECISION, non NUMERIC/INTEGER
--     3. profile_id e' NULLABLE e senza REFERENCES profiles(id)
--     4. id e' UUID, non BIGSERIAL
--     5. ci sono tre colonne in piu': tenant_id, action_type, poi_id
--
-- PERCHE' IL CLOUD HA LA RAGIONE E IL REPO NO.
--   Il cloud e' l'unica copia reale del database. Il repo ne aveva una
--   versione plausibile ma non verificata, e si e' rivelata diversa. La
--   correzione va dal repo verso il cloud, non il contrario. Per questo qui
--   si allineano le colonne, non si forza il cloud a prendere la forma del repo.
--
-- COSA NON E' RISOLTO, e va detto perche' il file esiste:
--   gli importi p_co2, p_liters, p_tokens e p_xp arrivano ancora dal client e
--   non hanno tetto. Con questa funzione eseguibile da `authenticated`, un
--   client modificato puo' chiamarla da solo, senza check-in, e accreditarsi
--   la cifra che vuole. Neutralizzare party_size chiude l'amplificatore, non
--   la forgia. La soluzione e' rendere questa funzione interna (REVOKE EXECUTE
--   da authenticated) e lasciare che scan_poi_gps, che calcola gli importi sul
--   server, sia l'unico ingresso pubblico. Finche' il GRANT a authenticated
--   resta, non e' chiuso.
--
--   Inoltre questa funzione continua a non scrivere tenant_id, action_type e
--   poi_id, che nel cloud esistono. Restano NULL. Se un report raggruppa per
--   action_type, questi check-in non compaiono da nessuna parte.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Convergenza delle colonne. ADD COLUMN IF NOT EXISTS, non DROP.
--    Nessuna perdita: il registro storico non si tocca.
-- -----------------------------------------------------------------------------
ALTER TABLE public.impact_transactions ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE public.impact_transactions ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.impact_transactions ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.impact_transactions ADD COLUMN IF NOT EXISTS is_takeaway BOOLEAN;
ALTER TABLE public.impact_transactions ADD COLUMN IF NOT EXISTS poi_id UUID;
ALTER TABLE public.impact_transactions ADD COLUMN IF NOT EXISTS party_size_reported INTEGER;

-- -----------------------------------------------------------------------------
-- 2. La funzione, riscritta sullo schema reale.
--    Le tre differenze che contano per l'INSERT:
--      - hash al posto di receipt_hash
--      - id esplicito, perche' non si sa se la colonna abbia un DEFAULT
--      - niente REFERENCES su profile_id: nel cloud la colonna e' nullable
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_esg_impact(
  p_co2        NUMERIC  DEFAULT 0,
  p_liters     INTEGER  DEFAULT 0,
  p_tokens     INTEGER  DEFAULT 0,
  p_xp         INTEGER  DEFAULT 0,
  p_takeaway   BOOLEAN  DEFAULT false,
  p_party_size INTEGER  DEFAULT 1,
  p_hash       TEXT     DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_co2    NUMERIC;
  v_liters INTEGER;
  v_tokens INTEGER;
  v_xp     INTEGER;
  v_size   INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'process_esg_impact: nessuna identita'' in sessione'
      USING ERRCODE = '42501';
  END IF;

  -- LEAST(GREATEST(x, 1), 1) restituisce 1 per qualunque x: il coefficiente
  -- e' morto per costruzione, non per convenzione.
  v_size   := LEAST(GREATEST(COALESCE(p_party_size, 1), 1), 1);

  v_co2    := COALESCE(p_co2, 0)    * v_size;
  v_liters := COALESCE(p_liters, 0) * v_size;
  v_tokens := GREATEST(COALESCE(p_tokens, 0), 0);
  v_xp     := GREATEST(COALESCE(p_xp, 0), 0);

  IF v_co2 = 0 AND v_liters = 0 AND v_tokens = 0 AND v_xp = 0 THEN
    RETURN json_build_object('success', true, 'xp_earned', 0, 'skipped', true);
  END IF;

  UPDATE public.profiles
     SET total_co2         = COALESCE(total_co2, 0)         + v_co2,
         total_liters_water = COALESCE(total_liters_water, 0) + v_liters,
         total_tokens       = COALESCE(total_tokens, 0)       + v_tokens,
         total_xp           = COALESCE(total_xp, 0)           + v_xp
   WHERE id = v_user;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'profilo_inesistente');
  END IF;

  INSERT INTO public.impact_transactions
    (id, profile_id, hash, co2_saved, liters_saved, tokens_earned, xp_earned,
     is_takeaway, party_size_reported)
  VALUES
    (gen_random_uuid(), v_user, p_hash, v_co2, v_liters, v_tokens, v_xp,
     COALESCE(p_takeaway, false), COALESCE(p_party_size, 1));

  RETURN json_build_object(
    'success',    true,
    'xp_earned',  v_xp,
    'co2_saved',  v_co2,
    'tokens',     v_tokens
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_esg_impact
  (NUMERIC, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_esg_impact
  (NUMERIC, INTEGER, INTEGER, INTEGER, BOOLEAN, INTEGER, TEXT) TO authenticated;

COMMIT;


-- =============================================================================
-- VERIFICA  (leggere l'output, non desumere dal fatto che la migration e' passata)
-- =============================================================================
-- C1: le colonne che la funzione scrive esistono tutte
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='impact_transactions'
   AND column_name IN ('id','profile_id','hash','receipt_hash','co2_saved',
                       'liters_saved','tokens_earned','xp_earned','is_takeaway',
                       'party_size_reported','tenant_id','action_type','poi_id')
 ORDER BY column_name;
-- atteso: 'hash' presente. Se compare ANCHE 'receipt_hash', la tabella ha una
--         colonna morbida: non e' un errore, ma segnala che il repo e' stato
--         creato da un percorso diverso. Annotarlo.

-- C2: una sola firma della funzione
SELECT pg_get_function_identity_arguments(p.oid) AS firma
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='process_esg_impact';
-- atteso: UNA riga sola, senza p_user_id. Due righe = resta la versione
--         d'archivio, da rimuovere a mano con DROP FUNCTION.

-- C3: il caso vero, cioe' la chiamata reale
BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM public.profiles LIMIT 1), true);
SELECT public.process_esg_impact(1.0, 1, 1, 1, false, 999999, 'test_hash');
SELECT co2_saved, liters_saved, tokens_earned, xp_earned, party_size_reported
  FROM public.impact_transactions ORDER BY created_at DESC LIMIT 1;
ROLLBACK;
-- atteso co2_saved = 1.0, NON 1000000. party_size_reported = 999999.
-- Quel contrasto nella stessa riga e' la prova che il tetto ha funzionato.
-- ROLLBACK perche' la funzione scrive sul ledger e tocca i saldi: si vede il
-- risultato senza lasciare la riga.

-- ---------------------------------------------------------------------------
-- SE COMPARE UN ERRORE
-- ---------------------------------------------------------------------------
-- 'column X does not exist'
--   C1 ti dice quale. Se e' una delle sei che questo file aggiunge, il
--   ALTER TABLE non e' passato: riapplica il file.
--
-- 'permission denied for table impact_transactions'
--   RLS attiva e manca il bypass. La funzione e' SECURITY DEFINER, quindi
--   dovrebbe ereditare i diritti del proprietario: controlla che sia stata
--   creata da un ruolo con INSERT, non da uno senza.
--
-- 'null value in column "id" violates not-null constraint'
--   La colonna UUID non aveva DEFAULT e gen_random_uuid() non e' disponibile.
--   Serve pgcrypto: CREATE EXTENSION IF NOT EXISTS pgcrypto; poi riapplica.
--
-- La funzione va a buon fine ma i check-in dal client continuano a fallire:
--   non e' piu' questa migration. Il client chiama ancora la firma vecchia con
--   p_user_id. Vedi docs_v2/tooling/autorita.json, dominio 'process-esg-impact'.
-- =============================================================================

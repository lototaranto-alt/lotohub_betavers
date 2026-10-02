-- =============================================================================
-- 20261002110000 - Corregge profiles.total_liters_water, che non esiste
-- =============================================================================
-- PERCHE' ESISTE, E PERCHE' UN FILE SEPARATO.
--   Il 02/10 la 20260930210000 e' stata applicata. La funzione e' stata creata,
--   ma C3 e' fallito cosi':
--     ERROR 42703: column "total_liters_water" does not exist
--     CONTEXT: PL/pgSQL function process_esg_impact(...) line 28
--   La 30210000 e' gia' applicata e non si riapre: il delta e' questo file.
--   Stessa regola che ha fatto nascere la 30210000 invece di correggere la
--   30180000.
--
-- LA CAUSA, E LA DIFFERENZA DA receipt_hash.
--   Qui non e' un nome sbagliato inventato dal repo. La colonna
--   total_liters_water NON ESISTE perche' la feature dei litri e' stata
--   ACCANTONATA: implicava la borraccia, frizionava sulla gestione e sulla
--   certificazione dell'azione reale. Non e' drift, e' una decisione di
--   prodotto. La differenza rispetto a receipt_hash e' che li' il repo
--   sbagliava sul nome del campo; qui inseguiva una feature che non e' piu'
--   vera. Per questo la correzione NON e' un ALTER TABLE ADD COLUMN: aggiungere
--   la colonna per far contenta la funzione significherebbe riesumare dal
--   cassetto la feature che e' stata accantonata, e farlo di nascosto.
--
-- I DUE STRATI, CHE NON VANNO CONFUSI.
--   profiles.total_liters_water      -> contatore di gamificazione sul profilo.
--                                       ACCANTONATO. Non viene ricreato.
--   impact_transactions.liters_saved -> registro del ledger, e gia' previsto:
--                                       scan_poi_gps lo scrive a zero alla
--                                       riga 267 di 20260929160000. E' il posto
--                                       dove i dati ESG stanno per regola 7, e
--                                       resta.
--   Quindi: via la riga dal profilo, si tiene p_liters nella firma e si continua
--   a registrare sul ledger. Il ledger non promette niente al giocatore, il
--   profilo s'e' accantonato: due strati, due posti, due scelte.
--
-- IL GUARD DEI BLOCCHI 1 E 3, E PERCHE' SONO IN QUESTO ORDINE.
--   Questa funzione scrive quattro colonne su profiles. Una era sbagliata e non
--   l'abbiamo vista, perche' plpgsql non valida i nomi di colonna quando crea
--   la funzione: li valida quando la esegue. Il risultato e' stato un CREATE
--   OR REPLACE che passa, e un check-in che muore a mezzanotte.
--
--   Il guard e' in due tempi perche' non si puo' fare altrimenti:
--     blocco 1  controlla il catalogo, prima di creare. Fallisce subito, con un
--               messaggio che nomina la colonna mancante.
--     blocco 3  esegue il corpo appena creato, dentro un SAVEPOINT, e lascia
--               che un errore faccia abortire TUTTA la transazione, CREATE
--               compresa. Plpgsql risolve i riferimenti a colonna alla prima
--               esecuzione dello statement, quindi la prova e' reale: non e' un
--               test parallelo che puo' divergere dal corpo, e' lo statement
--               che girera' davvero. Non serve che la riga di profilo esista:
--               la clausola WHERE viene valutata DOP aver risolto le colonne.
--
--   Non basta il blocco 1: puo' passare e il body sbagliare.
--   Non basta il blocco 3: fallirebbe con 42703, che e' esattamente il
--   messaggio che non dice quale dei due file lo abbia causato.
--
-- SE COMPARE UN ERRORE
--   'guard: profiles non ha la colonna X'
--     Il cloud ha un altro schema di profiles. Non correggere a tentativi:
--     esegui docs_v2/verifica-colonne-profiles.sql e rimetti il nome reale
--     nella riga marcata sotto.
--   'guard: il corpo usa ancora la colonna X, riga N, di relation profiles'
--     Qualcuno ha rimesso la riga nel corpo. Il guard ha fatto il suo lavoro:
--     la transazione e' andata indietro e non e' rimasto niente.
--   'function process_esg_impact already exists with a different return type'
--     La 30180000 l'aveva creata con un altro tipo di ritorno. Serve
--     DROP FUNCTION public.process_esg_impact(<firma vecchia>); prima di questo
--     file. C2 della 30210000 dice quale.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. GUARD DI CATALOGO. Non crea niente, controlla e basta.
--    total_liters_water e' escluso di proposito: non deve esistere, ed e'
--    esattamente la colonna che questa migration toglie dal corpo.
-- -----------------------------------------------------------------------------
DO $guard_catalogo$
DECLARE
    v_mancante TEXT;
BEGIN
    SELECT string_agg(t.nome, ', ')
      INTO v_mancante
      FROM unnest(ARRAY['total_co2', 'total_tokens', 'total_xp']) AS t(nome)
     WHERE NOT EXISTS (
        SELECT 1
          FROM information_schema.columns c
         WHERE c.table_schema = 'public'
           AND c.table_name   = 'profiles'
           AND c.column_name  = t.nome
     );

    IF v_mancante IS NOT NULL THEN
        RAISE EXCEPTION 'guard: profiles non ha la colonna %', v_mancante
            USING HINT = 'Non correggere a tentativi: esegui docs_v2/verifica-colonne-profiles.sql (P1) e rimetti il nome reale nel corpo qui sotto.';
    END IF;
END;
$guard_catalogo$;


-- -----------------------------------------------------------------------------
-- 2. IL CORPO CORRETTO. Unica differenza rispetto alla 30210000: via la riga
--    total_liters_water dal SET del profilo. Nessun ADD COLUMN.
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

  -- 02/10: via la riga total_liters_water. La colonna non esiste nel cloud e non
  -- viene ricreata: la feature dei litri e' accantonata per decisione di
  -- prodotto. p_liters resta nella firma e resta sul ledger, che e' un altro
  -- strato: registrare un dato metodologico non e' ricompensare un giocatore.
  UPDATE public.profiles
     SET total_co2   = COALESCE(total_co2, 0)   + v_co2,
         total_tokens = COALESCE(total_tokens, 0) + v_tokens,
         total_xp     = COALESCE(total_xp, 0)     + v_xp
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


-- -----------------------------------------------------------------------------
-- 3. GUARD DI ESECUZIONE. Esegue il corpo appena creato CONTRO UN PROFILO REALE,
--    dentro un SAVEPOINT che annulla Whatever scrive.
--
--    Il primo tentativo di questo guard usava un UUID inesistente, ed era
--    SBAGLIATO per un motivo che vale la pena scrivere: con un id che non
--    esiste, l'UPDATE non trova la riga, la funzione fa NOT FOUND e ritorna
--    prima dell'INSERT. Le colonne di impact_transactions non venivano mai
--    risolte, quindi il guard validava solo meta' del corpo e lasciava passare
--    un riferimento rotto. Verificato: togliendo liters_saved dal ledger, il
--    guard passava e l'errore emergeva solo dopo il COMMIT, in C3.
--
--    Con un profilo davvero esistente l'UPDATE trova la riga e l'INSERT sul
--    ledger viene eseguito: tutti i riferimenti del corpo vengono risolti.
--    Le scritture che la prova produce vengono annullate da ROLLBACK TO
--    SAVEPOINT, che riporta indietro solo quello che e' successo dopo il
--    savepoint e lascia intatta la CREATE OR REPLACE, che e' avvenuta prima.
--
--    Qui NON c'e' un gestore di eccezioni, ed e' deliberato: se il corpo non
--    gira contro lo schema reale, non si installa. Un errore qualunque
--    annulla la transazione e la funzione rotta non resta mai installata.
--    Con la firma sbagliata l'errore sarebbe comparso a notte, su un check-in.
--
--    Se il database non ha profili non c'e' niente da provare: si avvisa e si
--    prosegue, perche' la CREATE OR REPLACE e' comunque stata validata dal
--    parser. E' l'unico caso in cui il guard cede, ed e' dichiarato.
-- -----------------------------------------------------------------------------
SAVEPOINT esecuzione_prova;
DO $guard_corpo$
DECLARE
    v_profilo UUID;
BEGIN
    SELECT id INTO v_profilo FROM public.profiles ORDER BY id LIMIT 1;

    IF v_profilo IS NULL THEN
        RAISE WARNING 'guard: nessun profilo nel database, la prova di esecuzione e'' saltata';
        RETURN;
    END IF;

    PERFORM set_config('request.jwt.claim.sub', v_profilo::text, true);

    -- Profilo reale: l'UPDATE trova la riga e l'INSERT viene eseguito davvero.
    -- Tutto quello che questa chiamata scrive viene annullato dal
    -- ROLLBACK TO SAVEPOINT che segue.
    PERFORM public.process_esg_impact(1.0, 1, 1, 1, false, 999999, 'guard_hash');
END;
$guard_corpo$;
ROLLBACK TO SAVEPOINT esecuzione_prova;
RELEASE SAVEPOINT esecuzione_prova;

COMMIT;


-- =============================================================================
-- VERIFICA  (leggere l'output, non desumere dal fatto che la migration e' passata)
-- =============================================================================

-- V1: le colonne del profilo. total_liters_water NON deve comparire, e stavolta
--     e' atteso che non compaia: e' la prova che la feature resta accantonata
--     anche nello schema, non solo nel corpo della funzione.
SELECT 'V1' AS verifica, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profiles'
   AND column_name IN ('total_co2','total_tokens','total_xp',
                       'total_liters','total_liters_water')
 ORDER BY column_name;
-- atteso: total_co2, total_tokens, total_xp. Nessuna colonna litri.
--         Se total_liters compare, esiste gia' nel cloud e va deciso a parte:
--         non e' un errore di questa migration.

-- V2: il caso vero, la stessa chiamata di C3. Stavolta deve andare.
BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM public.profiles LIMIT 1), true);
SELECT public.process_esg_impact(1.0, 1, 1, 1, false, 999999, 'test_hash');
SELECT co2_saved, liters_saved, tokens_earned, xp_earned, party_size_reported
  FROM public.impact_transactions ORDER BY created_at DESC LIMIT 1;
ROLLBACK;
-- atteso co2_saved = 1.0 e party_size_reported = 999999 nella stessa riga.
--     liters_saved = 1 NON e' un bug e non e' un casino: sul ledger il dato si
--     registra, sul profilo il contatore non esiste piu'. Sono due strati.

-- V3: il corpo non contiene piu' la colonna eliminata. Se una revisione
--     futura la reintrodusse, questa lo dice subito e non al primo check-in.
--     I commenti -- vengono tolti prima della ricerca: il corpo documenta
--     PERCHE' la colonna e' stata eliminata, e senza questo passaggio la
--     verifica troverebbe la parola nella spiegazione e urlerebbe di nuovo.
SELECT 'V3' AS verifica,
       position('total_liters_water' in regexp_replace(p.prosrc, '--.*$', '', 'g')) > 0
         AS body_usa_ancora_liters_water
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public' AND p.proname='process_esg_impact';
-- atteso: false.

-- =============================================================================
-- FINE - la 20261002120000 va applicata DOPO questa: revoca l'EXECUTE a
-- authenticated e rende la funzione interna. Insieme, chiudono il buco.
-- =============================================================================
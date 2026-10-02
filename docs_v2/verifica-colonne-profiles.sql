-- =============================================================================
-- P1-P5 - Le colonne che process_esg_impact scrive, misurate sul cloud
-- =============================================================================
-- PERCHE' ESISTE.
--   Il 02/10 la 20260930210000 e' stata applicata e C3 e' fallito con
--     ERROR 42703: column "total_liters_water" does not exist
--   CONTEXT: PL/pgSQL function process_esg_impact(...) line 28
--
--   L'errore dice che total_liters_water NON esiste. Non dice che total_liters
--   esista: sono due affermazioni diverse. types/database.ts sostiene che la
--   seconda, ma lo stesso file dichiara anche email e full_name su profiles,
--   che Zero-PII vieta. Quel file non e' un oracolo.
--
--   Prima di correggere una colonna bisogna sapere quali delle quattro che la
--   funzione scrive esistono davvero. Se una e' sbagliata, non e' improbabile
--   che le altre abbiano la stessa sorte: correggerle una alla volta significa
--   tornare qui quattro volte.
--
-- PERCHE' IL CLIENT NON E' UN TESTIMONE.
--   Nel client (.ts e .tsx) total_liters e total_liters_water non compaiono
--   mai: zero occorrenze. Contano solo total_xp (28), total_co2 (8) e
--   total_tokens (4). Nessuna schermata legge i litri, quindi il nome di
--   quella colonna non puo' rompere l'app. E' per questo che la decisione non
--   e' urgente come sembrava.
--
-- TUTTO IN SOLA LETTURA. Nessuna scrittura, nessun DDL, nessun lock.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- P1 - IL VERDETTO. Una riga per colonna target: esiste o no.
--      Questa e' la tabella da leggere. Se una riga ha esiste = false, quella
--      e' la colonna che va cambiata nella funzione.
-- -----------------------------------------------------------------------------
WITH target(nome, ruolo) AS (
    VALUES
      ('total_co2',         'la funzione la scrive'),
      ('total_tokens',      'la funzione la scrive'),
      ('total_xp',          'la funzione la scrive'),
      ('total_liters',      'candidata, suggerita da types/database.ts'),
      ('total_liters_water', 'candidata, usata dalla 30180000: NON ESISTE')
)
SELECT t.nome                                              AS colonna,
       (c.column_name IS NOT NULL)                         AS esiste,
       COALESCE(c.data_type, '-')                          AS tipo,
       COALESCE(c.is_nullable, '-')                        AS nullable,
       COALESCE(c.column_default, '-')                    AS default,
       t.ruolo
  FROM target t
  LEFT JOIN information_schema.columns c
         ON c.table_schema = 'public'
        AND c.table_name   = 'profiles'
        AND c.column_name  = t.nome
 ORDER BY esiste, t.nome;


-- -----------------------------------------------------------------------------
-- P2 - Tutte le colonne di profiles, per intero.
--      Serve a due cose: vedere se esiste un terzo nome per i litri che
--      nessuno ha considerato, e controllare che le altre colonne ci
--      aspettate esistano davvero (party_size, total_distance_meters,
--      pois_discovered: le funzioni e il client le toccano).
-- -----------------------------------------------------------------------------
SELECT ordinal_position AS pos, column_name, data_type, is_nullable,
       COALESCE(column_default, '') AS default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'profiles'
 ORDER BY ordinal_position;


-- -----------------------------------------------------------------------------
-- P3 - Zero-PII: profiles contiene dati che non deve contenere?
--      types/database.ts dichiara email e full_name su profiles. AGENTS.md
--      vieta esplicitamente nome, email e telefono nell'app, e l'app deve
--      essere anonima. Se le colonne esistono e sono popolate, non e' un
--      problema di stile: e' il presupposto Zero-PII a essere falso.
--      Nota: questo e' un dato sullo schema, non una lettura di PII: si conta
--      quante righe hanno il campo valorizzato, non cosa c'e' dentro.
-- -----------------------------------------------------------------------------
SELECT 'P3-zero-pii' AS sezione, column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'profiles'
   AND column_name IN ('email', 'full_name', 'phone', 'phone_number',
                       'first_name', 'last_name', 'display_name')
 ORDER BY column_name;
-- atteso: zero righe. Se invece compare email o full_name, la situazione da
--         aprire e' piu' grossa del nome di una colonna, e va detta prima di
--         tutto il resto.


-- -----------------------------------------------------------------------------
-- P4 - Quanti utenti hanno il contatore litri valorizzato, e in quale colonna.
--      Se nessuna delle due colonne esiste, questa sezione restituisce zero
--      righe invece di fallire: e' il caso atteso dopo l'errore di C3.
--      Serve a decidere se il dato esiste da qualche parte e va spostato, o
--      se il contatore non e' mai stato popolato e si puo' ricreare pulito.
-- -----------------------------------------------------------------------------
DO $p4$
DECLARE
    v_water BIGINT;
    v_liters BIGINT;
    v_esiste_water BOOLEAN;
    v_esiste_liters BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='profiles'
           AND column_name='total_liters_water'
    ) INTO v_esiste_water;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='profiles'
           AND column_name='total_liters'
    ) INTO v_esiste_liters;

    IF v_esiste_water THEN
        EXECUTE 'SELECT count(*) FROM public.profiles WHERE total_liters_water IS NOT NULL AND total_liters_water <> 0'
          INTO v_water;
    END IF;

    IF v_esiste_liters THEN
        EXECUTE 'SELECT count(*) FROM public.profiles WHERE total_liters IS NOT NULL AND total_liters <> 0'
          INTO v_liters;
    END IF;

    RAISE NOTICE 'P4-litri | colonna total_liters_water esiste=%, righe valorizzate=%', v_esiste_water, v_water;
    RAISE NOTICE 'P4-litri | colonna total_liters esiste=%, righe valorizzate=%', v_esiste_liters, v_liters;
END;
$p4$;
-- LEGGERE I NOTICE, non desumere dal fatto che il file sia passato.
--   entrambe false -> il contatore non esiste: si ricrea, e si sceglie il
--                     nome che il client non usa comunque.
--   solo total_liters valorizzata -> il dato c'e' gia', si allinea la funzione.
--   entrambe valorizzate -> i dati sono divisi su due colonne: serve un piano,
--                     non un refactor.


-- -----------------------------------------------------------------------------
-- P5 - Lo stato delle funzioni dopo il 02/10.
--      La 30210000 e' stata applicata: la funzione ESISTE, ma con un corpo
--      che muore alla riga 28. Questo e' il secondo punto d'ingresso da
--      chiudere, e la sezione lo rende misurabile invece che ipotizzato.
--      has_function_privilege e' la verita': confrontarla con pg_proc racconta
--      cosa si intendeva, questa dice cosa si puo' fare davvero.
-- -----------------------------------------------------------------------------
SELECT 'P5-funzioni' AS sezione,
       p.pronname                                 AS funzione,
       pg_get_function_identity_arguments(p.oid) AS argomenti,
       has_function_privilege('anon',         p.oid, 'EXECUTE') AS da_anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS da_utente,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') AS da_service
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('process_esg_impact', 'scan_poi_gps')
 ORDER BY p.proname, argomenti;
-- atteso: process_esg_impact -> da_utente true. La 30210000 ha fatto di nuovo
--         GRANT a authenticated alle righe 140-141, quindi la forgia e'
--         aperta in questo momento, su una funzione che pero' muore prima di
--         scrivere. Non e' una garanzia, e' un incidente.
--         scan_poi_gps -> da_utente true: questo deve restare cosi', e' il
--         percorso buono.


-- =============================================================================
-- FINE - 5 sezioni: P1 verdetto colonne, P2 schema completo di profiles,
--                   P3 controllo Zero-PII, P4 dati litri, P5 privilegi.
-- =============================================================================
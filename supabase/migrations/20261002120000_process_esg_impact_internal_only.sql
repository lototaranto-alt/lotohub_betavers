-- =============================================================================
-- 20261002120000 - process_esg_impact diventa interna: nessun EXECUTE al client
-- =============================================================================
-- PERCHE' ESISTE.
--   La 20260930210000 riscrive la funzione sullo schema reale e, alle righe
--   140-141, le fa di nuovo GRANT EXECUTE TO authenticated. L'handover del 30/09
--   lo dichiarava: neutralizzare party_size chiude l'amplificatore, non la
--   forgia. Gli importi p_co2, p_liters, p_tokens e p_xp arrivano dal client e
--   non hanno tetto. Con EXECUTE a authenticated, un client modificato si
--   accredita la cifra che vuole. Questo file chiude la forgia togliendo
--   l'ingresso pubblico.
--
-- PERCHE' ADESSO E NON PRIMA.
--   Il 02/10 il client e' stato allineato: app/(tabs)/index.tsx non chiama piu'
--   process_esg_impact, chiama scan_poi_gps, che calcola tutto sul server ed e'
--   dotata di proximity gate, cooldown 12h e anti-velocita'.
--   components/PoiDetailSheet.tsx:141 gia' usava scan_poi_gps.
--   Prima di questa modifica il revoke avrebbe rotto il check-in dei POI
--   partner. Ora non resta un solo chiamante nel client, quindi il revoke
--   non costa niente.
--
-- PERCHE' UN BLOCCO DO E NON UN REVOKE SINGOLO.
--   process_esg_impact ha avuto piu' firme nel tempo: una con p_user_id, che il
--   client non deve piu' poter usare, e una senza. Un REVOKE esplicito
--   coprirebbe una sola delle due e lascerebbe aperta l'altra, invisibile.
--   Il blocco DO enumera tutte le firme presenti e le revoca una per una, cosi'
--   il risultato non dipende da quante sopravvivono.
--
-- PERCHE' REVOKE ANCHE DA PUBLIC.
--   PUBLIC comprende anche anon. Supabase crea le funzioni con EXECUTE a PUBLIC
--   per default: senza questo REVOKE, un token anonimo puo' chiamare la funzione
--   quanto un utente autenticato.
--
-- COSA NON È CHIUSO, e va detto perché il file esiste:
--   supabase/functions/calculate-esg-impact/index.ts chiama ancora questa
--   funzione, e gira con SUPABASE_SERVICE_ROLE_KEY. Il service_role bypassa RLS
--   e i GRANT: questo REVOKE non lo ferma. Inoltre la edge function riceve
--   base_co2, base_liters, base_tokens e party_size da req.json(), cioe' dal
--   corpo della richiesta: gli importi sono scelti dal client e il commento
--   "Logica di Calcolo Protetta" descrive il contrario di quello che fa.
--   Percio' il buco ha due ingressi, e questo file chiude solo quello SQL.
--   Il secondo si chiude eliminando la edge function, che non e' chiamata da
--   nessuna parte del client e fa gia' il lavoro di scan_poi_gps.
--
-- SE COMPARE UN ERRORE
--   'function process_esg_impact(...) does not exist'
--     La 20260930210000 non e' stata applicata. Vedi la sezione VERIFICA di quel
--     file: C2 deve restituire UNA sola firma, senza p_user_id.
--   'permission denied for function process_esg_impact'
--     Qualcuno l'ha richiamata dopo il revoke. Il SELECT su pg_proc qui sotto
--     dice chi: le righe con has_function_privilege true sono ancora pubbliche.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_sig TEXT;
BEGIN
    FOR v_sig IN
        SELECT pg_get_function_identity_arguments(p.oid)
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname = 'process_esg_impact'
    LOOP
        EXECUTE format(
            'REVOKE ALL ON FUNCTION public.process_esg_impact(%s) FROM PUBLIC',
            v_sig
        );
        EXECUTE format(
            'REVOKE ALL ON FUNCTION public.process_esg_impact(%s) FROM authenticated',
            v_sig
        );
        EXECUTE format(
            'REVOKE ALL ON FUNCTION public.process_esg_impact(%s) FROM anon',
            v_sig
        );
        RAISE NOTICE 'process_esg_impact(%) revocata', v_sig;
    END LOOP;

    IF NOT FOUND THEN
        RAISE NOTICE 'Nessuna process_esg_impact trovata: niente da revocare';
    END IF;
END;
$$;

COMMIT;


-- =============================================================================
-- VERIFICA  (leggere l'output, non desumere dal fatto che il file e' passato)
-- =============================================================================

-- R1: nessuna firma deve restare pubblica.
--     Tutte le colonne has_*_privilege devono essere false.
SELECT pg_get_function_identity_arguments(p.oid) AS firma,
       has_function_privilege('anon',         p.oid, 'EXECUTE') AS eseguibile_da_anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS eseguibile_da_utente,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') AS eseguibile_da_service
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('process_esg_impact', 'scan_poi_gps');
-- atteso: process_esg_impact -> anon false, utente false.
--         scan_poi_gps       -> anon ?, utente true. Il secondo non si tocca: e'
--                              l'ingresso pubblico unico del check-in.
--
--         Le colonne di anon su scan_poi_gps possono essere true: la 29160000
--         puo' aver lasciato il GRANT a PUBLIC, e PUBLIC comprende anon. Non e'
--         un difetto di questa funzione, che non accetta nessun parametro
--         controllato dal client ed espone solo l'importo calcolato dal server.
--         Se vuoi chiuderlo anche li, serve un REVOKE separato su scan_poi_gps,
--         da valutare con il gating anagrafico: puo' esistere un flusso
--         pubblico legittimo che oggi non si vede.
--
--         eseguibile_da_service puo' restare false: non e' un errore. Dopo il
--         revoke nessuno deve piu' chiamare questa funzione, service role
--         compreso. Se qualcosa la chiama ancora, lo trovi dalla R3 e dalla
--         ricerca su supabase/functions/.

-- R2: il percorso buono deve essere ancora aperto, altrimenti il revoke ha
--     rotto l'app invece di chiuderla.
SELECT public.scan_poi_gps(
         (SELECT id FROM public.pois LIMIT 1),
         0::double precision, 0::double precision
       );
-- I due 0 portano il cast esplicito: senza, PostgreSQL li legge come integer e
-- risponde "function scan_poi_gps(uuid, integer, integer) does not exist",
-- che sembra la funzione rotta mentre e' solo una firma che non combacia. Il
-- falso allarme diceva esattamente il contrario della verita'.
-- atteso: EXCEPTION con testo in italiano. Cooldown, distanza, coordinate
--         mancanti o POI non trovato: va bene QUALSIASI errore, l'importante e'
--         che arrivi dalla funzione e non "permission denied". Se arriva
--         permission denied, il revoke ha toccato scan_poi_gps per errore:
--         ripristinare con GRANT EXECUTE ON FUNCTION public.scan_poi_gps(uuid,
--         double precision, double precision) TO authenticated.

-- R3: il check-in del client non deve dipendere da process_esg_impact.
SELECT proname, pg_get_function_identity_arguments(oid) AS firma
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname IN ('scan_poi_gps', 'process_esg_impact')
 ORDER BY proname;
-- atteso: due righe. Una sola process_esg_impact e senza p_user_id. Se
--         p_user_id compare, l'archivio sopravvive e va rimosso a mano con
--         DROP FUNCTION public.process_esg_impact(<firma con p_user_id>);
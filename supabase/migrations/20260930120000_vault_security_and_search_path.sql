-- =============================================================================
--  20260930120000 - Sicurezza del vault multimediale + hardening search_path
-- =============================================================================
--  PERCHE' ESISTE
--  La migration_v20 (gia' applicata al cloud) ha riscritto tre funzioni del vault
--  introducendone due difetti. Questa li corregge senza toccare i dati.
--
--  DIFETTO 1 - get_poi_vetrina accetta l'id utente come parametro
--    Firma vecchia: get_poi_vetrina(p_poi_id UUID, p_user_id UUID)
--    Calcolava livello e premium sul profilo PASSATO dal client, non su quello
--    autenticato. Chiunque poteva passare l'id di un utente con XP alti e
--    ricevere media_path dei contenuti a pagamento, aggirando il gate.
--    Correzione: si legge auth.uid(). Niente piu' parametro.
--    Nota: nessun chiamante nel client (solo una dichiarazione di tipo in
--    types/database.ts:1804, che dichiara peraltro un campo inesistente,
--    media_url, invece di media_path). Per questo la firma puo' cambiare.
--
--  DIFETTO 2 - tre funzioni SECURITY DEFINER senza SET search_path
--    Una funzione SECURITY DEFINER gira con i privilegi di chi l'ha creata.
--    Se un utente autenticato puo' creare oggetti in uno schema del
--    search_path, puo' far risolvere a una funzione privilegiata un oggetto
--    suo. E' il buco che la 26/09 aveva gia' corretto su scan_poi_gps e che
--    la v20 ha riportato dentro tre funzioni nuove.
--
--  SU search_path = public, pg_temp  (e non solo "public")
--    pg_temp viene elencato per ULTIMO di proposito. In PostgreSQL pg_temp e'
--    cercato per primo se non e' nominato esplicitamente: senza questo, un
--    utente puo' creare una tabella temporanea che ombra una tabella di public
--    dentro una funzione privilegiata. Elencarlo per ultimo chiude il buco.
--    Verificato il 30/09: PostGIS e' nello schema public (D1), quindi
--    ST_Distance si risolve senza dover aggiungere 'extensions'.
--
--  COSA NON FA
--    Non tocca dati, non cancella righe, non modifica alcuna tabella.
--    Gli unici DROP sono di tipo funzione e servono per cambiare una firma:
--    PostgreSQL non permette di cambiare il tipo di ritorno con CREATE OR
--    REPLACE. Per gli stessi motivi non puo' esistere piu' di una versione.
--
--  RILEVANTE PER: A3-T9 (chiuso dalla v20), sicurezza del vault,
--                igiene del repository (unico sistema: supabase/migrations/)
-- =============================================================================

BEGIN;

-- =============================================================================
--  1. calculate_user_level - stessa curva, con search_path
--     Curva verificata identica a utils/levelUtils.ts LEVEL_THRESHOLDS:
--     50 soglie, 0 differenze. Non si tocca nessun numero.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_user_level(xp INT)
RETURNS INT AS $$
DECLARE
    v_xp INT := GREATEST(COALESCE(xp, 0), 0);
    v_level INT := 1;
    v_min_xp INT[] := ARRAY[
        0, 30, 90, 180, 300, 450, 630, 840, 1080, 1350, 1650, 2080, 2540, 3030, 3550,
        4100, 4680, 5290, 5930, 6600, 7300, 8230, 9190, 10180, 11200, 12250, 13330,
        14440, 15580, 16750, 17950, 19180, 20440, 21730, 23050, 24400, 25780, 27190,
        28630, 30100, 31600, 33130, 34690, 36280, 37900, 39550, 41230, 42940, 44680, 46450
    ];
BEGIN
    FOR i IN 1..50 LOOP
        IF v_xp >= v_min_xp[i] THEN
            v_level := i;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    RETURN v_level;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.calculate_user_level(INT) IS
'Curva dei livelli lato server. Verificata identica a utils/levelUtils.ts. A3-T9.';


-- =============================================================================
--  2. sblocca_media - gia' usava auth.uid(), aggiunto search_path
--     La logica di sblocco NON cambia: stesso gate di livello, stesso premium,
--     stesso insert in user_unlocked_media.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sblocca_media(p_media_id UUID)
RETURNS TABLE (
    unlocked BOOLEAN,
    media_path TEXT,
    message TEXT
) AS $$
DECLARE
    v_profile_id UUID;
    v_user_xp INT;
    v_user_level INT;
    v_required_level INT;
    v_is_premium_only BOOLEAN;
    v_user_is_premium BOOLEAN;
    v_poi_id UUID;
    v_territory_id UUID;
    v_media_path TEXT;
    v_already_unlocked BOOLEAN;
BEGIN
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Utente non autenticato.'::TEXT;
        RETURN;
    END IF;

    SELECT poi_id, media_path, COALESCE(required_level, 1), COALESCE(is_premium_only, FALSE)
        INTO v_poi_id, v_media_path, v_required_level, v_is_premium_only
    FROM public.media_vault
    WHERE id = p_media_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Contenuto multimediale non trovato.'::TEXT;
        RETURN;
    END IF;

    SELECT territory_id INTO v_territory_id
    FROM public.pois
    WHERE id = v_poi_id;

    SELECT EXISTS (
        SELECT 1 FROM public.user_unlocked_media
        WHERE profile_id = v_profile_id AND media_id = p_media_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN QUERY SELECT TRUE, v_media_path, 'Contenuto gia' sbloccato in precedenza.'::TEXT;
        RETURN;
    END IF;

    SELECT total_xp, COALESCE(is_premium, FALSE)
        INTO v_user_xp, v_user_is_premium
    FROM public.profiles
    WHERE id = v_profile_id;

    IF v_user_xp IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Profilo utente non trovato.'::TEXT;
        RETURN;
    END IF;

    v_user_level := public.calculate_user_level(v_user_xp);

    IF v_user_level < v_required_level THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT,
            format('Livello insufficiente: richiesto Livello %s, attuale %s.',
                   v_required_level, v_user_level);
        RETURN;
    END IF;

    IF v_is_premium_only AND NOT v_user_is_premium THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT,
            'Contenuto Premium: riservato agli utenti L.O.T.O. ELITE.'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.user_unlocked_media (profile_id, media_id, territory_id)
    VALUES (v_profile_id, p_media_id, v_territory_id);

    RETURN QUERY SELECT TRUE, v_media_path, 'Sblocco effettuato con successo.'::TEXT;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;


-- =============================================================================
--  3. get_poi_vetrina - IL FIX DI SICUREZZA
--     Firma nuova: UN solo parametro. L'utente viene da auth.uid().
--     Il parametro p_user_id e' sparito perche' accettarlo era il difetto.
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_poi_vetrina(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_poi_vetrina(p_poi_id UUID)
RETURNS TABLE (
    id UUID,
    poi_id UUID,
    title TEXT,
    media_path TEXT,
    media_type VARCHAR,
    required_level INT,
    is_premium_only BOOLEAN,
    is_unlocked BOOLEAN
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_xp INT;
    v_user_level INT;
    v_user_is_premium BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        v_user_xp := 0;
        v_user_is_premium := FALSE;
    ELSE
        SELECT total_xp, COALESCE(is_premium, FALSE)
            INTO v_user_xp, v_user_is_premium
        FROM public.profiles
        WHERE id = v_user_id;

        IF v_user_xp IS NULL THEN
            v_user_xp := 0;
            v_user_is_premium := FALSE;
        END IF;
    END IF;

    v_user_level := public.calculate_user_level(v_user_xp);

    RETURN QUERY
    SELECT
        mv.id,
        mv.poi_id,
        mv.title,
        CASE WHEN (v_user_level >= COALESCE(mv.required_level, 1))
                  AND (COALESCE(mv.is_premium_only, FALSE) = FALSE OR v_user_is_premium)
             THEN mv.media_path
             ELSE NULL END,
        mv.media_type,
        COALESCE(mv.required_level, 1),
        COALESCE(mv.is_premium_only, FALSE),
        EXISTS (
            SELECT 1 FROM public.user_unlocked_media uum
            WHERE uum.media_id = mv.id AND uum.profile_id = v_user_id
        )
    FROM public.media_vault mv
    WHERE mv.poi_id = p_poi_id
    ORDER BY COALESCE(mv.required_level, 1) ASC,
             COALESCE(mv.is_premium_only, FALSE) ASC,
             mv.created_at ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.get_poi_vetrina(UUID) IS
'Catalogo multimediale del POI. L''utente e'' auth.uid(): non accetta piu'' un id passato dal client. A3-T9.';


-- =============================================================================
--  4. SWEEP: search_path su TUTTE le altre funzioni SECURITY DEFINER di public
--     In repository ce ne sono 21, di cui 18 che non ho letto riga per riga.
--     Riscriverle una per una richiederebbe di conoscerne il corpo: una firma
--     sbagliata fa fallire l'ALTER e non succede nulla.
--
--     Si fa il contrario: si lascia che sia PostgreSQL a trovare le funzioni,
--     con un blocco che le interroga in pg_proc e usa EXECUTE. Nessuna firma
--     scritta a mano, quindi nessun errore di trascrizione possibile, e si
--     toccano solo le funzioni che ESISTONO davvero nel cloud.
--
--     Qui si aggiunge 'extensions' oltre a public: e' una rete di sicurezza per
--     le 18 funzioni il cui corpo non ho verificato. Uno schema inesistente nel
--     search_path e' innocuo in PostgreSQL, quindi non costa nulla.
--     PostGIS e' comunque in public (D1 del 30/09), quindi 'extensions' non e'
--     necessario oggi: e' tolleranza per il futuro, non una dipendenza.
-- =============================================================================

DO $$
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosecdef
          AND n.nspname = 'public'
          AND p.proname NOT IN ('calculate_user_level', 'sblocca_media',
                                'get_poi_vetrina', 'scan_poi_gps')
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions, pg_temp',
                           r.sig);
            v_count := v_count + 1;
        EXCEPTION WHEN undefined_function THEN
            RAISE NOTICE 'Saltata (non esiste): %', r.sig;
        END;
    END LOOP;
    RAISE NOTICE 'Funzioni SECURITY DEFINER sistemate: %', v_count;
END;
$$;

COMMIT;


-- =============================================================================
--  DOPO L'APPLICAZIONE - tre verifiche, una sola lettura ciascuna.
--  Se la 1 non passa, la transazione e' stata annullata e il vault e' come
--  prima: nessuna perdita, ma anche nessuna correzione.
-- =============================================================================

--  SELECT proname,
--         (prosrc LIKE '%auth.uid()%')            AS usa_auth_uid,
--         (prosrc LIKE '%p_user_id%')             AS accetta_p_user_id,
--         (proconfig::text LIKE '%search_path%')  AS search_path_impostato
--  FROM pg_proc
--  WHERE proname IN ('get_poi_vetrina','sblocca_media','calculate_user_level')
--    AND pronamespace = 'public'::regnamespace
--  ORDER BY proname;
--  -- atteso: 3 righe. usa_auth_uid = true ovunque, accetta_p_user_id = false
--  --         OVUNQUE, search_path_impostato = true ovunque.

--  SELECT count(*) AS vetrina_vecchia_firma
--  FROM pg_proc
--  WHERE proname = 'get_poi_vetrina'
--    AND pronamespace = 'public'::regnamespace
--    AND pg_get_function_identity_arguments(oid) = 'p_poi_id uuid, p_user_id uuid';
--  -- atteso: 0. La firma vecchia non deve piu' esistere.

--  SELECT count(*) AS definitor_senza_search_path
--  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE p.prosecdef AND n.nspname = 'public'
--    AND (p.proconfig IS NULL
--         OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) cfg
--                        WHERE cfg LIKE '%search_path%'));
--  -- atteso: 0. Se resta qualcosa, ci sono funzioni che lo sweep non ha
--  --         raggiunto: vanno sistemate a mano, una alla volta.

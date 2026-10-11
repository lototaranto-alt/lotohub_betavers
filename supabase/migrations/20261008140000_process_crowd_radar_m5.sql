-- ============================================================================
-- M5 - process_crowd_radar: identita' dal server (Fase 1)
-- Data: 08/10/2026
-- Severita': BLOCCANTE
-- ============================================================================
-- Difetto misurato (precheck 20, 08/10):
--   - prosecdef = true, proconfig = null  -> SECURITY DEFINER SENZA
--     search_path pinnato (R2 aperto)
--   - proacl = null  -> EXECUTE di default a PUBLIC = anon puo' chiamare
--     (R1 aperto; con proacl null un REVOKE FROM anon da solo e' un no-op:
--      il grant esplicito va fatto a authenticated e revocato da PUBLIC)
--   - il corpo usa p_reporter_id dichiarato dal client:
--     INSERT INTO crowd_predictions (..., reporter_id, ...) VALUES
--     (..., p_reporter_id, ...). Il client unico (app/p/[id].tsx:88, dentro
--     if (session) alla riga 85) passa session.user.id, che coincide con
--     auth.uid() per costruzione (JWT sub) -> gate client VERDE 08/10,
--     ma il server non deve fidarsi del parametro.
--
-- Cosa fa questa migration (idempotente, rieseguibile):
--   1. CREATE OR REPLACE con:
--      - v_reporter_id := auth.uid() al posto di p_reporter_id
--        (il parametro resta nella firma: il client lo passa, e' ignorato)
--      - guardia: auth.uid() IS NULL -> RAISE EXCEPTION
--        'chiamata anonima non consentita' (passo 2 del piano)
--      - SET search_path = public, pg_temp INLINE nella CREATE OR REPLACE
--        (equivalente al passo 4 ALTER FUNCTION ... SET search_path:
--         stesso proconfig, in un colpo solo e idempotente)
--   2. GRANT EXECUTE a authenticated + REVOKE da PUBLIC (R1):
--      corrisponde al "REVOKE da anon" del piano, nei termini misurati
--   3. NESSUNA modifica al cap >1000 -> 100 (bug di dato, non di
--      sicurezza): la lascio e la registro come CB-20 (gate del piano)
--
-- LIMITI DOCUMENTATI (non risolti, come da piano):
--   - **D5 resta aperta**: v_certified = (new + avg)/2 su un p_raw_count
--     dichiarato dal chiamante autenticato resta una media su un dato
--     non verificato. Serve geofence server-side. M5 NON promette
--     identita' fidabile: sposta il confine da "chiunque" a "chi ha un
--     account", e basta.
--   - Il cap incoerente (1500 -> 100, 999 passa) -> CB-20.
--
-- GATE prima di applyare - ESEGUITI E VERDI l'08/10:
--   20  -> prosecdef=true, proconfig=null, proacl=null, firma
--          (uuid, uuid, integer)->integer, corpo catturato (= backup M3;
--          file: diagnostica_fase1/risultato 20_process.txt)
--   gate client -> unico chiamante app/p/[id].tsx:88 con sessione garantita
--   M1 chiuso (grant Fase 0 01/01b), M3 chiuso (backup = output 20)
--
-- DOPO l'apply: eseguire diagnostica_fase1/21_m5_post_apply_verifica.sql
-- (valori attesi nel commento dello script).
--
-- IMPATTI CLIENT noti (registrati, non sorpresi):
--   - app/p/[id].tsx:88 continua a funzionare: passa un valore ignorato
--   - nessun altro chiamante (grep 08/10: app, components, utils, context,
--     loto-admin-v2/src, supabase/functions -> solo p/[id].tsx)
--   - anon: da EXECUTE a permission denied; l'app non ha mai chiamato la
--     RPC senza sessione (stessa riga 85 le controlla)
--
-- ROLLBACK:
--   ripristinare il corpo da diagnostica_fase1/risultato 20_process.txt
--   (pg_get_functiondef catturato prima della modifica = backup M3);
--   ALTER FUNCTION ... RESET search_path (o rimuovere l'inline);
--   GRANT EXECUTE ... TO PUBLIC (o ripristinare proacl precedente = NULL
--   default). Nessun dato in crowd_predictions/pois viene alterato da M5.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Corpo: identita' da auth.uid() + guardia anonima + search_path pinnato
--    (p_reporter_id resta in firma ma non viene piu' usato)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_crowd_radar(
    p_poi_id uuid,
    p_reporter_id uuid,   -- ignorato dall'08/10 (M5): identita' = auth.uid()
    p_raw_count integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_reporter_id uuid := auth.uid();
    v_certified INT;
    v_recent_avg INT;
    v_confidence INT := 1;
BEGIN
    -- Sicurezza: l'identita' viene dal JWT, non dal parametro
    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'chiamata anonima non consentita';
    END IF;

    -- Sicurezza: Taglio (Cap) sui numeri esagerati per evitare manomissioni
    -- NOTA (CB-20): cap incoerente lasciato volutamente: 1500 -> 100, 999 passa
    IF p_raw_count > 1000 THEN
        p_raw_count := 100;
    END IF;

    -- Doppia Convalida Civica: Media dello storico negli ultimi 15 minuti
    SELECT AVG(certified_count) INTO v_recent_avg
      FROM crowd_predictions
     WHERE poi_id = p_poi_id AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_recent_avg IS NOT NULL THEN
        -- Smussamento: Media tra il dato nuovo e lo storico
        v_certified := (p_raw_count + v_recent_avg) / 2;
        v_confidence := 2; -- Validato dal pattern (Tier superiore)
    ELSE
        v_certified := p_raw_count;
    END IF;

    -- Salvataggio nella tabella di Analytics B2B
    INSERT INTO crowd_predictions (poi_id, reporter_id, raw_count, certified_count, confidence_score)
    VALUES (p_poi_id, v_reporter_id, p_raw_count, v_certified, v_confidence);

    -- Debouncer: Aggiorna il calore del POI per la Mappa Live su una scala sicura 10-100
    UPDATE public.pois
       SET heat = LEAST(100, GREATEST(10, v_certified * 5))
     WHERE id = p_poi_id;

    RETURN v_certified;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 2. EXECUTE: con proacl = null il grant effettivo era PUBLIC (anon
--    compreso). Prima il grant esplicito a authenticated (rimane dopo il
--    revoke: le entry esplicite hanno la priorita' su PUBLIC), poi la
--    revoca a PUBLIC. Rieseguibile: i REVOKE da ruoli senza entry sono
--    no-op, il doppio GRANT idempotente.
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.process_crowd_radar(uuid, uuid, integer)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_crowd_radar(uuid, uuid, integer)
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.process_crowd_radar(uuid, uuid, integer)
  FROM anon;

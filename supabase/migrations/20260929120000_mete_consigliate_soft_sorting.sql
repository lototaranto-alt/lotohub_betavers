-- =============================================================================
--  L.O.T.O. HUB - Mete Consigliate: soft-sorting del deflusso turistico
-- =============================================================================
--  Perche' questa migration esiste
--  ---------------------------------
--  public.pois ha tre colonne gia' pronte per l'algoritmo di deflusso, e nessuna
--  delle tre e' mai stata scritta da nessun codice:
--
--    loto_quota_max    number  -> la capienza del POI. Non esposta al consumer.
--    crowd_level       text    -> LETTA da components/PoiCard.tsx:30
--    is_recommended    boolean -> LETTA da app/(tabs)/index.tsx:857
--
--  L'unica scrittura esistente in tutto il repository e' un UPDATE manuale
--  (pure_cloud_queries/19_reimposta_mete_consigliate...). Quindi non manca lo
--  schema: manca lo SCRITTORE. Questa migration aggiunge una funzione e un cron,
--  e non crea tabelle.
--
--  Decisione di prodotto, 2026-09-29: l'algoritmo entra nel prodotto.
--  Specifica: docs_v2/METE-CONSIGLIATE-SPEC.md
--
--  L'idea
--  ------
--  Quando un POI supera l'80% della capienza, il traffico non va accumulato li':
--  viene deviato sui POI culturali e sulle Mete Segrete vicini che sono liberi.
--  E' decongestione, ed e' anche la tesi del report che si vende alla PA.
--
--  Tre scelte, e perche' sono quelle
--  -----------------------------------
--  1. SOGLIA k = 5.  public.user_pois e' una riga per utente. Pubblicare il
--     conteggio grezzo significa dire "ci sono 5 persone", non "e' pieno". Quindi
--     sotto k=5 il POI non viene valutato, non scrive niente, e non puo' innescare
--     niente. Il valore 5 non e' inventato qui: e' lo stesso k che
--     vw_daas_heatmap_15min usa gia' (verificata funzionante, ESITO-QUERY.md:96).
--     Un solo k in tutto il prodotto, o la privacy dipende da quale vista hai
--     chiesto.
--
--  2. recommended_until, per non cancellare il marketing a tradimento.
--     L'algoritmo e il pannello admin scrivono la stessa colonna, e senza un
--     marcatore di provenienza un cron che resetta tutto cancella, ogni mattina,
--     le scelte commerciali di ieri. Con UNA colonna il problema e' risolto:
--
--       recommended_until NOT NULL  ->  campagna manuale, l'algoritmo non la tocca
--       recommended_until IS NULL   ->  dominio dell'algoritmo
--
--     Le campagne scadute vengono spente e restituite all'algoritmo, quindi il
--     marketing non deve fare pulizia a mano e ogni scelta ha una scadenza che
--     e' stata scelta da qualcuno, non ereditata da un default.
--
--  3. NESSUN reset cieco. L'algoritmo spegne solo le righe che sono di sua
--     proprieta' (recommended_until IS NULL). Le righe manuali attive restano
--     accese finche' scadono.
--
--  Cosa NON fa, e va saputo prima di accenderla
--  ---------------------------------------------
--  - Se loto_quota_max resta NULL su tutti i POI, la condizione di eccesso non si
--    innesca MAI. La funzione gira, non capita niente, e sembra funzionante.
--    Prima di schedulare il cron, controllare:
--        select count(*) filter (where loto_quota_max is not null) as con_quota,
--               count(*) as totale from pois;
--  - crowd_level viene scritto come testo ('85'). La colonna e' dichiarata text in
--    types/database.ts: se nel cloud risulta numerica, togliere il cast ::text
--    nella funzione, unica riga da cambiare. Verificabile con:
--        select data_type from information_schema.columns
--        where table_name='pois' and column_name='crowd_level';
--  - Il cast ::geography in ST_DWithin serve perche' su geometry il raggio e' in
--    gradi. Verificabile con:
--        select f_geometry_column, srid, type from geometry_columns
--        where f_table_name='pois' and f_geometry_column='coords';
--
--  Difesa
--  ------
--  SECURITY DEFINER con search_path fissato, e revoca esplicita ad anon e
--  authenticated. Non e' una API pubblica: se un client potesse chiamarla,
--  potrebbe scrivere is_recommended e dirottare i turisti di tutta la citta'.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
--  1. La colonna che separa l'algoritmo dalla mano
-- -----------------------------------------------------------------------------
--  Additiva. Nessun DROP, nessuna riscrittura di dati esistenti.
ALTER TABLE public.pois
    ADD COLUMN IF NOT EXISTS recommended_until TIMESTAMPTZ;

COMMENT ON COLUMN public.pois.recommended_until IS
    'Scadenza della sponsorizzazione manuale. NULL = dominio esclusivo del cron mete_consigliate. Scaduta = torna all''algoritmo.';

-- -----------------------------------------------------------------------------
--  2. Il calcolo
-- -----------------------------------------------------------------------------
--  Una sola statement: occupazione -> eccesso -> candidati -> piano -> UPDATE.
--  Nessuna tabella temporanea, e le righe che non cambiano non vengono scritte,
--  quindi la funzione e' sicura da girare ogni 5 minuti senza gonfiare la tabella.
CREATE OR REPLACE FUNCTION public.recalc_mete_consigliate()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    -- Soglie. Tutte qui, nessun numero magico nel corpo.
    v_k          CONSTANT DOUBLE PRECISION := 5;      -- soglia k-anonimato
    v_window     CONSTANT INTERVAL      := INTERVAL '1 hour';
    v_threshold  CONSTANT DOUBLE PRECISION := 0.8;    -- 80% della capienza
    v_radius_m   CONSTANT DOUBLE PRECISION := 2000;   -- 2 km, confermato il 29/09
    v_rows       INTEGER := 0;
BEGIN
    WITH occupazione AS (
        -- Conto per POI, finestra scorrevole di 1 ora, righe shadowbanned escluse.
        -- Il JOIN interno serve di per se': un POI senza check-in recenti non
        -- compare, e quindi non viene valutato.
        SELECT p.id,
               p.loto_quota_max,
               count(up.id) AS presenze
        FROM public.pois p
        JOIN public.user_pois up
          ON up.poi_id = p.id
         AND up.is_shadowbanned IS NOT TRUE
         AND up.visited_at > now() - v_window
        GROUP BY p.id, p.loto_quota_max
    ),

    valutabili AS (
        -- Sopra la soglia k. Sotto questa soglia non si pubblica niente.
        SELECT id, loto_quota_max, presenze
        FROM occupazione
        WHERE presenze >= v_k
    ),

    in_eccesso AS (
        SELECT p.id, p.coords, p.loto_quota_max
        FROM public.pois p
        JOIN valutabili v ON v.id = p.id
        WHERE p.loto_quota_max IS NOT NULL
          AND p.loto_quota_max > 0
          AND v.presenze >= p.loto_quota_max * v_threshold
    ),

    candidati AS (
        -- POI culturali e Mete Segrete, attivi, non in eccesso anch'essi, entro 2 km
        -- da almeno un POI in eccesso. Le categorie sono le stesse che il client
        -- usa per lo scaffale "Culturali" e "Mete Segrete" (index.tsx:858,:860):
        -- cosi' un POI promosso esce dallo scaffale di origine e non appare due
        -- volte, che e' esattamente il comportamento richiesto.
        SELECT DISTINCT c.id
        FROM in_eccesso e
        JOIN public.pois c
          ON c.id <> e.id
         AND c.is_active IS NOT FALSE
         AND c.coords IS NOT NULL
         AND e.coords IS NOT NULL
         AND c.category IN ('free', 'museum', 'attraction', 'monument', 'park', 'secret')
         -- Il cast a geography NON e' decorativo: su un geometry il raggio di
         -- ST_DWithin e' in GRADI, e 2000 gradi comprende l'intero pianeta, cioe'
         -- ogni POI del database diventerebbe "consigliato". Con geography il
         -- raggio e' in metri, che e' quello che 2000 vuol dire. La colonna e'
         -- dichiarata `unknown` in types/database.ts, quindi il tipo reale va
         -- verificato: con la riga 5 di questo file.
         AND ST_DWithin(c.coords::geography, e.coords::geography, v_radius_m)
         AND NOT EXISTS (
             SELECT 1 FROM in_eccesso x WHERE x.id = c.id
         )
    ),

    piano AS (
        SELECT
            p.id,
            -- crowd_level: percentuale di occupazione, solo sopra k e solo se la
            -- capienza e' nota. Sotto k torna NULL, e la colonna si svuota: e'
            -- il comportamento corretto, non lasciare in giro una lettura vecchia.
            CASE
                WHEN v.presenze >= v_k AND v.loto_quota_max IS NOT NULL AND v.loto_quota_max > 0
                THEN round(v.presenze * 100.0 / v.loto_quota_max)::int::text
                ELSE NULL
            END AS nuovo_crowd_level,
            CASE
                -- 1. Campagna manuale scaduta: si spegne e torna all'algoritmo.
                WHEN p.recommended_until IS NOT NULL AND p.recommended_until <= now() THEN false
                -- 2. Campagna manuale attiva: intoccabile.
                WHEN p.recommended_until IS NOT NULL THEN true
                -- 3. Scelto dall'algoritmo in questo giro.
                WHEN c.id IS NOT NULL THEN true
                -- 4. Era una scelta dell'algoritmo che ora non regge: si spegne.
                ELSE false
            END AS nuovo_is_recommended,
            CASE
                WHEN p.recommended_until IS NOT NULL AND p.recommended_until <= now() THEN NULL
                ELSE p.recommended_until
            END AS nuova_scadenza
        FROM public.pois p
        LEFT JOIN valutabili v ON v.id = p.id
        LEFT JOIN candidati  c ON c.id = p.id
    )

    UPDATE public.pois p
    SET crowd_level       = pl.nuovo_crowd_level,
        is_recommended    = pl.nuovo_is_recommended,
        recommended_until = pl.nuova_scadenza
    FROM piano pl
    WHERE p.id = pl.id
      AND (
            p.crowd_level       IS DISTINCT FROM pl.nuovo_crowd_level
         OR p.is_recommended    IS DISTINCT FROM pl.nuovo_is_recommended
         OR p.recommended_until IS DISTINCT FROM pl.nuova_scadenza
      );

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows;
END;
$$;

-- -----------------------------------------------------------------------------
--  3. Nessuno la chiama dal client
-- -----------------------------------------------------------------------------
--  Di default PostgreSQL concede EXECUTE a PUBLIC su ogni funzione, e anon e
--  authenticated ne ereditano. Va tolto esplicitamente, altrimenti chiunque
--  potrebbe accendere is_recommended a piacimento su tutta la citta'.
REVOKE ALL ON FUNCTION public.recalc_mete_consigliate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalc_mete_consigliate() FROM anon;
REVOKE ALL ON FUNCTION public.recalc_mete_consigliate() FROM authenticated;

COMMIT;

-- =============================================================================
--  4. Schedulazione
-- =============================================================================
--  Ogni 5 minuti. La soglia dell'80% su base oraria non richiede granularita'
--  piu' fine, e 5 minuti tengono l'app reattiva senza carico.
--
--  pg_cron va abilitata. Non la abilito qui di proposito: e' una decisione di
--  permessi su cloud_pg, e supabase/migrations/20260825_whatsapp_bot_setup.sql:120
--  la lascia volutamente commentata per la stessa ragione. Scommentare se serve:
--
--      CREATE EXTENSION IF NOT EXISTS pg_cron;
--
--  Il blocco fallisce piano e avvisa, invece di far fallire tutta la migration:
--  le funzioni e le revoche sopra sono gia' state applicate e valgono comunque.
DO $$
BEGIN
    PERFORM cron.unschedule('recalc_mete_consigliate');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job mete_consigliate inesistente o pg_cron assente: si procede alla schedulazione.';
END;
$$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'recalc_mete_consigliate',
        '*/5 * * * *',
        'SELECT public.recalc_mete_consigliate()'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron non abilitata su questo progetto. Funzione creata e protetta; manca solo la schedulazione.';
END;
$$;

-- =============================================================================
--  5. Come verificare che stia funzionando
-- =============================================================================
--  Prima di tutto: le quote. Se questa riga restituisce 0, l'algoritmo e' spento
--  anche se sembra vivo.
--
--    select count(*) filter (where loto_quota_max is not null) as con_quota,
--           count(*) as totale from pois;
--
--  Poi, dopo un giro:
--
--    select name, category, loto_quota_max, crowd_level, is_recommended, recommended_until
--    from pois
--    where is_recommended or crowd_level is not null
--    order by recommended_until nulls last;
--
--  Quello che NON deve succedere: crowd_level valorizzato sotto k=5. Se compare,
--  il k-anonimato non e' stato applicato e la privacy non regge.
--
--    select count(*) from pois where crowd_level is not null;
-- =============================================================================

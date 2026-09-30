-- =========================================================================
-- 20260926120000_scan_chain_canonical.sql
-- CATENA DI VALIDAZIONE CANONICA (GPS/NFC -> BLE) - unico writer di user_pois
-- =========================================================================
-- PERCHE' ESISTE
--   Il check-in POI non aveva un writer unico. Tre fatti verificati:
--     1) `INSERT INTO user_pois` non compare in NESSUN file di supabase/**.
--        L'unica scrittura era client-side in app/p/[id].tsx, con id POI MOCK.
--     2) scan_poi_gps deployata (migration_master_reset.sql:504) scriveva solo
--        `esg_raw_logs` (tabella assente dai tipi generati) e NON user_pois:
--        le viste DaaS non potevano ricevere nulla.
--     3) Non c'era cooldown ne' vincolo di duplicato: scan_poi_gps in loop entro
--        80 m incassava xp_reward all'infinito (exploit XP).
--   In più la versione root (anti_spoofing_scan_poi_gps.sql:97) scriveva
--   colonne inesistenti: `user_id` e `created_at` invece di profile_id/visited_at.
--
--   Questa migration NON cambia le viste DaaS: quelle sono gia' corrette in
--   20260925120000_admin_dashboard_hardening.sql (gate is_loto_admin(), tenant_id,
--   k-anonimita'). Qui si costruisce solo l'UPSTREAM che le alimenta.
--
-- MODELLO DECISIONALE (allineato ad AGENTS.md: ledger immutabile)
--   user_pois            = LOG DI VALIDAZIONE (dove, quando, se valido)
--                          co2_saved/xp_awarded = copia denormalizzata per la
--                          Prestige Card, NON sorgente di verita'.
--   impact_transactions  = LEDGER (unica fonte di verita' per CO2/PTI/XP)
--   profiles.total_*     = cache di lettura, ricalcolata, mai sorgente.
--
-- REGOLE RISPETTATE
--   - action_type IN ('tourist_checkin','civic_action','event','refill','unknown')
--     (vincolo impact_transactions_action_type_check, hardening:47-51)
--   - mai-nessuna-PII: la funzione non accetta e non restituisce identificativi
--     di terzi; ignora qualsiasi utente passato dal client (usa auth.uid()).
--   - SECURITY DEFINER + search_path fissato.
--   - Idempotente: ri-eseguibile senza effetti collaterali.
--
-- APPLICAZIONE: MANUALE, via Supabase SQL Editor. Mai in automatico (AGENTS.md).
-- =========================================================================


-- =========================================================================
-- FASE 0 - NORMALIZZAZIONE SCHEMA (idempotente)
-- =========================================================================

-- 0.1 Colonne di geometria/validazione su user_pois.
--     Co2/XP/shadowbanned sono garantite da migration_v21_fix_scan_co2.sql,
--     ma le richiediamo qui perche' questa migration deve reggere da sola.
ALTER TABLE public.user_pois
    ADD COLUMN IF NOT EXISTS visited_at          TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS lat                  DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS lng                  DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS co2_saved            NUMERIC  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS xp_awarded           INTEGER  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_shadowbanned      BOOLEAN  DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS calculated_speed_kmh DOUBLE PRECISION;

-- 0.2 Se esiste una colonna 'id' senza default (schema reale da types/database.ts),
--     le INSERT della funzione fallirebbero. Le diamo un default.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_pois'
      AND column_name = 'id' AND column_default IS NULL
  ) THEN
    EXECUTE 'ALTER TABLE public.user_pois ALTER COLUMN id SET DEFAULT gen_random_uuid()';
  END IF;
END;
$$;

-- 0.3 Indici di lettura. NON creiamo un UNIQUE su (profile_id, poi_id):
--     la PK composta (profile_id, poi_id) del dump cloud imporrebbe "un POI una
--     volta sola nella vita", rendendo impossibili check-in ripetuti, heatmap
--     storiche e conteggi giornalieri. Il vincolo di unicita' temporale e' il
--     cooldown applicato dalla funzione, non un indice.
--     Nota: se la PK composta gia' esiste, l'indice e' ridondante ma innocuo.
CREATE INDEX IF NOT EXISTS idx_user_pois_profile_visited
    ON public.user_pois (profile_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_pois_poi_visited
    ON public.user_pois (poi_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_pois_geom
    ON public.user_pois (lat, lng)
    WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 0.4 tenant_id su profiles: manca (types/database.ts non la dichiara) ma
--     app/(tabs)/index.tsx:276-286 filtra i profili per tenant -> errore
--     PostgREST garantito. Coerente con master_reset (tenant_id TEXT).
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS tenant_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant
    ON public.profiles (tenant_id);


-- =========================================================================
-- FASE 1 - SCAN POI CANONICO (GPS + anti-spoofing + ledger)
-- =========================================================================
-- Unico punto di scrittura per un check-in. Sostituisce INCOMPATIBILMENTE:
--   - supabase/migration_master_reset.sql:504-556  (scriveva esg_raw_logs)
--   - anti_spoofing_scan_poi_gps.sql:7-120        (scriveva user_id/created_at)
-- Le due non vanno riapplicate: la funzione sotto e' quella canonica.
--
-- Anti-spoofing (3 scenari, ereditati dalla versione root e resi persistenti):
--   > 130 km/h  -> SHADOWBAN: visita registrata, XP=0, CO2=0, esclusa dai DaaS
--   20-130 km/h -> VEICOLARE: XP sì, CO2=0 (non ha camminato)
--   <  20 km/h  -> PEDONALE: XP sì, CO2=0 + base_co2 del POI
-- =========================================================================

CREATE OR REPLACE FUNCTION public.scan_poi_gps(
    p_poi_id   UUID,
    p_lat      DOUBLE PRECISION,
    p_lng      DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid            UUID := auth.uid();
    v_poi            RECORD;
    v_last           RECORD;
    v_user_geog      GEOGRAPHY;
    v_dist_poi_m     DOUBLE PRECISION;
    v_dist_last_m    DOUBLE PRECISION;
    v_speed_kmh      DOUBLE PRECISION := 0;
    v_radius_m       DOUBLE PRECISION;
    v_xp             INTEGER  := 0;
    v_co2            NUMERIC  := 0;
    v_visited_today  BOOLEAN  := FALSE;
    v_shadowbanned   BOOLEAN  := FALSE;
    v_new_xp         INTEGER;
    v_new_co2        NUMERIC;
    v_cooldown_hours CONSTANT NUMERIC := 12;
BEGIN
    -- 1) Autenticazione: l'utente NON puo' essere passato dal client.
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    -- 2) POI + parametri di sicurezza lato server
    SELECT p.id,
           p.coords,
           COALESCE(p.xp_reward, 15)  AS xp_reward,
           COALESCE(p.base_co2, 0)    AS base_co2,
           COALESCE(p.checkin_radius, 80) AS checkin_radius,
           p.tenant_id
      INTO v_poi
      FROM public.pois p
     WHERE p.id = p_poi_id;

    IF v_poi.id IS NULL THEN
        RAISE EXCEPTION 'POI non trovato';
    END IF;
    IF v_poi.coords IS NULL THEN
        RAISE EXCEPTION 'POI senza coordinate: check-in non verificabile';
    END IF;

    -- 3) Proximity gate: il raggio e' quello del POI, non un 80 m cablato.
    v_radius_m   := v_poi.checkin_radius;
    v_user_geog  := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    v_dist_poi_m := ST_Distance(v_user_geog, v_poi.coords::geography);

    IF v_dist_poi_m > v_radius_m THEN
        RAISE EXCEPTION 'Sei troppo distante dal POI per il check-in (distanza: % m, massimo % m)',
            ROUND(v_dist_poi_m::numeric, 1), ROUND(v_radius_m::numeric, 1);
    END IF;

    -- 4) Anti-speed: dal precedente punto GPS registrato dallo stesso utente.
    SELECT up.lat, up.lng, up.visited_at
      INTO v_last
      FROM public.user_pois up
     WHERE up.profile_id = v_uid
       AND up.lat IS NOT NULL
       AND up.lng IS NOT NULL
       AND up.visited_at IS NOT NULL
     ORDER BY up.visited_at DESC
     LIMIT 1;

    IF v_last.visited_at IS NOT NULL THEN
        v_dist_last_m := ST_Distance(
            v_user_geog,
            ST_SetSRID(ST_MakePoint(v_last.lng, v_last.lat), 4326)::geography
        );
        v_speed_kmh := (v_dist_last_m / 1000.0)
                     / (GREATEST(EXTRACT(EPOCH FROM (now() - v_last.visited_at)) / 3600.0, 0.01));
    END IF;

    -- 5) Cooldown: niente XP a ripetizione sullo stesso POI nella stessa giornata.
    --    Questo e' il vero atto di chiusura dell'exploit XP (non un indice unique).
    SELECT EXISTS (
        SELECT 1 FROM public.user_pois up
         WHERE up.profile_id = v_uid
           AND up.poi_id    = p_poi_id
           AND up.visited_at > now() - (v_cooldown_hours || ' hours')::interval
    ) INTO v_visited_today;

    -- 6) Ricompense per scenario di mobilita'
    IF v_visited_today THEN
        v_xp  := 0;
        v_co2 := 0;
    ELSIF v_speed_kmh > 130 THEN
        v_shadowbanned := TRUE;
        v_xp  := 0;
        v_co2 := 0;
    ELSIF v_speed_kmh >= 20 THEN
        v_xp  := v_poi.xp_reward;   -- veicolare: XP sì, CO2 no
        v_co2 := 0;
    ELSE
        v_xp  := v_poi.xp_reward;
        v_co2 := v_poi.base_co2;
    END IF;

    -- 7) SCRITTURE. Saltate del tutto in caso di cooldown: una riga con XP=0
    --    non rappresenterebbe una visita reale e inquinerebbe la heatmap DaaS
    --    (e il conteggio giornaliero) senza alcun valore.
    IF NOT v_visited_today THEN

        -- 7a) LOG DI VALIDAZIONE (geometria + validita').
        --     Adattivo: se lo schema ha la PK composta (profile_id, poi_id) una
        --     seconda visita allo stesso POI non puo' coesistere, quindi
        --     l'EXCEPTION ricade sull'UPDATE della riga esistente.
        BEGIN
            INSERT INTO public.user_pois
                (profile_id, poi_id, visited_at, lat, lng,
                 co2_saved, xp_awarded, is_shadowbanned, calculated_speed_kmh)
            VALUES
                (v_uid, p_poi_id, now(), p_lat, p_lng,
                 v_co2, v_xp, v_shadowbanned, v_speed_kmh);
        EXCEPTION WHEN unique_violation THEN
            UPDATE public.user_pois
               SET visited_at           = now(),
                   lat                  = p_lat,
                   lng                  = p_lng,
                   co2_saved            = v_co2,
                   xp_awarded           = v_xp,
                   is_shadowbanned      = v_shadowbanned,
                   calculated_speed_kmh = v_speed_kmh
             WHERE profile_id = v_uid
               AND poi_id     = p_poi_id;
        END;

        -- 7b) LEDGER: unica fonte di verita' per CO2/PTI/XP.
        --     Solo se la visita ha prodotto ricompense.
        IF v_xp > 0 OR v_co2 > 0 THEN
            INSERT INTO public.impact_transactions
                (profile_id, co2_saved, liters_saved, tokens_earned, xp_earned,
                 action_type, tenant_id)
            VALUES
                (v_uid, v_co2, 0, 0, v_xp,
                 'tourist_checkin', v_poi.tenant_id::text);
        END IF;

        -- 7c) Cache di lettura sul profilo (ricalcolabile, mai sorgente).
        --     tenant_id NON viene toccato: e' un dato di appartenenza registrato
        --     all'iscrizione, e sovrascriverlo con il tenant del POI sposterebbe
        --     l'utente fra tenant. Inoltre il tipo della colonna
        --     (TEXT o UUID) non e' verificabile offline e un cast implicito
        --     text->uuid fallirebbe.
        UPDATE public.profiles
           SET total_xp   = COALESCE(total_xp, 0)  + v_xp,
               total_co2  = COALESCE(total_co2, 0) + v_co2,
               updated_at = now()
         WHERE id = v_uid;

    END IF;

    -- 8) Totali correnti, letti in un punto solo: così il cooldown restituisce
    --    i valori reali invece di sommare ricompense inesistenti.
    SELECT COALESCE(total_xp, 0), COALESCE(total_co2, 0)
      INTO v_new_xp, v_new_co2
      FROM public.profiles
     WHERE id = v_uid;

    v_new_xp  := COALESCE(v_new_xp, 0);
    v_new_co2 := COALESCE(v_new_co2, 0);

    -- 10) Ritorno: mantiene TUTTE le chiavi che il client gia' legge
    --     (PoiDetailSheet.tsx legge new_total_xp) + i dati per lo shadowban,
    --     cosi' nessun caller esistente va in errore.
    RETURN jsonb_build_object(
        'status',         CASE
                            WHEN v_visited_today THEN 'cooldown'
                            WHEN v_shadowbanned  THEN 'shadowbanned'
                            WHEN v_speed_kmh >= 20 THEN 'vehicle'
                            ELSE 'pedestrian'
                          END,
        'success',        NOT v_shadowbanned,
        'xp_awarded',     v_xp,
        'co2_saved',      v_co2,
        'new_total_xp',   v_new_xp,          -- chiave storica, mantenuta
        'new_total_co2',  v_new_co2,
        'distance',       v_dist_poi_m,
        'radius',         v_radius_m,
        'speed_kmh',      v_speed_kmh,
        'shadowbanned',   v_shadowbanned,
        'cooldown_hours', v_cooldown_hours
    );
END;
$$;

-- La funzione scrive con i permessi del definer: le policy RLS di INSERT su
-- user_pois non la bloccherebbero, ma restano il controllo per gli accessi
-- diretti dal client.
REVOKE ALL ON FUNCTION public.scan_poi_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_poi_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION)
    TO authenticated, service_role;


-- =========================================================================
-- FASE 1b - CHIUSURA DEL BYPASS NFC/QR (scan_poi)
-- =========================================================================
-- Il client chiama scan_poi(p_poi_id) in components/PoiDetailSheet.tsx:576 dal
-- percorso di scansione tag, e lo faceva SENZA alcuna validazione:
--   - nessun controllo GPS (a differenza di scan_poi_gps);
--   - `scannedData` NON veniva confrontato con il POI: bastava qualsiasi QR,
--     perchè PoiScannerModal in Alpha accetta qualsiasi contenuto;
--   - XP assegnati, quindi ricompensa interamente lato client non verificata.
-- Diventa una "finalizzazione": puo' valere solo se lo stesso utente ha gia'
-- una visita GPS validata di recente per QUEL POI (tag + presenza fisica).
-- Non assegna nulla: la ricompensa e' gia' stata erogata da scan_poi_gps, quindi
-- qui si richiama anche il doppio conteggio.
--
-- NOTA PRODOTTO: questa e' una decisione di sicurezza, non un refactor neutro.
-- Accettando di scansionare il tag senza aver prima validato il GPS, l'utente
-- riceverà un errore server. Se il prodotto richiede lo scan come percorso
-- autonomo, serve un challenge NFC firmato (validate_ntag424_sdm) al posto di
-- questa guardia: la decisione va presa prima del rilascio.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.scan_poi(p_poi_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid   UUID := auth.uid();
    v_visit RECORD;
    v_xp    INTEGER;
    v_co2   NUMERIC;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    -- Presenza fisica di recente: stessa terna utente+POI, ultimi 15 minuti.
    SELECT up.co2_saved, up.xp_awarded, up.is_shadowbanned
      INTO v_visit
      FROM public.user_pois up
     WHERE up.profile_id = v_uid
       AND up.poi_id    = p_poi_id
       AND up.visited_at > now() - INTERVAL '15 minutes'
     ORDER BY up.visited_at DESC
     LIMIT 1;

    IF v_visit IS NULL THEN
        RAISE EXCEPTION 'Check-in non autorizzato: nessuna validazione GPS recente per questo POI. Avvicinati al monumento e riprova.';
    END IF;

    -- Totali correnti: la ricompensa e' gia' stata contabilizzata da scan_poi_gps.
    SELECT COALESCE(total_xp, 0), COALESCE(total_co2, 0)
      INTO v_xp, v_co2
      FROM public.profiles
     WHERE id = v_uid;

    RETURN jsonb_build_object(
        'status',       CASE WHEN v_visit.is_shadowbanned THEN 'shadowbanned' ELSE 'confirmed' END,
        'success',      NOT v_visit.is_shadowbanned,
        'xp_awarded',   0,   -- mai raddoppiato: gia' erogato da scan_poi_gps
        'co2_saved',    0,
        'new_total_xp', COALESCE(v_xp, 0),    -- chiave che il client legge
        'new_total_co2',COALESCE(v_co2, 0),
        'shadowbanned', COALESCE(v_visit.is_shadowbanned, FALSE)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.scan_poi(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_poi(UUID) TO authenticated, service_role;


-- =========================================================================
-- FASE 2 - NEUTRALIZZAZIONE DELLE DEFINIZIONI DIVERGENTI
-- =========================================================================
-- Le due versioni storiche non vanno riapplicate: hanno firme identiche ma
-- semantica opposta e sovrascriverebbero la funzione canonica.
--
--   supabase/migration_master_reset.sql:504  -> sovrascrive con esg_raw_logs
--   anti_spoofing_scan_poi_gps.sql:7         -> sovrascrive scrivendo user_id
--
-- mitigation.sql li elenco come DA NON APPLICARE (regola gia' presente in
-- docs/codici_morti.md per v19 e 02_gamification_and_events.sql).


-- =========================================================================
-- FASE 3 - CONTROLLI (rieseguire = 0 errori => catena attiva)
-- =========================================================================
SELECT 'colonne user_pois' AS controllo,
       COUNT(*) FILTER (WHERE column_name IN
         ('profile_id','poi_id','visited_at','lat','lng',
          'co2_saved','xp_awarded','is_shadowbanned')) AS attese_8,
       COUNT(*) AS presenti
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'user_pois'
   AND column_name IN ('profile_id','poi_id','visited_at','lat','lng',
                       'co2_saved','xp_awarded','is_shadowbanned');

SELECT 'scan_poi_gps' AS controllo,
       COUNT(*) AS overloads,
       pg_get_function_result(oid) AS ritorno
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'scan_poi_gps';

-- Atteso: 1 overload per nome. Se > 1, due definizioni con firme diverse
-- coesistono e PostgREST puo' risolvere sulla sbagliata: va risolta a mano.
SELECT 'scan_poi' AS controllo,
       COUNT(*) AS overloads,
       pg_get_function_result(oid) AS ritorno
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'scan_poi';

-- Atteso: nessun anon con EXECUTE sulle due RPC di check-in.
SELECT 'grant anon sulle scan' AS controllo,
       COUNT(*) ASViolazioni
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('scan_poi', 'scan_poi_gps')
   AND EXISTS (
        SELECT 1 FROM pg_roles r
         WHERE r.rolname = 'anon'
           AND has_function_privilege(r.oid, p.oid, 'EXECUTE')
       );

SELECT 'profiles.tenant_id' AS controllo,
       COUNT(*) AS presente
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'profiles'
   AND column_name = 'tenant_id';

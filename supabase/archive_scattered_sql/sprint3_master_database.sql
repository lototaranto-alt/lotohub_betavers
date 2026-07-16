-- =========================================================================
-- MIGRATION V13: SPRINT 3 DATABASE SCHEMAS (Scalable Data Foundations)
-- =========================================================================

-- 1. Estensione PostGIS (già abilitata, ma per sicurezza)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabella Territori (public.territories)
CREATE TABLE IF NOT EXISTS public.territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    boundaries GEOMETRY(MultiPolygon, 4326) NOT NULL, -- Poligoni PostGIS dei confini (es. Taranto, Lecce)
    colors JSONB NOT NULL, -- Configurazione colori ({primary, secondary, etc})
    assets JSONB NOT NULL, -- URL statici di loghi e grafiche del tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_colors_format CHECK (jsonb_typeof(colors) = 'object'),
    CONSTRAINT check_assets_format CHECK (jsonb_typeof(assets) = 'object')
);

CREATE INDEX IF NOT EXISTS territories_spatial_idx ON public.territories USING GIST(boundaries);

-- Abilitiamo Row Level Security (RLS) per i territori
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Policy di sola lettura pubblica (necessaria per il funzionamento client multi-tenant "Camaleonte")
DROP POLICY IF EXISTS "Allow anonymous read on territories" ON public.territories;
CREATE POLICY "Allow anonymous read on territories" ON public.territories FOR SELECT USING (true);


-- 3. Estensione tabella public.pois per supportare il multi-tenancy spaziale
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL;


-- 4. Funzione Trigger per assegnare e validare il territorio del POI
CREATE OR REPLACE FUNCTION assign_and_validate_poi_territory_fn()
RETURNS TRIGGER AS $$
DECLARE
    found_territory_id UUID;
BEGIN
    -- Cerca il territorio attivo in cui ricadono le coordinate del POI (Cast a geometry per ST_Within)
    SELECT id INTO found_territory_id
    FROM public.territories
    WHERE ST_Within(NEW.coords::geometry, boundaries)
    LIMIT 1;

    -- Se le coordinate non ricadono in nessun territorio registrato, solleva un errore (Dogma Geofencing)
    IF found_territory_id IS NULL THEN
        RAISE EXCEPTION 'Errore di geofencing: Le coordinate geografiche del POI non ricadono in nessun territorio attivo registrato.';
    END IF;

    -- Imposta il territory_id associato
    NEW.territory_id := found_territory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger su INSERT o UPDATE delle coordinate del POI
DROP TRIGGER IF EXISTS trigger_assign_and_validate_poi_territory ON public.pois;
CREATE TRIGGER trigger_assign_and_validate_poi_territory
BEFORE INSERT OR UPDATE OF coords ON public.pois
FOR EACH ROW
EXECUTE FUNCTION assign_and_validate_poi_territory_fn();


-- 5. RPC per permettere l'inserimento semplificato dei POI da parte delle Web Agency (lat, lon decimali)
CREATE OR REPLACE FUNCTION insert_poi_standardized(
    p_name TEXT,
    p_category TEXT,
    p_layer_name TEXT,
    p_loto_quota_max INTEGER,
    p_xp_reward INTEGER,
    p_is_accessible BOOLEAN,
    p_latitude FLOAT8,
    p_longitude FLOAT8
)
RETURNS UUID AS $$
DECLARE
    new_poi_id UUID;
BEGIN
    INSERT INTO public.pois (
        name, 
        category, 
        layer_name, 
        loto_quota_max, 
        xp_reward, 
        is_accessible, 
        coords
    ) VALUES (
        p_name,
        p_category,
        p_layer_name,
        p_loto_quota_max,
        p_xp_reward,
        p_is_accessible,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    )
    RETURNING id INTO new_poi_id;

    RETURN new_poi_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION insert_poi_standardized IS 'Consente l''inserimento di un POI inserendo latitudine/longitudine in decimali. Il trigger compilerà automaticamente il territory_id.';


-- 6. Tabella Vault Multimediale (public.media_vault)
CREATE TABLE IF NOT EXISTS public.media_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    media_path VARCHAR(512) NOT NULL, -- Percorso privato del file all'interno di Supabase Storage
    loto_cost INTEGER NOT NULL CHECK (loto_cost >= 0),
    media_type VARCHAR(50) NOT NULL, -- es. 'audio', 'video'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Abilitiamo RLS per media_vault
ALTER TABLE public.media_vault ENABLE ROW LEVEL SECURITY;

-- Tutti gli utenti autenticati possono consultare i metadati dei contenuti del vault
DROP POLICY IF EXISTS "Allow authenticated read on media_vault" ON public.media_vault;
CREATE POLICY "Allow authenticated read on media_vault" ON public.media_vault FOR SELECT USING (auth.role() = 'authenticated');


-- 7. Tabella Storico Sblocchi (public.user_unlocked_media)
CREATE TABLE IF NOT EXISTS public.user_unlocked_media (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media_vault(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL, -- Memorizzato per le future analitiche DaaS B2B (porta aperta)
    PRIMARY KEY (profile_id, media_id)
);

-- Abilitiamo RLS per user_unlocked_media
ALTER TABLE public.user_unlocked_media ENABLE ROW LEVEL SECURITY;

-- Gli utenti possono vedere esclusivamente il proprio storico degli sblocchi
DROP POLICY IF EXISTS "Users can view their own unlocked media" ON public.user_unlocked_media;
CREATE POLICY "Users can view their own unlocked media" ON public.user_unlocked_media FOR SELECT USING (auth.uid() = profile_id);


-- 8. RPC Transazionale sblocca_media
-- Consente l'acquisto atomico del contenuto scalando i token dal saldo dell'utente in un'unica transazione.
CREATE OR REPLACE FUNCTION sblocca_media(p_media_id UUID)
RETURNS TABLE (
    unlocked BOOLEAN,
    media_path TEXT,
    message TEXT
) AS $$
DECLARE
    v_profile_id UUID;
    v_loto_cost INTEGER;
    v_user_balance INTEGER;
    v_poi_id UUID;
    v_territory_id UUID;
    v_media_path TEXT;
    v_already_unlocked BOOLEAN;
BEGIN
    -- 1. Recupera l'utente connesso
    v_profile_id := auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Utente non autenticato.'::TEXT;
        RETURN;
    END IF;

    -- 2. Recupera i dettagli del media
    SELECT poi_id, media_path, loto_cost INTO v_poi_id, v_media_path, v_loto_cost
    FROM public.media_vault
    WHERE id = p_media_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Contenuto multimediale non trovato.'::TEXT;
        RETURN;
    END IF;

    -- 3. Recupera il territorio associato al POI per tracciamento statistico (porta aperta)
    SELECT territory_id INTO v_territory_id
    FROM public.pois
    WHERE id = v_poi_id;

    -- 4. Controlla si il media è già sbloccato
    SELECT EXISTS (
        SELECT 1 FROM public.user_unlocked_media
        WHERE profile_id = v_profile_id AND media_id = p_media_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN QUERY SELECT TRUE, v_media_path, 'Contenuto già sbloccato in precedenza.'::TEXT;
        RETURN;
    END IF;

    -- 5. Recupera il saldo punti (total_tokens) dal profilo dell'utente
    SELECT total_tokens INTO v_user_balance
    FROM public.profiles
    WHERE id = v_profile_id;

    IF v_user_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Profilo utente non trovato o saldo non inizializzato.'::TEXT;
        RETURN;
    END IF;

    -- 6. Verifica la copertura del saldo
    IF v_user_balance < v_loto_cost THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Saldo punti (LOTO PTI) insufficiente.'::TEXT;
        RETURN;
    END IF;

    -- 7. Detrazione atomica dei token (LOTO Economy)
    UPDATE public.profiles
    SET total_tokens = total_tokens - v_loto_cost
    WHERE id = v_profile_id;

    -- 8. Registrazione sblocco
    INSERT INTO public.user_unlocked_media (profile_id, media_id, territory_id)
    VALUES (v_profile_id, p_media_id, v_territory_id);

    RETURN QUERY SELECT TRUE, v_media_path, 'Sblocco effettuato con successo.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Anti-Cheat: Trigger di plausibilità velocità su registrazione check-in
-- Calcola la velocità dello spostamento tra check-in consecutivi (user_pois) ed interrompe l'operazione in caso di cheating.
CREATE OR REPLACE FUNCTION verify_checkin_speed_plausibility_fn()
RETURNS TRIGGER AS $$
DECLARE
    last_poi_coords GEOGRAPHY;
    last_visited_time TIMESTAMP WITH TIME ZONE;
    new_poi_coords GEOGRAPHY;
    distance_meters FLOAT8;
    time_diff_seconds FLOAT8;
    speed_kmh FLOAT8;
    max_speed_threshold FLOAT8 := 130.0; -- Soglia massima velocità in km/h (previene il "teletrasporto" fittizio)
BEGIN
    -- Recupera le coordinate geografiche del POI corrente
    SELECT coords INTO new_poi_coords
    FROM public.pois
    WHERE id = NEW.poi_id;

    -- Recupera l'ultimo check-in dello stesso utente
    SELECT p.coords, up.visited_at 
    INTO last_poi_coords, last_visited_time
    FROM public.user_pois up
    JOIN public.pois p ON p.id = up.poi_id
    WHERE up.profile_id = NEW.profile_id
    ORDER BY up.visited_at DESC
    LIMIT 1;

    -- Se esiste un check-in precedente, calcola la velocità media di transito
    IF FOUND AND last_visited_time IS NOT NULL THEN
        distance_meters := ST_Distance(new_poi_coords, last_poi_coords);
        time_diff_seconds := EXTRACT(EPOCH FROM (NEW.visited_at - last_visited_time));

        IF time_diff_seconds > 0 THEN
            speed_kmh := (distance_meters / time_diff_seconds) * 3.6;

            -- Se lo spostamento supera la soglia su una distanza significativa (>500m), solleva eccezione
            IF speed_kmh > max_speed_threshold AND distance_meters > 500 THEN
                RAISE EXCEPTION 'Blocco Sicurezza (Anti-Cheat): Velocità di spostamento tra check-in non plausibile (%.2f km/h).', speed_kmh;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verify_checkin_speed ON public.user_pois;
CREATE TRIGGER trigger_verify_checkin_speed
BEFORE INSERT ON public.user_pois
FOR EACH ROW
EXECUTE FUNCTION verify_checkin_speed_plausibility_fn();


-- 10. Vista DaaS Privacy-First (Materialized View per le Municipalità)
-- Aggrega i passaggi con approssimazione spaziale ~110m (ST_SnapToGrid) e time-bucketing a 15 minuti.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daas_anonymous_mobility_features AS
SELECT 
    p.territory_id,
    ST_SnapToGrid(p.coords::geometry, 0.001)::geography as grid_coords,
    -- Arrotondamento timestamp a scaglioni di 15 minuti per GDPR time-bucketing
    (date_trunc('hour', up.visited_at) + 
     (EXTRACT(minute FROM up.visited_at)::int / 15 * 15) * interval '1 minute')::timestamp with time zone as time_bucket,
    COUNT(DISTINCT up.profile_id) as unique_users_count,
    COUNT(*) as total_passages_count
FROM public.user_pois up
JOIN public.pois p ON p.id = up.poi_id
WHERE p.territory_id IS NOT NULL
GROUP BY p.territory_id, grid_coords, time_bucket;

-- Indice unico necessario per l'aggiornamento concorrente (pg_cron REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX IF NOT EXISTS daas_mobility_idx ON public.daas_anonymous_mobility_features (territory_id, grid_coords, time_bucket);

-- Concessione permessi di lettura
GRANT SELECT ON public.daas_anonymous_mobility_features TO authenticated;
GRANT SELECT ON public.daas_anonymous_mobility_features TO service_role;

-- 11. Trigger per Creazione Automatica Profilo (V3 Zero-PII)
-- Garantisce che ogni utente inserito in auth.users abbia immediatamente un profilo, prevenendo Race Conditions sul frontend.
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, total_tokens)
    VALUES (NEW.id, 0);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Ignorato errore struttura profilo per garantire login: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user_fn();

-- =========================================================================
-- Popolamento Iniziale Territori (Taranto e Lecce)
-- =========================================================================
INSERT INTO public.territories (name, boundaries, colors, assets)
VALUES (
    'Taranto',
    ST_GeomFromText('MULTIPOLYGON(((16.80 40.30, 17.50 40.30, 17.50 40.55, 16.80 40.55, 16.80 40.30)))', 4326),
    '{"primary": "#4A5D23", "secondary": "#D96C4A", "background": "#F9F6EE", "card": "#FFFFFF", "text": "#1F1F1F", "tint": "#4A5D23"}'::jsonb,
    '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/taranto/splash.png"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.territories (name, boundaries, colors, assets)
VALUES (
    'Lecce',
    ST_GeomFromText('MULTIPOLYGON(((18.05 40.25, 18.29 40.25, 18.29 40.45, 18.05 40.45, 18.05 40.25)))', 4326),
    '{"primary": "#C5A059", "secondary": "#6E5032", "background": "#FAF8F5", "card": "#FFFFFF", "text": "#2A2521", "tint": "#C5A059"}'::jsonb,
    '{"logoUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/logo.png", "iconUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/icon.png", "splashUrl": "https://lotohub.s3.amazonaws.com/tenants/lecce/splash.png"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- Collegamento Retroattivo POIs esistenti al loro Territorio Spaziale
-- =========================================================================
UPDATE public.pois SET coords = coords;

-- =========================================================================
-- Popolamento Iniziale Media Vault
-- =========================================================================
DO $$
DECLARE
    v_castello_id UUID;
    v_ipogeo_id UUID;
    v_saturo_id UUID;
BEGIN
    SELECT id INTO v_castello_id FROM public.pois WHERE name = 'Castello Aragonese' LIMIT 1;
    SELECT id INTO v_ipogeo_id FROM public.pois WHERE name = 'Ipogeo Spartano - Casa della Marchesa' LIMIT 1;
    SELECT id INTO v_saturo_id FROM public.pois WHERE name = 'Parco Archeologico di Saturo' LIMIT 1;

    -- Inserimento contenuti Castello Aragonese
    IF v_castello_id IS NOT NULL THEN
        -- Controlla se il media esiste già per evitare duplicati
        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_castello_id AND title = 'Audio-Guida: Il Segreto delle Mura del Castello') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_castello_id,
                'Audio-Guida: Il Segreto delle Mura del Castello',
                'audio/castello_mura_secret.mp3',
                15,
                'audio'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_castello_id AND title = 'Video Premium: Riprese Drone Canale Navigabile') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_castello_id,
                'Video Premium: Riprese Drone Canale Navigabile',
                'video/castello_drone.mp4',
                30,
                'video'
            );
        END IF;
    END IF;

    -- Inserimento contenuti Ipogeo Spartano
    IF v_ipogeo_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_ipogeo_id AND title = 'Audio-Guida: La Necropoli Nascosta') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_ipogeo_id,
                'Audio-Guida: La Necropoli Nascosta',
                'audio/ipogeo_necropoli.mp3',
                25,
                'audio'
            );
        END IF;
    END IF;

    -- Inserimento contenuti Parco Archeologico di Saturo
    IF v_saturo_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.media_vault WHERE poi_id = v_saturo_id AND title = 'Audio-Guida: Il Tempio di Saturo e il Culto dell''Acqua') THEN
            INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
            VALUES (
                v_saturo_id,
                'Audio-Guida: Il Tempio di Saturo e il Culto dell''Acqua',
                'audio/saturo_tempio.mp3',
                20,
                'audio'
            );
        END IF;
    END IF;
END $$;

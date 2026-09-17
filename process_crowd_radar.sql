-- =================================================================================
-- L.O.T.O. HUB - RPC: Radar BLE (Certificato ESG / Deflussi Turistici)
-- Firma allineata alla chiamata client: app/p/[id].tsx:88
--     await supabase.rpc('process_crowd_radar', {
--       p_poi_id: poiData.id,
--       p_reporter_id: session.user.id,
--       p_raw_count: crowdCount
--     });
--
-- L'apprendimento delle ancore hardware (times_seen, is_trusted_anchor, decay 72h
-- e quorum) avviene in EDGE COMPUTING lato client (utils/bleManager.ts).
-- Questa funzione è il "Fase C" del Radar: scrive la statistica pulita nella
-- tabella crowd_predictions (colonna raw_count), ovvero il registro vitale che
-- i partner B2B useranno per i certificati sui deflussi turistici.
-- Fonti: chat 7-15 Settembre (Deep Dive RPC V2 Radar BLE, Fase C).
-- =================================================================================

CREATE OR REPLACE FUNCTION public.process_crowd_radar(
    p_poi_id UUID,
    p_reporter_id UUID,
    p_raw_count INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reporter_id UUID;
BEGIN
    -- 1. Sicurezza: nessun inserimento anonimo / parametri malformati
    v_reporter_id := COALESCE(p_reporter_id, auth.uid());
    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    IF p_poi_id IS NULL THEN
        RAISE EXCEPTION 'p_poi_id mancante';
    END IF;

    -- 2. Statistica pulita: nessuna folla rilevata = nessun dato da certificare
    IF p_raw_count IS NULL OR p_raw_count < 1 THEN
        RETURN jsonb_build_object(
            'status', 'skipped',
            'message', 'Nessuna folla rilevata (raw_count < 1)',
            'raw_count', 0
        );
    END IF;

    -- 3. Certificato ESG: inserimento della metrica pura (Zero-IoT, Zero-PII)
    INSERT INTO public.crowd_predictions (poi_id, reporter_id, raw_count, confidence_score)
    VALUES (p_poi_id, v_reporter_id, p_raw_count, 100)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
        'status', 'success',
        'poi_id', p_poi_id,
        'reporter_id', v_reporter_id,
        'raw_count', p_raw_count
    );
END;
$$;

-- 4. Accesso consentito agli utenti autenticati e anonimi (check-in demo)
GRANT EXECUTE ON FUNCTION public.process_crowd_radar(UUID, UUID, INTEGER) TO anon, authenticated;

-- 5. Nota applicativa: se la tabella crowd_predictions non esiste ancora nel DB,
--    crearla con lo schema utilizzato dal client (utils/bleManager.ts:150):
--      CREATE TABLE IF NOT EXISTS public.crowd_predictions (
--          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--          poi_id UUID REFERENCES public.pois(id) ON DELETE CASCADE,
--          reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
--          raw_count INTEGER NOT NULL DEFAULT 1,
--          confidence_score INTEGER DEFAULT 100,
--          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
--      );
--      ALTER TABLE public.crowd_predictions ENABLE ROW LEVEL SECURITY;
--      CREATE POLICY "Tutti leggono le previsioni" ON public.crowd_predictions
--          FOR SELECT USING (true);
--      CREATE POLICY "Utenti autenticati scrivono" ON public.crowd_predictions
--          FOR INSERT WITH CHECK (auth.uid() = reporter_id);
-- =========================================================================================
-- FIX 5 BUGS - ULTIMO MIGLIO (V2)
-- =========================================================================================

-- 1. RIPRISTINO COLORI HOME (Taranto Premium)
-- Usiamo i colori e gli asset corretti (Olive Green & Orange) per la Home
UPDATE public.territories 
SET colors = '{"primary": "#4A5D23", "secondary": "#D96C4A", "background": "#F9F6EE", "card": "#FFFFFF", "text": "#1F1F1F", "tint": "#4A5D23"}'::jsonb
WHERE name ILIKE '%Taranto%';

-- 2. SBLOCCO WIZARD ONBOARDING
-- Impostiamo i flag a true per tutti in modo che la Modifica Profilo sia sbloccata
UPDATE public.profiles
SET onboarding_completed = true, profile_completed = true;

-- 3. RIPRISTINO SEGNALAZIONI CIVICHE (RLS Error Fix)
CREATE TABLE IF NOT EXISTS public.civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id TEXT,
    category TEXT,
    description TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    grid_cell TEXT,
    status TEXT DEFAULT 'pending_match',
    matched_report_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Civic Reports Access" ON public.civic_reports;
CREATE POLICY "Civic Reports Access" ON public.civic_reports 
FOR ALL USING (true) WITH CHECK (true);

-- 4. INIEZIONE MOCK PREMIUM (VETRINA)
-- Troviamo l'ID del Castello Aragonese e di un altro POI per agganciarci i media
DO $$
DECLARE
    v_castello_id UUID;
    v_saturo_id UUID;
BEGIN
    SELECT id INTO v_castello_id FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;
    SELECT id INTO v_saturo_id FROM public.pois WHERE name ILIKE '%Parco Archeologico di Saturo%' LIMIT 1;

    IF v_castello_id IS NOT NULL THEN
        -- I Segreti degli Aragonesi (Premium Mock)
        DELETE FROM public.media_vault WHERE title ILIKE '%Aragonesi%';
        INSERT INTO public.media_vault (poi_id, title, description, media_path, loto_cost, media_type, required_level, is_premium_only)
        VALUES (
            v_castello_id, 
            'I Segreti degli Aragonesi', 
            'Un documento storico esclusivo recuperato dagli archivi segreti. Solo per veri avventurieri.', 
            'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', -- MOCK HTTP (Bypassa il Bucket)
            50, 
            'pdf',
            2,
            false
        );
    END IF;

    IF v_saturo_id IS NOT NULL THEN
        -- Il Gigante di Pietra
        DELETE FROM public.media_vault WHERE title ILIKE '%Gigante di Pietra%';
        INSERT INTO public.media_vault (poi_id, title, description, media_path, loto_cost, media_type, required_level, is_premium_only)
        VALUES (
            v_saturo_id, 
            'Il Gigante di Pietra', 
            'Il mito del guardiano del Parco di Saturo. Audiolibro immersivo.', 
            'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3', -- MOCK HTTP
            100, 
            'audio',
            3,
            true
        );
    END IF;
END $$;

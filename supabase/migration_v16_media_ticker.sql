-- MIGRATION: Media, Ticker and Whitelabel Config

-- 1. Aggiungere le colonne mancanti alla tabella POIS
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Aggiungere la colonna Ticker alla tabella TERRITORIES
ALTER TABLE public.territories
ADD COLUMN IF NOT EXISTS ticker_text TEXT;

-- 3. Inserimento del Ticker iniziale (Mockup) per il territorio di Taranto
-- Il testo può essere modificato dal pannello Supabase, poi in futuro una RPC notturna lo sovrascriverà in base ai dati reali.
UPDATE public.territories
SET ticker_text = '🍃 TARANTO COMMUNITY TODAY: 1.240 Liters saved • 45kg Plastic • 12kg CO₂'
WHERE name ILIKE 'Taranto';

-- 4. Creazione sicura del bucket Storage (se non esiste)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loto-media', 'loto-media', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Policy Storage per permettere la lettura pubblica
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'loto-media' );

-- 6. Policy Storage per permettere a utenti anonimi/autenticati di caricare (solo a scopo di sviluppo/setup iniziale)
-- NOTA: In produzione questa policy andrebbe ristretta solo agli admin!
CREATE POLICY "Enable insert for all users"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'loto-media' );

CREATE POLICY "Enable update for all users"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'loto-media' );

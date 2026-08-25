-- =========================================================================
-- Modulo Admin Dash: Update Events Table
-- =========================================================================

-- Rinominare event_date in start_time se necessario, o aggiungere le colonne mancanti
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'web_public';

-- (Opzionale) Copiare event_date su start_time per retrocompatibilità se si volesse deprecare event_date
-- UPDATE public.events SET start_time = event_date WHERE start_time IS NULL;

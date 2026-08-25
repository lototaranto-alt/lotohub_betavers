-- =========================================================================
-- Modulo Admin Dash: Tabella Shadow Feedback B2B ("Whispers")
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.b2b_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT, -- es. 'accoglienza', 'pulizia', 'prezzo'
    is_premium_unlocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (solo il service_role Admin o l'utente che lo ha creato possono vederli)
ALTER TABLE public.b2b_feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy pubblica per permettere agli utenti di inserire i whisper anonimi (se autenticati)
CREATE POLICY "Utenti possono inserire i propri whisper" 
ON public.b2b_feedbacks FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- La lettura pubblica non è permessa (solo per partner Premium, che verrà gestita via RPC o view separata)

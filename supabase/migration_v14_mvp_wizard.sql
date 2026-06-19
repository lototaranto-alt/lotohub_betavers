-- =========================================================================
-- Modulo A: MVP Wizard & Database Alignment (V14)
-- Aggiunge campi per l'identità del turista (User Persona) e il punto di rientro.
-- =========================================================================

-- 1. Aggiungiamo i nuovi campi se non esistono
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_persona') THEN
        ALTER TABLE profiles ADD COLUMN user_persona TEXT CHECK (user_persona IN ('Standard', 'Senior', '♿'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'return_point_type') THEN
        ALTER TABLE profiles ADD COLUMN return_point_type TEXT CHECK (return_point_type IN ('Cruise', 'Hotel', 'Station'));
    END IF;
END $$;

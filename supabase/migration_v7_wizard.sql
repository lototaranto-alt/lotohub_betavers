-- MIGRATION V7: Wizard & Roles Overhaul
-- Aggiunge campi fondamentali alla tabella profiles per gestire il redirect del wizard e l'accessibilità

-- 1. Aggiungiamo i campi per il Wizard e l'Accessibilità se non esistono
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_completed') THEN
        ALTER TABLE profiles ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accessibility_mode') THEN
        ALTER TABLE profiles ADD COLUMN accessibility_mode BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'flow_role') THEN
        ALTER TABLE profiles ADD COLUMN flow_role TEXT DEFAULT 'LOTO Explorer';
    END IF;
    
    -- Assicuriamoci che party_size esista e sia valorizzato di default a 1
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'party_size') THEN
        ALTER TABLE profiles ADD COLUMN party_size INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. Assicuriamo che RLS consenta l'aggiornamento a se stessi
-- (Aggiungere o modificare policy se necessario, in genere l'utente può aggiornare il proprio record)
DROP POLICY IF EXISTS "Gli utenti possono aggiornare il proprio profilo" ON profiles;
CREATE POLICY "Gli utenti possono aggiornare il proprio profilo"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- NOTA: In Supabase, per eseguire un redirect immediato all'avvio dell'app basato su profile_completed,
-- il frontend leggerà la riga su `profiles` corrispondente a `auth.uid()`. Se profile_completed = false, andrà a /wizard.

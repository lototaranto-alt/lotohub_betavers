-- Esegui questo script nel SQL Editor di Supabase

-- 1. Aggiungiamo la colonna mancante 'profile_completed' alla tabella profiles
-- (Se il database è stato resettato di recente, questa colonna si era persa)
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 2. Ricreiamo la funzione in modo sicuro assicurandoci che corrisponda alla tabella
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, profile_completed, total_tokens)
  VALUES (
    NEW.id,
    FALSE,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Assicuriamoci che il trigger sia correttamente collegato
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user_fn();

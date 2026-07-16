-- Esegui questo script nel SQL Editor di Supabase per risolvere il "Database error creating anonymous user"

-- Questo script rende il trigger di creazione utente "Bulletproof".
-- Se la tabella profiles ha schemi vecchi o campi mancanti, l'errore verrà ignorato
-- garantendo che l'utente anonimo (auth.users) venga SEMPRE creato con successo.

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Inserisce solo i campi base sicuri
    INSERT INTO public.profiles (id, total_tokens)
    VALUES (NEW.id, 0);
  EXCEPTION WHEN OTHERS THEN
    -- Fondamentale: ignora qualsiasi errore di struttura del DB per non far fallire l'Auth!
    RAISE LOG 'Ignorato errore struttura profilo per garantire login: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Riapplica il trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user_fn();

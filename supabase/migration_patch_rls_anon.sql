-- 1. Ripariamo il Trigger (Rimuovendo le colonne inesistenti)
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, total_tokens, total_xp)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Sblocchiamo l'RLS per i Profili
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

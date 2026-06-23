-- MIGRATION: User Itineraries

CREATE TABLE IF NOT EXISTS public.user_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    selected_pois JSONB NOT NULL,
    mobility_type TEXT NOT NULL,
    potential_xp INTEGER DEFAULT 0,
    co2_saved NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itineraries"
    ON public.user_itineraries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries"
    ON public.user_itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
    ON public.user_itineraries FOR UPDATE
    USING (auth.uid() = user_id);

-- RPC for secure itinerary creation
CREATE OR REPLACE FUNCTION public.create_itinerary(
  p_title TEXT,
  p_pois JSONB,
  p_mobility TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_base_xp INTEGER;
  v_mobility_xp INTEGER;
  v_total_xp INTEGER;
  v_poi_count INTEGER;
  v_co2 NUMERIC;
  v_itinerary_id UUID;
BEGIN
  -- Recupera l'utente
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autorizzato';
  END IF;

  -- Verifica se il JSONB è un array
  IF jsonb_typeof(p_pois) != 'array' THEN
    RAISE EXCEPTION 'p_pois deve essere un array JSON';
  END IF;

  v_poi_count := jsonb_array_length(p_pois);

  -- Calcolo sicuro backend
  v_base_xp := v_poi_count * 10;
  
  IF p_mobility = 'walk' OR p_mobility = 'bike' THEN
    v_mobility_xp := v_poi_count * 15;
    v_co2 := v_poi_count * 0.12;
  ELSIF p_mobility = 'bus' THEN
    v_mobility_xp := v_poi_count * 8;
    v_co2 := v_poi_count * 0.06;
  ELSE
    v_mobility_xp := 0;
    v_co2 := 0;
  END IF;

  v_total_xp := v_base_xp + v_mobility_xp;

  -- Inserimento
  INSERT INTO public.user_itineraries (
    user_id, title, selected_pois, mobility_type, potential_xp, co2_saved, status
  )
  VALUES (
    v_user_id, p_title, p_pois, p_mobility, v_total_xp, v_co2, 'pending'
  )
  RETURNING id INTO v_itinerary_id;

  RETURN v_itinerary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for fetching user itineraries
CREATE OR REPLACE FUNCTION public.get_user_itineraries()
RETURNS TABLE (
    id UUID,
    title TEXT,
    selected_pois JSONB,
    mobility_type TEXT,
    potential_xp INTEGER,
    co2_saved NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.selected_pois,
    i.mobility_type,
    i.potential_xp,
    i.co2_saved,
    i.status,
    i.created_at
  FROM public.user_itineraries i
  WHERE i.user_id = auth.uid()
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

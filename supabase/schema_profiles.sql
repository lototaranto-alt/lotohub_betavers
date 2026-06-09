-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture 
-- Tabella Primaria: PROFILES (GDPR Compliant & RLS Protected)
-- =========================================================================

-- 1. Enable PostGIS extension for spatial routing logic (Smart Return Point)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the Profiles table linking to Supabase's absolute auth.users UUID
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Identità & Esigenze Particolari
  user_persona TEXT CHECK (user_persona IN ('Standard', 'Senior', '♿')),
  
  -- Nucleo di Viaggio e Organizzazione
  party_size INTEGER DEFAULT 1 CHECK (party_size > 0),
  
  -- Punto di Rientro Sostenibile
  return_point_type TEXT CHECK (return_point_type IN ('Cruise', 'Hotel', 'Station')),
  return_point_coords GEOGRAPHY(POINT), -- Location per percorsi 'Safe & Fast'
  
  -- Impostazioni ESG e Calcoli Baseline
  mobility_baseline TEXT CHECK (mobility_baseline IN ('Walking', 'Public', 'Shared'))
);

-- 3. Row Level Security (RLS) - GDPR Protection
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Creazione delle Policy (L'utente manipola solo la propria riga)
CREATE POLICY "Users can insert their own profile."
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile."
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- =========================================================================
-- Disaccoppiamento ESG e Calcoli (Come da Direttiva Strategica)
-- =========================================================================

-- Questa tabella raccoglie solo letture grezze. L'approvazione CO2
-- avverrà tramite Edge Functions escludendo modifiche libere dal frontend.
CREATE TABLE esg_raw_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Anonimizzati alla cancellazione
    action_type TEXT NOT NULL,         -- es: 'Refill', 'Entry_Museum'
    location_id INTEGER,
    raw_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Il backend di Supabase calcolerà l'impatto reale. Nessun input di trust visibile al client.
    status TEXT DEFAULT 'pending_verification' 
);

ALTER TABLE esg_raw_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert raw logs" ON esg_raw_logs FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can view own logs" ON esg_raw_logs FOR SELECT USING (auth.uid() = profile_id);

-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - V2 (Persistenza & Impact)
-- =========================================================================

-- 1. Estensione della tabella PROFILES con statistiche kumulative
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2 FLOAT8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_liters FLOAT8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;

-- 2. Creazione Tabella IMPACT_TRANSACTIONS per audit trail certificato
CREATE TABLE IF NOT EXISTS impact_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dettaglio Impatto Singolo Evento (Dati calcolati lato server)
    co2_saved FLOAT8 NOT NULL,
    liters_saved FLOAT8 NOT NULL,
    tokens_earned INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    
    -- Metadati Contesto
    is_takeaway BOOLEAN DEFAULT false,
    party_size INTEGER DEFAULT 1,
    action_type TEXT DEFAULT 'FB_AUDIT', -- es: FB_AUDIT, BEACON_REFILL, QR_CHECKIN
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS per le transazioni
ALTER TABLE impact_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
ON impact_transactions FOR SELECT 
USING (auth.uid() = profile_id);

-- La creazione avviene solo tramite Edge Functions (Service Role) 
-- o via frontend se consentito (per ora apriamo per test, poi restringeremo)
CREATE POLICY "Users can insert own transactions" 
ON impact_transactions FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- 4. Funzione Atomica per il calcolo e aggiornamento (RPC)
CREATE OR REPLACE FUNCTION process_esg_impact(
    user_id UUID,
    p_co2 FLOAT8,
    p_liters FLOAT8,
    p_tokens INTEGER,
    p_xp INTEGER,
    p_takeaway BOOLEAN,
    p_party_size INTEGER
) RETURNS VOID AS $$
BEGIN
    -- A. Aggiorna il profilo cumulativo
    UPDATE profiles
    SET 
        total_xp = total_xp + p_xp,
        total_co2 = total_co2 + p_co2,
        total_liters = total_liters + p_liters,
        total_tokens = total_tokens + p_tokens,
        updated_at = now()
    WHERE id = user_id;

    -- B. Registra la transazione di dettaglio
    INSERT INTO impact_transactions (
        profile_id, co2_saved, liters_saved, tokens_earned, xp_earned, is_takeaway, party_size
    ) VALUES (
        user_id, p_co2, p_liters, p_tokens, p_xp, p_takeaway, p_party_size
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

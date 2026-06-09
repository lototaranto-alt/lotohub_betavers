-- =========================================================================
-- Modulo 1: L.O.T.O. HUB Database Architecture - V3 (Identity & Profile)
-- =========================================================================

-- 1. Estensione della tabella PROFILES con datti Identità & Context
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS is_cruise BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_accessibility_needs BOOLEAN DEFAULT false;

-- 2. Commenti per documentazione schema
COMMENT ON COLUMN profiles.is_cruise IS 'Flag per identificare passeggeri di navi da crociera (Hub Costa/MSC)';
COMMENT ON COLUMN profiles.has_accessibility_needs IS 'Flag per attivare percorsi inclusivi e avvisi barriere';

-- 3. Nota: Nessuna modifica necessaria all'RPC process_esg_impact 
-- in quanto i parametri di calcolo ESG rimangono separati dai metadati di identità.

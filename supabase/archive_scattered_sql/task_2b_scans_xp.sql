-- ============================================================
-- TASK 2B: Collegamento Scans -> XP in Profiles
-- ============================================================

-- 1. Aggiungiamo la colonna xp_awarded alla tabella scans (se non esiste)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS xp_awarded INT DEFAULT 0;

-- 2. Creiamo una funzione che incrementa total_xp nel profilo
CREATE OR REPLACE FUNCTION update_user_xp_from_scans()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorniamo total_xp aggiungendo xp_awarded
    -- Usiamo COALESCE per evitare problemi se total_xp è null
    IF NEW.xp_awarded > 0 THEN
        UPDATE profiles
        SET total_xp = COALESCE(total_xp, 0) + NEW.xp_awarded
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attacchiamo il trigger alla tabella scans
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_xp_from_scans'
    ) THEN
        CREATE TRIGGER trigger_update_xp_from_scans
            AFTER INSERT ON scans
            FOR EACH ROW
            EXECUTE FUNCTION update_user_xp_from_scans();
    END IF;
END $$;

-- Verifica che il trigger esista
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_update_xp_from_scans';

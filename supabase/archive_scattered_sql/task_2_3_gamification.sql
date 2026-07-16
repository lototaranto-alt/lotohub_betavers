-- ============================================================
-- TASK 2: Campi XP e CO2 in profiles
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2 NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Trigger: aggiorna level automaticamente quando total_xp cambia
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := CASE
        WHEN NEW.total_xp >= 5000 THEN 5
        WHEN NEW.total_xp >= 2500 THEN 4
        WHEN NEW.total_xp >= 1000 THEN 3
        WHEN NEW.total_xp >= 500 THEN 2
        ELSE 1
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica solo se il trigger non esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_level'
    ) THEN
        CREATE TRIGGER trigger_update_level
            BEFORE UPDATE OF total_xp ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_user_level();
    END IF;
END $$;

-- Verifica
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('total_xp', 'total_co2', 'level', 'total_tokens');

-- ============================================================
-- TASK 3: Badge Esplorazione (XP-based)
-- ============================================================

-- 1. Aggiorna i check constraints in sicurezza
DO $$
BEGIN
    -- Rimuovi e ricrea il constraint per CATEGORY
    ALTER TABLE badge_templates DROP CONSTRAINT IF EXISTS badge_templates_category_check;
    ALTER TABLE badge_templates ADD CONSTRAINT badge_templates_category_check 
        CHECK (category IN ('civic_commitment', 'civic_impact', 'exploration'));

    -- Rimuovi e ricrea il constraint per THRESHOLD_TYPE 
    -- (Includiamo i valori storici trovati: confirmed_count, reports_count)
    ALTER TABLE badge_templates DROP CONSTRAINT IF EXISTS badge_templates_threshold_type_check;
    ALTER TABLE badge_templates ADD CONSTRAINT badge_templates_threshold_type_check 
        CHECK (threshold_type IN ('confirmed_count', 'reports_count', 'xp_total'));
END $$;

-- 2. Inserisci badge esplorazione
INSERT INTO badge_templates (id, category, level, threshold_type, threshold_value, pti_bonus, icon_name, color_hex)
VALUES 
('explore_1', 'exploration', 1, 'xp_total', 100, 0, 'map', '#4A90D9'),
('explore_2', 'exploration', 2, 'xp_total', 500, 0, 'compass', '#5BA85C'),
('explore_3', 'exploration', 3, 'xp_total', 1000, 0, 'star', '#D4A017'),
('explore_4', 'exploration', 4, 'xp_total', 2500, 0, 'crown', '#E74C3C'),
('explore_5', 'exploration', 5, 'xp_total', 5000, 0, 'gem', '#9B59B6')
ON CONFLICT (id) DO NOTHING;

-- 3. Localizzazione Taranto
INSERT INTO badge_localizations (tenant_id, badge_template_id, name, description, lore)
VALUES 
('taranto', 'explore_1', 'Viaggiatore', 'Hai mosso i primi passi nella città dei due mari.', 'Ogni grande viaggio inizia con un singolo passo.'),
('taranto', 'explore_2', 'Esploratore', 'Le strade di Taranto non hanno più segreti per te.', 'I naviganti antichi conoscevano ogni insenatura.'),
('taranto', 'explore_3', 'Avventuriero', 'Hai scoperto tesori nascosti che pochi conoscono.', 'Solo i più audaci trovano i passaggi segreti.'),
('taranto', 'explore_4', 'Ambasciatore', 'Sei diventato punto di riferimento per altri viandanti.', 'Gli ambasciatori portavano la voce della città lontano.'),
('taranto', 'explore_5', 'Leggenda Vivente', 'La tua storia è intrecciata con quella di Taranto.', 'Le leggende non muoiono, diventano eternhe.')
ON CONFLICT DO NOTHING;

-- 4. Trigger: assegna badge esplorazione quando total_xp cambia
CREATE OR REPLACE FUNCTION check_and_award_exploration_badges()
RETURNS TRIGGER AS $$
DECLARE
    template RECORD;
    already_has BOOLEAN;
BEGIN
    -- Solo se total_xp è aumentato
    IF NEW.total_xp <= OLD.total_xp THEN
        RETURN NEW;
    END IF;

    FOR template IN 
        SELECT * FROM badge_templates 
        WHERE category = 'exploration' 
        ORDER BY level
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = NEW.id AND badge_template_id = template.id
        ) INTO already_has;

        IF NOT already_has AND NEW.total_xp >= template.threshold_value THEN
            INSERT INTO user_badges (user_id, badge_template_id, earned_at)
            VALUES (NEW.id, template.id, now());
            
            -- Notifica (Edge Function può ascoltare)
            PERFORM pg_notify('badge_awarded', json_build_object(
                'user_id', NEW.id,
                'badge_id', template.id,
                'category', 'exploration',
                'tenant_id', NEW.tenant_id
            )::text);
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger solo se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_award_exploration_badges'
    ) THEN
        CREATE TRIGGER trigger_award_exploration_badges
            AFTER UPDATE OF total_xp ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION check_and_award_exploration_badges();
    END IF;
END $$;

-- Verifica
SELECT bt.id, bt.category, bt.threshold_value, bl.name, bl.description
FROM badge_templates bt
JOIN badge_localizations bl ON bt.id = bl.badge_template_id
WHERE bl.tenant_id = 'taranto' AND bt.category = 'exploration'
ORDER BY bt.level;

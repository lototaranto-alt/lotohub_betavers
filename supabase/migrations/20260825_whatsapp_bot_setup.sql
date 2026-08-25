-- 1. AGGIUNTA COLONNE A POIS PER IL B2B
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS b2b_phone text,
ADD COLUMN IF NOT EXISTS b2b_plan text DEFAULT 'freemium';

-- 2. CREAZIONE TABELLA ADMIN ALERTS PER RICEVERE UPGRADE REQUESTS
CREATE TABLE IF NOT EXISTS public.admin_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 3. FUNZIONE RPC PER LA GENERAZIONE DEI REPORT (USATA DAL CRON / EDGE FUNCTION)
CREATE OR REPLACE FUNCTION public.generate_daily_b2b_reports()
RETURNS TABLE (
    poi_id uuid,
    poi_name text,
    b2b_phone text,
    b2b_plan text,
    checkins_count int,
    whispers_count int,
    whisper_1 text,
    whisper_2 text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH daily_checkins AS (
        SELECT user_pois.poi_id, count(*) as count
        FROM user_pois
        WHERE created_at > now() - interval '24 hours'
        GROUP BY user_pois.poi_id
    ),
    daily_whispers AS (
        SELECT b2b_feedbacks.poi_id, count(*) as count
        FROM b2b_feedbacks
        WHERE created_at > now() - interval '24 hours'
        GROUP BY b2b_feedbacks.poi_id
    ),
    latest_two_whispers AS (
        SELECT 
            poi_id,
            MAX(CASE WHEN rn = 1 THEN message END) as w1,
            MAX(CASE WHEN rn = 2 THEN message END) as w2
        FROM (
            SELECT 
                b2b_feedbacks.poi_id, 
                message,
                ROW_NUMBER() OVER (PARTITION BY b2b_feedbacks.poi_id ORDER BY created_at DESC) as rn
            FROM b2b_feedbacks
            WHERE created_at > now() - interval '24 hours'
        ) sub
        WHERE rn <= 2
        GROUP BY poi_id
    )
    SELECT 
        p.id,
        p.name,
        p.b2b_phone,
        p.b2b_plan,
        COALESCE(c.count, 0)::int,
        COALESCE(w.count, 0)::int,
        lw.w1,
        lw.w2
    FROM pois p
    LEFT JOIN daily_checkins c ON c.poi_id = p.id
    LEFT JOIN daily_whispers w ON w.poi_id = p.id
    LEFT JOIN latest_two_whispers lw ON lw.poi_id = p.id
    WHERE p.category = 'partner' AND p.b2b_phone IS NOT NULL;
END;
$$;

-- 4. DB WEBHOOK TRIGGER (CHIAMA EDGE FUNCTION QUANDO SI ASSOCIA L'NFC)
-- (Sostituire {PROJECT_REF} con l'ID del progetto e gestire l'header Auth nelle impostazioni Webhook della Dashboard, oppure usare pg_net)

CREATE OR REPLACE FUNCTION trigger_whatsapp_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Eseguiamo una chiamata HTTP POST all'Edge Function tramite l'estensione pg_net (se abilitata)
    -- NOTA: In produzione è consigliato usare i Webhook nativi dalla Dashboard di Supabase
    -- per una gestione più sicura dei secret. Questa è una implementazione SQL nativa.
    
    PERFORM net.http_post(
        url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/whatsapp-bot',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'UPDATE',
            'table', 'pois',
            'record', row_to_json(NEW),
            'old_record', row_to_json(OLD)
        )
    );
    RETURN NEW;
END;
$$;

-- Assicuriamoci che non esista già
DROP TRIGGER IF EXISTS whatsapp_onboarding_trigger ON pois;

CREATE TRIGGER whatsapp_onboarding_trigger
AFTER UPDATE ON pois
FOR EACH ROW
WHEN (OLD.nfc_activated_at IS NULL AND NEW.nfc_activated_at IS NOT NULL)
EXECUTE FUNCTION trigger_whatsapp_onboarding();

-- 5. PG_CRON PER REPORT SERALI (Richiede estensione pg_cron abilitata)
-- Lancia la funzione ogni giorno alle 20:30 chiamando l'Edge Function per spedire i messaggi.

-- Assicurati di abilitare l'estensione pg_cron:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedulazione (Alle 20:30 UTC):
SELECT cron.schedule(
    'daily_whatsapp_reports',
    '30 20 * * *',
    $$
    SELECT net.http_post(
        url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/whatsapp-bot',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('action', 'send_daily_reports')
    );
    $$
);

-- =========================================================================
-- migration_v24_app_telemetry.sql
-- ADB 2 - TELEMETRIA DEV / DEBUG (dati per sviluppo e debug, NON venduti)
-- =========================================================================
-- Tabella eventi app (nessuna PII, solo contesto tecnico: evento, versione,
-- OS, tenant) + vista di riepilogo giornaliera per dashboard dev/admin.
--
-- RLS:
--   INSERT  -> consentito a chiunque (user_id NULL = anon ok)
--              oppure al solo utente loggato (user_id = auth.uid())
--   SELECT  -> solo l'utente proprietario della riga
--   vw_dev_telemetry_daily -> postgres, service_role, authenticated
--
-- Idempotente: ri-eseguibile (CREATE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- =========================================================================

-- =========================================================================
-- SEZIONE 3 - TELEMETRIA DEV / DEBUG (dati di sviluppo, non venduti)
-- =========================================================================

-- 3.1 Tabella di telemetria eventi app (nessuna PII, solo contesto tecnico)
CREATE TABLE IF NOT EXISTS public.app_telemetry_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- opzionale, per debug
    event_name  TEXT NOT NULL,          -- es. 'session_start', 'scan_gps', 'error_rpc'
    tenant_id   TEXT DEFAULT 'taranto',
    app_version TEXT,
    os_name     TEXT,
    payload     JSONB DEFAULT '{}'::jsonb  -- contesto tecnico, MAI dati personali
);

CREATE INDEX IF NOT EXISTS idx_app_telemetry_created  ON public.app_telemetry_events(created_at);
CREATE INDEX IF NOT EXISTS idx_app_telemetry_event    ON public.app_telemetry_events(event_name);
CREATE INDEX IF NOT EXISTS idx_app_telemetry_user     ON public.app_telemetry_events(user_id);

ALTER TABLE public.app_telemetry_events ENABLE ROW LEVEL SECURITY;

-- Inserimento consentito all'utente loggato (eventi suoi) o a chi inserisce anonimo
DROP POLICY IF EXISTS "Utenti inseriscono i propri eventi di telemetria" ON public.app_telemetry_events;
CREATE POLICY "Utenti inseriscono i propri eventi di telemetria"
    ON public.app_telemetry_events FOR INSERT
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Lettura: solo l'utente stesso per debug
DROP POLICY IF EXISTS "Lettura telemetria: solo proprio profilo" ON public.app_telemetry_events;
CREATE POLICY "Lettura telemetria: solo proprio profilo"
    ON public.app_telemetry_events FOR SELECT
    USING (auth.uid() = user_id);

-- 3.2 Vista di riepilogo telemetria (per dashboard dev/admin)
DROP VIEW IF EXISTS public.vw_dev_telemetry_daily;
CREATE VIEW public.vw_dev_telemetry_daily AS
SELECT
    created_at::date                    AS day,
    event_name,
    tenant_id,
    app_version,
    os_name,
    COUNT(*)                            AS events,
    COUNT(DISTINCT user_id)             AS affected_users
FROM public.app_telemetry_events
GROUP BY day, event_name, tenant_id, app_version, os_name
ORDER BY day DESC, event_name;

GRANT SELECT ON public.vw_dev_telemetry_daily TO postgres, service_role;
GRANT SELECT ON public.vw_dev_telemetry_daily TO authenticated;

-- =========================================================================
-- SEZIONE CONTROLLI (rieseguire = nessun errore => telemetria pronta)
-- =========================================================================
SELECT 'TABELLA TELEMETRIA' AS chk, COUNT(*) AS colonne
FROM information_schema.columns
WHERE table_schema='public' AND table_name='app_telemetry_events';
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_role TEXT;

UPDATE public.profiles
SET admin_role = 'viewer'
WHERE admin_role IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN admin_role SET DEFAULT 'viewer';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_admin_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_admin_role_check
      CHECK (admin_role IN ('admin', 'analyst', 'viewer'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_admin_role
  ON public.profiles (admin_role);

ALTER TABLE public.impact_transactions
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;

ALTER TABLE public.impact_transactions
  ADD COLUMN IF NOT EXISTS action_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'impact_transactions_action_type_check'
      AND conrelid = 'public.impact_transactions'::regclass
  ) THEN
    ALTER TABLE public.impact_transactions
      ADD CONSTRAINT impact_transactions_action_type_check
      CHECK (
        action_type IS NULL
        OR action_type IN ('tourist_checkin', 'civic_action', 'event', 'refill', 'unknown')
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_impact_transactions_tenant_created
  ON public.impact_transactions (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_impact_transactions_action_created
  ON public.impact_transactions (action_type, created_at);

CREATE OR REPLACE FUNCTION public.is_loto_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.admin_role IN ('admin', 'analyst')
    );
$$;

REVOKE ALL ON FUNCTION public.is_loto_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_loto_admin() TO authenticated, service_role;

DROP VIEW IF EXISTS public.vw_daas_heatmap_15min;
CREATE VIEW public.vw_daas_heatmap_15min AS
WITH cells AS (
  SELECT
    COALESCE(p.tenant_id::text, 'unassigned') AS tenant_id,
    ROUND(up.lat::numeric, 3)::double precision AS grid_lat,
    ROUND(up.lng::numeric, 3)::double precision AS grid_lng,
    DATE_TRUNC('hour', up.visited_at)
      + INTERVAL '15 min' * (EXTRACT(minute FROM up.visited_at)::int / 15) AS time_block,
    up.poi_id,
    up.profile_id,
    COALESCE(up.co2_saved, 0) AS co2_saved
  FROM public.user_pois up
  JOIN public.pois p ON p.id = up.poi_id
  WHERE public.is_loto_admin()
    AND up.is_shadowbanned IS NOT TRUE
    AND up.lat IS NOT NULL
    AND up.lng IS NOT NULL
    AND up.visited_at IS NOT NULL
)
SELECT
  tenant_id,
  grid_lat,
  grid_lng,
  time_block,
  poi_id,
  COUNT(*) AS checkins,
  COUNT(DISTINCT profile_id) AS unique_visitors,
  SUM(co2_saved) AS co2_saved_kg,
  5 AS k_anonymity_threshold
FROM cells
GROUP BY tenant_id, grid_lat, grid_lng, time_block, poi_id
HAVING COUNT(DISTINCT profile_id) >= 5;

REVOKE ALL ON public.vw_daas_heatmap_15min FROM anon;
GRANT SELECT ON public.vw_daas_heatmap_15min TO authenticated, service_role;

DROP VIEW IF EXISTS public.vw_daas_esg_monthly;
CREATE VIEW public.vw_daas_esg_monthly AS
WITH tourist_source AS (
  SELECT
    COALESCE(p.tenant_id::text, 'unassigned') AS tenant_id,
    DATE_TRUNC('month', up.visited_at) AS month,
    up.profile_id,
    COALESCE(up.co2_saved, 0) AS co2_saved,
    COALESCE(up.xp_awarded, 0) AS xp_awarded
  FROM public.user_pois up
  JOIN public.pois p ON p.id = up.poi_id
  WHERE public.is_loto_admin()
    AND up.is_shadowbanned IS NOT TRUE
    AND up.visited_at IS NOT NULL
),
tourist_month AS (
  SELECT
    tenant_id,
    month,
    COUNT(*) AS tourist_checkins,
    COUNT(DISTINCT profile_id) AS tourist_users,
    SUM(co2_saved) AS tourist_co2_saved,
    SUM(xp_awarded) AS tourist_xp
  FROM tourist_source
  GROUP BY tenant_id, month
),
civic_ledger_source AS (
  SELECT
    COALESCE(NULLIF(tenant_id, ''), 'unassigned') AS tenant_id,
    DATE_TRUNC('month', created_at) AS month,
    profile_id,
    action_type,
    COALESCE(tokens_earned, 0) AS tokens_earned,
    COALESCE(co2_saved, 0) AS co2_saved,
    COALESCE(liters_saved, 0) AS liters_saved,
    COALESCE(xp_earned, 0) AS xp_earned
  FROM public.impact_transactions
  WHERE public.is_loto_admin()
    AND created_at IS NOT NULL
),
civic_ledger_month AS (
  SELECT
    tenant_id,
    month,
    COUNT(*) FILTER (
      WHERE action_type IN ('civic_action', 'event', 'refill')
    ) AS civic_transactions,
    COALESCE(SUM(tokens_earned) FILTER (
      WHERE action_type IN ('civic_action', 'event', 'refill')
    ), 0) AS civic_pti,
    COALESCE(SUM(co2_saved) FILTER (
      WHERE action_type IN ('civic_action', 'event', 'refill')
    ), 0) AS civic_co2_saved,
    COALESCE(SUM(liters_saved) FILTER (
      WHERE action_type IN ('civic_action', 'event', 'refill')
    ), 0) AS civic_liters_saved,
    COUNT(*) FILTER (
      WHERE action_type IS NULL
        OR action_type NOT IN ('tourist_checkin', 'civic_action', 'event', 'refill', 'unknown')
    ) AS unclassified_transactions
  FROM civic_ledger_source
  GROUP BY tenant_id, month
),
civic_reports_month AS (
  SELECT
    COALESCE(NULLIF(tenant_id, ''), 'unassigned') AS tenant_id,
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS civic_actions,
    COUNT(*) FILTER (
      WHERE status IN ('confirmed', 'verified', 'resolved')
    ) AS confirmed_reports,
    COUNT(*) FILTER (
      WHERE status IN ('pending', 'pending_match')
    ) AS pending_reports
  FROM public.civic_reports
  WHERE public.is_loto_admin()
    AND created_at IS NOT NULL
  GROUP BY COALESCE(NULLIF(tenant_id, ''), 'unassigned'), DATE_TRUNC('month', created_at)
),
months AS (
  SELECT tenant_id, month FROM tourist_month
  UNION
  SELECT tenant_id, month FROM civic_ledger_month
  UNION
  SELECT tenant_id, month FROM civic_reports_month
),
activity AS (
  SELECT tenant_id, month, profile_id FROM tourist_source
  UNION
  SELECT tenant_id, month, profile_id
  FROM civic_ledger_source
  WHERE action_type IN ('civic_action', 'event', 'refill')
),
active_users AS (
  SELECT tenant_id, month, COUNT(DISTINCT profile_id) AS active_users
  FROM activity
  GROUP BY tenant_id, month
)
SELECT
  m.tenant_id,
  m.month,
  COALESCE(t.tourist_checkins, 0) AS checkins,
  COALESCE(au.active_users, 0) AS active_users,
  COALESCE(t.tourist_co2_saved, 0) + COALESCE(cl.civic_co2_saved, 0) AS co2_saved,
  COALESCE(t.tourist_co2_saved, 0) AS tourist_co2_saved,
  COALESCE(cl.civic_co2_saved, 0) AS civic_co2_saved,
  COALESCE(cl.civic_liters_saved, 0) AS liters_saved,
  COALESCE(cl.civic_pti, 0) AS pti_generated,
  COALESCE(t.tourist_xp, 0) AS xp_earned,
  COALESCE(t.tourist_xp, 0) AS tourist_xp_earned,
  COALESCE(cl.civic_pti, 0) AS civic_pti_generated,
  COALESCE(cr.civic_actions, 0) AS civic_actions,
  COALESCE(cr.confirmed_reports, 0) AS confirmed_reports,
  COALESCE(cr.pending_reports, 0) AS pending_reports,
  COALESCE(cl.unclassified_transactions, 0) AS unclassified_transactions
FROM months m
LEFT JOIN tourist_month t
  ON t.tenant_id = m.tenant_id AND t.month = m.month
LEFT JOIN civic_ledger_month cl
  ON cl.tenant_id = m.tenant_id AND cl.month = m.month
LEFT JOIN civic_reports_month cr
  ON cr.tenant_id = m.tenant_id AND cr.month = m.month
LEFT JOIN active_users au
  ON au.tenant_id = m.tenant_id AND au.month = m.month;

REVOKE ALL ON public.vw_daas_esg_monthly FROM anon;
GRANT SELECT ON public.vw_daas_esg_monthly TO authenticated, service_role;

DROP VIEW IF EXISTS public.vw_daas_event_attendance;
CREATE VIEW public.vw_daas_event_attendance AS
SELECT
  e.tenant_id,
  e.id AS event_id,
  e.title AS event_title,
  e.event_date,
  e.poi_id,
  COUNT(up.id) AS checkins,
  COUNT(DISTINCT up.profile_id) AS participants,
  COALESCE(SUM(up.co2_saved), 0) AS co2_saved,
  5 AS k_anonymity_threshold
FROM public.events e
LEFT JOIN public.user_pois up
  ON up.poi_id = e.poi_id
  AND up.visited_at::date = COALESCE(e.event_date::date, e.start_time::date)
  AND up.is_shadowbanned IS NOT TRUE
WHERE public.is_loto_admin()
  AND e.event_type IN ('web_public', 'nodo_community', 'civic')
GROUP BY e.tenant_id, e.id, e.title, e.event_date, e.poi_id
HAVING COUNT(DISTINCT up.profile_id) >= 5;

REVOKE ALL ON public.vw_daas_event_attendance FROM anon;
GRANT SELECT ON public.vw_daas_event_attendance TO authenticated, service_role;

DROP VIEW IF EXISTS public.vw_user_dashboard_metrics;
CREATE VIEW public.vw_user_dashboard_metrics AS
WITH poi_agg AS (
  SELECT
    profile_id,
    COUNT(DISTINCT poi_id) AS pois_discovered,
    COUNT(*) FILTER (WHERE visited_at::date = CURRENT_DATE) AS checkins_today,
    SUM(COALESCE(co2_saved, 0)) AS co2_saved_gps,
    SUM(COALESCE(xp_awarded, 0)) AS xp_gps,
    MAX(visited_at) AS last_poi_visit
  FROM public.user_pois
  WHERE is_shadowbanned IS NOT TRUE
    AND visited_at IS NOT NULL
  GROUP BY profile_id
),
tx_agg AS (
  SELECT
    profile_id,
    SUM(COALESCE(co2_saved, 0)) AS co2_saved_ledger,
    SUM(COALESCE(liters_saved, 0)) AS liters_saved,
    SUM(COALESCE(tokens_earned, 0)) FILTER (
      WHERE action_type IN ('civic_action', 'event', 'refill')
    ) AS civic_pti,
    SUM(COALESCE(xp_earned, 0)) FILTER (
      WHERE action_type = 'tourist_checkin'
    ) AS xp_ledger,
    MAX(created_at) AS last_tx
  FROM public.impact_transactions
  WHERE created_at IS NOT NULL
  GROUP BY profile_id
),
badge_agg AS (
  SELECT
    user_id,
    COUNT(*) AS badges_count,
    MAX(awarded_at) AS last_badge_at
  FROM public.user_badges
  WHERE awarded_at IS NOT NULL
  GROUP BY user_id
)
SELECT
  p.id AS profile_id,
  p.nickname,
  COALESCE(poi.pois_discovered, 0) AS pois_discovered,
  COALESCE(poi.checkins_today, 0) AS checkins_today,
  COALESCE(tx.civic_pti, 0) AS tokens,
  ROUND((COALESCE(tx.co2_saved_ledger, 0) + COALESCE(poi.co2_saved_gps, 0))::numeric, 2) AS co2_saved,
  COALESCE(tx.liters_saved, 0) AS liters_saved,
  COALESCE(tx.xp_ledger, 0) + COALESCE(poi.xp_gps, 0) AS total_xp,
  COALESCE(bad.badges_count, 0) AS badges_count,
  GREATEST(bad.last_badge_at, poi.last_poi_visit, tx.last_tx) AS last_activity_at
FROM public.profiles p
LEFT JOIN poi_agg poi ON poi.profile_id = p.id
LEFT JOIN tx_agg tx ON tx.profile_id = p.id
LEFT JOIN badge_agg bad ON bad.user_id = p.id
WHERE p.id = auth.uid()
   OR public.is_loto_admin();

REVOKE ALL ON public.vw_user_dashboard_metrics FROM anon;
GRANT SELECT ON public.vw_user_dashboard_metrics TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.app_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  tenant_id TEXT DEFAULT 'taranto',
  app_version TEXT,
  os_name TEXT,
  payload JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_app_telemetry_created
  ON public.app_telemetry_events (created_at);

CREATE INDEX IF NOT EXISTS idx_app_telemetry_event
  ON public.app_telemetry_events (event_name);

CREATE INDEX IF NOT EXISTS idx_app_telemetry_user
  ON public.app_telemetry_events (user_id);

ALTER TABLE public.app_telemetry_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own telemetry events" ON public.app_telemetry_events;
CREATE POLICY "Users insert own telemetry events"
  ON public.app_telemetry_events FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own telemetry events" ON public.app_telemetry_events;
CREATE POLICY "Users read own telemetry events"
  ON public.app_telemetry_events FOR SELECT
  USING (auth.uid() = user_id);

DROP VIEW IF EXISTS public.vw_dev_telemetry_daily;
CREATE VIEW public.vw_dev_telemetry_daily AS
SELECT
  created_at::date AS day,
  event_name,
  tenant_id,
  app_version,
  os_name,
  COUNT(*) AS events,
  COUNT(DISTINCT user_id) AS affected_users
FROM public.app_telemetry_events
WHERE public.is_loto_admin()
GROUP BY day, event_name, tenant_id, app_version, os_name;

REVOKE ALL ON public.vw_dev_telemetry_daily FROM anon;
GRANT SELECT ON public.vw_dev_telemetry_daily TO authenticated, service_role;

COMMIT;

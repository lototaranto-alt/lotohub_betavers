import { isSupabaseConfigured, supabase } from './supabase'

export type EsgMonthlyRow = {
  month: string | null
  checkins: number | null
  active_users: number | null
  co2_saved: number | null
  liters_saved: number | null
  pti_generated: number | null
  xp_earned: number | null
  confirmed_reports: number | null
  pending_reports: number | null
}

export type HeatmapRow = {
  grid_lat: number | null
  grid_lng: number | null
  time_block: string | null
  poi_id: string | null
  checkins: number | null
  unique_visitors: number | null
  co2_saved_kg: number | null
}

export type EventAttendanceRow = {
  event_id: string | null
  tenant_id: string | null
  event_title: string | null
  event_date: string | null
  poi_id: string | null
  checkins: number | null
  participants: number | null
  co2_saved: number | null
}

export type TelemetryDailyRow = {
  day: string | null
  event_name: string | null
  tenant_id: string | null
  app_version: string | null
  os_name: string | null
  events: number | null
  affected_users: number | null
}

export type DaasSection = 'esg' | 'heatmap' | 'events' | 'telemetry'

export type DaasSnapshot = {
  esgMonthly: EsgMonthlyRow[]
  heatmap: HeatmapRow[]
  eventAttendance: EventAttendanceRow[]
  telemetryDaily: TelemetryDailyRow[]
  errors: Record<DaasSection, string | null>
}

function getErrorMessage(error: { message?: string } | null) {
  return error?.message || null
}

export async function getDaasSnapshot(): Promise<DaasSnapshot> {
  if (!isSupabaseConfigured) {
    const message = 'Configurazione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY mancante.'
    return {
      esgMonthly: [],
      heatmap: [],
      eventAttendance: [],
      telemetryDaily: [],
      errors: {
        esg: message,
        heatmap: message,
        events: message,
        telemetry: message,
      },
    }
  }

  const [esgResult, heatmapResult, eventsResult, telemetryResult] = await Promise.all([
    supabase
      .from('vw_daas_esg_monthly')
      .select('*')
      .order('month', { ascending: false })
      .limit(12),
    supabase
      .from('vw_daas_heatmap_15min')
      .select('*')
      .order('time_block', { ascending: false })
      .limit(100),
    supabase
      .from('vw_daas_event_attendance')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(50),
    supabase
      .from('vw_dev_telemetry_daily')
      .select('*')
      .order('day', { ascending: false })
      .limit(50),
  ])

  return {
    esgMonthly: (esgResult.data || []) as EsgMonthlyRow[],
    heatmap: (heatmapResult.data || []) as HeatmapRow[],
    eventAttendance: (eventsResult.data || []) as EventAttendanceRow[],
    telemetryDaily: (telemetryResult.data || []) as TelemetryDailyRow[],
    errors: {
      esg: getErrorMessage(esgResult.error),
      heatmap: getErrorMessage(heatmapResult.error),
      events: getErrorMessage(eventsResult.error),
      telemetry: getErrorMessage(telemetryResult.error),
    },
  }
}

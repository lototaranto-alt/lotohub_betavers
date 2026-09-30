import { supabase } from './supabase';
import { calculateLevel } from './levelUtils';

// ADB 2 - Aggregazione dati lato DB (SSOT).
// Le viste vw_daas_* e vw_user_dashboard_metrics / app_telemetry_events sono
// definite nelle migration v22/v23/v24. Questo modulo espone gli helper client
// che si appoggiano a quelle viste, con fallback sicuro se non ancora deployate.

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

// Prestige Card con metriche CALCOLATE lato DB (vw_user_dashboard_metrics).
// La vista aggrega user_pois + impact_transactions + user_badges real-time (SSOT),
// sostituendo le colonne statiche di profiles (pois_discovered/total_co2/total_tokens/total_xp).
// Fallback sicuro: se la vista non è ancora deployata sul cloud, si ripiega sul profilo statico.
export async function enrichProfileWithDbMetrics(profile: any): Promise<any> {
  if (!profile?.id) return profile;
  try {
    const { data, error } = await supabase
      .from('vw_user_dashboard_metrics')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (error || !data) return profile;
    return {
      ...profile,
      pois_discovered: data.pois_discovered ?? profile.pois_discovered,
      total_co2: data.co2_saved ?? profile.total_co2,
      total_tokens: data.tokens ?? profile.total_tokens,
      total_xp: data.total_xp ?? profile.total_xp,
      metricsFromDb: true,
    };
  } catch {
    return profile;
  }
}

// Telemetria non bloccante per dev/debug (tabella app_telemetry_events).
// MAI dati personali: solo contesto tecnico (evento, versione app, OS, tenant).
// Se il log fallisce o la tabella non esiste ancora, si ignora in silenzio.
export async function sendTelemetry(eventName: string, payload: any = {}, osName = 'android'): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    await supabase.from('app_telemetry_events').insert({
      user_id: userId,
      event_name: eventName,
      tenant_id: 'taranto',
      app_version: '1.0.2',
      os_name: osName,
      payload,
    });
  } catch {}
}

// Helper per il log di avvio sessione con livello calcolato lato client.
export async function sendSessionStartTelemetry(totalXp: number): Promise<void> {
  const safeXp = typeof totalXp === 'number' && !Number.isNaN(totalXp) ? totalXp : 0;
  await sendTelemetry('session_start', { xp: safeXp, level: calculateLevel(safeXp) });
}
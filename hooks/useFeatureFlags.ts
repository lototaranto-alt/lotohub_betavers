import { useTenant } from '../context/TenantContext';

/**
 * [NOTA DI SVILUPPO - FASE 4: Whitelabel & Multi-Tenant]
 * Questo hook è il cuore pulsante dei Feature Flags dinamici.
 * Si collega al TenantContext per leggere le 'features' del Comune attualmente caricato.
 * Viene usato dai vari componenti (es. options.tsx) per nascondere o mostrare
 * intere sezioni dell'app (es. Segnalazioni Civiche, Eventi, Boost).
 * 
 * Se un tenant non ha configurato i flag, vengono applicati i valori di fallback (es. false).
 */
export const useFeatureFlags = () => {
  const { tenant } = useTenant();
  
  return {
    civicModule: tenant?.features?.civic_module ?? false,
    events: tenant?.features?.events ?? false,
    communityChallenges: tenant?.features?.community_challenges ?? false,
    premiumBoost: tenant?.features?.premium_boost ?? false,
    bleHeatmap: tenant?.features?.ble_heatmap ?? false,
    gamification: tenant?.features?.gamification ?? true,
  };
};

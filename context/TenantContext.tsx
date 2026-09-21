// context/TenantContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';

// --- Types ---

export interface TenantColors {
  primary: string;
  secondary: string;
}

export interface TenantFeatures {
  civic_module: boolean;
  gamification: boolean;
  events: boolean;
  community_challenges: boolean;
  ble_heatmap: boolean;
  premium_boost: boolean;
}

export interface TenantLocalization {
  locale: string;
  onboarding_title: string;
  onboarding_subtitle: string;
  onboarding_cta: string;
  points_name: string;
  points_name_plural: string;
  civic_module_name: string;
  civic_submit_button: string;
  civic_success_message: string;
  events_tab_name: string;
  events_empty_state: string;
}

export interface TenantConfig {
  id: string;
  displayName: string;
  slug: string;
  colors: TenantColors;
  logoUrl?: string;
  cityName: string;
  region?: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  features: TenantFeatures;
  localization: TenantLocalization;
  maxPois: number;
  maxPartners: number;
  maxEventsActive: number;
  status: string;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  currentTenant: TenantConfig | null; // Backwards compatibility
  isLoading: boolean;
  error: string | null;
  availableTenants: Pick<TenantConfig, 'id' | 'displayName' | 'cityName'>[];
  resolveTenant: (tenantId?: string) => Promise<void>;
  setTenantManually: (tenantId: string) => Promise<void>;
  setTenantManual: (tenantId: string) => Promise<void>; // Backwards compatibility
  refreshTenant: () => Promise<void>;
}

// --- Haversine (distanza in km) ---

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Context ---

const TenantContext = createContext<TenantContextType | null>(null);

export const TenantProvider: React.FC<{
  children: React.ReactNode;
  initialTenantId?: string;
}> = ({ children, initialTenantId }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantContextType['availableTenants']>([]);

  // Fetch tutti i tenant attivi
  const fetchAllTenants = useCallback(async () => {
    const { data, error: sbError } = await supabase
      .from('tenants')
      .select('id, display_name, city_name, center_lat, center_lng')
      .eq('status', 'active');

    if (sbError) throw sbError;
    return data || [];
  }, []);

  // Fetch tenant completo con localizzazione
  const fetchTenantById = useCallback(async (tenantId: string): Promise<TenantConfig> => {
    const { data, error: sbError } = await supabase
      .from('tenants')
      .select(`
        *,
        localization:tenant_localizations(*)
      `)
      .eq('id', tenantId)
      .eq('tenant_localizations.locale', 'it')
      .single();

    if (sbError || !data) throw sbError || new Error('Tenant non trovato');

    const loc = data.localization?.[0] || {};

    return {
      id: data.id,
      displayName: data.display_name,
      slug: data.slug,
      colors: {
        primary: data.primary_color || '#E74C3C',
        secondary: data.secondary_color || '#2C3E50',
      },
      logoUrl: data.logo_url,
      cityName: data.city_name,
      region: data.region,
      centerLat: parseFloat(data.center_lat),
      centerLng: parseFloat(data.center_lng),
      defaultZoom: data.default_zoom,
      features: data.features as TenantFeatures,
      localization: {
        locale: loc.locale || 'it',
        onboarding_title: loc.onboarding_title || 'Benvenuto',
        onboarding_subtitle: loc.onboarding_subtitle || '',
        onboarding_cta: loc.onboarding_cta || 'Inizia',
        points_name: loc.points_name || 'PTI',
        points_name_plural: loc.points_name_plural || 'PTI',
        civic_module_name: loc.civic_module_name || 'Segnalazioni',
        civic_submit_button: loc.civic_submit_button || 'Invia',
        civic_success_message: loc.civic_success_message || 'Grazie!',
        events_tab_name: loc.events_tab_name || 'Eventi',
        events_empty_state: loc.events_empty_state || 'Nessun evento',
      },
      maxPois: data.max_pois,
      maxPartners: data.max_partners,
      maxEventsActive: data.max_events_active,
      status: data.status,
    };
  }, []);

  /**
   * [NOTA DI SVILUPPO - FASE 4: Whitelabel]
   * Questa funzione è responsabile di decidere QUALE Comune caricare all'avvio.
   * L'algoritmo segue questo ordine di priorità:
   * 1. Deep Link (es. loto://app?tenant=borgo-test) -> Utile per campagne marketing.
   * 2. GPS Fallback -> Calcola l'Haversine distance; se sei a < 50km dal centro di un tenant attivo, lo carica.
   * 3. Default Fallback -> Carica il primo tenant attivo disponibile (es. Taranto).
   */
  const resolveTenant = useCallback(async (forcedId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let targetId = forcedId;

      // 1. Deep link
      if (!targetId) {
        const url = await Linking.getInitialURL();
        if (url) {
          const { queryParams } = Linking.parse(url);
          if (queryParams?.tenant) {
            targetId = queryParams.tenant as string;
          }
        }
      }

      // Pre-carichiamo tutti i tenant (ci serve in ogni caso)
      const allTenants = await fetchAllTenants();
      setAvailableTenants(allTenants.map(t => ({ id: t.id, displayName: t.display_name, cityName: t.city_name })));

      // Trova Taranto come fallback sicuro
      const fallbackTenant = allTenants.find(t => t.city_name === 'Taranto') || allTenants[0];

      // 2. GPS fallback intelligente e scalabile
      if (!targetId) {
        try {
          // Controlliamo se abbiamo GIA' i permessi, per non bloccare l'UI inutilmente all'avvio
          const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
          
          if (existingStatus === 'granted') {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = location.coords;

            if (allTenants.length > 0) {
              let closest = allTenants[0];
              let minDist = haversine(latitude, longitude, parseFloat(closest.center_lat), parseFloat(closest.center_lng));

              for (const t of allTenants) {
                const dist = haversine(latitude, longitude, parseFloat(t.center_lat), parseFloat(t.center_lng));
                if (dist < minDist) {
                  minDist = dist;
                  closest = t;
                }
              }

                            // --- DEBITO TECNICO DOC 1: HARD-LOCK SU TARANTO (Alpha) ---
              // Sospensione temporanea della logica di auto-switch dinamico entro 50km 
              // per garantire la stabilità assoluta del tenant durante i test Guerrilla.
              // if (minDist < 50) {
              //   targetId = closest.id;
              // }
              targetId = fallbackTenant?.id;
            }
          } else {
            // Se i permessi NON sono ancora concessi, non forziamo la richiesta qui!
            // Lasciamo che sia index.tsx o l'onboarding a chiederla con calma.
            // Assegniamo temporaneamente il fallback così l'App non glitcha "senza tema".
            targetId = fallbackTenant?.id;
          }
        } catch (gpsError) {
          console.warn('GPS fallback fallito o disabilitato, ignoro...', gpsError);
        }
      }

      // 3. Assegnazione Finale
      if (!targetId && fallbackTenant) {
        targetId = fallbackTenant.id;
      }

      if (targetId) {
        const config = await fetchTenantById(targetId);
        setTenant(config);
      } else {
        setTenant(null);
      }
      
    } catch (err: any) {
      console.error('Tenant resolution error:', err);
      setError(err.message || 'Errore risoluzione tenant');
    } finally {
      setIsLoading(false);
    }
  }, [fetchTenantById, fetchAllTenants]);

  const setTenantManually = useCallback(async (tenantId: string) => {
    setIsLoading(true);
    try {
      const config = await fetchTenantById(tenantId);
      setTenant(config);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTenantById]);

  const refreshTenant = useCallback(async () => {
    if (tenant?.id) {
      await setTenantManually(tenant.id);
    }
  }, [tenant?.id, setTenantManually]);

  useEffect(() => {
    resolveTenant(initialTenantId);
  }, [initialTenantId, resolveTenant]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      const { queryParams } = Linking.parse(event.url);
      if (queryParams?.tenant) {
        setTenantManually(queryParams.tenant as string);
      }
    });
    return () => subscription.remove();
  }, [setTenantManually]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        currentTenant: tenant,
        isLoading,
        error,
        availableTenants,
        resolveTenant,
        setTenantManually,
        setTenantManual: setTenantManually,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used inside TenantProvider');
  return ctx;
};



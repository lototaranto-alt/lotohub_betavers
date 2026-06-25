import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { TenantConfig, TENANTS, DEFAULT_TENANT, findTenantByCoords } from '../config/tenants';
import { supabase } from '../utils/supabase';

const MANUAL_TENANT_KEY = 'loto_manual_tenant_id';
const GPS_MODE_KEY = 'loto_gps_mode_active';

export interface DynamicTenantConfig extends TenantConfig {
  ticker_text?: string;
}

interface TenantContextType {
  currentTenant: DynamicTenantConfig;
  setTenantManual: (tenantId: string) => Promise<void>;
  isGpsMode: boolean;
  enableGpsMode: () => Promise<void>;
  loading: boolean;
  availableTenants: DynamicTenantConfig[];
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [availableTenants, setAvailableTenants] = useState<DynamicTenantConfig[]>(TENANTS);
  const [currentTenant, setCurrentTenant] = useState<DynamicTenantConfig>(DEFAULT_TENANT);
  const [isGpsMode, setIsGpsMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Riferimenti per gestire l'isteresi del cambio di confine
  const pendingTenantRef = useRef<DynamicTenantConfig | null>(null);
  const hysteresisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // 1. Inizializzazione all'avvio
  useEffect(() => {
    const initializeTenant = async () => {
      try {
        // A. Carica i Tenants dal Database Supabase
        console.log('[TenantContext] Fetching tenants da Supabase...');
        const { data: dbTerritories, error } = await supabase.from('territories').select('*');
        let dynamicTenants = TENANTS; // fallback
        
        if (!error && dbTerritories && dbTerritories.length > 0) {
          dynamicTenants = dbTerritories.map(t => ({
            id: t.name.toLowerCase(), // Usiamo il nome in minuscolo come ID provvisorio se l'ID è un UUID
            name: t.name,
            colors: t.colors || DEFAULT_TENANT.colors,
            assets: t.assets || DEFAULT_TENANT.assets,
            mapboxStyle: t.mapbox_style || DEFAULT_TENANT.mapboxStyle,
            center: t.center || DEFAULT_TENANT.center,
            boundaries: t.boundaries || DEFAULT_TENANT.boundaries,
            ticker_text: t.ticker_text
          }));
          setAvailableTenants(dynamicTenants);
          console.log(`[TenantContext] Caricati ${dynamicTenants.length} tenants dal database.`);
        } else {
          console.log('[TenantContext] Usa tenants locali (fallback).');
        }

        const savedGpsMode = await AsyncStorage.getItem(GPS_MODE_KEY);
        const savedManualId = await AsyncStorage.getItem(MANUAL_TENANT_KEY);

        console.log('[TenantContext] Init - GPS Mode salvato:', savedGpsMode, '| Tenant manuale salvato:', savedManualId);

        if (savedGpsMode === 'false' && savedManualId) {
          // L'utente ha disabilitato il GPS e forzato un comune manuale
          const tenant = dynamicTenants.find(t => t.id === savedManualId);
          if (tenant) {
            setCurrentTenant(tenant);
            setIsGpsMode(false);
            console.log('[TenantContext] Caricato tenant manuale salvato:', tenant.name);
            setLoading(false);
            return;
          }
        }

        // Altrimenti, proviamo ad avviare la geolocalizzazione automatica
        await startGpsDetection(dynamicTenants);
      } catch (error) {
        console.error('[TenantContext] Errore durante inizializzazione tenant:', error);
        setLoading(false);
      }
    };

    initializeTenant();

    return () => {
      // Pulizia delle sottoscrizioni e dei timer al disaccoppiamento
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
      if (hysteresisTimerRef.current) {
        clearTimeout(hysteresisTimerRef.current);
      }
    };
  }, []);

  // 2. Funzione principale per rilevamento GPS
  const startGpsDetection = async (tenantsList = availableTenants) => {
    try {
      console.log('[TenantContext] Avvio rilevamento GPS...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('[TenantContext] Permessi GPS negati. Fallback alla selezione manuale.');
        await handleGpsFailure(tenantsList);
        return;
      }

      // Rileva posizione corrente immediata
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Modifica la ricerca per usare la lista dinamica al posto di TENANTS (che è in config)
      // findTenantByCoords usa TENANTS internamente, la adattiamo usando un loop locale.
      let detectedTenant = null;
      for (const tenant of tenantsList) {
        const coords = tenant.boundaries?.coordinates;
        if (!coords) continue;
        for (const multipolygon of coords) {
          for (const polygon of multipolygon) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const pt of polygon) {
              const [lon, lat] = pt;
              if (lon < minX) minX = lon;
              if (lon > maxX) maxX = lon;
              if (lat < minY) minY = lat;
              if (lat > maxY) maxY = lat;
            }
            if (location.coords.longitude >= minX && location.coords.longitude <= maxX && location.coords.latitude >= minY && location.coords.latitude <= maxY) {
              detectedTenant = tenant;
              break;
            }
          }
          if (detectedTenant) break;
        }
        if (detectedTenant) break;
      }
      
      if (detectedTenant) {
        console.log('[TenantContext] GPS Rilevato tenant corrente:', detectedTenant.name);
        setCurrentTenant(detectedTenant);
        await AsyncStorage.setItem(GPS_MODE_KEY, 'true');
        setIsGpsMode(true);
      } else {
        console.log('[TenantContext] L\'utente è fuori dai confini attivi. Fallback manuale.');
        await handleGpsFailure(tenantsList);
      }

      // Avvia l'ascolto continuo per gestire l'isteresi del cambio di confine
      startLocationWatching();

    } catch (error) {
      console.error('[TenantContext] Errore nel rilevamento GPS:', error);
      await handleGpsFailure(tenantsList);
    } finally {
      setLoading(false);
    }
  };

  // 3. Gestione fallimento GPS (Coordinate non valide o permessi negati)
  const handleGpsFailure = async (tenantsList = availableTenants) => {
    setIsGpsMode(false);
    await AsyncStorage.setItem(GPS_MODE_KEY, 'false');

    // Recupera l'ultimo tenant impostato manualmente o il default
    const savedManualId = await AsyncStorage.getItem(MANUAL_TENANT_KEY);
    const tenant = tenantsList.find(t => t.id === savedManualId) || tenantsList[0] || DEFAULT_TENANT;
    
    console.log('[TenantContext] Fallback GPS attivo. Tenant caricato:', tenant.name);
    setCurrentTenant(tenant);
  };

  // 4. Ascolto continuo della posizione per Isteresi Confini (5 minuti)
  const startLocationWatching = async () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
    }

    try {
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50, // Notifica ogni 50 metri per non sovraccaricare
        },
        (location) => {
          if (!isGpsMode) return; // Se l'utente è in modalità manuale, ignora il GPS

          const detectedTenant = findTenantByCoords(location.coords.latitude, location.coords.longitude);
          
          if (!detectedTenant) {
            // L'utente è uscito dai confini attivi (es. in autostrada), annulla timer pendenti
            clearHysteresis();
            return;
          }

          if (detectedTenant.id === currentTenant.id) {
            // L'utente è all'interno dello stesso territorio attivo, annulla timer pendenti
            clearHysteresis();
          } else {
            // L'utente è entrato in un NUOVO territorio attivo (es. Lecce)
            handleBorderlineTransition(detectedTenant);
          }
        }
      );
    } catch (err) {
      console.error('[TenantContext] Errore nell\'ascolto della posizione:', err);
    }
  };

  // Gestione dell'isteresi di transizione confine
  const handleBorderlineTransition = (newTenant: TenantConfig) => {
    // Se stiamo già attendendo la transizione per lo stesso comune, non fare nulla
    if (pendingTenantRef.current?.id === newTenant.id) {
      return;
    }

    // Altrimenti, annulla timer precedenti ed imposta il nuovo comune pendente
    clearHysteresis();
    pendingTenantRef.current = newTenant;

    console.log(`[TenantContext] Transizione Rilevata: Rilevato comune ${newTenant.name}. Inizio isteresi 5 minuti...`);

    // Avvia un timer di 5 minuti (300.000 ms). Per scopi di test/debug rapido, in sviluppo visualizziamo 5 minuti logici.
    // In produzione = 5 minuti (300000ms)
    const HYS_TIME = 300000; 

    hysteresisTimerRef.current = setTimeout(() => {
      console.log(`[TenantContext] Isteresi Completata: Consolidato nei confini di ${newTenant.name}. Cambio di Tenant Effettuato.`);
      setCurrentTenant(newTenant);
      clearHysteresis();
    }, HYS_TIME);
  };

  const clearHysteresis = () => {
    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
      hysteresisTimerRef.current = null;
    }
    pendingTenantRef.current = null;
  };

  // 5. Metodo per impostare manualmente il tenant
  const setTenantManual = async (tenantId: string) => {
    let tenant = availableTenants.find(t => t.id === tenantId);
    if (!tenant) {
      tenant = TENANTS.find(t => t.id === tenantId);
    }
    if (!tenant) return;

    console.log('[TenantContext] Selezione manuale tenant effettuata:', tenant.name);
    
    // Ferma l'ascolto GPS continuo se attivo
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    clearHysteresis();

    setCurrentTenant(tenant);
    setIsGpsMode(false);
    
    await AsyncStorage.setItem(GPS_MODE_KEY, 'false');
    await AsyncStorage.setItem(MANUAL_TENANT_KEY, tenantId);
  };

  // 6. Metodo per riattivare la localizzazione GPS automatica
  const enableGpsMode = async () => {
    setLoading(true);
    await AsyncStorage.setItem(GPS_MODE_KEY, 'true');
    await AsyncStorage.removeItem(MANUAL_TENANT_KEY);
    await startGpsDetection();
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setTenantManual,
        isGpsMode,
        enableGpsMode,
        loading,
        availableTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant deve essere utilizzato all\'interno di un TenantProvider');
  }
  return context;
}

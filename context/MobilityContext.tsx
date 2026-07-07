import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MobilityType = 'dolce' | 'pubblica' | 'privata' | null;
export type MobilityRadius = 2 | 10 | 30;

interface MobilityContextType {
  mobilityType: MobilityType;
  mobilityRadius: MobilityRadius;
  lastWizardDate: string | null;
  saveMobilityChoice: (type: MobilityType, radius: MobilityRadius) => Promise<void>;
  resetMobilityChoice: () => Promise<void>;
  forceReopenWizard: () => void;
  loading: boolean;
}

const MobilityContext = createContext<MobilityContextType | undefined>(undefined);

interface MobilityProviderProps {
  children: ReactNode;
}

// Helper per ottenere la data odierna in formato YYYY-MM-DD basata sull'ora locale
const getTodayDateString = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const STORAGE_KEYS = {
  TYPE: 'loto_mobility_type',
  RADIUS: 'loto_mobility_radius',
  DATE: 'loto_mobility_last_date',
};

export function MobilityProvider({ children }: MobilityProviderProps) {
  const [mobilityType, setMobilityType] = useState<MobilityType>('dolce');
  const [mobilityRadius, setMobilityRadius] = useState<MobilityRadius>(2);
  const [lastWizardDate, setLastWizardDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Recupera lo stato salvato all'avvio dell'applicazione
  useEffect(() => {
    const initializeMobilityState = async () => {
      try {
        const savedDate = await AsyncStorage.getItem(STORAGE_KEYS.DATE);
        const todayStr = getTodayDateString();

        if (savedDate === todayStr) {
          // Se la data coincide con oggi, ripristiniamo le scelte dell'utente
          const savedType = await AsyncStorage.getItem(STORAGE_KEYS.TYPE);
          const savedRadius = await AsyncStorage.getItem(STORAGE_KEYS.RADIUS);

          if (savedType) {
            setMobilityType(savedType as MobilityType);
          } else {
            setMobilityType('dolce');
          }

          if (savedRadius) {
            const radiusNum = parseInt(savedRadius, 10);
            if (radiusNum === 2 || radiusNum === 10 || radiusNum === 30) {
              setMobilityRadius(radiusNum as MobilityRadius);
            } else {
              setMobilityRadius(2);
            }
          }
          setLastWizardDate(savedDate);
          console.log('[MobilityContext] Stato della mobilità ripristinato per oggi:', { savedType, savedRadius, savedDate });
        } else {
          // Se la data è diversa o assente, resettiamo mobilityType a dolce (Immediacy-First)
          console.log('[MobilityContext] Data assente o diversa da oggi. Reset a dolce.');
          setMobilityType('dolce');
          setLastWizardDate(savedDate);
        }
      } catch (error) {
        console.error('[MobilityContext] Errore nel caricamento dello stato della mobilità:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMobilityState();
  }, []);

  // Aggiorna lo stato globale e salva su AsyncStorage
  const saveMobilityChoice = async (type: MobilityType, radius: MobilityRadius) => {
    try {
      const todayStr = getTodayDateString();

      // Salvataggio persistente in AsyncStorage
      if (type) {
        await AsyncStorage.setItem(STORAGE_KEYS.TYPE, type);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.TYPE);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.RADIUS, String(radius));
      await AsyncStorage.setItem(STORAGE_KEYS.DATE, todayStr);

      // Aggiornamento dello stato React
      setMobilityType(type);
      setMobilityRadius(radius);
      setLastWizardDate(todayStr);

      console.log('[MobilityContext] Scelta mobilità salvata con successo:', { type, radius, date: todayStr });
    } catch (error) {
      console.error('[MobilityContext] Errore durante il salvataggio della scelta mobilità:', error);
      throw error;
    }
  };

  const resetMobilityChoice = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TYPE);
      setMobilityType(null);
      console.log('[MobilityContext] Scelta mobilità resettata (riapertura Wizard)');
    } catch (error) {
      console.error('[MobilityContext] Errore durante il reset della scelta mobilità:', error);
      throw error;
    }
  };

  const forceReopenWizard = () => {
    setMobilityType(null);
  };

  return (
    <MobilityContext.Provider
      value={{
        mobilityType,
        mobilityRadius,
        lastWizardDate,
        saveMobilityChoice,
        resetMobilityChoice,
        forceReopenWizard,
        loading,
      }}
    >
      {children}
    </MobilityContext.Provider>
  );
}

// Hook personalizzato per utilizzare il contesto della mobilità
export function useMobility() {
  const context = useContext(MobilityContext);
  if (context === undefined) {
    throw new Error('useMobility deve essere utilizzato all\'interno di un MobilityProvider');
  }
  return context;
}

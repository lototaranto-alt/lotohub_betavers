import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definizione della chiave per il salvataggio persistente
const STORAGE_KEY = 'loto_current_city';

// Definizione dell'interfaccia per il tipo di contesto
interface CityContextType {
  currentCity: string;
  setCurrentCity: (city: string) => Promise<void>;
  loading: boolean;
}

// Creazione del contesto
const CityContext = createContext<CityContextType | undefined>(undefined);

// Props del Provider
interface CityProviderProps {
  children: ReactNode;
}

export function CityProvider({ children }: CityProviderProps) {
  const [currentCity, setCurrentCityState] = useState<string>('taranto');
  const [loading, setLoading] = useState<boolean>(true);

  // Carica la città salvata all'avvio dell'applicazione
  useEffect(() => {
    const loadSavedCity = async () => {
      try {
        const savedCity = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedCity) {
          setCurrentCityState(savedCity);
          console.log('[CityContext] Città ripristinata da AsyncStorage:', savedCity);
        } else {
          console.log('[CityContext] Nessuna città salvata, uso default:', 'taranto');
        }
      } catch (error) {
        console.error('[CityContext] Errore nel caricamento della città:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedCity();
  }, []);

  // Aggiorna lo stato e salva su AsyncStorage
  const setCurrentCity = async (city: string) => {
    try {
      const normalizedCity = city.trim().toLowerCase();
      await AsyncStorage.setItem(STORAGE_KEY, normalizedCity);
      setCurrentCityState(normalizedCity);
      console.log('[CityContext] Città aggiornata e salvata:', normalizedCity);
    } catch (error) {
      console.error('[CityContext] Errore nel salvataggio della città:', error);
    }
  };

  return (
    <CityContext.Provider value={{ currentCity, setCurrentCity, loading }}>
      {children}
    </CityContext.Provider>
  );
}

// Hook personalizzato per utilizzare facilmente il contesto
export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity deve essere utilizzato all\'interno di un CityProvider');
  }
  return context;
}

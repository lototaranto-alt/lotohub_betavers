import React, { createContext, useContext, ReactNode } from 'react';
import { useTenant } from './TenantContext';

interface CityContextType {
  currentCity: string;
  setCurrentCity: (city: string) => Promise<void>;
  loading: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

interface CityProviderProps {
  children: ReactNode;
}

export function CityProvider({ children }: CityProviderProps) {
  const { currentTenant, setTenantManual, isLoading: loading } = useTenant();

  const setCurrentCity = async (city: string) => {
    // Mappa la chiamata a setCity su setTenantManual
    await setTenantManual(city);
  };

  return (
    <CityContext.Provider 
      value={{ 
        currentCity: currentTenant?.id || '', 
        setCurrentCity, 
        loading 
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity deve essere utilizzato all\'interno di un CityProvider');
  }
  return context;
}

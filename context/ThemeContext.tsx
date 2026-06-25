import React, { createContext, useContext, useState } from 'react';
import { useTenant } from './TenantContext';

// Palette Colori
export const FREEMIUM_THEME = {
  isElite: false,
  background: '#FDF8F2', // Crema
  surface: '#FFFFFF',
  text: '#1A1C1E', // Ebano
  textMuted: '#64748B',
  primary: '#5F713D', // Verde Oliva
  secondary: '#C36B4D', // Terracotta
  accent: '#D9A05B', // Sabbia Dorata
  border: '#C9C4B8',
};

export const ELITE_THEME = {
  isElite: true,
  background: '#121417', // Obsidian (Molto elegante, scuro ma morbido)
  surface: '#1A1D21',    // Slate scuro per le card
  text: '#F2ECE4',       // Bianco Perla
  textMuted: '#9B968B',  // Cenere dorata
  primary: '#C5A059',    // Oro Brunito / Champagne
  secondary: '#6E3A35',  // Rosso Velluto / Mogano
  accent: '#E5D3B3',     // Oro chiaro per tocchi luminosi
  border: '#2C3036',     // Bordo sottile
};

type ThemeType = typeof FREEMIUM_THEME;

interface ThemeContextProps {
  isElite: boolean;
  theme: ThemeType;
  setElite: (status: boolean) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  isElite: false,
  theme: FREEMIUM_THEME,
  setElite: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isElite, setIsElite] = useState(false);
  const { currentTenant } = useTenant();

  // Se l'utente non è Elite, usa i colori dinamici del Tenant (effetto Camaleonte)
  // Se è Elite, usa il dark theme universale (status symbol)
  const baseTheme = isElite ? ELITE_THEME : FREEMIUM_THEME;
  
  const theme = isElite 
    ? baseTheme // Modalità Elite sempre scura/universale
    : {
        ...baseTheme,
        primary: currentTenant.colors.primary || baseTheme.primary,
        secondary: currentTenant.colors.secondary || baseTheme.secondary,
        background: currentTenant.colors.background || baseTheme.background,
        surface: currentTenant.colors.card || baseTheme.surface,
        card: currentTenant.colors.card || baseTheme.surface, // Alias
        text: currentTenant.colors.text || baseTheme.text,
        tint: currentTenant.colors.tint || baseTheme.primary,
      };

  const setElite = (status: boolean) => {
    setIsElite(status);
  };

  return (
    <ThemeContext.Provider value={{ isElite, theme, setElite }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenant } from './TenantContext';
import { supabase } from '../utils/supabase';

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
  background: '#0A0F14', // Very dark blue/black (Neo-Futurista)
  surface: '#111827',    // Slate scuro per le card
  text: '#E0F2FE',       // Azzurrino ghiaccio (Neon Text)
  textMuted: '#8BA6B9',  // Grigio-Azzurro spento
  primary: '#00F0FF',    // Neon Cyan
  secondary: '#FF00FF',  // Neon Magenta
  accent: '#00F0FF',     // Neon Cyan
  border: '#1E293B',     // Bordo scuro
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();
        if (active && profile) setIsElite(!!profile.is_premium);
      } catch (e) {
        console.warn('[ThemeContext] Impossibile recuperare lo stato Premium:', e);
      }
    })();
    return () => { active = false; };
  }, []);

  // Se l'utente non è Elite, usa i colori dinamici del Tenant (effetto Camaleonte)
  // Se è Elite, usa il dark theme universale (status symbol)
  const baseTheme = isElite ? ELITE_THEME : FREEMIUM_THEME;
  
  const theme = isElite 
    ? baseTheme // Modalità Elite sempre scura/universale
    : {
        ...baseTheme,
        primary: currentTenant?.colors?.primary || baseTheme.primary,
        secondary: currentTenant?.colors?.secondary || baseTheme.secondary,
        background: (currentTenant?.colors as any)?.background || baseTheme.background,
        surface: (currentTenant?.colors as any)?.card || baseTheme.surface,
        card: (currentTenant?.colors as any)?.card || baseTheme.surface, // Alias
        text: (currentTenant?.colors as any)?.text || baseTheme.text,
        tint: (currentTenant?.colors as any)?.tint || baseTheme.primary,
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

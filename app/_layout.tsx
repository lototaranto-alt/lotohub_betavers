import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { TenantProvider } from '../context/TenantContext';
import { CityProvider } from '../context/CityContext';
import { MobilityProvider } from '../context/MobilityContext';
import { ThemeProvider as AppThemeProvider } from '../context/ThemeContext';
import { RouteProvider } from '../context/RouteContext';
import MobilityWizard from '../components/MobilityWizard';
import NfcManager from 'react-native-nfc-manager';

// Inizializzazione Globale Hardware NFC
NfcManager.start().catch(e => console.warn('NFC non supportato in questo ambiente (es. Web/Simulatore)'));

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
      const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const navigateToApp = () => {
        // Redirige direttamente alla Mappa (Immediacy-First)
        router.replace('/(tabs)/map');
      };

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) console.error('[Auth Error] Fallimento login anonimo:', error.message);
        else {
          console.log('[Auth Success] Entrato come ospite anonimo');
          if (data?.user) navigateToApp();
        }
      } else {
        console.log('[Auth Success] Sessione anonima/guest esistente ripristinata');
        navigateToApp();
      }
    };

    initAuth();
  }, []);

  return (
    <TenantProvider>
      <AppThemeProvider>
        <CityProvider>
          <MobilityProvider>
            <RouteProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="route-creation-mockup" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="upgrade" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="p/[id]" options={{ presentation: 'modal', headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
                <MobilityWizard />
              </ThemeProvider>
            </RouteProvider>
          </MobilityProvider>
        </CityProvider>
      </AppThemeProvider>
    </TenantProvider>
  );
}


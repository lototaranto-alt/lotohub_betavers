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
import MobilityWizard from '../components/MobilityWizard';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const checkProfile = async (user: any) => {
        const { data } = await supabase.from('profiles').select('profile_completed').eq('id', user.id).single();
        if (data && !data.profile_completed) {
          router.replace('/wizard');
        } else {
          router.replace('/(tabs)');
        }
      };

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) console.error('[Auth Error] Fallimento login anonimo:', error.message);
        else {
          console.log('[Auth Success] Entrato come ospite (L.O.T.O. Guest)');
          if (data?.user) checkProfile(data.user);
        }
      } else {
        console.log('[Auth Success] Sessione esistente ripristinata');
        checkProfile(session.user);
      }
    };

    initAuth();
  }, []);

  return (
    <AppThemeProvider>
      <TenantProvider>
        <CityProvider>
          <MobilityProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="wizard" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="route-creation-mockup" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="upgrade" options={{ presentation: 'modal', headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
              <MobilityWizard />
            </ThemeProvider>
          </MobilityProvider>
        </CityProvider>
      </TenantProvider>
    </AppThemeProvider>
  );
}


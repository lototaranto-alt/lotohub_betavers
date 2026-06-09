import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { CityProvider } from '../context/CityContext';

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
    <CityProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="wizard" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CityProvider>
  );
}


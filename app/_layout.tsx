import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Raleway_400Regular, Raleway_600SemiBold } from '@expo-google-fonts/raleway';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { Alert, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/utils/supabase';
import { TenantProvider } from '../context/TenantContext';
import { CityProvider } from '../context/CityContext';
import { MobilityProvider } from '../context/MobilityContext';
import { ThemeProvider as AppThemeProvider } from '../context/ThemeContext';
import { GamificationProvider } from '../context/GamificationContext';
import { RouteProvider } from '../context/RouteContext';
import MobilityWizard from '../components/MobilityWizard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { registerForPushNotificationsAsync } from '../utils/notifications';

// Inizializzazione Globale Hardware NFC (Commentato per Expo Go Demo)
import NfcManager from 'react-native-nfc-manager';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    /* if (Application.nativeBuildVersion === '1') { 
 // Disabilitato fino al rilascio del nuovo APK V2 a Settembre
 } */
  }, []);


  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Raleway_400Regular,
    Raleway_600SemiBold,
  });

  const initAuth = async () => {
    try {
      setAuthError(null);
      const { data: { session } } = await supabase.auth.getSession();
      let userLevel = 0;
      let currentUserId = null;
      if (session) {
        console.log('[Auth Success] Sessione esistente ripristinata');
        currentUserId = session.user.id;
        // registerForPushNotificationsAsync(); // Spostato o disabilitato per evitare popup all'avvio
      } else {
        // Tentativo di login anonimo rigoroso
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        console.log('[Auth Success] Entrato come ospite anonimo');
        currentUserId = data.user?.id;
        // registerForPushNotificationsAsync(); // Spostato o disabilitato per evitare popup all'avvio
      }
      
      // AUTO-HEALING TRAMITE REINCARNAZIONE
      if (currentUserId) {
        const { error: profileError } = await supabase.from('profiles').select('id').eq('id', currentUserId).single();
        if (profileError && profileError.code === 'PGRST116') {
           console.log('[Auto-Healing] Riga profile mancante e protetta da RLS. Forzo il reset dell\'identitÃ ...');
           await supabase.auth.signOut();
           await AsyncStorage.clear();
           
           // Ricrea utente
           const { data: newData, error: newError } = await supabase.auth.signInAnonymously();
           if (newError) throw newError;
           currentUserId = newData.user?.id;
           console.log('[Auto-Healing] Nuova identitÃ  creata con successo.');
        }
      }
      
      const hasForcedOnboarding = await AsyncStorage.getItem('loto_onboarding_seen');
      
      // FORZATO: l'utente ha richiesto che il carosello sia sempre visibile all'avvio come caricamento
      let willShowOnboarding = true;

      setIsFirstLaunch(!hasForcedOnboarding);
      setShowOnboarding(willShowOnboarding);
      setIsAuthReady(true);
    } catch (err: any) {
      console.error('[Auth Error] Fallimento critico:', err.message);
      setAuthError(err.message);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if ((isAuthReady || authError) && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAuthReady, authError, fontsLoaded]);

  const handleRetryAuth = async () => {
    // Pulisce eventuali sessioni corrotte prima di riprovare
    await supabase.auth.signOut();
    initAuth();
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('loto_onboarding_seen', 'true');
    setShowOnboarding(false);
    // Naviga alla mappa una volta terminato l'onboarding
    setTimeout(() => router.replace('/(tabs)/map'), 100);
  };

  

  if (!isAuthReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF2' }}>
        <ActivityIndicator size="large" color="#5F713D" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#5F713D', fontFamily: 'serif', letterSpacing: 2 }}>L.O.T.O.</Text>
        <Text style={{ fontSize: 12, color: '#1A1C1E', marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Sincronizzazione Identità ...</Text>
      </View>
    );
  }

  return (
    
      <TenantProvider>
      <AppThemeProvider>
        <CityProvider>
          <GamificationProvider>
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
                {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} isFirstLaunch={isFirstLaunch} />}
              </ThemeProvider>
            </RouteProvider>
          </MobilityProvider>
            </GamificationProvider>
        </CityProvider>
      </AppThemeProvider>
    </TenantProvider>
    
  );
}


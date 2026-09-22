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
import LotoHardwareGate from '../components/LotoHardwareGate';

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

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Raleway_400Regular,
    Raleway_600SemiBold,
  });

  const initAuth = async () => {
    try {
      setAuthError(null);
      const { data: { session } } = await supabase.auth.getSession();
      let currentUserId = null;
      if (session) {
        currentUserId = session.user.id;
      } else {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        currentUserId = data.user?.id;
      }
      
      if (currentUserId) {
        const { error: profileError } = await supabase.from('profiles').select('id').eq('id', currentUserId).single();
        if (profileError && profileError.code === 'PGRST116') {
           await supabase.auth.signOut();
           // Rimuove solo i token di sessione, preservando l'onboarding
          await AsyncStorage.removeItem('supabase-auth-token');
           const { data: newData, error: newError } = await supabase.auth.signInAnonymously();
           if (newError) throw newError;
        }
      }
      
      const hasForcedOnboarding = await AsyncStorage.getItem('loto_onboarding_seen');
      setIsFirstLaunch(!hasForcedOnboarding);
      setShowOnboarding(true);

    } catch (err: any) {
      console.warn('[Auth] Primo tentativo fallito. Avvio Deep Recovery...', err.message);
      try {
        await AsyncStorage.clear();
        await supabase.auth.signOut();
        const { error: recoveryError } = await supabase.auth.signInAnonymously();
        if (recoveryError) throw recoveryError;
        setIsFirstLaunch(true);
        setShowOnboarding(true);
      } catch (fatalErr: any) {
        console.error('[Auth] Deep Recovery fallita:', fatalErr.message);
        Alert.alert(
          "Modalità Offline",
          "Connessione ai server instabile (Err: " + fatalErr.message + "). L'app funzionerà offline.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsAuthReady(true);
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

  

  if (!isAuthReady || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF2' }}>
        <ActivityIndicator size="large" color="#5F713D" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#5F713D', fontFamily: 'serif', letterSpacing: 2 }}>L.O.T.O.</Text>
        <Text style={{ fontSize: 12, color: '#1A1C1E', marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Sincronizzazione Identità...</Text>
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
                <LotoHardwareGate suppressed={showOnboarding} />
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





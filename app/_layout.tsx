import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const initAuth = async () => {
    try {
      setAuthError(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Tentativo di login anonimo rigoroso
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        console.log('[Auth Success] Entrato come ospite anonimo');
      } else {
        console.log('[Auth Success] Sessione esistente ripristinata');
      }
      
      setIsAuthReady(true);
      // Piccolo ritardo per permettere al router di montarsi prima del redirect
      setTimeout(() => router.replace('/(tabs)/map'), 100);
    } catch (err: any) {
      console.error('[Auth Error] Fallimento critico:', err.message);
      setAuthError(err.message);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleRetryAuth = async () => {
    // Pulisce eventuali sessioni corrotte prima di riprovare
    await supabase.auth.signOut();
    initAuth();
  };

  if (authError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1C1E', padding: 20 }}>
        <Text style={{ color: '#E74C3C', fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>ACCESSO NEGATO</Text>
        <Text style={{ color: '#FFF', textAlign: 'center', marginBottom: 20, fontSize: 16, lineHeight: 24 }}>
          L'architettura Zero-PII richiede l'autenticazione anonima obbligatoria.{'\n\n'}
          Verifica di aver abilitato "Anonymous Sign-ins" nella sezione Authentication {'>'} Providers di Supabase.
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 30, textAlign: 'center' }}>Dettagli Errore: {authError}</Text>
        <TouchableOpacity 
          onPress={handleRetryAuth}
          style={{ backgroundColor: '#5F713D', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12 }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>RIPROVA CONNESSIONE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isAuthReady) {
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


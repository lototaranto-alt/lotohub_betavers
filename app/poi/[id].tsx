import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function PoiScanHandler() {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    const handleScan = async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Simuliamo l'elaborazione del POI scansionato.
        // In una versione completa, qui si farebbe una chiamata al server per validare l'NFC e assegnare i punti.
        setTimeout(() => {
          Alert.alert(
            "Indizio Trovato: " + (id === 'castello' ? 'Castello Aragonese' : id),
            "Hai scansionato con successo la targa NFC! I dati sono stati sincronizzati col tuo Diario LOTO.",
            [
              { 
                text: "Fantastico!", 
                onPress: () => router.replace('/')
              }
            ]
          );
        }, 1000);

      } catch (err) {
        console.warn("Errore durante l'elaborazione NFC", err);
        router.replace('/');
      }
    };

    handleScan();
  }, [id]);

  return (
    <View style={styles.container}>
      <MaterialIcons name="nfc" size={80} color="#D4AF37" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Analisi Sensore NFC...</Text>
      <Text style={styles.subtitle}>Sincronizzazione in corso con il L.O.T.O. Engine.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3621', // Verde Boutique
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'serif',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center'
  }
});

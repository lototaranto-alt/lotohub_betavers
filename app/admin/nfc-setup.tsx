import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch, Vibration } from 'react-native';
import * as Location from 'expo-location';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { supabase } from '../../utils/supabase';

export default function NfcSetupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+39');
  const [isElite, setIsElite] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Validazione Form prima di attivare l'hardware
  const validateForm = () => {
    if (name.trim().length < 3) {
      Alert.alert('Errore', 'Inserisci un nome locale valido.');
      return false;
    }
    // Controllo basico per numero WhatsApp internazionale
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Errore', 'Inserisci un numero WhatsApp valido con prefisso (es. +39...).');
      return false;
    }
    return true;
  };

  // 2. Acquisizione Coordinate, Lettura NFC e Salvataggio (Tutto in uno per evitare asincronie monche)
  const handleStartAcquisition = async () => {
    if (!validateForm()) return;

    try {
      setIsScanning(true);

      // STEP A: Permessi e GPS ad altissima precisione (Zero-IoT)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permesso di geolocalizzazione negato.');
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      // STEP B: Inizializza l'Hardware NFC
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.Ndef); // Legge tag standard
      const tag = await NfcManager.getTag();
      
      if (!tag || !tag.id) {
        throw new Error('Impossibile estrarre l\'UID del tag NFC.');
      }

      // Haptic Feedback: Il tag è stato letto fisicamente!
      Vibration.vibrate(200);

      setIsScanning(false);
      setIsSaving(true);

      // STEP C: Scrittura Atomica su Supabase (Triggera il Webhook Bot WhatsApp)
      const { error } = await supabase
        .from('pois')
        .insert({
          name: name.trim(),
          category: 'partner',
          // Supabase converte automaticamente il formato testuale WKT (Well-Known Text) in PostGIS Geometry
          coords: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
          nfc_uid: tag.id,
          b2b_phone: phone.trim(),
          b2b_plan: isElite ? 'elite' : 'freemium',
          nfc_activated_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // STEP D: Successo Visivo
      setSuccess(true);
      Vibration.vibrate([0, 100, 100, 100]); // Pattern di successo

    } catch (err: any) {
      Alert.alert('Acquisizione Fallita', err.message || 'Errore sconosciuto');
    } finally {
      setIsScanning(false);
      setIsSaving(false);
      // Pulizia forzata dell'hardware NFC
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: '#1C2E20' }]}>
        <Text style={styles.successTitle}>🌿 Acquisizione Completata</Text>
        <Text style={styles.successText}>
          Il Partner "{name}" è stato registrato nel database. 
          Le coordinate GPS e l'UID NFC sono bloccati. 
          Il Bot WhatsApp ha appena inviato il messaggio di benvenuto.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            setName('');
            setPhone('+39');
            setIsElite(false);
            setSuccess(false);
          }}
        >
          <Text style={styles.buttonText}>NUOVA ACQUISIZIONE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acquisizione NFC Partner</Text>
      <Text style={styles.subtitle}>Strumento Operatore L.O.T.O.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nome del Locale / P.O.I.</Text>
        <TextInput 
          style={styles.input}
          placeholder="Es. Pizzeria Da Mario"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Numero WhatsApp (con prefisso)</Text>
        <TextInput 
          style={styles.input}
          placeholder="+39..."
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Piano Premium (Elite)</Text>
          <Switch 
            value={isElite} 
            onValueChange={setIsElite}
            trackColor={{ false: '#333', true: '#5F713D' }}
          />
        </View>

        <View style={{ marginTop: 40 }}>
          {isScanning ? (
            <View style={styles.scanningBox}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.scanningText}>Acquisizione GPS in corso...</Text>
              <Text style={styles.scanningTextBold}>AVVICINA IL TELEFONO AL TAG NFC</Text>
            </View>
          ) : isSaving ? (
            <View style={styles.scanningBox}>
              <ActivityIndicator size="large" color="#5F713D" />
              <Text style={styles.scanningText}>Salvataggio su Supabase in corso...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.button}
              onPress={handleStartAcquisition}
            >
              <Text style={styles.buttonText}>REGISTRA E SCANSIONA NFC</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#D4AF37', // Oro
    marginBottom: 40,
    fontFamily: 'Raleway_600SemiBold',
  },
  form: {
    flex: 1,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 20,
    fontFamily: 'Raleway_400Regular',
  },
  input: {
    backgroundColor: '#1A1C1E',
    color: '#FFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanningBox: {
    backgroundColor: '#1A1C1E',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderStyle: 'dashed',
  },
  scanningText: {
    color: '#9CA3AF',
    marginTop: 15,
    textAlign: 'center',
  },
  scanningTextBold: {
    color: '#D4AF37',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 18,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  successText: {
    color: '#A7F3D0',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
  }
});

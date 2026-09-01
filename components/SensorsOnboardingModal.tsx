import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SensorsOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

export default function SensorsOnboardingModal({ visible, onClose, theme }: SensorsOnboardingModalProps) {
  const [gpsGranted, setGpsGranted] = useState(false);
  const [pedGranted, setPedGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, [visible]);

  const checkPermissions = async () => {
    const gps = await Location.getForegroundPermissionsAsync();
    const ped = await Pedometer.getPermissionsAsync();
    setGpsGranted(gps.status === 'granted');
    setPedGranted(ped.status === 'granted');
  };

  const requestGps = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    if (res.status === 'granted') setGpsGranted(true);
  };

  const requestPedometer = async () => {
    const res = await Pedometer.requestPermissionsAsync();
    if (res.status === 'granted') setPedGranted(true);
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('loto_sensors_onboarded', 'true');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          
          <View style={styles.iconHeader}>
            <MaterialIcons name="explore" size={40} color="#D4AF37" />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>I Sensi del Camaleonte</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Per sbloccare il gioco, ottenere XP e trovare i tesori sulla mappa, abbiamo bisogno di due super-poteri.
          </Text>

          {/* GPS Block */}
          <TouchableOpacity 
            style={[styles.permissionRow, { borderColor: gpsGranted ? '#2ECC71' : theme.border }]} 
            onPress={requestGps}
            disabled={gpsGranted}
          >
            <View style={[styles.iconBox, { backgroundColor: gpsGranted ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <MaterialIcons name="place" size={24} color={gpsGranted ? '#2ECC71' : theme.primary} />
            </View>
            <View style={styles.permissionText}>
              <Text style={[styles.permTitle, { color: theme.text }]}>Navigazione Mappa</Text>
              <Text style={[styles.permDesc, { color: theme.textMuted }]}>Ti permette di fare i check-in ai monumenti (GPS).</Text>
            </View>
            <MaterialIcons name={gpsGranted ? "check-circle" : "add-circle-outline"} size={24} color={gpsGranted ? '#2ECC71' : theme.primary} />
          </TouchableOpacity>

          {/* Pedometer Block */}
          <TouchableOpacity 
            style={[styles.permissionRow, { borderColor: pedGranted ? '#2ECC71' : theme.border }]} 
            onPress={requestPedometer}
            disabled={pedGranted}
          >
            <View style={[styles.iconBox, { backgroundColor: pedGranted ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <MaterialIcons name="directions-walk" size={24} color={pedGranted ? '#2ECC71' : theme.primary} />
            </View>
            <View style={styles.permissionText}>
              <Text style={[styles.permTitle, { color: theme.text }]}>Sincro-Avventura</Text>
              <Text style={[styles.permDesc, { color: theme.textMuted }]}>Calcola la CO2 risparmiata contando i tuoi passi.</Text>
            </View>
            <MaterialIcons name={pedGranted ? "check-circle" : "add-circle-outline"} size={24} color={pedGranted ? '#2ECC71' : theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnFinish, { backgroundColor: theme.primary }]} onPress={handleFinish}>
            <Text style={styles.btnFinishText}>INIZIA A ESPLORARE</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  iconHeader: {
    alignSelf: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 20,
    borderRadius: 40,
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 15
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  permissionText: {
    flex: 1
  },
  permTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  permDesc: {
    fontSize: 12,
    lineHeight: 16
  },
  btnFinish: {
    marginTop: 15,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center'
  },
  btnFinishText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1
  }
});

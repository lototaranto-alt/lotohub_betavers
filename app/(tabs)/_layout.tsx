import { Tabs } from 'expo-router';
import React, { useState, createContext, useContext } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// 1. Context Globale per lo Scanner (accessibile da ogni pagina del tab)
const ScannerContext = createContext({
  openScanner: () => {},
});

export const useScanner = () => useContext(ScannerContext);

export default function TabLayout() {
  const { theme, isElite } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const simulateNfcScan = () => {
    Alert.alert(
      "Indizio Trovato", 
      isElite 
        ? "Benvenuto Esploratore Elite! Hai ricevuto +50 PTI Bonus discreti e sbloccato il Certificato Digitale Esclusivo del P.O.I. gratuito."
        : "Incontro Autentico confermato! Passa a Elite per sbloccare le memorie del territorio."
    );
    setModalVisible(false);
  };

  return (
    <ScannerContext.Provider value={{ openScanner: () => setModalVisible(true) }}>
      <Tabs
        initialRouteName="map"
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isElite ? '#0A0F14' : theme.background,
            borderTopWidth: isElite ? 1 : 0.5,
            borderTopColor: isElite ? '#00F0FF' : theme.border,
            height: 65,
            paddingBottom: 12,
            paddingTop: 8,
            ...(isElite ? {
              shadowColor: '#00F0FF',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 10
            } : {})
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            fontFamily: isElite ? 'sans-serif' : 'serif'
          }
        }}>
        
        {/* 1. VISIBILE: Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home-filled" color={color} />,
          }}
        />

        {/* 2. VISIBILE: Profilo (L.O.T.O. Pass) */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profilo',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="account-circle" color={color} />,
          }}
        />

        {/* 3. VISIBILE: Pulsante centrale SCAN (Intercepted) */}
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="qr-code-scanner" color={color} />,
            tabBarButton: (props) => (
              <TouchableOpacity 
                {...(props as any)} 
                onPress={(e) => {
                  e.preventDefault(); 
                  setModalVisible(true);
                }} 
              />
            )
          }}
        />

        {/* 4. VISIBILE: Options (diventato Menu) */}
        <Tabs.Screen
          name="options"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="menu" color={color} />,
          }}
        />

        {/* 5. INVISIBILI (Switchboard Routing Target) */}
        <Tabs.Screen name="explore" options={{ href: null, title: 'Esplora' }} />
        <Tabs.Screen name="map" options={{ href: null, title: 'Mappa' }} />
        <Tabs.Screen name="events" options={{ href: null, title: 'Eventi' }} />
      </Tabs>

      {/* OVERLAY MODALE GLOBALE PER LO SCANNER NFC */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <MaterialIcons name="nfc" size={60} color={theme.primary} style={{ marginBottom: 15 }} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Scansione NTAG424</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Avvicina il telefono all'Indizio del Luogo...
            </Text>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.primary }]} 
              onPress={simulateNfcScan}
            >
              <MaterialIcons name="tap-and-play" size={28} color={theme.background} />
              <Text style={[styles.actionBtnText, { color: theme.background }]}>SIMULA SCANSIONE NFC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>ANNULLA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScannerContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(26, 28, 30, 0.8)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FDFBF2',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    paddingBottom: 50
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1C1E',
    fontFamily: 'serif',
    marginBottom: 5
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 30,
    textAlign: 'center'
  },
  actionBtn: {
    backgroundColor: '#C36B4D',
    width: '100%',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 15,
    letterSpacing: 1
  },
  closeBtn: {
    marginTop: 30,
    padding: 15
  },
  closeBtnText: {
    color: '#5F713D',
    fontWeight: 'bold',
    fontSize: 16
  }
});

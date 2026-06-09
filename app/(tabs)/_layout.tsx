import { Tabs } from 'expo-router';
import React, { useState, createContext, useContext } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';

// 1. Context Globale per lo Scanner (accessibile da ogni pagina del tab)
const ScannerContext = createContext({
  openScanner: () => {},
});

export const useScanner = () => useContext(ScannerContext);

export default function TabLayout() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScannerContext.Provider value={{ openScanner: () => setModalVisible(true) }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#5F713D', // Verde Oliva
          tabBarInactiveTintColor: '#C9C4B8',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FDFBF2', // Boutique Ivory
            borderTopWidth: 0.5,
            borderTopColor: '#C9C4B8',
            height: 65,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            fontFamily: 'serif'
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

        {/* 2. VISIBILE: Pulsante centrale SCAN (Intercepted) */}
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

        {/* 3. VISIBILE: Info */}
        <Tabs.Screen
          name="info"
          options={{
            title: 'Info',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="info-outline" color={color} />,
          }}
        />

        {/* 4. INVISIBILI (Switchboard Routing Target) */}
        <Tabs.Screen name="explore" options={{ href: null, title: 'Esplora' }} />
        <Tabs.Screen name="map" options={{ href: null, title: 'Mappa' }} />
        <Tabs.Screen name="events" options={{ href: null, title: 'Eventi' }} />
      </Tabs>

      {/* OVERLAY MODALE GLOBALE PER LO SCANNER */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Certificazione Hub</Text>
            <Text style={styles.modalSubtitle}>Scegli l&apos;azione da intraprendere sul territorio.</Text>
            
            <TouchableOpacity style={styles.actionBtn}>
              <MaterialIcons name="receipt-long" size={32} color="#FFF" />
              <Text style={styles.actionBtnText}>SCANSIONA SCONTRINO (OCR)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0056D2', marginTop: 15}]}>
              <MaterialIcons name="water-drop" size={32} color="#FFF" />
              <Text style={styles.actionBtnText}>SBLOCCA FONTANELLA (QR)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>ANNULLA</Text>
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

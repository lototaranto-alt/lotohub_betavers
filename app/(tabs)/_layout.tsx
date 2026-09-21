import { Tabs, useRouter } from 'expo-router';
import React, { useState, createContext, useContext } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useGamification } from '../../context/GamificationContext';
import { COMMUNITY_UNLOCK_LEVEL } from '../../utils/levelUtils';
import FeatureLockSheet from '../../components/FeatureLockSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import NfcManager from 'react-native-nfc-manager';

// Inizializza NFC
try {
  NfcManager.start().catch(e => {
    console.warn("NfcManager.start promise rejection ignorata in DEV", e);
  });
} catch (e) {
  console.warn("NfcManager.start failed (likely Expo Go)", e);
}

// 1. Context Globale per lo Scanner (accessibile da ogni pagina del tab)
const ScannerContext = createContext({
  openScanner: () => {},
});

export const useScanner = () => useContext(ScannerContext);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isElite } = useTheme();
  const { level: userLevel } = useGamification();
  const [modalVisible, setModalVisible] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const router = useRouter();

  const handleOpenScanner = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const supported = await NfcManager.isSupported();
      if (!supported) {
        // Fallback per simulatori
        console.warn("NFC non supportato sul dispositivo.");
      } else {
        const enabled = await NfcManager.isEnabled();
        if (!enabled) {
          Alert.alert("Sensore NFC Spento 📵", "Per favore attiva l'NFC dalle impostazioni del tuo telefono per interagire con le targhe fisiche.");
          // Non blocchiamo per permettere test in Expo Go, ma l'avviso è mostrato.
        }
      }
    } catch(e) {
      console.warn("NFC check ignorato", e);
    }
    setModalVisible(true);
  };

  const simulateNfcScan = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    
    // Invece di un finto Alert, spariamo il vero flusso simulando un tag NFC
    // Creiamo un array di ID mockati per dare varietà ai test
    const mockPois = ['poi-001', 'poi-002', 'poi-003', 'poi-004'];
    const randomPoi = mockPois[Math.floor(Math.random() * mockPois.length)];
    
    // Piccolo delay per permettere alla modale di chiudersi fluidamente
    setTimeout(() => {
      router.push(`/p/${randomPoi}`);
    }, 300);
  };

  return (
    <ScannerContext.Provider value={{ openScanner: handleOpenScanner }}>
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
            // Cuscinetti dinamici: la Tab Bar si adatta ai tasti di sistema
            // trasparenti (Immersive Mode) spingendo le icone LOTO verso l'alto.
            height: 62 + insets.bottom,
            paddingBottom: Math.max(12, insets.bottom),
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

        {/* 2. Mappa (Accessibile fin dal Livello 1 - Easy Entry) */}
        <Tabs.Screen
          name="map"
          options={{
            title: 'Mappa',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="map" color={color} />,
          }}
        />

        {/* 3. VISIBILE: Pulsante centrale SCAN (Flottante) */}
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarLabel: () => null, // Rimuoviamo il testo sotto il bottone centrale per renderlo più pulito
            tabBarButton: (props) => (
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', top: -20, width: 70 }}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.preventDefault(); 
                    setModalVisible(true);
                  }} 
                  activeOpacity={0.9}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#2D4A22',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: '#D4AF37',
                    elevation: 8,
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10
                  }}
                >
                  <MaterialIcons size={32} name="qr-code-scanner" color="#FFF" />
                </TouchableOpacity>
              </View>
            )
          }}
        />

        {/* 4. Community (Sempre visibile, ma mostra preview lockata se livello < soglia) */}
        <Tabs.Screen
          name="community"
          listeners={{
            tabPress: (e) => {
              if (userLevel < COMMUNITY_UNLOCK_LEVEL) {
                e.preventDefault();
                setLockedFeature('Community');
              }
            }
          }}
          options={{
            title: 'Community',
            tabBarLabel: () => (
              <Text style={[{
                fontSize: 10,
                fontWeight: '900',
                fontFamily: isElite ? 'sans-serif' : 'serif',
                color: userLevel < COMMUNITY_UNLOCK_LEVEL ? theme.textMuted : (theme.primary),
                opacity: userLevel < COMMUNITY_UNLOCK_LEVEL ? 0.75 : 1,
              }]}>
                {userLevel < COMMUNITY_UNLOCK_LEVEL ? `??? (LV.${COMMUNITY_UNLOCK_LEVEL})` : 'Community'}
              </Text>
            ),
            tabBarIcon: ({ color }) => {
              const locked = userLevel < COMMUNITY_UNLOCK_LEVEL;
              return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons
                    size={28}
                    name="groups"
                    color={locked ? `${theme.textMuted}B3` : color}
                    style={{ opacity: locked ? 0.6 : 1 }}
                  />
                  {locked && (
                    <View style={{
                      position: 'absolute',
                      right: -6,
                      top: -2,
                      backgroundColor: theme.secondary,
                      borderRadius: 8,
                      paddingHorizontal: 3,
                      paddingVertical: 1,
                    }}>
                      <MaterialIcons name="lock" size={10} color="#FFF" />
                    </View>
                  )}
                </View>
              );
            },
          }}
        />

        {/* 5. VISIBILE: Profilo (e Menu) */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profilo',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="account-circle" color={color} />,
          }}
        />
        
        {/* Schermata Options rimossa, sarà inglobata nel Profile. */}
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
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>ANNULLA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OVERLAY MODALE GLOBALE: preview lockata (G7 — popup personalizzato, mai notifica di sistema) */}
      <FeatureLockSheet
        visible={lockedFeature !== null}
        onClose={() => setLockedFeature(null)}
        featureName={lockedFeature || 'Sezione Misteriosa'}
        unlockLevel={COMMUNITY_UNLOCK_LEVEL}
      />
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

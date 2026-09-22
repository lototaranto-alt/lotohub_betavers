import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { SensorGateState } from './LotoHardwareGate';

const { width, height } = Dimensions.get('window');

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
  CREMA: '#FDF8F2',
};

type LotoPermissionModalProps = {
  visible: boolean;
  state?: SensorGateState;
  onRequestPermissions: () => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
};

export default function LotoPermissionModal({ visible, state = 'missing', onRequestPermissions, onOpenSettings, onClose }: LotoPermissionModalProps) {
  const insets = useSafeAreaInsets();
  const isGpsOff = state === 'gpsOff';

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?q=80&w=2070&auto=format&fit=crop' }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.overlay} />
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.iconBadge}>
            <MaterialIcons name={isGpsOff ? 'gps-off' : 'radar'} size={48} color={LOTO_PALETTE.SABBIA_DORATA} />
          </View>

          <Text style={styles.title}>
            {isGpsOff ? 'Il Tuo Sensore È Spento' : 'Serve una Mano dal Tuo Sensore'}
          </Text>

          {isGpsOff ? (
            <Text style={styles.paragraph}>
              Il <Text style={styles.highlight}>GPS</Text> del telefono è spento. Il permesso è già concesso:
              basta riattivare i servizi di posizione per ritrovare la strada tra i Nodi Segreti.
            </Text>
          ) : (
            <Text style={styles.paragraph}>
              L.O.T.O. ha bisogno del tuo <Text style={styles.highlight}>GPS</Text> per guidarti sulla mappa
              e del tuo <Text style={styles.highlight}>Bluetooth</Text> per le ancore dei locali.
            </Text>
          )}

          <Text style={styles.paragraphSub}>
            {isGpsOff
              ? 'Nessun dato lascia il telefono: si tratta solo della tua bussola personale.'
              : "Nessun dato personale esce dal telefono: è solo la tua bussola per scovare i segreti di Taranto."}
          </Text>

          {isGpsOff ? (
            <TouchableOpacity style={styles.activateBtn} onPress={onOpenSettings} activeOpacity={0.9}>
              <MaterialIcons name="settings" size={22} color={LOTO_PALETTE.EBANO} style={{ marginRight: 10 }} />
              <Text style={styles.activateBtnText}>Attiva il GPS (Impostazioni)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.activateBtn} onPress={onRequestPermissions} activeOpacity={0.9}>
              <MaterialIcons name="sensors" size={22} color={LOTO_PALETTE.EBANO} style={{ marginRight: 10 }} />
              <Text style={styles.activateBtnText}>Attiva Sensori LOTO</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={styles.silentBtn} activeOpacity={0.8}>
            <Text style={styles.silentBtnText}>Ora no, esploro in silenzio</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <LinearGradient
            colors={[LOTO_PALETTE.VERDE_OLIVA, LOTO_PALETTE.EBANO]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.footerBar}
          >
            <Text style={styles.footerText}>L.O.T.O. MAP</Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LOTO_PALETTE.EBANO,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 28, 30, 0.82)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(217, 160, 91, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 160, 91, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    color: LOTO_PALETTE.CREMA,
    textAlign: 'center',
    marginBottom: 18,
  },
  paragraph: {
    fontFamily: 'Raleway-Regular',
    fontSize: 16,
    color: LOTO_PALETTE.CREMA,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  paragraphSub: {
    fontFamily: 'Raleway-Regular',
    fontSize: 13,
    color: 'rgba(253, 248, 242, 0.6)',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 36,
  },
  highlight: {
    fontFamily: 'Raleway-Bold',
    color: LOTO_PALETTE.SABBIA_DORATA,
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LOTO_PALETTE.SABBIA_DORATA,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 40,
    elevation: 6,
    shadowColor: LOTO_PALETTE.SABBIA_DORATA,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  activateBtnText: {
    fontFamily: 'Raleway-Bold',
    fontSize: 16,
    color: LOTO_PALETTE.EBANO,
    letterSpacing: 0.5,
  },
  silentBtn: {
    marginTop: 18,
    padding: 10,
  },
  silentBtnText: {
    fontFamily: 'Raleway-Regular',
    fontSize: 13,
    color: 'rgba(253, 248, 242, 0.55)',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 20,
  },
  footerBar: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Raleway-Bold',
    fontSize: 13,
    color: LOTO_PALETTE.CREMA,
    letterSpacing: 3,
  },
});
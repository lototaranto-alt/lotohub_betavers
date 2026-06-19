import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMobility } from '../context/MobilityContext';

export default function MobilityWizard() {
  const { mobilityType, saveMobilityChoice, loading } = useMobility();

  // Il Modal deve essere visibile SOLO SE !loading && mobilityType === null.
  // Se stiamo caricando o lo stato è già definito, non renderizzare nulla.
  if (loading || mobilityType !== null) {
    return null;
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Come esplori oggi?</Text>
          <Text style={styles.subtitle}>
            Regoliamo la bussola. Scopri i percorsi perfetti per te o crea il tuo itinerario sostenibile da condividere.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.btnDolce]}
            onPress={() => saveMobilityChoice('dolce', 2)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnDolceText}>🌱 A piedi, Bici, Monopattino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.btnPubblica]}
            onPress={() => saveMobilityChoice('pubblica', 10)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPubblicaText}>🚌 Bus o Mezzi Navali</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.btnPrivata]}
            onPress={() => saveMobilityChoice('privata', 30)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrivataText}>🚗 Auto o Moto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sfondo semi-trasparente
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    // Ombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    // Ombra Android
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  btnDolce: {
    backgroundColor: '#10B981', // Verde foglia prominente per la mobilità ecologica
  },
  btnDolceText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPubblica: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0a7ea4', // Colore primario del brand
  },
  btnPubblicaText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPrivata: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#9BA1A6', // Grigio neutro per la mobilità privata
  },
  btnPrivataText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
});

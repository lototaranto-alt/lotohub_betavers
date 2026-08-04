import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

export default function LotoPassRecoveryScanner({ visible, onClose, theme }: Props) {
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const processRecoveryCode = async (code: string) => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      // LOGICA DEFINITIVA: In produzione, la stringa letta dal QR viene passata a una RPC
      // che verifica il codice e restituisce un Custom JWT per quell'utente,
      // oppure fonde i dati del vecchio profilo con il nuovo UUID anonimo appena creato.
      
      const { data, error } = await supabase.rpc('recover_loto_pass', {
        recovery_code: code.trim()
      });

      if (error) {
        throw error;
      } else if (data?.success) {
        Alert.alert('Recupero Riuscito', data.message || 'Bentornato! Il tuo L.O.T.O. Pass è valido e i tuoi dati sono stati ripristinati.');
        onClose();
      } else {
        Alert.alert('Attenzione', data?.message || 'Codice non valido.');
      }
    } catch (err: any) {
      Alert.alert('Errore di Recupero', 'Impossibile verificare il codice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Recupero L.O.T.O. Pass</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* PLACEHOLDER SCANNER AREA */}
          <View style={[styles.cameraPlaceholder, { borderColor: theme.accent }]}>
            <MaterialIcons name="qr-code-scanner" size={60} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 10, textAlign: 'center' }}>
              (Funzione Scanner nativa in arrivo) Inquadra il QR Code salvato nella tua galleria.
            </Text>
          </View>

          <Text style={{ textAlign: 'center', color: theme.textMuted, marginVertical: 20 }}>— OPPURE INSERISCI MANUALMENTE —</Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Es. LOTO-A1B2C3D4-5678"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            value={manualCode}
            onChangeText={setManualCode}
          />

          <TouchableOpacity 
            onPress={() => processRecoveryCode(manualCode)} 
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.primary }]}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verifica Codice</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', borderRadius: 24, padding: 25, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  cameraPlaceholder: { height: 200, borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 20 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 16, textAlign: 'center', letterSpacing: 1 },
  button: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

import React, { useState } from 'react';
import { Modal, TextInput, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

interface B2BFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  poiId: string;
  theme: any;
}

export default function B2BFeedbackModal({ visible, onClose, poiId, theme }: B2BFeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (message.trim().length < 10) {
      Alert.alert('Messaggio troppo corto', 'Scrivi almeno 10 caratteri per aiutare il custode.');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere autenticato');

      const { error } = await supabase.from('partner_insights').insert({
        poi_id: poiId,
        user_id: user.id,
        message: message.trim()
      });

      if (error) throw error;
      
      Alert.alert('Inviato!', 'Il tuo messaggio anonimo è stato consegnato al custode.');
      setMessage('');
      onClose();
    } catch (err: any) {
      Alert.alert('Errore', 'Impossibile inviare il messaggio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <MaterialIcons name="mail-outline" size={24} color={theme.text} />
            <Text style={[styles.title, { color: theme.text, marginLeft: 8 }]}>Insight Riservato</Text>
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto' }}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Aiuta il partner a migliorare lasciando un Insight statistico (Visibile solo al proprietario). o custode di questo luogo. Solo loro potranno leggerlo.
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Scrivi qui il tuo messaggio..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: theme.primary }]}
            onPress={submitFeedback}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Invia Insight al Partner</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  container: { borderRadius: 16, padding: 20, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 15, minHeight: 120, marginBottom: 20 },
  btn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

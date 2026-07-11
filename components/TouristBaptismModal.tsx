import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';
import { useTheme } from '../context/ThemeContext';

interface TouristBaptismModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  onNicknameSaved: (nickname: string) => void;
}

export default function TouristBaptismModal({ visible, onClose, userProfile, onNicknameSaved }: TouristBaptismModalProps) {
  const { theme } = useTheme();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('Inserisci un nome o premi "Salta".');
      return;
    }

    if (trimmed.length < 3) {
      setError('Il nome deve avere almeno 3 caratteri.');
      return;
    }

    const badWords = ['admin', 'loto', 'root'];
    if (badWords.some(w => trimmed.toLowerCase().includes(w))) {
      setError('Nome non consentito.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', trimmed)
        .neq('id', userProfile?.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        setError('Nome già in uso, scegline un altro!');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ nickname: trimmed })
        .eq('id', userProfile?.id);

      if (updateError) throw updateError;

      onNicknameSaved(trimmed);
      onClose();
    } catch (err: any) {
      setError('Errore di connessione. Riprova.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Battesimo del Turista</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Scegli il tuo nome in codice per iniziare a raccogliere punti, scalare le classifiche civiche e sbloccare le storie segrete del borgo.
          </Text>

          <TextInput
            style={[
              styles.input,
              { 
                borderColor: error ? '#E74C3C' : theme.border, 
                color: theme.text,
                backgroundColor: theme.background
              }
            ]}
            placeholder="Il tuo nome esploratore..."
            placeholderTextColor={theme.textMuted}
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              setError(null);
            }}
            maxLength={20}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.skipButton, { borderColor: theme.border }]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.skipButtonText, { color: theme.textMuted }]}>Salta per ora</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.primary }]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Inizia Avventura</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'serif',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

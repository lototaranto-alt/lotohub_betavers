import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: any;
  userUuid: string;
}

export default function LotoPassBackupModal({ visible, onClose, theme, userUuid }: Props) {
  const [activeTab, setActiveTab] = useState<'qr' | 'email'>('qr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureCode, setSecureCode] = useState<string | null>(null);

  const generateLotoPass = async () => {
    // Simulazione di una generazione sicura: in produzione questo chiamerebbe una RPC su Supabase
    // per registrare un secret_hash legato a questo UUID.
    setSecureCode(`LOTO-${userUuid.substring(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleEmailBackup = async () => {
    if (!email || !password) {
      Alert.alert('Errore', 'Inserisci email e password.');
      return;
    }
    setLoading(true);
    try {
      // Aggancia l'email e la password all'account anonimo ESISTENTE!
      // Questo è il cuore dell'Unificazione del Dato.
      const { error } = await supabase.auth.updateUser({
        email: email,
        password: password,
      });

      if (error) throw error;

      Alert.alert('Successo', 'Il tuo profilo è ora al sicuro! Puoi usare questa email per accedere in futuro su qualsiasi dispositivo.');
      onClose();
    } catch (err: any) {
      Alert.alert('Errore di Backup', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 500 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>Messa in Sicurezza</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={28} color={theme.text} /></TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 20 }}>
            Il tuo profilo attuale è anonimo. Scegli un metodo di backup per non perdere i tuoi XP e PTI se cambi dispositivo.
          </Text>

          {/* TABS */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 20 }}>
            <TouchableOpacity 
              style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: activeTab === 'qr' ? theme.background : 'transparent', alignItems: 'center' }}
              onPress={() => setActiveTab('qr')}
            >
              <Text style={{ fontWeight: 'bold', color: activeTab === 'qr' ? theme.primary : theme.textMuted }}>Opzione A (QR)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: activeTab === 'email' ? theme.background : 'transparent', alignItems: 'center' }}
              onPress={() => setActiveTab('email')}
            >
              <Text style={{ fontWeight: 'bold', color: activeTab === 'email' ? theme.accent : theme.textMuted }}>Opzione B (Email)</Text>
            </TouchableOpacity>
          </View>

          {/* OPZIONE A: LOTO PASS QR */}
          {activeTab === 'qr' && (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="qr-code-2" size={80} color={theme.text} style={{ marginBottom: 15 }} />
              <Text style={{ textAlign: 'center', color: theme.text, marginBottom: 20 }}>
                Genera un L.O.T.O. Pass (QR Code). È totalmente anonimo. Salvalo nella galleria foto per recuperare il profilo in futuro.
              </Text>
              
              {!secureCode ? (
                <TouchableOpacity onPress={generateLotoPass} style={{ backgroundColor: theme.primary, padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Genera QR Code Anonimo</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ backgroundColor: '#F3F4F6', padding: 20, borderRadius: 12, width: '100%', alignItems: 'center' }}>
                  {/* Placeholder per il vero componente QRCode */}
                  <View style={{ width: 150, height: 150, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' }}>
                    <Text style={{ fontWeight: 'bold', color: '#333' }}>[ QR CODE QUI ]</Text>
                  </View>
                  <Text style={{ marginTop: 15, fontSize: 16, fontWeight: '900', letterSpacing: 2, color: '#333' }}>{secureCode}</Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' }}>Fai uno screenshot di questa schermata!</Text>
                </View>
              )}
            </View>
          )}

          {/* OPZIONE B: EMAIL TRADIZIONALE */}
          {activeTab === 'email' && (
            <View>
              <Text style={{ color: theme.text, marginBottom: 15 }}>
                Aggancia un'email classica. I tuoi dati attuali non verranno persi, verranno semplicemente unificati a questa email.
              </Text>
              
              <TextInput
                style={{ backgroundColor: theme.surface, color: theme.text, padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: theme.border }}
                placeholder="Email"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={{ backgroundColor: theme.surface, color: theme.text, padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: theme.border }}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity 
                onPress={handleEmailBackup} 
                disabled={loading}
                style={{ backgroundColor: theme.accent, padding: 15, borderRadius: 12, alignItems: 'center' }}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Metti al Sicuro il Profilo</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

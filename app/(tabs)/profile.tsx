import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LotoPassCard from '../../components/LotoPassCard';
import TipsBoutiqueSheet from '../../components/TipsBoutiqueSheet';
import { useTheme } from '../../context/ThemeContext';
import { useMobility } from '../../context/MobilityContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { forceReopenWizard } = useMobility();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isTipsVisible, setIsTipsVisible] = useState(false);

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert("Attenzione", "Inserisci email e password per effettuare il backup.");
      return;
    }
    
    setIsLinking(true);
    // Simula la chiamata Supabase di merge account (verrà implementata via Edge Function)
    setTimeout(() => {
      setIsLinking(false);
      Alert.alert(
        "Backup completato",
        `Il tuo account anonimo è stato fuso con ${email}. I tuoi LOTO PTI sono ora al sicuro!`,
        [{ text: "Ottimo!" }]
      );
    }, 1500);
  };

  const showTips = () => {
    setIsTipsVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* HEADER con Icona Aiuti in stile Boutique */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Il tuo L.O.T.O. Pass</Text>
          <Text style={styles.headerSubtitle}>Il tuo Status Digitale in città</Text>
        </View>
        <TouchableOpacity style={[styles.boutiqueIconBtn, { borderColor: theme.border }]} onPress={showTips}>
          <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <LotoPassCard />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Protezione Status e Backup</Text>
          <Text style={styles.sectionDesc}>
            Attualmente sei un utente anonimo. Abbiamo a cuore la tua privacy: puoi salvare la tua Card qui sopra come immagine per non perdere i punti, oppure creare un Backup Cloud (fortemente consigliato) inserendo un'email e una password.
          </Text>
          
          <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: theme.text }]}
                placeholder="La tua Email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputWrapper, { borderBottomWidth: 0 }]}>
              <MaterialIcons name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: theme.text }]}
                placeholder="Crea Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.authButton, { backgroundColor: theme.primary }]} 
            onPress={handleEmailLogin}
            activeOpacity={0.8}
            disabled={isLinking}
          >
            <Text style={styles.authButtonText}>{isLinking ? "Salvataggio in corso..." : "Metti al Sicuro i miei Punti"}</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      <TipsBoutiqueSheet visible={isTipsVisible} onClose={() => setIsTipsVisible(false)} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'serif'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    fontWeight: '500'
  },
  boutiqueIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  formContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wizardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  wizardBannerIcon: {
    marginRight: 15,
  },
  wizardBannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  wizardBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wizardBannerDesc: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.8,
  }
});

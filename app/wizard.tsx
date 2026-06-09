import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, Switch } from 'react-native';
import { supabase } from '../utils/supabase';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDFBF2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
};

const WIZARD_ASSETS = [
  require('../assets/images/intro_explore_1775676666618.png'),
  require('../assets/images/intro_protect_1775676688994.png'),
  require('../assets/images/intro_earn_1775676711707.png'),
];

const ROLES = [
  { id: 'LOTO Explorer', label: 'LOTO Explorer', desc: 'Turista standard' },
  { id: 'Flash Cruiser', label: 'Flash Cruiser', desc: 'Crocierista (Percorsi rapidi)' },
  { id: 'LOTO Partner', label: 'LOTO Partner', desc: 'Commerciante (Dashboard B2B)' }
];

export default function WizardScreen() {
  const [wizardStep, setWizardStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [flowRole, setFlowRole] = useState('LOTO Explorer');
  const [partySize, setPartySize] = useState('1');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [updatingWizard, setUpdatingWizard] = useState(false);

  const completaWizard = async () => {
    if (!nickname) {
      alert('Inserisci un nickname!');
      return;
    }
    setUpdatingWizard(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname,
          flow_role: flowRole,
          party_size: parseInt(partySize) || 1,
          accessibility_mode: accessibilityMode,
          profile_completed: true
        })
        .eq('id', user.id);

      if (error) {
        alert('Errore salvataggio profilo.');
        console.error(error);
        setUpdatingWizard(false);
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {__DEV__ && (
        <TouchableOpacity style={styles.devResetBtn} onPress={() => setWizardStep(0)}>
          <MaterialIcons name="restart-alt" size={24} color={LOTO_PALETTE.TERRACOTTA} />
        </TouchableOpacity>
      )}
      {wizardStep < 3 ? (
        <View style={styles.wizardContainer}>
          <Image source={WIZARD_ASSETS[wizardStep]} style={styles.wizardImg} resizeMode="contain" />
          <View style={styles.stepIndicator}>
            {[0, 1, 2].map((step) => (
              <View key={step} style={[styles.dot, wizardStep === step && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.btnNextImage} onPress={() => setWizardStep(wizardStep + 1)}>
            <Text style={styles.btnNextTextImage}>AVANTI</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
          <Text style={styles.formTitle}>Benvenuto in LOTO</Text>
          <Text style={styles.formSubtitle}>Crea il tuo profilo per personalizzare l&apos;esperienza.</Text>

          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="Come vuoi farti chiamare?"
            value={nickname}
            onChangeText={setNickname}
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Chi sei?</Text>
          <View style={styles.rolesContainer}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleOption, flowRole === r.id && styles.roleOptionActive]}
                onPress={() => setFlowRole(r.id)}
              >
                <Text style={[styles.roleLabel, flowRole === r.id && styles.roleLabelActive]}>{r.label}</Text>
                <Text style={[styles.roleDesc, flowRole === r.id && styles.roleDescActive]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Persone in viaggio</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={partySize}
            onChangeText={setPartySize}
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 15 }}>
              <Text style={styles.labelSwitch}>Modalità Accessibile</Text>
              <Text style={styles.switchDesc}>Attiva per ricevere avvisi su sfide architettoniche nei P.O.I.</Text>
            </View>
            <Switch
              value={accessibilityMode}
              onValueChange={setAccessibilityMode}
              trackColor={{ false: '#C9C4B8', true: LOTO_PALETTE.TERRACOTTA }}
              thumbColor={accessibilityMode ? '#FFF' : '#FFF'}
            />
          </View>

          <TouchableOpacity style={styles.btnSubmit} onPress={completaWizard} disabled={updatingWizard}>
            <Text style={styles.btnSubmitText}>{updatingWizard ? 'SALVATAGGIO...' : 'ENTRA IN LOTO'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LOTO_PALETTE.CREMA },
  devResetBtn: { position: 'absolute', top: 50, right: 20, zIndex: 100, backgroundColor: '#FFF', padding: 10, borderRadius: 20, elevation: 2, borderWidth: 0.5, borderColor: '#C9C4B8' },
  wizardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  wizardImg: { width: width * 0.9, height: height * 0.55 },
  stepIndicator: { flexDirection: 'row', marginTop: 20, marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9C4B8', marginHorizontal: 5 },
  dotActive: { backgroundColor: LOTO_PALETTE.TERRACOTTA, width: 20 },
  btnNextImage: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, paddingVertical: 18, paddingHorizontal: 60, borderRadius: 30, elevation: 4 },
  btnNextTextImage: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 },
  
  formContainer: { width: '100%', paddingHorizontal: 25, paddingTop: 40 },
  formTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'serif', color: LOTO_PALETTE.EBANO, marginBottom: 5 },
  formSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 30 },
  
  label: { fontSize: 13, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#FFF', padding: 18, borderRadius: 15, fontSize: 16, color: LOTO_PALETTE.EBANO, borderWidth: 0.5, borderColor: '#C9C4B8' },
  
  rolesContainer: { flexDirection: 'column', gap: 10 },
  roleOption: { padding: 18, backgroundColor: '#FFF', borderRadius: 15, borderWidth: 0.5, borderColor: '#C9C4B8' },
  roleOptionActive: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, borderColor: LOTO_PALETTE.VERDE_OLIVA },
  roleLabel: { fontSize: 16, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  roleLabelActive: { color: '#FFF' },
  roleDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  roleDescActive: { color: 'rgba(255,255,255,0.8)' },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 15, borderWidth: 0.5, borderColor: '#C9C4B8', marginTop: 25 },
  labelSwitch: { fontSize: 14, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  switchDesc: { fontSize: 11, color: '#64748B', marginTop: 5 },
  
  btnSubmit: { backgroundColor: LOTO_PALETTE.EBANO, paddingVertical: 20, borderRadius: 15, alignItems: 'center', marginTop: 35, marginBottom: 50 },
  btnSubmitText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
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
  require('../assets/images/intro_explore_flat.png'),
  require('../assets/images/intro_protect_flat.png'),
  require('../assets/images/intro_earn_flat.png'),
];

const PERSONAS = [
  { id: 'Standard', label: 'LOTO Explorer', desc: 'Utente standard, nessun limite.' },
  { id: 'Senior', label: 'Senior Cruiser', desc: 'Percorsi rilassati e frequenti soste.' },
  { id: '♿', label: 'Accessibile (♿)', desc: 'Percorsi privi di barriere architettoniche.' }
];

const RETURN_POINTS = [
  { id: 'Hotel', label: 'Hotel / B&B', icon: 'hotel' },
  { id: 'Cruise', label: 'Nave Crociera', icon: 'directions-boat' },
  { id: 'Station', label: 'Stazione', icon: 'train' }
];

export default function WizardScreen() {
  const [wizardStep, setWizardStep] = useState(0);
  const [userPersona, setUserPersona] = useState('Standard');
  const [returnPoint, setReturnPoint] = useState('Hotel');
  const [partySize, setPartySize] = useState(1);
  const [updatingWizard, setUpdatingWizard] = useState(false);

  const completaWizard = async (isSkipped = false) => {
    setUpdatingWizard(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_persona: userPersona,
          return_point_type: returnPoint,
          party_size: partySize,
          profile_completed: !isSkipped
        })
        .eq('id', user.id);

      if (error) {
        alert('Errore salvataggio profilo.');
        console.error(error);
        setUpdatingWizard(false);
      } else {
        router.replace('/(tabs)');
      }
    } else {
      alert('Nessun utente autenticato (Anonymous Auth fallita).');
      setUpdatingWizard(false);
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
        <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer} contentContainerStyle={{ paddingBottom: 50 }}>
          <Text style={styles.formTitle}>Identità Anonima</Text>
          <Text style={styles.formSubtitle}>I tuoi dati servono unicamente a personalizzare i percorsi e tarare l'ecosistema cittadino sui tuoi bisogni. Tutto avviene nel pieno rispetto dell'anonimato.</Text>

          <Text style={styles.label}>Chi sei?</Text>
          <View style={styles.rolesContainer}>
            {PERSONAS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.roleOption, userPersona === p.id && styles.roleOptionActive]}
                onPress={() => setUserPersona(p.id)}
              >
                <Text style={[styles.roleLabel, userPersona === p.id && styles.roleLabelActive]}>{p.label}</Text>
                <Text style={[styles.roleDesc, userPersona === p.id && styles.roleDescActive]}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 30 }]}>In quanti siete? (Party Size)</Text>
          <Text style={styles.formSubtitle}>Il tuo impatto e i LOTO PTI guadagnati verranno moltiplicati per i membri del gruppo.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', alignSelf: 'flex-start', borderRadius: 25, borderWidth: 0.5, borderColor: '#C9C4B8', padding: 5 }}>
            <TouchableOpacity onPress={() => setPartySize(Math.max(1, partySize - 1))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: LOTO_PALETTE.CREMA, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="remove" size={20} color={LOTO_PALETTE.EBANO} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, color: LOTO_PALETTE.EBANO }}>{partySize}</Text>
            <TouchableOpacity onPress={() => setPartySize(Math.min(20, partySize + 1))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: LOTO_PALETTE.TERRACOTTA, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 30 }]}>Punto di Rientro</Text>
          <Text style={styles.formSubtitle}>Serve per il "Punto di Ritorno" (rientro sicuro veloce).</Text>
          <View style={styles.returnPointsContainer}>
            {RETURN_POINTS.map(rp => (
              <TouchableOpacity
                key={rp.id}
                style={[styles.returnOption, returnPoint === rp.id && styles.returnOptionActive]}
                onPress={() => setReturnPoint(rp.id)}
              >
                <MaterialIcons 
                  name={rp.icon as any} 
                  size={28} 
                  color={returnPoint === rp.id ? '#FFF' : LOTO_PALETTE.VERDE_OLIVA} 
                  style={{ marginBottom: 5 }}
                />
                <Text style={[styles.returnLabel, returnPoint === rp.id && styles.returnLabelActive]}>{rp.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btnSubmit} onPress={() => completaWizard(false)} disabled={updatingWizard}>
            <Text style={styles.btnSubmitText}>{updatingWizard ? 'SALVATAGGIO...' : 'INIZIA L\'AVVENTURA'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{ marginTop: 5, marginBottom: 30, alignItems: 'center', padding: 15 }} onPress={() => completaWizard(true)}>
             <Text style={{ color: '#64748B', fontWeight: 'bold', textDecorationLine: 'underline' }}>Salta per ora (esplora da anonimo)</Text>
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
  formSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  
  label: { fontSize: 13, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  rolesContainer: { flexDirection: 'column', gap: 10 },
  roleOption: { padding: 18, backgroundColor: '#FFF', borderRadius: 15, borderWidth: 0.5, borderColor: '#C9C4B8' },
  roleOptionActive: { backgroundColor: LOTO_PALETTE.VERDE_OLIVA, borderColor: LOTO_PALETTE.VERDE_OLIVA },
  roleLabel: { fontSize: 16, fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  roleLabelActive: { color: '#FFF' },
  roleDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  roleDescActive: { color: 'rgba(255,255,255,0.8)' },

  returnPointsContainer: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  returnOption: { flex: 1, padding: 15, backgroundColor: '#FFF', borderRadius: 15, borderWidth: 0.5, borderColor: '#C9C4B8', alignItems: 'center' },
  returnOptionActive: { backgroundColor: LOTO_PALETTE.TERRACOTTA, borderColor: LOTO_PALETTE.TERRACOTTA },
  returnLabel: { fontSize: 12, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, textAlign: 'center' },
  returnLabelActive: { color: '#FFF' },
  
  btnSubmit: { backgroundColor: LOTO_PALETTE.EBANO, paddingVertical: 20, borderRadius: 15, alignItems: 'center', marginTop: 35 },
  btnSubmitText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});

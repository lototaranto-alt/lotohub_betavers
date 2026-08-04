import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import XpToast from '../../components/XpToast';
import { supabase } from '../../utils/supabase';

const { height } = Dimensions.get('window');

export default function DeepLinkPoiScreen() {
  const { id } = useLocalSearchParams();
  const idStr = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { theme } = useTheme();

  // Dati Mockati per le Associazioni
  const getPoiData = () => {
    if (idStr === 'casaviola') {
      return {
        title: 'Casa Viola',
        subtitle: 'B2B Partner - Centro Storico',
        description: 'Un angolo di quiete nel cuore della città.\n\nCasa Viola è un avamposto LOTO per la sostenibilità e la cultura. Effettuando la scansione hai validato la tua presenza e sostenuto il nodo civico.\n\n📍 BONUS ATTIVO: Hai sbloccato l\'accesso a eventi esclusivi.',
        reward: 50,
        type: 'XP' as 'XP'|'PTI',
        tags: ['Cultura', 'Partner', 'VIP']
      };
    }
    if (idStr === 'dis' || idStr === 'diseducation') {
      return {
        title: 'Diseducation',
        subtitle: 'Associazione Accessibilità - Taranto',
        description: 'Dis-Education è un nome che richiama l\'idea di educare alle disuguaglianze, favorendo maggiore consapevolezza, senso civico e responsabilità sociale.\n\nL\'associazione sostiene persone con disabilità e chiunque viva condizioni di marginalità sociale, promuovendo rispetto, autonomia e piena partecipazione alla vita della comunità.\n\n📍 EVENTO ATTIVO: Passeggiata Scan Inaccessibilità. Partecipa con la community per tracciare le barriere architettoniche del quartiere.',
        reward: 50,
        type: 'XP' as 'XP'|'PTI',
        tags: ['Accessibilità', 'Sociale', 'Cultura', 'Inclusione']
      };
    }
    if (idStr === 'tgt') {
      return {
        title: 'Taranto Grand Tour',
        subtitle: 'Esplorazione e Patrimonio',
        description: 'Benvenuto nel cuore storico di Taranto!\n\nTaranto Grand Tour ti invita a scoprire l\'anima più autentica della città, esplorando i vicoli e i segreti del borgo antico.\n\n📍 STORIA SBLOCCATA: Il segreto del vicolo. Hai esplorato un nuovo angolo della mappa!',
        reward: 50,
        type: 'XP' as 'XP'|'PTI',
        tags: ['Cultura', 'Esplorazione', 'Tour']
      };
    }
    // Default (Plasticaqquà)
    return {
      title: 'Plasticaqquà',
      subtitle: 'Nodo Civico Ambientale',
      description: 'Benvenuto nel cuore della rigenerazione urbana!\n\nPlasticaqquà ti invita a scoprire l\'anima più autentica della città unendo la tutela dell\'ambiente marino alla valorizzazione del patrimonio.\n\n📍 MISSIONE ATTIVA: Operazione "Spiagge Pulite". La tua visita genera un impatto reale per il nostro territorio. Hai finanziato la nostra prossima missione!',
      reward: 50,
      type: 'XP' as 'XP'|'PTI',
      tags: ['Ambiente', 'Civico', 'Impatto']
    };
  };

  const poiData = getPoiData();

  const [isScanning, setIsScanning] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastXp, setToastXp] = useState(0);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpTitle, setLevelUpTitle] = useState('');
  const [levelUpMessage, setLevelUpMessage] = useState('');
  
  const leveledUpTo = useRef<number | null>(null);

  const handleClaim = () => {
    setIsScanning(true);
    
    // Esegui salvataggio database in background senza bloccare l'animazione UI
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Fetch current XP
          const { data: profile } = await supabase.from('profiles').select('total_xp, pois_discovered, total_tokens').eq('id', session.user.id).single();
          if (profile) {
            const oldXp = profile.total_xp || 0;
            const newXp = oldXp + poiData.reward;
            const newScans = (profile.pois_discovered || 0) + 1;
            const newTokens = (profile.total_tokens || 0) + 15; // 15 LOTO PTI per scan
            
            const oldLevel = Math.floor(oldXp / 100);
            const newLevel = Math.floor(newXp / 100);
            
            // Aggiorna profilo (questo funziona sempre)
            await supabase.from('profiles').update({
              total_xp: newXp,
              pois_discovered: newScans,
              total_tokens: newTokens
            }).eq('id', session.user.id);
            
            // Track Level Up in state tramite useRef (per aggirare la closure del Toast)
            if (newLevel > oldLevel) {
              leveledUpTo.current = newLevel;
            }
            
            // Tentativo di insert nello storico (può fallire se il POI è mockato e non c'è nel DB, ma non bloccherà il level up)
            try {
              await supabase.from('scans').insert({
                poi_id: idStr,
                session_id: session.user.id,
                nfc_token: 'NFC_DEEP_LINK',
                ble_devices_count: 5,
                xp_awarded: poiData.reward,
                tenant_id: 'taranto'
              });
            } catch(err) {
              console.log('Skipping scan insert for mock POI');
            }
          } else {
            // OFFLINE DEMO FALLBACK: Se il server rifiuta la creazione, salviamo in locale!
            console.log("Fallback su AsyncStorage per XP e Tokens");
            
            const fallbackStr = await AsyncStorage.getItem('loto_fallback_xp');
            const fallbackTokensStr = await AsyncStorage.getItem('loto_fallback_tokens');
            const fallbackPoisStr = await AsyncStorage.getItem('loto_fallback_pois');
            
            const fallbackXp = fallbackStr ? parseInt(fallbackStr) : 0;
            const fallbackTokens = fallbackTokensStr ? parseInt(fallbackTokensStr) : 0;
            const fallbackPois = fallbackPoisStr ? parseInt(fallbackPoisStr) : 0;
            
            const newXp = fallbackXp + poiData.reward;
            const newTokens = fallbackTokens + 15;
            const newPois = fallbackPois + 1;
            
            await AsyncStorage.setItem('loto_fallback_xp', newXp.toString());
            await AsyncStorage.setItem('loto_fallback_tokens', newTokens.toString());
            await AsyncStorage.setItem('loto_fallback_pois', newPois.toString());
            
            const oldLevel = Math.floor(fallbackXp / 100);
            const newLevel = Math.floor(newXp / 100);
            
            if (newLevel > oldLevel) {
              leveledUpTo.current = newLevel;
            }
          }
        }
      } catch (e: any) {
        Alert.alert("Errore Critico", "Fallimento Deep Link: " + (e.message || JSON.stringify(e)));
        console.log('Error claiming reward via deep link', e);
      }
    })();
    
    // Simula 3 secondi di Foreground-Triggered BLE Scan (Garantito, indipendentemente dalla rete)
    setTimeout(() => {
      setIsScanning(false);
      
      // Haptic per il toast XP
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastMessage("Ottimo! Hai guadagnato " + poiData.reward + " XP!");
      setToastXp(poiData.reward);
      setToastVisible(true);
    }, 3000);
  };

  const handleToastHide = () => {
    setToastVisible(false);
    
    const targetLevel = leveledUpTo.current;

    if (targetLevel) {
      let title = "🌟 LIVELLO " + targetLevel + " RAGGIUNTO!";
      let message = "Congratulazioni per il level up!";
      
      if (targetLevel === 2) {
        title = "🎉 LIVELLO 2 RAGGIUNTO!";
        message = "Sei un Novizio! Hai appena sbloccato l'accesso alle prime guide audio esclusive dei POI. Continua l'esplorazione.";
      } else if (targetLevel === 3) {
        title = "🔥 LIVELLO 3 RAGGIUNTO!";
        message = "Esploratore! Il tuo impatto ecologico inizia a pesare. Sblocca nuovi file digitali e accumula token ambientali.";
      } else if (targetLevel === 4) {
        title = "🌍 LIVELLO 4 RAGGIUNTO!";
        message = "Cittadino Attivo! La mappa si riempie di colori. Preparati, la Community segreta ti aspetta al prossimo livello!";
      } else if (targetLevel >= 5) {
        title = "🔓 LIVELLO 5: COMMUNITY SBLOCCATA!";
        message = "Hai sbloccato l'accesso alla Community globale e agli Archivi Segreti! La tua influenza in città è ora reale.";
      }

      // Haptic per Level Up (impatto forte)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      setLevelUpTitle(title);
      setLevelUpMessage(message);
      setLevelUpModalVisible(true);
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Modale Level Up Custom */}
      <Modal visible={levelUpModalVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialIcons name="workspace-premium" size={100} color="#D4AF37" style={{ marginBottom: 20 }} />
          <Text style={{ fontFamily: 'serif', fontSize: 28, color: '#D4AF37', fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }}>{levelUpTitle}</Text>
          <Text style={{ fontFamily: 'Outfit_Regular', fontSize: 16, color: '#FFF', textAlign: 'center', marginBottom: 40, lineHeight: 24, paddingHorizontal: 20 }}>{levelUpMessage}</Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#D4AF37', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, elevation: 5 }}
            onPress={() => {
              setLevelUpModalVisible(false);
              router.replace('/' as any);
            }}
          >
            <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 16 }}>FANTASTICO!</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Toast Animato */}
      <XpToast 
        visible={toastVisible} 
        xpAmount={toastXp} 
        message={toastMessage}
        type={poiData.type}
        onHide={handleToastHide} 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Header Icon / Image */}
        <View style={[styles.headerIconContainer, { backgroundColor: theme.primary, overflow: 'hidden' }]}>
          {idStr === 'casaviola' ? (
             <Image 
              source={require('../../assets/images/casa_viola.png')} 
              style={{ width: '150%', height: '150%', transform: [{ scale: 1.2 }, { translateX: -10 }, { translateY: 0 }] }} 
              resizeMode="cover" 
            />
          ) : idStr === 'mena' || idStr === 'plasticaqqua' || idStr === 'tgt' ? (
            <Image 
              source={idStr === 'plasticaqqua' ? require('../../assets/images/plasticaqquà.png') : require('../../assets/images/mena_logo.jpg')} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="contain" 
            />
          ) : idStr === 'dis' || idStr === 'diseducation' ? (
            <Image 
              source={require('../../assets/images/diseducation_logo.jpg')} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="contain" 
            />
          ) : (
            <MaterialIcons name="accessible-forward" size={80} color={theme.background} />
          )}
        </View>

        {/* Info Box */}
        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: 'rgba(95, 113, 61, 0.1)' }]}>
             <MaterialIcons name="verified" size={16} color={theme.primary} />
             <Text style={[styles.badgeText, { color: theme.primary }]}>Partner L.O.T.O. Verificato</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{(idStr === 'mena' || idStr === 'plasticaqqua' || idStr === 'tgt' || idStr === 'dis' || idStr === 'diseducation') ? poiData.title : 'Punto di Interesse'}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{(idStr === 'mena' || idStr === 'plasticaqqua' || idStr === 'tgt' || idStr === 'dis' || idStr === 'diseducation') ? poiData.subtitle : 'Dettagli non trovati'}</Text>

          <View style={styles.tagsRow}>
            {poiData.tags.map(tag => (
              <View key={tag} style={[styles.tag, { borderColor: theme.border }]}>
                <Text style={[styles.tagText, { color: theme.textMuted }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.description, { color: theme.text }]}>
              {(idStr === 'mena' || idStr === 'plasticaqqua' || idStr === 'tgt' || idStr === 'dis' || idStr === 'diseducation') ? poiData.description : 'Contenuto sbloccato tramite Deep Link NDEF.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: isScanning ? theme.border : theme.primary }]} 
          onPress={handleClaim}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 10 }} />
              <Text style={[styles.btnText, { color: theme.primary, fontSize: 14 }]}>Scansione BLE in corso (3s)...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="nfc" size={24} color={theme.background} style={{ marginRight: 8 }} />
              <Text style={[styles.btnText, { color: theme.background }]}>Riscatta {poiData.reward} LOTO PTI</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>Chiudi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconContainer: { width: '100%', height: height * 0.35, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  content: { padding: 25, marginTop: -20 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 15 },
  badgeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  title: { fontSize: 32, fontWeight: '900', fontFamily: 'serif', marginBottom: 5 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25 },
  tag: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 10, marginBottom: 10 },
  tagText: { fontSize: 12, fontWeight: 'bold' },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 10 },
  description: { fontSize: 16, lineHeight: 24 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 15 },
  btnText: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { marginTop: 15, alignItems: 'center', padding: 10 },
  closeBtnText: { fontSize: 14, fontWeight: 'bold' }
});

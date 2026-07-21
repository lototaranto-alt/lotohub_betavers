import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import XpToast from '../../components/XpToast';

const { height } = Dimensions.get('window');

export default function DeepLinkPoiScreen() {
  const { id } = useLocalSearchParams();
  const idStr = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { theme } = useTheme();

  // Dati Mockati per le Associazioni
  const getPoiData = () => {
    if (idStr === 'dis' || idStr === 'diseducation') {
      return {
        title: 'Diseducation',
        subtitle: 'Associazione Accessibilità - Taranto',
        description: 'Dis-Education è un nome che richiama l\'idea di educare alle disuguaglianze, favorendo maggiore consapevolezza, senso civico e responsabilità sociale.\n\nL\'associazione sostiene persone con disabilità e chiunque viva condizioni di marginalità sociale, promuovendo rispetto, autonomia e piena partecipazione alla vita della comunità.\n\n📍 EVENTO ATTIVO: Passeggiata Scan Inaccessibilità. Partecipa con la community per tracciare le barriere architettoniche del quartiere.',
        reward: 60,
        type: 'PTI' as 'XP'|'PTI',
        tags: ['Accessibilità', 'Sociale', 'Cultura', 'Inclusione']
      };
    }
    if (idStr === 'tgt') {
      return {
        title: 'Taranto Grand Tour',
        subtitle: 'Esplorazione e Patrimonio',
        description: 'Benvenuto nel cuore storico di Taranto!\n\nTaranto Grand Tour ti invita a scoprire l\'anima più autentica della città, esplorando i vicoli e i segreti del borgo antico.\n\n📍 STORIA SBLOCCATA: Il segreto del vicolo. Hai esplorato un nuovo angolo della mappa!',
        reward: 15,
        type: 'XP' as 'XP'|'PTI',
        tags: ['Cultura', 'Esplorazione', 'Tour']
      };
    }
    if (idStr === 'mena') {
      return {
        title: 'Mena Mena Mè',
        subtitle: 'Food & Beverage Partner',
        description: 'Locale accogliente nel cuore di Taranto vecchia. Oggi ospita un incontro speciale con i ragazzi di Plasticaqquà e TGT per discutere i prossimi interventi sul territorio.\n\n📍 EVENTO ATTIVO: Incontro Plasticaqquà & TGT. Ottieni i tuoi punti bonus!',
        reward: 50,
        type: 'PTI' as 'XP'|'PTI',
        tags: ['Cibo', 'Socialità', 'Incontro']
      };
    }
    if (idStr === 'castello') {
      return {
        title: 'Castello Aragonese',
        subtitle: 'Fortezza Storica',
        description: 'Immergiti nella storia della città dei due mari. Costruito a protezione del borgo antico, il Castello Aragonese nasconde secoli di segreti navali e militari.\n\n📍 EVENTO ATTIVO: Visita interattiva. Guadagna punti scansionando l\'area e sblocca l\'audioguida esclusiva!',
        reward: 100,
        type: 'XP' as 'XP'|'PTI',
        tags: ['Storia', 'Cultura', 'Esplorazione']
      };
    }
    // Default (Plasticaqquà)
    return {
      title: 'Plasticaqquà',
      subtitle: 'Nodo Civico Ambientale',
      description: 'Benvenuto nel cuore della rigenerazione urbana!\n\nPlasticaqquà ti invita a scoprire l\'anima più autentica della città unendo la tutela dell\'ambiente marino alla valorizzazione del patrimonio.\n\n📍 MISSIONE ATTIVA: Operazione "Spiagge Pulite". La tua visita genera un impatto reale per il nostro territorio. Hai finanziato la nostra prossima missione!',
      reward: 10,
      type: 'PTI' as 'XP'|'PTI',
      tags: ['Ambiente', 'Civico', 'Impatto']
    };
  };

  const poiData = getPoiData();

  const [isScanning, setIsScanning] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastXp, setToastXp] = useState(0);

  const handleClaim = () => {
    setIsScanning(true);
    
    // Simula 3 secondi di Foreground-Triggered BLE Scan
    setTimeout(() => {
      setIsScanning(false);
      const simulatedBleCount = idStr === 'plasticaqqua' ? 34 : 12; // Dati plausibili basati sul POI

      setToastMessage(poiData.type === 'PTI' ? `Validazione + ${simulatedBleCount} BLE proxy` : `Hai sbloccato una storia`);
      setToastXp(poiData.reward);
      setToastVisible(true);
    }, 3000);
  };

  const handleToastHide = () => {
    setToastVisible(false);
    router.replace('/(tabs)/map');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <XpToast 
        visible={toastVisible} 
        xpAmount={poiData.type === 'XP' ? toastXp : 0} 
        ptiAmount={poiData.type === 'PTI' ? toastXp : 0}
        message={toastMessage}
        onHide={handleToastHide} 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Header Icon / Image */}
        <View style={[styles.headerIconContainer, { backgroundColor: theme.primary, overflow: 'hidden' }]}>
          {idStr === 'mena' ? (
            <Image source={require('../../assets/images/mena_logo.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : idStr === 'dis' || idStr === 'diseducation' ? (
            <Image source={require('../../assets/images/diseducation_logo.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : idStr === 'castello' ? (
            <Image source={require('../../assets/images/castello-evento.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <MaterialIcons name="local-activity" size={80} color={theme.background} />
          )}
        </View>

        {/* Info Box */}
        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: 'rgba(95, 113, 61, 0.1)' }]}>
             <MaterialIcons name="verified" size={16} color={theme.primary} />
             <Text style={[styles.badgeText, { color: theme.primary }]}>Partner L.O.T.O. Verificato</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{poiData.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{poiData.subtitle}</Text>

          <View style={styles.tagsRow}>
            {poiData.tags.map(tag => (
              <View key={tag} style={[styles.tag, { borderColor: theme.border }]}>
                <Text style={[styles.tagText, { color: theme.textMuted }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.description, { color: theme.text }]}>{poiData.description}</Text>
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

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

export default function DeepLinkPoiScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  // Dati Mockati per le Associazioni
  const getPoiData = () => {
    if (id === 'dis' || id === 'diseducation') {
      return {
        title: 'Diseducation',
        subtitle: 'Associazione Accessibilità - Taranto',
        description: 'Dis-Education è un nome che richiama l\'idea di educare alle disuguaglianze, favorendo maggiore consapevolezza, senso civico e responsabilità sociale.\n\nL\'associazione sostiene persone con disabilità e chiunque viva condizioni di marginalità sociale, promuovendo rispetto, autonomia e piena partecipazione alla vita della comunità.\n\nAttraverso progetti dedicati all\'accessibilità, percorsi formativi, attività culturali e collaborazioni con scuole, enti e realtà del territorio, lavoriamo per sviluppare comportamenti più attenti e relazioni più consapevoli.\n\nLe nostre iniziative si integrano con reti locali e nazionali, con l\'obiettivo di costruire una società più accogliente, sicura e realmente accessibile per tutte e tutti.',
        reward: 60,
        tags: ['Accessibilità', 'Sociale', 'Cultura', 'Inclusione']
      };
    }
    // Default (Mena Mena Mè)
    return {
      title: 'Mena Mena Mè',
      subtitle: 'Associazione di Promozione Sociale - Taranto',
      description: 'Siamo un\'Associazione di Promozione Sociale. Veniteci a trovare per degustare le prelibatezze che ci offre la natura in base alle stagioni. Buona musica, birra ghiacciata, forte ridondanza sociale e prezzi rigorosamente popolari nel cuore della Città Vecchia!',
      reward: 50,
      tags: ['Accessibilità', 'Inclusione', 'Musica', 'Popolare']
    };
  };

  const poiData = getPoiData();

  const [isScanning, setIsScanning] = useState(false);

  const handleClaim = () => {
    setIsScanning(true);
    
    // Simula 3 secondi di Foreground-Triggered BLE Scan
    setTimeout(() => {
      setIsScanning(false);
      const simulatedBleCount = id === 'mena' ? 34 : 12; // Dati plausibili basati sul POI

      Alert.alert(
        "Validazione Ibrida Completata!",
        `✅ ${poiData.reward} LOTO PTI guadagnati tramite NFC.\n\n📡 Radar BLE: rilevati ${simulatedBleCount} dispositivi anonimi circostanti.\n\nDato predittivo inviato alla Heatmap urbana in modo sicuro e anonimo.`,
        [{ text: "Torna alla Mappa", onPress: () => router.replace('/(tabs)/map') }]
      );
    }, 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Header Icon / Image */}
        <View style={[styles.headerIconContainer, { backgroundColor: theme.primary, overflow: 'hidden' }]}>
          {id === 'mena' ? (
            <Image 
              source={require('../../assets/images/mena_logo.jpg')} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="contain" 
            />
          ) : id === 'dis' || id === 'diseducation' ? (
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

          <Text style={[styles.title, { color: theme.text }]}>{id === 'mena' ? poiData.title : 'Punto di Interesse'}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{id === 'mena' ? poiData.subtitle : 'Dettagli non trovati'}</Text>

          <View style={styles.tagsRow}>
            {poiData.tags.map(tag => (
              <View key={tag} style={[styles.tag, { borderColor: theme.border }]}>
                <Text style={[styles.tagText, { color: theme.textMuted }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.description, { color: theme.text }]}>
              {id === 'mena' ? poiData.description : 'Contenuto sbloccato tramite Deep Link NDEF.'}
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

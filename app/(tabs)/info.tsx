import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useCity } from '../../context/CityContext';
import { getAssetPath } from '../../utils/getAssetUrl';

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  CREMA: '#FDF8F2',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
};

const AccordionItem = ({ title, children, icon }: { title: string, children: React.ReactNode, icon: any }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <MaterialIcons name={icon} size={24} color={LOTO_PALETTE.TERRACOTTA} style={{ marginRight: 15 }} />
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <MaterialIcons name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={LOTO_PALETTE.EBANO} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

export default function InfoScreen() {
  const { currentCity } = useCity();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: `${getAssetPath(currentCity, 'ui', 'logo-LOTO.png')}?v=2` }} 
            style={styles.logoImage} 
            transition={1000}
            contentFit="contain"
          />
          <Text style={styles.heroTitle}>L.O.T.O. HUB</Text>
          <Text style={styles.heroSubtitle}>Architettura Smart Routing V6</Text>
        </View>


        <AccordionItem title="Proprietà Intellettuale & Modello" icon="gavel">
          <Text style={styles.bodyText}>
            {"L.O.T.O. (Local Optimization & Territorial Organization) utilizza un modello proprietario di "}
            <Text style={styles.boldText}>{"Gestione Dinamica dei Flussi"}</Text>.
          </Text>
          <Text style={styles.bodyText}>
            {"L'algoritmo di Smart Routing è tutelato da segreto industriale e si basa sul "}
            <Text style={styles.boldText}>{"\"Triangolo della Verità\""}</Text>
            {": un triplo livello di validazione per prevenire frodi ambientali. Questo include il geofencing spaziale (raggio di 50m), la validazione cinematica (sospensione accumulo XP a velocità superiori ai 20 km/h) e il protocollo anti-double-spend per l'acquisizione degli scontrini OCR."}
          </Text>
          <Text style={styles.bodyText}>
            {"L'intero ecosistema logico per la deviazione della calca e il ripopolamento delle aree urbane secondarie di Taranto costituisce un asset intellettuale protetto. È severamente vietata la riproduzione del codice sorgente, dei layer cartografici o delle funzioni di calcolo ESG."}
          </Text>
        </AccordionItem>

        <AccordionItem title="Come Partecipare (How To Use)" icon="eco">
          <Text style={styles.bodyText}>
            {"Più che un'app, L.O.T.O. è un invito a riscoprire l'autentica bellezza di Taranto proteggendo il suo ecosistema."}
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={[styles.boldText, { color: LOTO_PALETTE.VERDE_OLIVA }]}>{"🍃 CO₂ Evitata:"}</Text>
            {" Camminare verso le mete consigliate o raggiungere un partner locale contribuisce ad abbattere le emissioni. Il nostro sistema converte i tuoi passi in chilogrammi di anidride carbonica risparmiata."}
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={[styles.boldText, { color: '#0056D2' }]}>{"🚰 Bonus Idrico (Refill):"}</Text>
            {" Porta con te la tua borraccia! Presso i partner aderenti, puoi fare il refill gratuito dell'acqua, risparmiando plastica e accumulando XP bonus."}
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={[styles.boldText, { color: LOTO_PALETTE.SABBIA_DORATA }]}>{"🪙 LOTO PTI:"}</Text>
            {" La moneta virtuale dell'impatto positivo. Eseguendo Check-in nelle aree culturali o scansionando gli scontrini, accumuli PTI per scalare la gerarchia LOTO (fino al rango Eroe del Mare) e sbloccare Storie Segrete."}
          </Text>
        </AccordionItem>

        <AccordionItem title="Policy & Contatti" icon="info-outline">
          <Text style={styles.bodyText}>
            Per assistenza tecnica, proposte di partnership (sezione B2B) o per richiedere i dati storici del proprio impatto ESG:
          </Text>
          <Text style={[styles.bodyText, { marginTop: 10, textAlign: 'center', fontWeight: 'bold' }]}>
            support@lotohub.com
          </Text>
        </AccordionItem>
        <View style={styles.ipMetadataContainer}>
          <Text style={styles.ipMetadataTitle}>IP & ASSET METADATA</Text>
          <Text style={styles.ipMetadataText}>Map Tiles & Rendering Engine: LOTO Ecosystem™</Text>
          <Text style={styles.ipMetadataText}>Boutique UI Assets: LOTO Core Design System</Text>
          <Text style={styles.ipMetadataText}>Iconografia: LOTO Original / Material Icons</Text>
          <Text style={styles.ipMetadataText}>Dati Geospaziali & Flow Management Algorithm: Proprietary</Text>
        </View>

        <Text style={styles.copy}>© 2026 LOTO Hub. Tutti i diritti riservati sulla Proprietà Intellettuale.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LOTO_PALETTE.CREMA },
  scrollContent: { padding: 25, paddingBottom: 50 },
  heroSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logoImage: { width: 100, height: 100, marginBottom: 5 },
  heroTitle: { fontSize: 32, fontWeight: '900', fontFamily: 'serif', color: LOTO_PALETTE.EBANO, marginTop: 15, letterSpacing: 2 },
  heroSubtitle: { fontSize: 13, color: LOTO_PALETTE.TERRACOTTA, marginTop: 5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  accordionContainer: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 0.5, borderColor: '#C9C4B8', overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  accordionTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'serif', color: LOTO_PALETTE.EBANO, flex: 1 },
  accordionContent: { paddingHorizontal: 20, paddingBottom: 25, backgroundColor: '#FFF', borderTopWidth: 0.5, borderTopColor: '#F0EBE1', paddingTop: 20 },
  
  bodyText: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 10 },
  boldText: { fontWeight: 'bold', color: LOTO_PALETTE.EBANO },
  bulletPoint: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 15, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: LOTO_PALETTE.TERRACOTTA },
  
  copy: { textAlign: 'center', fontSize: 10, color: '#94A3B8', marginTop: 30, textTransform: 'uppercase', letterSpacing: 1 },
  ipMetadataContainer: { backgroundColor: 'rgba(26, 28, 30, 0.03)', padding: 15, borderRadius: 10, marginTop: 10 },
  ipMetadataTitle: { fontSize: 10, fontWeight: 'bold', color: LOTO_PALETTE.EBANO, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  ipMetadataText: { fontSize: 9, color: '#64748B', marginBottom: 4 }
});

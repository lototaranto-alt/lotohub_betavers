import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface TipsBoutiqueSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TIPS_DATA = [
  {
    id: 'explore',
    title: 'Esplorazione Dinamica',
    icon: 'map',
    content: 'La mappa non mostra tutti i luoghi contemporaneamente per non sovraccaricarti. Accendi il filtro "Heatmap BLE" per scoprire dove pulsa il cuore della città in questo momento.'
  },
  {
    id: 'earn',
    title: 'Guadagnare LOTO PTI',
    icon: 'nfc',
    content: 'Quando raggiungi un Luogo d\'Interesse, avvicina il telefono all\'adesivo NFC che trovi all\'ingresso. In alternativa, scansiona il QR Code. Il GPS convaliderà la tua posizione e riceverai i tuoi PTI.'
  },
  {
    id: 'status',
    title: 'Status e Privilegi',
    icon: 'star-outline',
    content: 'I punti accumulati aumentano il livello del tuo L.O.T.O. Pass sbloccando Titoli speciali. Raggiungendo i nuovi Status (es. Elite, Gold) sbloccherai accessi VIP, funzionalità avanzate sulla mappa e potrai partecipare ad eventi esclusivi riservati alla Community.'
  },
  {
    id: 'civic',
    title: 'Gamification & Community',
    icon: 'volunteer-activism',
    content: 'Non si esplora da soli! Usa la mobilità dolce, partecipa alle sfide della Community LOTO, raccogli oggetti collezionabili e segnala le barriere. Contribuirai a rendere la città migliore e verrai premiato per il tuo impatto collettivo.'
  }
];

export default function TipsBoutiqueSheet({ visible, onClose }: TipsBoutiqueSheetProps) {
  const { theme } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>L'Arte di Esplorare</Text>
              <Text style={styles.subtitle}>Guide e segreti per maestri del viaggio</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {TIPS_DATA.map((tip) => {
              const isExpanded = expandedId === tip.id;
              return (
                <View key={tip.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity 
                    style={styles.cardHeader} 
                    onPress={() => toggleExpand(tip.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                        <MaterialIcons name={tip.icon as any} size={22} color={theme.primary} />
                      </View>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{tip.title}</Text>
                    </View>
                    <MaterialIcons 
                      name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color={theme.text} 
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.cardBody}>
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      <Text style={[styles.cardContent, { color: theme.text }]}>{tip.content}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: '75%',
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic'
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  }
});

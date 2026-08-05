import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface VaultModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  theme: any;
}

export default function VaultModal({ visible, onClose, userProfile, theme }: VaultModalProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchMedia();
    }
  }, [visible]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_vault')
        .select('*')
        .limit(10);
      
      if (!error && data) {
        setMedia(data);
      }
    } catch (e) {
      console.log('Errore fetch vault', e);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: '#D6734E' }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Memoria L.O.T.O.</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', padding: 20 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(214, 115, 78, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <MaterialIcons name="photo-library" size={40} color="#D6734E" />
            </View>
            <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center', marginBottom: 20 }}>
              Qui troverai tutte le audioguide e i materiali sbloccati esplorando i P.O.I.
            </Text>
          </View>

          <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>I TUOI CONTENUTI</Text>
            
            {loading ? (
              <ActivityIndicator size="small" color="#D6734E" style={{ marginTop: 20 }} />
            ) : media.length === 0 ? (
              <Text style={{ fontSize: 13, textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: theme.textMuted }}>
                Nessun contenuto multimediale sbloccato.
              </Text>
            ) : (
              media.map((item, idx) => (
                <View key={idx} style={[styles.mediaItem, { borderBottomColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name={item.media_type === 'audio' ? 'headset' : 'image'} size={24} color="#D6734E" style={{ marginRight: 15 }} />
                    <View>
                      <Text style={[styles.txTitle, { color: theme.text }]}>{item.title || 'Contenuto Sbloccato'}</Text>
                      <Text style={[styles.txDate, { color: theme.textMuted }]}>{item.media_type === 'audio' ? 'Audioguida' : 'Immagine'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={{ backgroundColor: '#D6734E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>APRI</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 28, 30, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '70%', borderRadius: 30, borderWidth: 1, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', fontFamily: 'serif' },
  closeBtn: { padding: 5 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  mediaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 15 },
  txTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  txDate: { fontSize: 11 },
});

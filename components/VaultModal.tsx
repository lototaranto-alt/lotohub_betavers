import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '../utils/supabase';

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
      // In a real scenario, this should join with user_unlocked_media or check-ins.
      // For now, we simulate fetching the historical media from the DB.
      const { data, error } = await supabase
        .from('media_vault')
        .select('*');
      
      if (!error && data) {
        setMedia(data);
      }
    } catch (e) {
      console.log('Errore fetch vault', e);
    }
    setLoading(false);
  };

  const audioMedia = media.filter(m => m.media_type === 'audio');
  const imageMedia = media.filter(m => m.media_type === 'image' || m.media_type === 'photo');
  const docMedia = media.filter(m => m.media_type === 'document' || m.media_type === 'text');

  const renderMediaRow = (item: any, idx: number) => (
    <View key={idx} style={[styles.mediaItem, { borderBottomColor: theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <MaterialIcons 
          name={item.media_type === 'audio' ? 'headset' : item.media_type === 'document' ? 'article' : 'image'} 
          size={24} 
          color="#D6734E" 
          style={{ marginRight: 15 }} 
        />
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>{item.title || 'Contenuto Sbloccato'}</Text>
          <Text style={[styles.txDate, { color: theme.textMuted }]}>
            {item.poi_name ? `📍 ${item.poi_name}` : 'Documento Storico'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={{ backgroundColor: '#D6734E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15 }}>
        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>APRI</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: '#D6734E' }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Archivio Storico</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(214, 115, 78, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <MaterialIcons name="history-edu" size={30} color="#D6734E" />
            </View>
            <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
              In questo archivio troverai le audioguide, i documenti e i segreti sbloccati durante le tue esplorazioni.
            </Text>
          </View>

          <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 20 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#D6734E" style={{ marginTop: 40 }} />
            ) : media.length === 0 ? (
              <Text style={{ fontSize: 13, textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: theme.textMuted }}>
                Il tuo archivio è ancora vuoto. Scansiona i POI per svelare i segreti della città.
              </Text>
            ) : (
              <>
                {audioMedia.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: '#D6734E' }]}>🎧 AUDIOGUIDE</Text>
                    {audioMedia.map(renderMediaRow)}
                  </View>
                )}

                {imageMedia.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: '#D6734E' }]}>🖼️ GALLERIA STORICA</Text>
                    {imageMedia.map(renderMediaRow)}
                  </View>
                )}

                {docMedia.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: '#D6734E' }]}>📜 DOCUMENTI E SEGRETI</Text>
                    {docMedia.map(renderMediaRow)}
                  </View>
                )}
                
                {/* Fallback if media_type is null or weird */}
                {media.filter(m => !['audio','image','photo','document','text'].includes(m.media_type)).length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: '#D6734E' }]}>🔍 ALTRI RITROVAMENTI</Text>
                    {media.filter(m => !['audio','image','photo','document','text'].includes(m.media_type)).map(renderMediaRow)}
                  </View>
                )}
              </>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 15, 20, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '80%', borderRadius: 20, borderWidth: 1, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, marginTop: '10%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(214, 115, 78, 0.2)' },
  headerTitle: { fontSize: 22, fontWeight: '900', fontFamily: 'serif' },
  closeBtn: { padding: 5 },
  sectionContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  mediaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 12 },
  txTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  txDate: { fontSize: 11 },
});

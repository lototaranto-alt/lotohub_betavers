import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, Alert, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface MemoriesCameraModalProps {
  visible: boolean;
  onClose: () => void;
  userLevel: number;
  theme: any;
}

// Configurazione filtri basata sul GDD "Visioni Sospese"
const FILTERS = [
  { id: 'none', name: 'Naturale', minLevel: 1 },
  { id: 'bisso', name: 'Polvere di Bisso', minLevel: 1 }, // Sblocco base
  { id: 'spartane', name: 'Geometrie Spartane', minLevel: 11 }, // Tier 2
  { id: 'linfa', name: 'La Linfa del Loto', minLevel: 21 }, // Tier 3
  { id: 'ombre', name: 'Ombre del Borgo', minLevel: 31 }, // Tier 4
  { id: 'custode', name: 'Sigillo dei Due Mari', minLevel: 41 } // Tier 5
];

export default function MemoriesCameraModal({ visible, onClose, userLevel, theme }: MemoriesCameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  
  const cameraRef = useRef<any>(null);
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  const handleClose = () => {
    setPhotoUri(null);
    onClose();
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setPhotoUri(photo.uri);
      } catch (err) {
        Alert.alert('Errore', 'Impossibile scattare la foto.');
      }
    }
  };

  const shareMemory = async () => {
    try {
      // Catturiamo la View intera, che fonde l'immagine e il filtro grafico sovrastante!
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Condividi la tua Visione Sospesa',
      });
    } catch (err) {
      Alert.alert('Errore', 'Impossibile generare la LOTO Memory.');
    }
  };

  // Rendering Dinamico dei Filtri CSS (Mock per PNG futuri)
  const renderOverlayEffect = () => {
    switch (selectedFilter.id) {
      case 'bisso':
        return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]} pointerEvents="none" />;
      case 'spartane':
        return <View style={[StyleSheet.absoluteFill, { borderWidth: 12, borderColor: '#8D6E63', borderStyle: 'solid' }]} pointerEvents="none" />;
      case 'linfa':
        return <View style={[StyleSheet.absoluteFill, { borderWidth: 16, borderColor: '#2A9D8F', borderRadius: 20 }]} pointerEvents="none" />;
      case 'ombre':
        return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(60, 40, 20, 0.35)' }]} pointerEvents="none" />;
      case 'custode':
        return (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 }]} pointerEvents="none">
            <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <MaterialIcons name="waves" size={40} color="#FFD700" />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (!permission?.granted) {
    return null; // O un fallback view
  }

  const availableFilters = FILTERS.filter(f => userLevel >= f.minLevel);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
            <MaterialIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Visioni Sospese</Text>
          {!photoUri ? (
            <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={styles.iconBtn}>
              <MaterialIcons name="flip-camera-ios" size={28} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* CAMERA / PREVIEW AREA */}
        <View style={styles.cameraWrapper} ref={viewShotRef}>
          {!photoUri ? (
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          ) : (
            <Image source={{ uri: photoUri }} style={styles.camera} resizeMode="cover" />
          )}
          
          {/* OVERLAY APPLICATO */}
          {renderOverlayEffect()}
          
          {/* WATERMARK FISSO (Branding Virale) */}
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>Svelato tramite L.O.T.O.</Text>
          </View>
        </View>

        {/* CONTROLS (Filtri e Scatto) */}
        <View style={styles.controlsContainer}>
          
          {/* SCORRIMENTO FILTRI */}
          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {availableFilters.map(filter => {
                const isSelected = selectedFilter.id === filter.id;
                return (
                  <TouchableOpacity 
                    key={filter.id} 
                    onPress={() => setSelectedFilter(filter)}
                    style={[styles.filterBtn, isSelected && { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}
                  >
                    <Text style={[styles.filterText, isSelected && { color: theme.accent, fontWeight: 'bold' }]}>
                      {filter.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* AZIONI PRINCIPALI */}
          <View style={styles.actionRow}>
            {!photoUri ? (
              <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <TouchableOpacity onPress={() => setPhotoUri(null)} style={[styles.secondaryBtn, { backgroundColor: '#333' }]}>
                  <MaterialIcons name="refresh" size={24} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryBtnText}>Riscattalo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={shareMemory} style={[styles.secondaryBtn, { backgroundColor: theme.primary }]}>
                  <MaterialIcons name="share" size={24} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryBtnText}>Condividi Eco</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold', letterSpacing: 1 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  
  cameraWrapper: { flex: 1, marginHorizontal: 10, borderRadius: 24, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  camera: { flex: 1 },
  
  watermark: { position: 'absolute', bottom: 10, right: 15, opacity: 0.6 },
  watermarkText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },

  controlsContainer: { height: 180, justifyContent: 'space-evenly' },
  
  filtersWrapper: { height: 50 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#444', marginRight: 10, justifyContent: 'center' },
  filterText: { color: '#AAA', fontSize: 12 },

  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  
  captureBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },
  
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, elevation: 4 },
  secondaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

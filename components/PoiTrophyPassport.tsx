import React, { useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ImageBackground, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { getRankInfo } from '../utils/levelUtils';

const { width, height } = Dimensions.get('window');

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  TERRACOTTA: '#C36B4D',
  EBANO: '#1A1C1E',
  SABBIA_DORATA: '#D9A05B',
  CREMA: '#FDF8F2',
};

type PoiTrophyPassportProps = {
  visible: boolean;
  poi: any;
  userLevel: number;
  onClose: () => void;
};

export default function PoiTrophyPassport({ visible, poi, userLevel, onClose }: PoiTrophyPassportProps) {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<any>(null);

  const captureCard = async (): Promise<string | null> => {
    try {
      if (!viewShotRef.current) return null;
      return await viewShotRef.current.capture();
    } catch (error) {
      console.error('Error capturing passport:', error);
      return null;
    }
  };

  const handleShare = async () => {
    const uri = await captureCard();
    if (!uri) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Condividi la tua scoperta su L.O.T.O.',
          mimeType: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error sharing passport:', error);
    }
  };

  const handleSaveToGallery = async () => {
    const uri = await captureCard();
    if (!uri) return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permesso Negato', 'Per salvare la scoperta nella galleria, concedi l\'accesso alle foto nelle impostazioni.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Salvata!', 'La tua Scheda Trofeo è stata salvata nella galleria.');
    } catch (error) {
      console.error('Error saving passport to gallery:', error);
      Alert.alert('Errore', 'Non è stato possibile salvare la scheda nella galleria.');
    }
  };

  if (!poi) return null;

  const rankInfo = getRankInfo(userLevel);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color={LOTO_PALETTE.CREMA} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.viewShotContainer}>
            <ImageBackground 
              source={{ uri: poi.image_url || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2070&auto=format&fit=crop' }} 
              style={styles.passportCard}
              imageStyle={styles.passportImage}
            >
              <View style={styles.overlay} />
              
              <View style={styles.cardHeader}>
                <Text style={styles.appName}>L.O.T.O. PASS</Text>
                <MaterialIcons name="verified" size={24} color={LOTO_PALETTE.SABBIA_DORATA} />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.poiName}>{poi.name}</Text>
                <Text style={styles.poiCategory}>{poi.category || "Luogo d'Interesse"}</Text>

                <View style={styles.levelContent}>
                  <Text style={styles.levelTitle}>Livello {userLevel} • {rankInfo.rankName}</Text>
                  <Text style={styles.levelDesc}>
                    Prossimo grado: {rankInfo.rankName === 'LEGGENDA L.O.T.O.' ? 'Massimo livello raggiunto' : `${rankInfo.nextRank} (Livello ${rankInfo.requiredLvl})`}
                  </Text>
                </View>

                <View style={styles.footerBranding}>
                  <Text style={styles.brandText}>Unisciti a L.O.T.O.</Text>
                  <Text style={styles.brandSubtext}>Zero-PII | Turismo Sostenibile</Text>
                </View>
              </View>
            </ImageBackground>
          </ViewShot>
        </View>

        <View style={[styles.actionContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveToGallery}>
            <MaterialIcons name="save-alt" size={24} color={LOTO_PALETTE.EBANO} />
            <Text style={styles.saveButtonText}>Salva in Galleria</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <MaterialIcons name="share" size={24} color={LOTO_PALETTE.CREMA} />
            <Text style={styles.shareButtonText}>Condividi Scoperta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 28, 30, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  viewShotContainer: {
    width: width - 40,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    backgroundColor: LOTO_PALETTE.EBANO,
  },
  passportCard: {
    width: '100%',
    minHeight: 450,
    justifyContent: 'space-between',
    padding: 24,
  },
  passportImage: {
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 28, 30, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 1,
  },
  appName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: LOTO_PALETTE.SABBIA_DORATA,
    letterSpacing: 2,
  },
  cardBody: {
    zIndex: 1,
    flex: 1,
    justifyContent: 'flex-end',
  },
  poiName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    color: LOTO_PALETTE.CREMA,
    marginBottom: 8,
  },
  poiCategory: {
    fontFamily: 'Raleway-Regular',
    fontSize: 14,
    color: LOTO_PALETTE.SABBIA_DORATA,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  levelContent: {
    backgroundColor: 'rgba(253, 248, 242, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 160, 91, 0.3)',
    marginBottom: 24,
  },
  levelTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    color: LOTO_PALETTE.SABBIA_DORATA,
    marginBottom: 8,
  },
  levelDesc: {
    fontFamily: 'Raleway-Regular',
    fontSize: 14,
    color: LOTO_PALETTE.CREMA,
    lineHeight: 20,
  },
  footerBranding: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandText: {
    fontFamily: 'Raleway-Bold',
    fontSize: 14,
    color: LOTO_PALETTE.CREMA,
  },
  brandSubtext: {
    fontFamily: 'Raleway-Regular',
    fontSize: 10,
    color: 'rgba(253, 248, 242, 0.6)',
    marginTop: 4,
  },
  actionContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LOTO_PALETTE.SABBIA_DORATA,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    elevation: 5,
    shadowColor: LOTO_PALETTE.SABBIA_DORATA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontFamily: 'Raleway-Bold',
    fontSize: 16,
    color: LOTO_PALETTE.EBANO,
    marginLeft: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LOTO_PALETTE.TERRACOTTA,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
    shadowColor: LOTO_PALETTE.TERRACOTTA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shareButtonText: {
    fontFamily: 'Raleway-Bold',
    fontSize: 16,
    color: LOTO_PALETTE.CREMA,
    marginLeft: 12,
  },
});

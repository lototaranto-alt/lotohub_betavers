import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { height } = Dimensions.get('window');

interface ScannedPoisSheetProps {
  visible: boolean;
  onClose: () => void;
  scannedPois: any[];
  theme: any;
}

export default function ScannedPoisSheet({ visible, onClose, scannedPois, theme }: ScannedPoisSheetProps) {
  
  const renderPoiItem = ({ item }: { item: any }) => (
    <View style={[styles.poiItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.poiImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.poiImage} />
        ) : (
          <MaterialIcons name="image" size={30} color={theme.textMuted} />
        )}
      </View>
      <View style={styles.poiInfo}>
        <Text style={[styles.poiTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.poiCategory, { color: theme.textMuted }]}>{item.category || 'Mete'}</Text>
      </View>
      <View style={[styles.xpBadge, { backgroundColor: theme.accent + '20' }]}>
        <Text style={[styles.xpText, { color: theme.accent }]}>+{item.xp_reward || 15} XP</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />
          
          <View style={styles.container}>
            <View style={styles.header}>
              <MaterialIcons name="search" size={28} color={theme.accent} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Indizi Trovati</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Hai scansionato {scannedPois.length} luoghi di interesse.
            </Text>

            {scannedPois.length > 0 ? (
              <FlatList
                data={scannedPois}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderPoiItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="explore" size={60} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Non hai ancora scansionato alcun indizio.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: height * 0.7,
    paddingTop: 10,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
  },
  poiImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 15,
  },
  poiImage: {
    width: '100%',
    height: '100%',
  },
  poiInfo: {
    flex: 1,
  },
  poiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  poiCategory: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  }
});

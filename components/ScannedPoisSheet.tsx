import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { height } = Dimensions.get('window');

const PATRIMONIO_CATEGORIES = ['park', 'fountain', 'monument', 'museum', 'attraction'];
const CUSTODI_CATEGORIES = ['partner', 'custodian', 'b2b'];
const EVENTI_CATEGORIES = ['event', 'community', 'cleanup'];

interface ScannedPoisSheetProps {
  visible: boolean;
  onClose: () => void;
  scannedPois: any[];
  theme: any;
  onSelectPoi?: (poi: any) => void;
}

type FilterKey = 'patrimonio' | 'custodi' | 'eventi';

export default function ScannedPoisSheet({ visible, onClose, scannedPois, theme, onSelectPoi }: ScannedPoisSheetProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey | null>(null);

  const filteredPois = activeFilter === 'patrimonio'
    ? scannedPois.filter(p => PATRIMONIO_CATEGORIES.includes(p.category))
    : activeFilter === 'custodi'
      ? scannedPois.filter(p => CUSTODI_CATEGORIES.includes(p.category))
      : activeFilter === 'eventi'
        ? scannedPois.filter(p => EVENTI_CATEGORIES.includes(p.category))
        : scannedPois;

  // Calculate counters
  const countPatrimonio = scannedPois.filter(p => PATRIMONIO_CATEGORIES.includes(p.category)).length;
  const countCustodi = scannedPois.filter(p => CUSTODI_CATEGORIES.includes(p.category)).length;
  const countEventi = scannedPois.filter(p => EVENTI_CATEGORIES.includes(p.category)).length;

  const renderPoiItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.poiItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      activeOpacity={0.8}
      onPress={() => {
        if (onSelectPoi) {
          onClose();
          onSelectPoi(item);
        }
      }}
    >
      <View style={styles.poiImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.poiImage} />
        ) : (
          <MaterialIcons name="image" size={30} color={theme.textMuted} />
        )}
      </View>
      <View style={styles.poiInfo}>
        <Text style={[styles.poiTitle, { color: theme.text }]} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={[styles.poiCategory, { color: theme.textMuted }]}>{item.category || 'Mete'}</Text>
      </View>
      <View style={[styles.xpBadge, { backgroundColor: theme.accent + '20' }]}>
        <Text style={[styles.xpText, { color: theme.accent }]}>+{item.xp_reward || 15} XP</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
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

            {/* 3 Macro-Categorie Interattive */}
            {scannedPois.length > 0 && (
              <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.statsRow}>
                  <TouchableOpacity
                    style={[styles.counterBtn, activeFilter === 'patrimonio' && { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
                    onPress={() => setActiveFilter(activeFilter === 'patrimonio' ? null : 'patrimonio')}
                  >
                    <Text style={[styles.counterNum, { color: '#2ECC71' }]}>{countPatrimonio}</Text>
                    <Text style={[styles.counterLabel, { color: theme.textMuted }]}>Patrimonio</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.counterBtn, activeFilter === 'custodi' && { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
                    onPress={() => setActiveFilter(activeFilter === 'custodi' ? null : 'custodi')}
                  >
                    <Text style={[styles.counterNum, { color: '#E67E22' }]}>{countCustodi}</Text>
                    <Text style={[styles.counterLabel, { color: theme.textMuted }]}>Custodi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.counterBtn, activeFilter === 'eventi' && { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
                    onPress={() => setActiveFilter(activeFilter === 'eventi' ? null : 'eventi')}
                  >
                    <Text style={[styles.counterNum, { color: '#3498DB' }]}>{countEventi}</Text>
                    <Text style={[styles.counterLabel, { color: theme.textMuted }]}>Eventi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.counterBtn, activeFilter === null && { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
                    onPress={() => setActiveFilter(null)}
                  >
                    <Text style={[styles.counterNum, { color: '#9B59B6' }]}>{scannedPois.length}</Text>
                    <Text style={[styles.counterLabel, { color: theme.textMuted }]}>Segreti</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {filteredPois.length > 0 ? (
              <FlatList
                data={filteredPois}
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
    height: height * 0.75,
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
    marginBottom: 15,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  counterBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  counterNum: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    marginTop: 2,
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

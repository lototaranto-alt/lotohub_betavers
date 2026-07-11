import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Dimensions, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useRouteBuilder } from '../context/RouteContext';
import { useMobility } from '../context/MobilityContext';
import { mockEvents } from '../utils/mockEvents';

const { height } = Dimensions.get('window');

type RouteSummarySheetProps = {
  visible: boolean;
  onClose: () => void;
};

export default function RouteSummarySheet({ visible, onClose }: RouteSummarySheetProps) {
  const { theme } = useTheme();
  const { routePois, removePoiFromRoute, isPoiInRoute, routeName, setRouteName, routeEvents, addEventToRoute, removeEventFromRoute, isEventInRoute, clearRoute, setIsRouteActive } = useRouteBuilder();
  const { mobilityType } = useMobility();

  const getMobilityName = (type: string | null) => {
    if (type === 'pubblica') return 'Mezzi Pubblici';
    if (type === 'privata') return 'Veicoli Privati';
    return 'Mobilità Dolce';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={[styles.title, { color: theme.text, padding: 0, flex: 1 }]}
                  value={routeName}
                  onChangeText={setRouteName}
                  placeholder="Nome itinerario..."
                  placeholderTextColor={theme.textMuted}
                />
                <MaterialIcons name="edit" size={18} color={theme.textMuted} style={{ marginLeft: 8 }} />
              </View>
              <Text style={[styles.subtitle, { color: '#64748B' }]}>
                Ecco i luoghi che hai scelto di esplorare oggi.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* List of POIs - Scrollable with max height */}
          <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 10 }}>
            {routePois.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="explore" size={48} color="#E2E8F0" />
                <Text style={[styles.emptyText, { color: '#94A3B8' }]}>
                  Il tuo percorso è vuoto. Tocca i luoghi sulla mappa per aggiungerli.
                </Text>
              </View>
            ) : (
              <View style={{ maxHeight: height * 0.25 }}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {routePois.map((poi, index) => (
                    <View key={poi.id} style={[styles.poiRow, { borderBottomColor: theme.border }]}>
                      <View style={styles.poiNumber}>
                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{index + 1}</Text>
                      </View>
                      {poi.image_url ? (
                        <Image source={{ uri: poi.image_url }} style={styles.poiImage} />
                      ) : (
                        <View style={[styles.poiImagePlaceholder, { backgroundColor: theme.primary }]}>
                          <MaterialIcons name="place" size={20} color="#FFF" />
                        </View>
                      )}
                      <View style={styles.poiInfo}>
                        <Text style={[styles.poiName, { color: theme.text }]} numberOfLines={1}>{poi.name}</Text>
                        <Text style={[styles.poiCategory, { color: theme.textMuted }]}>{poi.category === 'partner' ? 'B2B Partner' : 'Cultura'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removePoiFromRoute(poi.id)} style={styles.deleteBtn}>
                        <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* SFIDE ATTIVE (Eventi Selezionati) */}
            {routeEvents.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>⚔️ SFIDE ATTIVE</Text>
                {routeEvents.map(ev => (
                  <View key={ev.id} style={[styles.activeEventRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialIcons name={ev.icon as any} size={20} color="#10B981" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.poiName, { color: theme.text }]} numberOfLines={1}>{ev.title}</Text>
                      <Text style={[styles.poiCategory, { color: theme.textMuted }]}>+{ev.xp} XP in palio</Text>
                    </View>
                    <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  </View>
                ))}
              </View>
            )}
            
            {/* Mapbox Route Notice */}
            {routePois.length > 0 && (
              <View style={[styles.noticeBox, { backgroundColor: theme.primary + '1A', borderColor: theme.primary }]}>
                <MaterialIcons name="info-outline" size={16} color={theme.primary} />
                <Text style={[styles.noticeText, { color: theme.text }]}>
                  Tracciato ottimizzato per <Text style={{fontWeight: 'bold'}}>{getMobilityName(mobilityType)}</Text>.
                </Text>
              </View>
            )}

            {/* EVENTI IN ZONA (Upselling Slider) */}
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.title, { color: theme.text, fontSize: 16, marginBottom: 10 }]}>🤝 Eventi della Community</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -25 }} contentContainerStyle={{ paddingHorizontal: 25 }}>
                {mockEvents.map(ev => {
                  const isAdded = isEventInRoute(ev.id);
                  return (
                    <View key={ev.id} style={[styles.eventCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <View style={styles.eventCardHeader}>
                        <View style={[styles.eventTypeBadge, { backgroundColor: ev.type === 'Competitivo' ? '#EF4444' : ev.type === 'Cooperativo' ? '#10B981' : theme.primary }]}>
                          <MaterialIcons name={ev.icon as any} size={12} color="#FFF" />
                          <Text style={{ fontSize: 10, color: '#FFF', fontWeight: 'bold', marginLeft: 4 }}>{ev.type}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold' }}>+{ev.xp} XP</Text>
                      </View>
                      <Text style={[styles.poiName, { color: theme.text, marginTop: 8 }]} numberOfLines={1}>{ev.title}</Text>
                      <Text style={[styles.poiCategory, { color: theme.textMuted }]} numberOfLines={2}>{ev.desc}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
                        <MaterialIcons name="access-time" size={14} color={theme.textMuted} />
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginLeft: 4 }}>{ev.date}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.addEventBtn, { backgroundColor: isAdded ? '#EF44441A' : theme.primary + '1A' }]}
                        onPress={() => {
                          if (isAdded) {
                            removeEventFromRoute(ev.id);
                          } else {
                            addEventToRoute(ev);
                          }
                        }}
                      >
                        <MaterialIcons name={isAdded ? "check-circle" : "add-circle-outline"} size={16} color={isAdded ? '#EF4444' : theme.primary} />
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: isAdded ? '#EF4444' : theme.primary, marginLeft: 4 }}>
                          {isAdded ? "Aggiunto" : "Aggiungi"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.footer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: routePois.length > 0 ? theme.primary : '#E2E8F0' }]}
              disabled={routePois.length === 0}
              onPress={() => {
                setIsRouteActive(true);
                onClose();
              }}
            >
              <Text style={[styles.primaryBtnText, { color: routePois.length > 0 ? '#FFF' : '#94A3B8' }]}>
                Inizia l'Esplorazione
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ marginTop: 15, alignItems: 'center' }}
              onPress={async () => {
                try {
                  const newRoute = { id: Date.now().toString(), name: routeName, pois: routePois, events: routeEvents, date: new Date().toISOString() };
                  const existingStr = await AsyncStorage.getItem('loto_diary');
                  const existing = existingStr ? JSON.parse(existingStr) : [];
                  await AsyncStorage.setItem('loto_diary', JSON.stringify([...existing, newRoute]));
                  
                  Alert.alert(
                    "Salvato nel Diario",
                    "Questo itinerario è stato salvato nel tuo Archivio Personale. Potrai ricaricarlo quando vuoi.",
                    [{ text: "Ottimo" }]
                  );
                } catch (e) {
                  Alert.alert("Errore", "Impossibile salvare il diario");
                }
              }}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>
                Salva nel Diario
              </Text>
            </TouchableOpacity>
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
    maxHeight: '95%',
    minHeight: '40%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 25,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    marginLeft: 15,
  },
  listContainer: {
    paddingHorizontal: 25,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  sectionTitleSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  activeEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  poiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  poiNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  poiImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  poiImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poiInfo: {
    flex: 1,
    marginLeft: 12,
  },
  poiName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  poiCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 15,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 8,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: 25,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  eventCard: {
    width: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  }
});

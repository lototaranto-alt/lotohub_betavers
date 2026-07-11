import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Dimensions, Animated } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useRouteBuilder } from '../context/RouteContext';
import { useTenant } from '../context/TenantContext';

const { height, width } = Dimensions.get('window');

interface EventDetailSheetProps {
  event: any | null;
  visible: boolean;
  onClose: () => void;
}

export default function EventDetailSheet({ event, visible, onClose }: EventDetailSheetProps) {
  const { theme } = useTheme();
  const { isEventInRoute, addEventToRoute, removeEventFromRoute } = useRouteBuilder();
  const { tenant } = useTenant();

  if (!event) return null;

  const isAdded = isEventInRoute(event.id);

  // Colore tematico basato sul tipo di evento
  const typeColor = event.event_type === 'community_challenge' ? '#10B981' : event.event_type === 'cultural_night' ? '#8B5CF6' : theme.accent;
  
  const ptiName = tenant?.localization?.points_name || 'PTI';

  const handleToggleEvent = () => {
    if (isAdded) {
      removeEventFromRoute(event.id);
    } else {
      addEventToRoute(event);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          
          {/* Header Image / Color Block */}
          <View style={[styles.headerBlock, { backgroundColor: typeColor }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <MaterialIcons name={event.icon_emoji ? "star" : "event"} size={48} color="#FFF" />
              <View style={styles.badgeWrapper}>
                <Text style={styles.badgeText}>{String(event.event_type || 'EVENTO').toUpperCase().replace('_', ' ')}</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Title and XP */}
            <View style={styles.titleSection}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>
                <View style={styles.infoRow}>
                  <MaterialIcons name="event" size={16} color={theme.textMuted} />
                  <Text style={[styles.infoText, { color: theme.textMuted }]}>
                    {event.starts_at ? new Date(event.starts_at).toLocaleDateString() : 'Prossimamente'}
                  </Text>
                </View>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: theme.primary + '1A' }]}>
                <Text style={[styles.xpText, { color: theme.primary }]}>+{event.reward_pti_bonus || 0} {ptiName}</Text>
              </View>
            </View>

            {/* Sfide e Obiettivi */}
            <View style={[styles.section, { borderTopColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>🎯 OBIETTIVI</Text>
              <Text style={[styles.descText, { color: theme.textMuted }]}>{event.short_description || event.description}</Text>
              
              <View style={[styles.taskItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialIcons name="check-circle-outline" size={20} color={theme.textMuted} />
                <Text style={[styles.taskText, { color: theme.text }]}>Recati nell'area dell'evento</Text>
              </View>
              <View style={[styles.taskItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialIcons name="radio-button-unchecked" size={20} color={typeColor} />
                <Text style={[styles.taskText, { color: theme.text }]}>Completa le sfide sul posto</Text>
              </View>
            </View>

            {/* Leaderboard rimossa per Gamification Zero-Coercition */}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bottom Fixed Action */}
          <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: isAdded ? '#EF4444' : theme.primary }]}
              onPress={handleToggleEvent}
            >
              <MaterialIcons name={isAdded ? "close" : "add"} size={24} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>{isAdded ? "Rimuovi dal Percorso" : "Partecipa alla Sfida"}</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerBlock: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  badgeWrapper: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  scrollContent: {
    flex: 1,
  },
  titleSection: {
    flexDirection: 'row',
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  xpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  xpText: {
    fontWeight: '900',
    fontSize: 16,
  },
  section: {
    padding: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  descText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
    width: 25,
    textAlign: 'center',
  },
  avatarMock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
  },
  playerScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});

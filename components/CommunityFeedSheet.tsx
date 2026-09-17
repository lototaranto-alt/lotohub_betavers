import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

interface FeedItem {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: any;
  color: string;
}

const MOCK_FEED: FeedItem[] = [
  { id: '1', user: 'Viaggiatore Anonimo', action: 'ha scoperto il Museo MarTa', time: '2 min fa', icon: 'location-on', color: '#2ECC71' },
  { id: '2', user: 'Marco', action: 'ha raggiunto la Fioritura del Loto', time: '15 min fa', icon: 'eco', color: '#D4AF37' },
  { id: '3', user: 'Anna', action: 'ha donato 50 PTI alla causa "Pulizia Spiagge"', time: '1 ora fa', icon: 'water-drop', color: '#3498DB' },
  { id: '4', user: 'Viaggiatore Anonimo', action: 'ha rivelato un antico Whisper', time: '2 ore fa', icon: 'record-voice-over', color: '#9B59B6' },
  { id: '5', user: 'Squadra LOTO', action: 'ha sbloccato il Bonus Sincronia a Taranto Vecchia', time: '3 ore fa', icon: 'people', color: '#E67E22' },
];

interface CommunityFeedSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function CommunityFeedSheet({ isVisible, onClose }: CommunityFeedSheetProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>L'Ecosistema</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>La tua community in tempo reale</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_FEED}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.scrollContent}
            renderItem={({ item }) => (
              <View style={[styles.feedItem, { backgroundColor: theme.background }]}>
                <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                  <MaterialIcons name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.userText, { color: theme.text }]}>{item.user}</Text>
                  <Text style={[styles.actionText, { color: theme.textMuted }]}>{item.action}</Text>
                </View>
                <Text style={[styles.timeText, { color: theme.textMuted }]}>{item.time}</Text>
              </View>
            )}
          />
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
    height: height * 0.7,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
  },
  subtitle: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    gap: 15,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 15,
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  userText: {
    fontFamily: 'Raleway_700Bold',
    fontSize: 15,
  },
  actionText: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  timeText: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 11,
  }
});

import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { CommunityFeedItem } from '../utils/communityFeed';

const { height } = Dimensions.get('window');

interface CommunityFeedSheetProps {
  isVisible: boolean;
  onClose: () => void;
  feed: CommunityFeedItem[];
}

export default function CommunityFeedSheet({ isVisible, onClose, feed }: CommunityFeedSheetProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>L&apos;Ecosistema</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>La tua community in tempo reale</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          {feed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="eco" size={60} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Nessuna attività recente. Scopri un luogo per essere la prima azione della community!
              </Text>
            </View>
          ) : (
            <FlatList
              data={feed}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.scrollContent}
              renderItem={({ item }) => (
                <View style={[styles.feedItem, { backgroundColor: theme.background }]}>
                  <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                    <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <View style={styles.textContent}>
                    <Text style={[styles.userText, { color: theme.text }]}>{item.user}</Text>
                    <Text style={[styles.actionText, { color: theme.textMuted }]}>{item.action}</Text>
                  </View>
                  <Text style={[styles.timeText, { color: theme.textMuted }]}>{item.time}</Text>
                </View>
              )}
            />
          )}
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Raleway_400Regular',
    lineHeight: 22,
  }
});
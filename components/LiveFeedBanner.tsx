import React, { useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CommunityFeedSheet from './CommunityFeedSheet';
import { CommunityFeedItem } from '../utils/communityFeed';

const { width } = Dimensions.get('window');

interface LiveFeedBannerProps {
  feed: CommunityFeedItem[];
}

export default function LiveFeedBanner({ feed }: LiveFeedBannerProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  const latest = feed.length > 0 ? feed[0] : null;

  // Permanenza prolungata: il banner mostra l'ultimo evento reale e resta visibile.
  // La transizione avviene SOLO quando arriva un evento più recente dal DB.
  React.useEffect(() => {
    if (!latest) return;
    slideAnim.setValue(15);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [latest?.id]);

  const display = latest
    ? `${latest.user} ${latest.action}`
    : 'La community si sta muovendo... scopri il primo luogo per iniziare.';

  return (
    <>
      <Animated.View style={[styles.bannerContainer, { opacity: latest ? fadeAnim : 1, transform: [{ translateY: latest ? slideAnim : 0 }] }]}>
        <TouchableOpacity style={styles.bannerContent} activeOpacity={0.8} onPress={() => setSheetVisible(true)}>
          <MaterialIcons name={latest ? (latest.icon as any) : 'eco'} size={16} color={latest ? latest.color : '#D4AF37'} />
          <Text style={styles.bannerText} numberOfLines={1}>{display}</Text>
          <MaterialIcons name="chevron-right" size={18} color="#D4AF37" />
        </TouchableOpacity>
      </Animated.View>

      <CommunityFeedSheet isVisible={sheetVisible} onClose={() => setSheetVisible(false)} feed={feed} />
    </>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    marginBottom: 15,
    marginTop: 5,
    alignSelf: 'center',
    zIndex: 999,
    width: width - 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  bannerContent: {
    backgroundColor: 'rgba(26, 54, 33, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bannerText: {
    color: '#F8FAF5',
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 13,
    flex: 1
  }
});
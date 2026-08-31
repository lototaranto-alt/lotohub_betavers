import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '../utils/supabase';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LiveFeedBannerProps {
  pois: any[];
}

export default function LiveFeedBanner({ pois }: LiveFeedBannerProps) {
  const [message, setMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-width)).current; // Inizia fuori schermo a sinistra

  useEffect(() => {
    // Iscrizione al canale realtime di user_pois per i check-in live
    const subscription = supabase
      .channel('public:user_pois_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_pois' },
        (payload) => {
          const poiId = payload.new.poi_id;
          // Cerca il nome del POI nella lista caricata in locale
          const poi = pois.find(p => p.id === poiId);
          const poiName = poi ? poi.name : 'un nuovo traguardo';
          
          setMessage(`🎉 Un esploratore ha appena raggiunto ${poiName}!`);
          
          // Animazione di ingresso (Slide in)
          Animated.sequence([
            Animated.timing(slideAnim, {
              toValue: 20, // Margine sinistro
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.delay(4000), // Resta visibile per 4 secondi
            Animated.timing(slideAnim, {
              toValue: width, // Esce a destra
              duration: 500,
              useNativeDriver: true,
            })
          ]).start(() => {
            // Reset per la prossima animazione
            slideAnim.setValue(-width);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [pois]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.bannerContent}>
        <MaterialIcons name="notifications-active" size={16} color="#D4AF37" />
        <Text style={styles.bannerText} numberOfLines={1}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 60, // Sotto la status bar
    left: 0,
    zIndex: 999,
    width: width - 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  bannerContent: {
    backgroundColor: '#1A3621', // Verde scuro LOTO
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF37', // Oro
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


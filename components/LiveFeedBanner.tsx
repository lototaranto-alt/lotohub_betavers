import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CommunityFeedSheet from './CommunityFeedSheet';

const { width } = Dimensions.get('window');

interface LiveFeedBannerProps {
  pois: any[];
}

const MOCK_MESSAGES = [
  "Marco ha appena raggiunto la Fioritura del Loto! 🌸",
  "Esploratore Anonimo ha scoperto il Museo MarTa",
  "Anna ha donato 50 PTI per pulire le spiagge",
  "Squadra LOTO ha sbloccato il Bonus Sincronia 🤝",
  "Un antico Whisper è stato rivelato in Via Cava 🤫"
];

export default function LiveFeedBanner({ pois }: LiveFeedBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    // Animazione di ciclo: Fade In -> Attesa -> Fade Out
    const cycleAnimation = () => {
      slideAnim.setValue(15);
      
      Animated.sequence([
        // Fade in + slide up
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          })
        ]),
        // Attendi 4 secondi affinché l'utente possa leggere con calma
        Animated.delay(4000),
        // Fade out + slide up
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -15,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
        // Passa al prossimo messaggio
        setCurrentIndex((prev) => (prev + 1) % MOCK_MESSAGES.length);
      });
    };

    cycleAnimation();
    const interval = setInterval(cycleAnimation, 5600); // 800+4000+800

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Animated.View style={[styles.bannerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={styles.bannerContent} activeOpacity={0.8} onPress={() => setSheetVisible(true)}>
          <MaterialIcons name="eco" size={16} color="#D4AF37" />
          <Text style={styles.bannerText} numberOfLines={1}>{MOCK_MESSAGES[currentIndex]}</Text>
          <MaterialIcons name="chevron-right" size={18} color="#D4AF37" />
        </TouchableOpacity>
      </Animated.View>

      <CommunityFeedSheet isVisible={sheetVisible} onClose={() => setSheetVisible(false)} />
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
    backgroundColor: 'rgba(26, 54, 33, 0.95)', // Verde scuro LOTO trasparente elegante
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)', // Oro semitrasparente
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

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { onboardingSlides, onboardingLabels } from '../utils/onboardingContent';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
  isFirstLaunch?: boolean;
}

export default function OnboardingCarousel({ onComplete, isFirstLaunch = false }: Props) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const totalSlides = onboardingSlides.length;

  useEffect(() => {
    let currentSlide = 0;
    const interval = setInterval(() => {
      currentSlide += 1;
      if (currentSlide < totalSlides) {
        setActiveIndex(currentSlide);
        scrollViewRef.current?.scrollTo({ x: currentSlide * width, animated: true });
      } else {
        clearInterval(interval);
        handleComplete();
      }
    }, 3600); // 3.6 secondi a slide

    return () => clearInterval(interval);
  }, []);

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height * 0.2, // Slide down slightly
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      onComplete();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Background (Dark/Neon gamified) */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0B0D17' }]}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          scrollEnabled={false} // Disabilita lo scroll manuale
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          {onboardingSlides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              
              {/* Visual Element (Icon/Lottie Placeholder) */}
              <View style={styles.visualContainer}>
                <MaterialIcons name={slide.icon as any} size={120} color={theme.primary} style={styles.iconGlow} />
              </View>

              {/* Glassmorphism Text Card */}
              <View style={styles.glassCardWrapper}>
                {Platform.OS !== 'android' && Platform.OS !== 'ios' ? (
                  <View style={[styles.glassCard, { backgroundColor: 'rgba(25, 30, 40, 0.9)' }]}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.subtitle}>{slide.subtitle}</Text>
                  </View>
                ) : (
                  <BlurView intensity={70} tint="dark" style={styles.glassCard}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.subtitle}>{slide.subtitle}</Text>
                  </BlurView>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer Loading Indicator */}
        <View style={styles.footer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.ctaText, { color: theme.primary, marginTop: 15, fontSize: 14 }]}>
            INIZIALIZZAZIONE SISTEMA...
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  safeArea: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    transform: [{ scale: 2 }],
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: [{ scale: 2 }],
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  iconGlow: {
    textShadowColor: 'rgba(0, 255, 157, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  glassCardWrapper: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassCard: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  subtitle: {
    color: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaText: {
    color: '#0B0D17',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});

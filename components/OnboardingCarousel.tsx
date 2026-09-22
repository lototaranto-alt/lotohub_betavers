import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { onboardingSlides } from '../utils/onboardingContent';
import { useTheme } from '../context/ThemeContext';
import { requestSensors, getSensorGateState } from './LotoHardwareGate';

const { width, height } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
  isFirstLaunch?: boolean;
}

export default function OnboardingCarousel({ onComplete, isFirstLaunch = false }: Props) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sensorsGranted, setSensorsGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const totalSlides = onboardingSlides.length;

  useEffect(() => {
    if (isFirstLaunch) {
      getSensorGateState().then((s) => setSensorsGranted(s === 'ok'));
    }
  }, [isFirstLaunch]);

  const requestSensorsNow = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const { fg, bt } = await requestSensors();
      setSensorsGranted(fg && bt);
    } catch (e) {
      console.warn('[Onboarding] Richiesta sensori fallita:', e);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNext = () => {
    // L'ultima slide può procedere anche senza sensori (zero frizione)
    if (activeIndex < totalSlides - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

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

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Background (Dark/Gamified) */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0A0F14' }]}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>SALTA</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {onboardingSlides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.visualContainer}>
                <MaterialIcons name={slide.icon as any} size={120} color={theme.primary} style={styles.iconGlow} />
              </View>

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

                {slide.action === 'sensors' && isFirstLaunch && (
                  <View style={styles.sensorPanel}>
                    <TouchableOpacity
                      style={[styles.sensorBtn, { backgroundColor: sensorsGranted ? 'rgba(46,204,113,0.15)' : theme.primary }]}
                      onPress={requestSensorsNow}
                      activeOpacity={0.85}
                    >
                      <MaterialIcons name={sensorsGranted ? 'check-circle' : 'sensors'} size={20} color={sensorsGranted ? '#2ECC71' : '#0B0D17'} style={{ marginRight: 8 }} />
                      <Text style={[styles.sensorBtnText, { color: sensorsGranted ? '#2ECC71' : '#0B0D17' }]}>
                        {sensorsGranted ? 'Sensori Attivi' : isRequesting ? 'Attivazione...' : 'Attiva Sensori (GPS)'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.sensorHint}>Facoltativo: puoi attivarli più tardi dai Tips. Nessun dato lascia il telefono.</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer with Manual Controls */}
        <View style={styles.footer}>
          <View style={styles.pagination}>
            {onboardingSlides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  activeIndex === idx ? [styles.dotActive, { backgroundColor: theme.primary }] : styles.dotInactive
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.primary }]} onPress={handleNext}>
            <Text style={styles.ctaText}>
              {activeIndex === totalSlides - 1 ? "INIZIA L'AVVENTURA" : "AVANTI"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 99999 },
  safeArea: { flex: 1 },
  header: { padding: 20, alignItems: 'flex-end', zIndex: 10 },
  skipText: { color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  glowTop: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(214, 115, 78, 0.15)', transform: [{ scale: 2 }] },
  glowBottom: { position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(214, 115, 78, 0.05)', transform: [{ scale: 2 }] },
  scrollView: { flex: 1 },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  visualContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  iconGlow: { textShadowColor: 'rgba(214, 115, 78, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30 },
glassCardWrapper: { width: '100%', borderRadius: 24, overflow: 'hidden', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  glassCard: { padding: 30, alignItems: 'center' },
  sensorPanel: { padding: 20, paddingTop: 4, alignItems: 'center' },
  sensorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30, elevation: 4 },
  sensorBtnText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
sensorHint: { color: 'rgba(224, 224, 224, 0.55)', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 10 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginBottom: 15, textAlign: 'center', fontFamily: 'serif' },
  subtitle: { color: '#E0E0E0', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 30, paddingBottom: 40, alignItems: 'center', width: '100%' },
  pagination: { flexDirection: 'row', marginBottom: 30, gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  dotInactive: { width: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  ctaButton: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 8 },
  ctaText: { color: '#0B0D17', fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5 },
});

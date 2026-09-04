import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

// 1. Funzione di Risoluzione Rango
const getRankInfo = (level: number) => {
  if (level <= 4) return { 
    title: 'TURISTA CURIOSO', 
    asset: require('../assets/images/logo-LOTO.png') 
  };
  if (level <= 8) return { 
    title: 'CITTADINO ATTIVO', 
    asset: require('../assets/images/logo-LOTO.png') 
  };
  if (level <= 12) return { 
    title: 'CUSTODE URBANO', 
    asset: require('../assets/images/logo-LOTO.png') 
  };
  if (level <= 16) return { 
    title: 'EROE JONICO', 
    asset: require('../assets/images/logo-LOTO.png') 
  };
  return { 
    title: 'LEGGENDA L.O.T.O.', 
    asset: require('../assets/images/logo-LOTO.png') 
  };
};

export type GamificationEvent = 
  | { type: 'LEVEL_UP'; level: number; title?: string; text?: string; rarity?: number; badge?: any }
  | { type: 'WHISPER'; title?: string; text?: string; rarity?: number; level?: number; badge?: any }
  | { type: 'BADGE'; badge?: any; type?: string; level?: number; title?: string; text?: string; rarity?: number };

export interface GamificationTransitionManagerRef {
  queueEvents: (events: GamificationEvent[]) => void;
}

export const GamificationTransitionManager = forwardRef<GamificationTransitionManagerRef, {}>((props, ref) => {
  const { theme } = useTheme();
  
  const [queue, setQueue] = useState<GamificationEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  // Animazioni
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useImperativeHandle(ref, () => ({
    queueEvents: (events: GamificationEvent[]) => {
      if (events.length > 0) {
        setQueue(events);
        setCurrentIndex(0);
        setVisible(true);
      }
    }
  }));

  useEffect(() => {
    if (visible && queue.length > 0) {
      // Trigger animation for the current item
      fadeAnim.setValue(0);
      slideAnim.setValue(height);
      scaleAnim.setValue(0.5);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    }
  }, [currentIndex, visible]);

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      // Animate out current, then next
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setCurrentIndex(prev => prev + 1);
      });
    } else {
      // Close
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setVisible(false);
        setQueue([]);
        setCurrentIndex(0);
      });
    }
  };

  if (!visible || queue.length === 0) return null;

  const currentEvent = queue[currentIndex];

  const renderLevelUp = (level: number) => {
    const rankInfo = getRankInfo(level);
    return (
      <Animated.View style={[
        styles.centerContainer, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <Image 
          source={rankInfo.asset} 
          style={styles.rankImage} 
          defaultSource={require('../assets/images/logo-LOTO.png')}
        />
        <Text style={styles.levelText}>LIVELLO {level} RAGGIUNTO</Text>
        <Text style={styles.rankTitle}>{rankInfo.title}</Text>
        
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary, marginTop: 40 }]} onPress={handleNext}>
          <Text style={styles.btnText}>Avanti</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderWhisper = (title: string = "IL SUSSURRO", text: string) => {
    return (
      <Animated.View style={[
        styles.glassCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <BlurView intensity={60} tint="dark" style={styles.blurCardBg} />
        <View style={styles.cardContent}>
          <View style={styles.whisperHeader}>
            <MaterialIcons name="auto-awesome" size={24} color="#FFD700" />
            <Text style={styles.whisperTitle}>{title}</Text>
            <MaterialIcons name="auto-awesome" size={24} color="#FFD700" />
          </View>
          <ScrollView style={styles.whisperScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.whisperText}>"{text}"</Text>
          </ScrollView>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary, marginTop: 20 }]} onPress={handleNext}>
            <Text style={styles.btnText}>Avanti</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderBadge = (badge: any) => {
    return (
      <Animated.View style={[
        styles.centerContainer, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.badgeGlass}>
           <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
           <View style={[styles.iconContainer, { backgroundColor: (badge.color || '#D4AF37') + '25', borderColor: badge.color || '#D4AF37' }]}>
             {badge.image ? (
               <Image source={badge.image} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
             ) : (
               <MaterialIcons name={badge.icon || 'star'} size={60} color={badge.color || '#D4AF37'} />
             )}
           </View>
           <Text style={styles.badgeLabel}>NUOVO BADGE SBLOCCATO!</Text>
           <Text style={[styles.badgeTitle, { color: theme.text }]}>{badge.name || badge.title}</Text>
           <Text style={[styles.badgeDesc, { color: theme.textMuted }]}>{badge.desc || badge.actionDescription}</Text>
           
           <TouchableOpacity style={[styles.btn, { backgroundColor: badge.color || theme.primary, marginTop: 30 }]} onPress={handleNext}>
             <Text style={styles.btnText}>Avanti</Text>
           </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal transparent animationType="none" visible={visible}>
      {/* BACKGROUND FISSO */}
      <View style={styles.container}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(26, 54, 33, 0.7)' }]} />

        {/* Render Event based on Type */}
        {currentEvent.type === 'LEVEL_UP' && renderLevelUp(currentEvent.level)}
        {currentEvent.type === 'WHISPER' && renderWhisper(currentEvent.title, currentEvent.text)}
        {currentEvent.type === 'BADGE' && renderBadge(currentEvent.badge)}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  rankImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: '#FFD700', // Oro
  },
  levelText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: 20,
  },
  rankTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'serif',
    marginTop: 5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  glassCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.6,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  blurCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardContent: {
    padding: 30,
    paddingTop: 40,
    paddingBottom: 50,
    flex: 1,
    alignItems: 'center',
  },
  whisperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  whisperTitle: {
    color: '#FFD700',
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  whisperScroll: {
    flex: 1,
    width: '100%',
  },
  whisperText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 34,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  badgeGlass: {
    width: '100%',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  badgeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 10,
  },
  badgeDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  btn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});


import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Animated, Easing, Dimensions, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { getRankInfo } from '../utils/levelUtils';

const { width, height } = Dimensions.get('window');

// 1. Emblema visuale per Tier di Rango (il nome viene dal Centro di Comando levelUtils)
const getRankAsset = (level: number) => {
  if (level < 11) return require('../assets/images/ranks/rank1_turista_curioso_organic.jpg');
  if (level < 21) return require('../assets/images/ranks/rank2_cittadino_attivo_organic.jpg');
  if (level < 31) return require('../assets/images/ranks/rank3_custode_urbano_organic.jpg');
  if (level < 41) return require('../assets/images/ranks/rank4_eroe_jonico_organic.jpg');
  return require('../assets/images/ranks/rank5_leggenda_loto_organic.jpg');
};

// 2. Mock del JSON Narrativo (Whispers)
const WHISPERS_DB: Record<number, { tier: number, text: string }> = {
  1: { tier: 1, text: "Ogni grande viaggio inizia con un singolo passo. Hai appena sfiorato la superficie di questa terra antica." },
  2: { tier: 1, text: "I vicoli iniziano a riconoscerti. Senti il profumo del mare mescolarsi alla pietra?" },
  3: { tier: 1, text: "Non sei più uno straniero. Le piazze si aprono davanti a te come pagine di un libro." },
  4: { tier: 1, text: "Un nuovo rango ti attende. Continua a esplorare per sbloccare l'anima segreta della città." },
  5: { tier: 2, text: "Benvenuto tra i Cittadini Attivi. Il tuo impatto ora è reale, tangibile. La città ti ringrazia." },
  // Default fallback
};

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ visible, level, onClose }: LevelUpModalProps) {
  const { theme } = useTheme();
  
  // Fase 1 (Celebrazione) -> Fase 2 (Lettura Pillola)
  const [phase, setPhase] = useState<1 | 2>(1);

  // Animazioni
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const slideCardAnim = React.useRef(new Animated.Value(height)).current;
  const emblemTranslateY = React.useRef(new Animated.Value(0)).current;
  const emblemScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setPhase(1);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true })
      ]).start();
    } else {
      // Reset animazioni alla chiusura
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideCardAnim.setValue(height);
      emblemTranslateY.setValue(0);
      emblemScale.setValue(1);
    }
  }, [visible]);

  const handleTap = () => {
    if (phase === 1) {
      // Transizione verso Fase 2
      setPhase(2);
      Animated.parallel([
        Animated.timing(emblemTranslateY, { toValue: -height * 0.25, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(emblemScale, { toValue: 0.6, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideCardAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    }
  };

  if (!visible) return null;

  const rankInfo = getRankInfo(level);
  const rankAsset = getRankAsset(level);
  const whisper = WHISPERS_DB[level] || { text: "La saggezza dei Custodi antichi risuona attraverso di te. Scopri nuovi misteri." };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      {/* BACKGROUND FISSO E ATMOSFERICO */}
      <View style={styles.container}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        {/* Layer oscurante Verde Scuro (come da design) */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(26, 54, 33, 0.7)' }]} />

        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={phase === 1 ? handleTap : undefined}
        >
          {/* EMBLEMA CENTRALE */}
          <Animated.View style={[
            styles.emblemContainer, 
            { 
              opacity: fadeAnim, 
              transform: [
                { scale: scaleAnim }, 
                { translateY: emblemTranslateY },
                { scale: emblemScale }
              ] 
            }
          ]}>
            {/* L'asset rigenerato dalla logica (organico) */}
            <Image 
              source={rankAsset} 
              style={styles.rankImage} 
              defaultSource={require('../assets/images/ranks/rank1_turista_curioso_organic.jpg')} // Fallback in caso di mancanza file locali
            />
            
            {/* TESTO DINAMICO INIETTATO SOPRA */}
            <Text style={styles.levelText}>LIVELLO {level} RAGGIUNTO</Text>
            <Text style={styles.rankTitle}>{rankInfo.rankName}</Text>
          </Animated.View>

          {/* FASE 1: Istruzione di Tap */}
          {phase === 1 && (
            <Animated.Text style={[styles.tapInstruction, { opacity: fadeAnim }]}>
              Tocca lo schermo per continuare
            </Animated.Text>
          )}

          {/* FASE 2: THE WHISPER PILL (Glassmorphism Card) */}
          <Animated.View style={[
            styles.glassCard,
            { transform: [{ translateY: slideCardAnim }] }
          ]}>
            <BlurView intensity={50} tint="light" style={styles.blurCardBg} />
            <View style={styles.cardContent}>
              <Text style={styles.whisperTitle}>IL SUSSURRO</Text>
              <Text style={styles.whisperText}>"{whisper.text}"</Text>
              
              {/* BOTTONE FINALE */}
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={onClose}>
                <Text style={styles.btnText}>Continua il Viaggio</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.3,
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  tapInstruction: {
    color: 'rgba(255,255,255,0.6)',
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    letterSpacing: 1,
  },
  glassCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.5,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  blurCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardContent: {
    padding: 30,
    paddingTop: 50,
    flex: 1,
    alignItems: 'center',
  },
  whisperTitle: {
    color: '#FFD700',
    fontSize: 14,
    letterSpacing: 4,
    marginBottom: 20,
    fontWeight: '600',
  },
  whisperText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  btn: {
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface BreathingLeafProps {
  fullScreen?: boolean;
  message?: string;
  size?: number;
}

const LOTO_PALETTE = {
  VERDE_OLIVA: '#5F713D',
  CREMA: '#FDFBF2',
  EBANO: '#1A1C1E',
};

export default function BreathingLeaf({ fullScreen = false, message = "Caricamento in corso...", size = 60 }: BreathingLeafProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    breathe.start();

    return () => breathe.stop();
  }, [scaleAnim, opacityAnim]);

  const content = (
    <View style={styles.content}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <MaterialIcons name="eco" size={size} color={LOTO_PALETTE.VERDE_OLIVA} />
      </Animated.View>
      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );

  if (fullScreen) {
    return <View style={[styles.container, styles.fullScreen]}>{content}</View>;
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: LOTO_PALETTE.CREMA,
  },
  content: {
    alignItems: 'center',
  },
  messageText: {
    marginTop: 20,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'serif',
    letterSpacing: 1,
  }
});

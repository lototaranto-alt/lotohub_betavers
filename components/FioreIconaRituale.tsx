import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getTodayChallenge } from './FioreDeiTrePetali';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface FioreIconaRitualeProps {
  size?: number;
  color?: string;
  duration?: number; // ms per ogni elemento del ciclo
}

// I 3 elementi del rituale quotidiano (SSOT: stessi del Fiore di Oggi):
// 1. Camminata (petalo verde) · 2. Check-in (petalo oro) · 3. Sfida del giorno (petalo teal)
export default function FioreIconaRituale({ size = 20, color = '#D4AF37', duration = 2600 }: FioreIconaRitualeProps) {
  const challenge = getTodayChallenge();
  const icons: MaterialIconName[] = [
    'directions-walk',
    'nfc',
    challenge.icon,
  ];

  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const goToNext = () => setIndex((i) => (i + 1) % icons.length);

  useEffect(() => {
    const cycle = Animated.loop(
      Animated.sequence([
        Animated.delay(duration),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ])
    );

    const rotateId = rotate.addListener(({ value }) => {
      if (value >= 0.98) goToNext();
    });

    cycle.start();
    return () => {
      cycle.stop();
      rotate.removeListener(rotateId);
      opacity.setValue(1);
      rotate.setValue(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ rotate: rotation }] }}>
      <MaterialIcons name={icons[index]} size={size} color={color} />
    </Animated.View>
  );
}
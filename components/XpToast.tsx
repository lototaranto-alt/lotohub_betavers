import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface XpToastProps {
  visible: boolean;
  xpAmount: number;
  message?: string;
  type?: 'XP' | 'PTI';
  onHide: () => void;
}

export default function XpToast({ visible, xpAmount, message = 'Check-in Completato!', type = 'XP', onHide }: XpToastProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        })
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.primary,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        }
      ]}
      pointerEvents="none"
    >
      <View style={[styles.iconContainer, { backgroundColor: type === 'PTI' ? theme.secondary : theme.primary }]}>
        <MaterialIcons name={type === 'PTI' ? "eco" : "stars"} size={28} color="#FFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{message}</Text>
        <Text style={[styles.xpText, { color: type === 'PTI' ? theme.secondary : theme.primary }]}>
          +{xpAmount} {type === 'PTI' ? 'Contributo (PTI)' : 'Esperienza (XP)'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
    minWidth: 250,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  }
});

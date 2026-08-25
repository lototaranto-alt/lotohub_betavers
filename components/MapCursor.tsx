import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Filter, Path, Circle, FeDropShadow } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

interface MapCursorProps {
  heading?: number;
  mode?: 'standard' | 'accessibility';
}

export const LotoMapCursor = ({ heading = 0 }: { heading?: number }) => (
  <View style={[styles.cursorContainer, { transform: [{ rotate: `${heading}deg` }] }]}>
    <Svg width="40" height="40" viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="50%" stopColor="#FFF8DC" />
          <Stop offset="100%" stopColor="#DAA520" />
        </LinearGradient>
        <Filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <FeDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
        </Filter>
      </Defs>
      <Path d="M50,5 C35,25 42,38 50,48 C58,38 65,25 50,5 Z" fill="url(#gold)" filter="url(#shadow)"/>
      <Circle cx="50" cy="55" r="26" fill="#1A3621" stroke="url(#gold)" strokeWidth="4" filter="url(#shadow)"/>
      <Circle cx="50" cy="55" r="10" fill="url(#gold)" />
    </Svg>
  </View>
);

export const HaloStandard = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.haloContainer, animatedStyle]}>
      <Svg width="120" height="120" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="haloStandard" x1="50%" y1="50%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4A7C59" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#4A7C59" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#haloStandard)" />
      </Svg>
    </Animated.View>
  );
};

export const HaloAccessibility = () => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.haloContainer, animatedStyle]}>
      <Svg width="120" height="120" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="haloAccess" x1="50%" y1="50%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#haloAccess)" />
      </Svg>
    </Animated.View>
  );
};

export default function UserAvatar({ heading, mode = 'standard' }: MapCursorProps) {
  return (
    <View style={styles.wrapper}>
      {mode === 'standard' ? <HaloStandard /> : <HaloAccessibility />}
      <LotoMapCursor heading={heading} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cursorContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  haloContainer: {
    position: 'absolute',
    zIndex: 1,
  },
});

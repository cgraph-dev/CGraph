import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

/**
 * PulsingDot - Animated indicator for live/online status
 * Features pulse, rotation, and glow effects
 */
export function PulsingDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, rotateAnim, glowAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.pulsingDotContainer}>
      {/* Outer rotating ring */}
      <Animated.View
        style={[
          styles.pulsingDotRing,
          {
            transform: [{ rotate: rotation }],
            opacity: glowAnim,
          },
        ]}
      />
      {/* Pulsing glow */}
      <Animated.View
        style={[
          styles.pulsingDotOuter,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />
      {/* Core dot */}
      <View style={styles.pulsingDotInner} />
    </View>
  );
}

const styles = StyleSheet.create({
  pulsingDotContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDotRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  pulsingDotOuter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
});

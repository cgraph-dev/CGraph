import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Animated3DCoinProps {
  size?: number;
  delay?: number;
}

/**
 * Animated 3D Coin Component
 *
 * Displays a rotating 3D coin with:
 * - Continuous rotation animation
 * - Scale animation with spring effect
 * - Pulsing glow effect
 * - Linear gradient coin face
 */
export function Animated3DCoin({ size = 70, delay = 0 }: Animated3DCoinProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Scale breathing animation with delay
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [rotateAnim, scaleAnim, glowAnim, delay]);

  const rotateY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={{ transform: [{ rotateY }, { scale: scaleAnim }] }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            opacity: glowOpacity,
            left: -size * 0.25,
            top: -size * 0.25,
          },
        ]}
      />
      {/* Coin face */}
      <LinearGradient
        colors={['#fbbf24', '#f59e0b', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.coinFace,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.coinInner,
            {
              width: size * 0.8,
              height: size * 0.8,
              borderRadius: size * 0.4,
            },
          ]}
        >
          <Text style={[styles.coinSymbol, { fontSize: size * 0.35 }]}>₿</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: '#f59e0b',
  },
  coinFace: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  coinInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  coinSymbol: {
    color: '#fff',
    fontWeight: '800',
  },
});

export default Animated3DCoin;

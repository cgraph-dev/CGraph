import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
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
  const rotateAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    // Continuous rotation animation
    rotateAnim.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    // Scale breathing animation with delay
    scaleAnim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Glow pulsing animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, [rotateAnim, scaleAnim, glowAnim, delay]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(rotateAnim.value, [0, 1], [0, 360])}deg` },
      { scale: scaleAnim.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.8]),
  }));

  return (
    <Animated.View style={coinStyle}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            left: -size * 0.25,
            top: -size * 0.25,
          },
          glowStyle,
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

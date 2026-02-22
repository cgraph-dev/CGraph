/**
 * LoadingScreen - Premium Mobile Version
 * 
 * A stunning animated loading screen with particle effects, gradient animations,
 * and smooth transitions that creates an immersive experience while loading.
 * 
 * Features:
 * - Animated gradient background with shimmer effect
 * - Pulsating logo with glow effects
 * - Floating particle system
 * - Progress indicator with gradient
 * - Smooth entrance/exit animations
 * - Random loading tips
 * 
 * @version 2.0.0
 * @since v0.8.1
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/theme-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Loading tips to display randomly
const LOADING_TIPS = [
  '✨ Preparing your experience...',
  '🚀 Loading amazing features...',
  '🎮 Getting everything ready...',
  '💫 Almost there...',
  '🌟 Setting up your profile...',
  '⚡ Optimizing for performance...',
  '🔮 Creating some magic...',
  '🎯 Connecting to servers...',
];

// Floating particle component
interface ParticleProps {
  delay: number;
  startX: number;
  size: number;
  duration: number;
  color: string;
}

function FloatingParticle({ delay, startX, size, duration, color }: ParticleProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset values
      translateY.setValue(SCREEN_HEIGHT + 50);
      translateX.setValue(0);
      opacity.setValue(0);
      scale.setValue(0.5);

      Animated.parallel([
        // Float up
        Animated.timing(translateY, {
          toValue: -100,
          duration: duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Drift sideways
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: Math.random() * 40 - 20,
            duration: duration / 2,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: Math.random() * 40 - 20,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Fade in then out
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 1000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            delay: duration - 2000,
            useNativeDriver: true,
          }),
        ]),
        // Scale
        Animated.timing(scale, {
          toValue: 1,
          duration: duration / 2,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

export default function LoadingScreen() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  const [tip] = useState(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
  
  // Logo animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  
  // Progress animation
  const progressWidth = useRef(new Animated.Value(0)).current;
  
  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  
  // Shimmer effect
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Text entrance
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(textTranslateY, {
        toValue: 0,
        friction: 8,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressWidth, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerTranslate, {
        toValue: SCREEN_WIDTH,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Generate particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3000,
    startX: Math.random() * SCREEN_WIDTH,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 4000 + 6000,
    color: [
      'rgba(59, 130, 246, 0.6)',
      'rgba(139, 92, 246, 0.6)',
      'rgba(236, 72, 153, 0.6)',
      'rgba(16, 185, 129, 0.6)',
      'rgba(245, 158, 11, 0.6)',
    ][Math.floor(Math.random() * 5)],
  }));

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={isDark ? ['#0a0a1a', '#1a1a2e', '#0f172a'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated background circles */}
      <View style={styles.backgroundCircles}>
        <Animated.View
          style={[
            styles.circle1,
            {
              opacity: glowOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.circle2,
            {
              opacity: Animated.multiply(glowOpacity, 0.7),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(236, 72, 153, 0.2)', 'rgba(59, 130, 246, 0.1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </View>

      {/* Floating particles */}
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} {...particle} />
      ))}

      {/* Logo container */}
      <View style={styles.logoContainer}>
        {/* Glow effect behind logo */}
        <Animated.View
          style={[
            styles.logoGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: Animated.add(logoScale, 0.2) }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.4)', 'rgba(139, 92, 246, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Main logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: rotation }],
            },
          ]}
        >
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6', '#ec4899']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubbles" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* App name */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={[styles.appName, { color: colors.text }]}>CGraph</Text>
        <View style={styles.shimmerContainer}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Loading tip */}
      <Animated.Text
        style={[
          styles.loadingTip,
          {
            color: colors.textSecondary,
            opacity: textOpacity,
          },
        ]}
      >
        {tip}
      </Animated.Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6', '#ec4899']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Version */}
      <Text style={[styles.version, { color: colors.textTertiary }]}>
        v0.8.1 ✨
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
    overflow: 'hidden',
  },
  circle2: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.2,
    right: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH * 0.5,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmer: {
    width: 100,
    height: '100%',
  },
  loadingTip: {
    fontSize: 14,
    marginBottom: 32,
  },
  progressContainer: {
    width: SCREEN_WIDTH * 0.6,
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
  },
});

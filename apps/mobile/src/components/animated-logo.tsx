/**
 * Animated SVG logo component with gradient effects and entrance animations.
 * @module components/AnimatedLogo
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'loading' | 'splash';
}

const sizeMap = {
  sm: { container: 40, text: 14 },
  md: { container: 64, text: 20 },
  lg: { container: 80, text: 24 },
  xl: { container: 128, text: 32 },
};

// Professional CG Monogram Logo for Mobile
function GeometricLogo({ size }: { size: number }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Defs>
        {/* Primary gradient - Purple to Indigo */}
        <LinearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#a855f7" />
          <Stop offset="50%" stopColor="#8b5cf6" />
          <Stop offset="100%" stopColor="#6366f1" />
        </LinearGradient>
        {/* Secondary gradient - Emerald */}
        <LinearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#34d399" />
          <Stop offset="100%" stopColor="#10b981" />
        </LinearGradient>
        {/* Background gradient */}
        <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1e1b4b" />
          <Stop offset="100%" stopColor="#0f172a" />
        </LinearGradient>
        {/* Metallic accent */}
        <LinearGradient id="metallicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.9} />
          <Stop offset="50%" stopColor="#94a3b8" stopOpacity={0.7} />
          <Stop offset="100%" stopColor="#64748b" stopOpacity={0.5} />
        </LinearGradient>
      </Defs>

      {/* Outer hexagon border */}
      <Polygon
        points="50,3 93,25 93,75 50,97 7,75 7,25"
        fill="none"
        stroke="url(#primaryGradient)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeOpacity={0.8}
      />

      {/* Inner hexagon background */}
      <Polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="url(#bgGradient)" />

      {/* Subtle grid pattern */}
      <G opacity={0.1} stroke="#a855f7" strokeWidth="0.3">
        <Line x1="50" y1="8" x2="50" y2="92" />
        <Line x1="12" y1="50" x2="88" y2="50" />
        <Line x1="31" y1="18" x2="69" y2="82" />
        <Line x1="69" y1="18" x2="31" y2="82" />
      </G>

      {/* Decorative corner accents */}
      <G opacity={0.6}>
        <Circle cx="50" cy="8" r="2" fill="url(#secondaryGradient)" />
        <Circle cx="88" cy="28" r="1.5" fill="url(#primaryGradient)" />
        <Circle cx="88" cy="72" r="1.5" fill="url(#primaryGradient)" />
        <Circle cx="50" cy="92" r="2" fill="url(#secondaryGradient)" />
        <Circle cx="12" cy="72" r="1.5" fill="url(#primaryGradient)" />
        <Circle cx="12" cy="28" r="1.5" fill="url(#primaryGradient)" />
      </G>

      {/* C letter - left side */}
      <G>
        <Path
          d="M 28 35 C 28 28, 35 22, 45 22 L 45 22 C 42 22, 32 26, 32 35 L 32 65 C 32 74, 42 78, 45 78 L 45 78 C 35 78, 28 72, 28 65 Z"
          fill="url(#primaryGradient)"
        />
        <Path
          d="M 45 22 L 55 22 L 55 28 L 45 28 C 38 28, 34 32, 34 35 L 34 36 L 28 36 L 28 35 C 28 28, 35 22, 45 22 Z"
          fill="url(#primaryGradient)"
        />
        <Path
          d="M 45 78 L 55 78 L 55 72 L 45 72 C 38 72, 34 68, 34 65 L 34 64 L 28 64 L 28 65 C 28 72, 35 78, 45 78 Z"
          fill="url(#primaryGradient)"
        />
      </G>

      {/* G letter - right side */}
      <G>
        <Path
          d="M 55 22 C 65 22, 72 28, 72 35 L 72 65 C 72 72, 65 78, 55 78 L 50 78 L 50 72 L 55 72 C 62 72, 66 68, 66 65 L 66 35 C 66 32, 62 28, 55 28 L 50 28 L 50 22 Z"
          fill="url(#secondaryGradient)"
        />
        <Rect x="55" y="47" width="17" height="6" rx="1" fill="url(#secondaryGradient)" />
        <Rect x="66" y="47" width="6" height="18" rx="1" fill="url(#secondaryGradient)" />
      </G>

      {/* Central connecting node */}
      <G opacity={0.8}>
        <Circle cx="50" cy="50" r="4" fill="url(#metallicGradient)" />
        <Circle cx="50" cy="50" r="2" fill="url(#primaryGradient)" />
        <Line
          x1="50"
          y1="50"
          x2="35"
          y2="35"
          stroke="url(#primaryGradient)"
          strokeWidth="1"
          opacity={0.5}
        />
        <Line
          x1="50"
          y1="50"
          x2="65"
          y2="35"
          stroke="url(#secondaryGradient)"
          strokeWidth="1"
          opacity={0.5}
        />
        <Line
          x1="50"
          y1="50"
          x2="35"
          y2="65"
          stroke="url(#primaryGradient)"
          strokeWidth="1"
          opacity={0.5}
        />
        <Line
          x1="50"
          y1="50"
          x2="65"
          y2="65"
          stroke="url(#secondaryGradient)"
          strokeWidth="1"
          opacity={0.5}
        />
      </G>

      {/* Orbital ring */}
      <Ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="12"
        fill="none"
        stroke="url(#primaryGradient)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        opacity={0.3}
      />
    </Svg>
  );
}

/**
 * Animated Logo component.
 *
 */
export function AnimatedLogo({
  size = 'md',
  showText = false,
  variant = 'default',
}: AnimatedLogoProps) {
  const dimensions = sizeMap[size];
  const isAnimated = variant === 'loading' || variant === 'splash';

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Initial entrance animation
    scale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withTiming(1, { duration: durations.slower.ms, easing: Easing.out(Easing.back(1.5)) })
    );

    textOpacity.value = withTiming(1, {
      duration: durations.dramatic.ms,
      easing: Easing.out(Easing.quad),
    });

    if (isAnimated) {
      // Continuous rotation for loading/splash
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );

      // Pulse animation
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: durations.verySlow.ms, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: durations.verySlow.ms, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      // Glow scale animation
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: durations.ambient.ms, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: durations.ambient.ms, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }
  }, [isAnimated, scale, rotation, pulseOpacity, glowScale, textOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateY: interpolate(textOpacity.value, [0, 1], [10, 0]),
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <AnimatedView style={[styles.container, containerStyle]}>
        {/* Outer glow */}
        <AnimatedView
          style={[
            styles.glow,
            {
              width: dimensions.container * 1.4,
              height: dimensions.container * 1.4,
              borderRadius: dimensions.container * 0.7,
            },
            glowStyle,
          ]}
        />

        {/* Rotating ring */}
        {isAnimated && (
          <AnimatedView
            style={[
              styles.rotatingRing,
              {
                width: dimensions.container + 16,
                height: dimensions.container + 16,
                borderRadius: (dimensions.container + 16) / 2,
              },
              rotatingStyle,
            ]}
          >
            <View
              style={[styles.ringDot, styles.purpleDot, { top: -4, left: '50%', marginLeft: -4 }]}
            />
            <View
              style={[
                styles.ringDot,
                styles.emeraldDot,
                { bottom: -4, right: '30%', marginRight: -4 },
              ]}
            />
          </AnimatedView>
        )}

        {/* Logo container */}
        <View
          style={[
            styles.logoContainer,
            {
              width: dimensions.container,
              height: dimensions.container,
              borderRadius: dimensions.container / 2,
            },
          ]}
        >
          <GeometricLogo size={dimensions.container} />
        </View>
      </AnimatedView>

      {/* Text */}
      {showText && (
        <AnimatedView style={[styles.textContainer, textStyle]}>
          <Text style={[styles.logoText, { fontSize: dimensions.text }]}>CGraph</Text>
          {variant === 'loading' && <Text style={styles.loadingText}>Loading...</Text>}
        </AnimatedView>
      )}
    </View>
  );
}

// Splash Screen Component
/**
 * Splash Screen component.
 *
 */
export function SplashScreen() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: durations.ambient.ms,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.splashContainer}>
      {/* Particle effects placeholder - can be enhanced with more particles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <ParticleEffect key={i} index={i} />
      ))}

      <AnimatedLogo size="xl" showText variant="splash" />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <AnimatedView style={[styles.progressBar, progressStyle]} />
      </View>

      <Text style={styles.splashLoadingText}>Initializing secure connection...</Text>
    </View>
  );
}

// Simple particle effect
function ParticleEffect({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const delay = index * 200;
    setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: durations.loop.ms, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: durations.loop.ms, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: durations.loop.ms, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.1, { duration: durations.loop.ms, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }, delay);
  }, [index, translateY, opacity]);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const isPurple = index % 2 === 0;

  return (
    <AnimatedView
      style={[
        styles.particle,
        {
          backgroundColor: isPurple ? '#a855f7' : '#10b981',
          left: `${10 + index * 8}%`,
          top: `${20 + (index % 5) * 15}%`,
        },
        particleStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 16,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  rotatingRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  ringDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  purpleDot: {
    backgroundColor: '#a855f7',
  },
  emeraldDot: {
    backgroundColor: '#10b981',
  },
  logoContainer: {
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    color: '#a855f7',
  },
  loadingText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressContainer: {
    marginTop: 40,
    width: 200,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
  splashLoadingText: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default AnimatedLogo;

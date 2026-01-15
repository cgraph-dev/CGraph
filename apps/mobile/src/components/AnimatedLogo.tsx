import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Polygon, Stop } from 'react-native-svg';
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

// Static Geometric Logo for better performance on mobile
function GeometricLogo({ size }: { size: number }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Defs>
        {/* Cyan gradient */}
        <LinearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00E5FF" stopOpacity={1} />
          <Stop offset="100%" stopColor="#00B8D4" stopOpacity={1} />
        </LinearGradient>
        {/* Magenta gradient */}
        <LinearGradient id="magentaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF00FF" stopOpacity={1} />
          <Stop offset="100%" stopColor="#D500F9" stopOpacity={1} />
        </LinearGradient>
      </Defs>

      {/* Background dark circle */}
      <Circle cx="50" cy="50" r="45" fill="#0A1628" />

      {/* Outer geometric ring */}
      <Circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#cyanGradient)"
        strokeWidth="1"
        strokeOpacity={0.3}
      />

      {/* Inner diamond/geometric shape - main logo */}
      <G>
        {/* Top diamond - cyan */}
        <Polygon points="50,15 70,35 50,55 30,35" fill="url(#cyanGradient)" fillOpacity={0.9} />
        {/* Bottom diamond - magenta */}
        <Polygon points="50,45 70,65 50,85 30,65" fill="url(#magentaGradient)" fillOpacity={0.9} />
        {/* Left accent triangle */}
        <Polygon points="25,50 35,40 35,60" fill="#00E5FF" fillOpacity={0.6} />
        {/* Right accent triangle */}
        <Polygon points="75,50 65,40 65,60" fill="#FF00FF" fillOpacity={0.6} />
      </G>

      {/* Connecting lines for graph effect */}
      <G stroke="white" strokeWidth="0.5" strokeOpacity={0.4}>
        <Line x1="50" y1="15" x2="70" y2="35" />
        <Line x1="50" y1="15" x2="30" y2="35" />
        <Line x1="50" y1="55" x2="50" y2="45" />
        <Line x1="70" y1="65" x2="75" y2="50" />
        <Line x1="30" y1="65" x2="25" y2="50" />
      </G>

      {/* Node points for graph visualization */}
      <G>
        <Circle cx="50" cy="15" r="3" fill="#00E5FF" />
        <Circle cx="70" cy="35" r="2" fill="#00E5FF" />
        <Circle cx="30" cy="35" r="2" fill="#00E5FF" />
        <Circle cx="50" cy="85" r="3" fill="#FF00FF" />
        <Circle cx="70" cy="65" r="2" fill="#FF00FF" />
        <Circle cx="30" cy="65" r="2" fill="#FF00FF" />
      </G>
    </Svg>
  );
}

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
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) })
    );

    textOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });

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
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      // Glow scale animation
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
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
              style={[styles.ringDot, styles.cyanDot, { top: -4, left: '50%', marginLeft: -4 }]}
            />
            <View
              style={[
                styles.ringDot,
                styles.magentaDot,
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
export function SplashScreen() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
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
          withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.quad) })
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

  const isCyan = index % 2 === 0;

  return (
    <AnimatedView
      style={[
        styles.particle,
        {
          backgroundColor: isCyan ? '#00E5FF' : '#FF00FF',
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
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  rotatingRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  ringDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cyanDot: {
    backgroundColor: '#00E5FF',
  },
  magentaDot: {
    backgroundColor: '#FF00FF',
  },
  logoContainer: {
    overflow: 'hidden',
    shadowColor: '#00E5FF',
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
    color: '#00E5FF',
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
    backgroundColor: '#00E5FF',
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

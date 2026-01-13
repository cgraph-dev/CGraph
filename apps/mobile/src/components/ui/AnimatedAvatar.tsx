/**
 * AnimatedAvatar v2.0 - Next-Gen Avatar System
 * 30+ animated border styles, particles, shapes, and status indicators
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors } from '@/lib/animations/AnimationEngine';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

type BorderAnimation =
  | 'none'
  | 'solid'
  | 'gradient'
  | 'pulse'
  | 'rainbow'
  | 'spin'
  | 'glow'
  | 'neon'
  | 'fire'
  | 'electric'
  | 'aurora'
  | 'plasma'
  | 'cosmic'
  | 'matrix'
  | 'holographic'
  | 'gem'
  | 'supernova'
  | 'black_hole'
  | 'quantum'
  | 'void'
  | 'celestial';

type AvatarShape = 'circle' | 'rounded-square' | 'hexagon' | 'octagon' | 'shield' | 'diamond';

type ParticleEffect = 'none' | 'sparkles' | 'bubbles' | 'flames' | 'snow' | 'hearts' | 'stars';

interface AnimatedAvatarProps {
  source: ImageSourcePropType;
  size?: number;
  borderAnimation?: BorderAnimation;
  shape?: AvatarShape;
  particleEffect?: ParticleEffect;
  showStatus?: boolean;
  isOnline?: boolean;
  levelBadge?: number;
  isPremium?: boolean;
  glowIntensity?: number;
  style?: ViewStyle;
}

export default function AnimatedAvatar({
  source,
  size = 64,
  borderAnimation = 'none',
  shape = 'circle',
  particleEffect = 'none',
  showStatus = false,
  isOnline = false,
  levelBadge,
  isPremium = false,
  glowIntensity = 0.5,
  style,
}: AnimatedAvatarProps) {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [particles, setParticles] = useState<Array<{ x: number; y: number; scale: number }>>([]);

  useEffect(() => {
    // Rotation animation for spin, rainbow, cosmic effects
    if (['spin', 'rainbow', 'cosmic', 'celestial'].includes(borderAnimation)) {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }

    // Pulse animation
    if (['pulse', 'glow', 'neon', 'supernova'].includes(borderAnimation)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Glow animation
    if (['glow', 'neon', 'fire', 'electric', 'plasma'].includes(borderAnimation)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }

    // Generate particles
    if (particleEffect !== 'none') {
      generateParticles();
    }
  }, [borderAnimation, particleEffect]);

  const generateParticles = () => {
    const particleCount = 8;
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = size / 2 + 10;
      newParticles.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: Math.random() * 0.5 + 0.5,
      });
    }
    setParticles(newParticles);
  };

  const getBorderColors = (): string[] => {
    switch (borderAnimation) {
      case 'gradient':
        return [AnimationColors.primary, AnimationColors.purple];
      case 'rainbow':
        return [
          '#ff0000',
          '#ff7f00',
          '#ffff00',
          '#00ff00',
          '#0000ff',
          '#4b0082',
          '#9400d3',
        ];
      case 'neon':
        return [AnimationColors.neonCyan, AnimationColors.neonMagenta];
      case 'fire':
        return ['#ff4500', '#ff8c00', '#ffd700'];
      case 'electric':
        return ['#00f5ff', '#00bfff', '#0080ff'];
      case 'aurora':
        return ['#00ff87', '#60efff', '#ff00ff'];
      case 'plasma':
        return ['#ff00ff', '#ff0080', '#8000ff'];
      case 'cosmic':
        return ['#4a0080', '#8000ff', '#ff00ff', '#ff0080'];
      case 'matrix':
        return [AnimationColors.matrixGreen, AnimationColors.matrixDark];
      case 'holographic':
        return [
          AnimationColors.primary,
          AnimationColors.purple,
          AnimationColors.pink,
          AnimationColors.amber,
        ];
      case 'gem':
        return ['#00ffff', '#ff00ff', '#ffff00'];
      case 'supernova':
        return ['#ffff00', '#ff8000', '#ff0000', '#8000ff'];
      case 'black_hole':
        return ['#000000', '#4b0082', '#000000'];
      case 'quantum':
        return ['#00ffff', '#ff00ff', '#00ff00', '#ffff00'];
      case 'void':
        return ['#1a0033', '#330066', '#1a0033'];
      case 'celestial':
        return ['#ffd700', '#ff8c00', '#ff4500', '#ff00ff'];
      default:
        return [AnimationColors.primary, AnimationColors.primary];
    }
  };

  const getShapeMask = (): ViewStyle => {
    const borderRadiusMap: Record<AvatarShape, number> = {
      circle: size / 2,
      'rounded-square': size / 6,
      hexagon: 0, // Custom SVG needed
      octagon: 0, // Custom SVG needed
      shield: size / 8,
      diamond: 0, // Custom SVG needed
    };

    return {
      borderRadius: borderRadiusMap[shape],
    };
  };

  const rotationInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const borderWidth = 4;
  const containerSize = size + borderWidth * 2 + 8;

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }, style]}>
      {/* Particles */}
      {particleEffect !== 'none' && (
        <View style={[StyleSheet.absoluteFill, styles.particlesContainer]}>
          {particles.map((particle, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { scale: particle.scale },
                  ],
                },
              ]}
            >
              {renderParticle(particleEffect)}
            </Animated.View>
          ))}
        </View>
      )}

      {/* Border animation container */}
      <Animated.View
        style={[
          styles.borderContainer,
          {
            width: size + borderWidth * 2,
            height: size + borderWidth * 2,
            transform: [
              { rotate: rotationInterpolate },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        {borderAnimation !== 'none' && borderAnimation !== 'solid' ? (
          <LinearGradient
            colors={getBorderColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              getShapeMask(),
              {
                opacity: glowOpacity,
              },
            ]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              getShapeMask(),
              {
                backgroundColor:
                  borderAnimation === 'solid' ? AnimationColors.primary : 'transparent',
              },
            ]}
          />
        )}

        {/* Glow effect */}
        {['glow', 'neon', 'supernova'].includes(borderAnimation) && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                ...getShapeMask(),
                shadowColor: getBorderColors()[0],
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: glowOpacity,
                shadowRadius: 20 * glowIntensity,
              },
            ]}
          />
        )}
      </Animated.View>

      {/* Avatar image */}
      <View style={[styles.imageContainer, { width: size, height: size }, getShapeMask()]}>
        <Image
          source={source}
          style={[styles.image, { width: size, height: size }, getShapeMask()]}
          resizeMode="cover"
        />
      </View>

      {/* Status indicator */}
      {showStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isOnline ? AnimationColors.success : AnimationColors.gray500,
              right: size / 8,
              bottom: size / 8,
              width: size / 5,
              height: size / 5,
            },
          ]}
        >
          {isOnline && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: AnimationColors.success,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            />
          )}
        </View>
      )}

      {/* Level badge */}
      {levelBadge !== undefined && (
        <View
          style={[
            styles.levelBadge,
            {
              top: -size / 12,
              right: -size / 12,
            },
          ]}
        >
          <LinearGradient
            colors={[AnimationColors.amber, AnimationColors.amberLight]}
            style={styles.levelBadgeGradient}
          >
            <Animated.Text
              style={[
                styles.levelText,
                {
                  fontSize: size / 5,
                },
              ]}
            >
              {levelBadge}
            </Animated.Text>
          </LinearGradient>
        </View>
      )}

      {/* Premium badge */}
      {isPremium && (
        <View style={[styles.premiumBadge, { top: -size / 12, left: -size / 12 }]}>
          <LinearGradient
            colors={[AnimationColors.purple, AnimationColors.pink]}
            style={styles.premiumBadgeGradient}
          >
            <Animated.Text style={styles.premiumIcon}>⭐</Animated.Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const renderParticle = (effect: ParticleEffect): JSX.Element => {
  const particleMap: Record<ParticleEffect, string> = {
    none: '',
    sparkles: '✨',
    bubbles: '○',
    flames: '🔥',
    snow: '❄️',
    hearts: '❤️',
    stars: '⭐',
  };

  return (
    <Animated.Text style={styles.particleText}>{particleMap[effect]}</Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  borderContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: AnimationColors.dark700,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusIndicator: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: AnimationColors.dark800,
  },
  levelBadge: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  levelBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: AnimationColors.white,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIcon: {
    fontSize: 12,
  },
  particlesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particleText: {
    fontSize: 12,
    opacity: 0.8,
  },
});

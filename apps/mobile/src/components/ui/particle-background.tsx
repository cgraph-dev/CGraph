/**
 * ParticleBackground - Animated floating particles background
 * Creates a mesmerizing depth effect with floating orbs, stars, and custom particles
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Rarity, RarityColors } from '@/lib/design/design-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ParticleType =
  | 'orbs'
  | 'stars'
  | 'snow'
  | 'bubbles'
  | 'confetti'
  | 'matrix'
  | 'fireflies';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  size: number;
  color: string;
  speed: number;
}

interface ParticleBackgroundProps {
  type?: ParticleType;
  count?: number;
  colors?: string[];
  speed?: number;
  rarity?: Rarity;
  interactive?: boolean;
  blur?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Particle Background component.
 *
 */
export default function ParticleBackground({
  type = 'orbs',
  count = 20,
  colors,
  speed = 1,
  rarity,
  interactive: _interactive = false,
  blur = true,
  style,
  children,
}: ParticleBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // Get colors based on rarity or use provided colors
  const particleColors =
    colors ||
    (rarity
      ? [RarityColors[rarity].primary, RarityColors[rarity].secondary, RarityColors[rarity].glow]
      : [
          Colors.primary[500],
          Colors.purple[500],
          Colors.neon.cyan,
          Colors.pink[500],
          Colors.amber[500],
        ]);

  useEffect(() => {
    initParticles();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      animationsRef.current.forEach((anim) => anim.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, count, speed]);

  const initParticles = () => {
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const particle = createParticle(i);
      newParticles.push(particle);
      animateParticle(particle);
    }

    setParticles(newParticles);
  };

  const createParticle = (id: number): Particle => {
    const sizeRange = getSizeRange();
    const size = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;

    return {
      id,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * SCREEN_HEIGHT),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      opacity: new Animated.Value(Math.random() * 0.5 + 0.3),
      rotation: new Animated.Value(0),
      size,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      speed: (Math.random() * 0.5 + 0.5) * speed,
    };
  };

  const getSizeRange = () => {
    switch (type) {
      case 'stars':
        return { min: 2, max: 8 };
      case 'snow':
        return { min: 4, max: 12 };
      case 'bubbles':
        return { min: 8, max: 24 };
      case 'confetti':
        return { min: 6, max: 12 };
      case 'matrix':
        return { min: 10, max: 20 };
      case 'fireflies':
        return { min: 4, max: 10 };
      default:
        return { min: 8, max: 32 };
    }
  };

  const animateParticle = (particle: Particle) => {
    const duration = 8000 / particle.speed;

    // Float animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -50,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.x, {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              toValue: (particle.x as unknown as number) + 30,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              toValue: (particle.x as unknown as number) - 30,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(particle.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(particle.opacity, {
          toValue: 0.8,
          duration: 2000 / particle.speed,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0.2,
          duration: 2000 / particle.speed,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation for confetti
    let rotationAnimation: Animated.CompositeAnimation | null = null;
    if (type === 'confetti') {
      rotationAnimation = Animated.loop(
        Animated.timing(particle.rotation, {
          toValue: 1,
          duration: 3000 / particle.speed,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    }

    // Start animations
    floatAnimation.start();
    pulseAnimation.start();
    rotationAnimation?.start();

    animationsRef.current.push(floatAnimation, pulseAnimation);
    if (rotationAnimation) animationsRef.current.push(rotationAnimation);
  };

  const renderParticle = (particle: Particle) => {
    const rotationInterpolate = particle.rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const baseStyle = {
      position: 'absolute' as const,
      width: particle.size,
      height: particle.size,
      transform: [
        { translateX: particle.x },
        { translateY: particle.y },
        { scale: particle.scale },
        { rotate: type === 'confetti' ? rotationInterpolate : '0deg' },
      ],
      opacity: particle.opacity,
    };

    switch (type) {
      case 'stars':
        return (
          <Animated.View key={particle.id} style={baseStyle}>
            <Animated.Text style={{ fontSize: particle.size * 2, color: particle.color }}>
              ✦
            </Animated.Text>
          </Animated.View>
        );

      case 'snow':
        return (
          <Animated.View key={particle.id} style={baseStyle}>
            <Animated.Text style={{ fontSize: particle.size * 1.5, color: 'white' }}>
              ❄
            </Animated.Text>
          </Animated.View>
        );

      case 'bubbles':
        return (
          <Animated.View
            key={particle.id}
            style={[
              baseStyle,
              {
                borderRadius: particle.size / 2,
                borderWidth: 1,
                borderColor: particle.color,
                backgroundColor: `${particle.color}20`,
              },
            ]}
          />
        );

      case 'confetti':
        return (
          <Animated.View
            key={particle.id}
            style={[
              baseStyle,
              {
                backgroundColor: particle.color,
                borderRadius: 2,
              },
            ]}
          />
        );

      case 'matrix': {
        const chars = '01アイウエオカキクケコ';
        return (
          <Animated.View key={particle.id} style={baseStyle}>
            <Animated.Text
              style={{
                fontSize: particle.size,
                color: Colors.matrix.green,
                fontFamily: 'monospace',
              }}
            >
              {chars[Math.floor(Math.random() * chars.length)]}
            </Animated.Text>
          </Animated.View>
        );
      }

      case 'fireflies':
        return (
          <Animated.View
            key={particle.id}
            style={[
              baseStyle,
              {
                borderRadius: particle.size / 2,
                backgroundColor: particle.color,
                shadowColor: particle.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: particle.size,
              },
            ]}
          />
        );

      default: // orbs
        return (
          <Animated.View key={particle.id} style={baseStyle}>
            <LinearGradient
              colors={[particle.color, `${particle.color}00`]}
              style={{
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
              }}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Background gradient */}
      <LinearGradient
        colors={[Colors.dark[950], Colors.dark[900], Colors.dark[950]]}
        style={StyleSheet.absoluteFill}
      />

      {/* Particles layer */}
      <View style={[StyleSheet.absoluteFill, blur && styles.blur]} pointerEvents="none">
        {particles.map(renderParticle)}
      </View>

      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  blur: {
    opacity: 0.6,
  },
});

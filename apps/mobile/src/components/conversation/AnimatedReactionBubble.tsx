/**
 * AnimatedReactionBubble Component
 * 
 * Interactive reaction bubble with animated feedback on tap.
 * Provides haptic and visual feedback for emoji reactions.
 * Features particle explosion effect matching web parity.
 * 
 * @module components/conversation/AnimatedReactionBubble
 * @since v0.7.29
 * @updated v0.8.2 - Added particle explosion effect for web parity
 */

import React, { memo, useRef, useCallback, useState } from 'react';
import { TouchableOpacity, Text, Animated, Easing, StyleSheet, View } from 'react-native';

// Number of particles in the explosion effect
const PARTICLE_COUNT = 8;

// Generate positions for radial particle explosion
const generateParticlePositions = () => {
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
    particles.push({
      x: Math.cos(angle) * 30, // Radius of 30
      y: Math.sin(angle) * 30,
    });
  }
  return particles;
};

const PARTICLE_POSITIONS = generateParticlePositions();

export interface ReactionData {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface ThemeColors {
  primary: string;
  surface: string;
  text: string;
}

export interface AnimatedReactionBubbleProps {
  /** Reaction data including emoji, count, and user reaction state */
  reaction: ReactionData;
  /** Whether this reaction is on the current user's message */
  isOwnMessage: boolean;
  /** Callback when the reaction is tapped */
  onPress: () => void;
  /** Theme colors for styling */
  colors: ThemeColors;
  /** Optional: Disable particle effect for performance */
  disableParticles?: boolean;
}

/**
 * Particle component for explosion effect
 */
const ReactionParticle = memo(function ReactionParticle({
  index,
  animValue,
  color,
}: {
  index: number;
  animValue: Animated.Value;
  color: string;
}) {
  const position = PARTICLE_POSITIONS[index];
  
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, position.x],
  });
  
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, position.y],
  });
  
  const scale = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 0],
  });
  
  const opacity = animValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
});

/**
 * Animated reaction bubble that displays emoji reactions on messages.
 * 
 * Features:
 * - Bounce animation on tap for satisfying feedback
 * - Visual distinction for user's own reactions
 * - Count display for multiple reactions
 * - 8-particle radial explosion effect (matching web)
 * - Optimized with memoization
 * 
 * Animation behavior:
 * - Scale pulse from 1 → 1.3 → 1 on press
 * - Emoji "jump" with translateY animation
 * - Spring physics for natural movement
 * - Particle burst with radial distribution
 * 
 * @example
 * ```tsx
 * <AnimatedReactionBubble
 *   reaction={{ emoji: '❤️', count: 5, hasReacted: true }}
 *   isOwnMessage={false}
 *   onPress={() => handleReactionTap('❤️')}
 *   colors={themeColors}
 * />
 * ```
 */
export const AnimatedReactionBubble = memo(function AnimatedReactionBubble({
  reaction,
  isOwnMessage,
  onPress,
  colors,
  disableParticles = false,
}: AnimatedReactionBubbleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [showParticles, setShowParticles] = useState(false);

  const handlePress = useCallback(() => {
    // Bounce animation sequence on tap
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();

    // Emoji "jump" animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -8,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
    ]).start();

    // Particle explosion effect
    if (!disableParticles) {
      setShowParticles(true);
      particleAnim.setValue(0);
      
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        setShowParticles(false);
      });
    }

    // Glow pulse effect
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start();

    onPress();
  }, [scaleAnim, bounceAnim, particleAnim, glowAnim, onPress, disableParticles]);

  // Glow opacity interpolation
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  // Dynamic styles based on reaction state and message ownership
  const bubbleStyle = {
    backgroundColor: reaction.hasReacted
      ? isOwnMessage
        ? 'rgba(255,255,255,0.25)'
        : `${colors.primary}25`
      : isOwnMessage
        ? 'rgba(255,255,255,0.12)'
        : colors.surface,
    borderColor: reaction.hasReacted ? colors.primary : 'transparent',
    borderWidth: reaction.hasReacted ? 1.5 : 0,
  };

  return (
    <View style={styles.container}>
      {/* Glow effect layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor: colors.primary,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      
      {/* Particle explosion */}
      {showParticles && !disableParticles && (
        <View style={styles.particleContainer}>
          {PARTICLE_POSITIONS.map((_, index) => (
            <ReactionParticle
              key={index}
              index={index}
              animValue={particleAnim}
              color={colors.primary}
            />
          ))}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.reactionBubble, bubbleStyle]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Animated.Text
          style={[
            styles.reactionEmoji,
            {
              transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
            },
          ]}
        >
          {reaction.emoji}
        </Animated.Text>
        {reaction.count > 1 && (
          <Text
            style={[
              styles.reactionCount,
              { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.text },
            ]}
          >
            {reaction.count}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    width: 40,
    height: 24,
    borderRadius: 12,
    zIndex: 0,
  },
  particleContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginTop: 4,
    zIndex: 1,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AnimatedReactionBubble;

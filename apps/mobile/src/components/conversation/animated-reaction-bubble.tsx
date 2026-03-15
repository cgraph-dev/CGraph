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

import { durations } from '@cgraph/animation-constants';
import React, { memo, useCallback, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing as ReanimatedEasing,
  type SharedValue,
} from 'react-native-reanimated';
import { LottieRenderer, emojiToCodepoint, getWebPFallbackUrl } from '@/lib/lottie';

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
  animValue: SharedValue<number>;
  color: string;
}) {
  const position = PARTICLE_POSITIONS[index];

  const particleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(animValue.value, [0, 1], [0, position.x]) },
      { translateY: interpolate(animValue.value, [0, 1], [0, position.y]) },
      { scale: interpolate(animValue.value, [0, 0.5, 1], [0, 1.2, 0]) },
    ],
    opacity: interpolate(animValue.value, [0, 0.3, 1], [0, 1, 0]),
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
        },
        particleAnimatedStyle,
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
  const scaleAnim = useSharedValue(1);
  const bounceAnim = useSharedValue(0);
  const particleAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const [showParticles, setShowParticles] = useState(false);

  const handlePress = useCallback(() => {
    // Bounce animation sequence on tap
    scaleAnim.value = withSequence(
      withSpring(1.3, { stiffness: 300, damping: 5 }),
      withSpring(1, { stiffness: 200, damping: 10 })
    );

    // Emoji "jump" animation
    bounceAnim.value = withSequence(
      withTiming(-8, {
        duration: durations.instant.ms,
        easing: ReanimatedEasing.out(ReanimatedEasing.quad),
      }),
      withSpring(0, { stiffness: 300, damping: 8 })
    );

    // Particle explosion effect
    if (!disableParticles) {
      setShowParticles(true);
      particleAnim.value = 0;

      particleAnim.value = withTiming(
        1,
        {
          duration: durations.smooth.ms,
          easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setShowParticles)(false);
          }
        }
      );
    }

    // Glow pulse effect
    glowAnim.value = withSequence(
      withTiming(1, {
        duration: durations.fast.ms,
        easing: ReanimatedEasing.out(ReanimatedEasing.quad),
      }),
      withTiming(0, {
        duration: durations.slow.ms,
        easing: ReanimatedEasing.in(ReanimatedEasing.quad),
      })
    );

    onPress();
  }, [scaleAnim, bounceAnim, particleAnim, glowAnim, onPress, disableParticles]);

  // Glow animated style
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0, 0.4]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [1, 1.5]) }],
  }));

  // Emoji animated style
  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }, { translateY: bounceAnim.value }],
  }));

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
          },
          glowAnimatedStyle,
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
        <Animated.View
          style={[
            styles.reactionEmoji,
             
            emojiAnimatedStyle as Record<string, unknown>,
          ]}
        >
          <LottieRenderer
            emoji={reaction.emoji}
            size={16}
            autoplay
            fallbackSrc={getWebPFallbackUrl(emojiToCodepoint(reaction.emoji))}
          />
        </Animated.View>
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
    // fontSize handled by LottieRenderer size prop
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AnimatedReactionBubble;

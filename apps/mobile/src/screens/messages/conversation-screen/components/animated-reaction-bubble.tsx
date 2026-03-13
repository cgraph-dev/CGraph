/**
 * AnimatedReactionBubble Component
 *
 * Animated reaction bubble with spring bounce effects using Reanimated v4.
 * Supports a "super reaction" mode with expanded particle burst.
 *
 * @module screens/messages/ConversationScreen/components
 */

import { durations } from '@cgraph/animation-constants';
import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  _withDelay,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_PRESETS } from '@/lib/animations/animation-library';
import { LottieRenderer, emojiToCodepoint, getWebPFallbackUrl } from '@/lib/lottie';
import type { AnimatedReactionBubbleProps } from '../types';

const SUPER_PARTICLE_COUNT = 10;

/**
 * A single burst particle that flies outward from the reaction bubble.
 */
function BurstParticle({ emoji, index, total }: { emoji: string; index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2;
  const distance = 50 + Math.random() * 30;

  return (
    <Animated.Text
      entering={FadeIn.duration(150).delay(index * 20)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.particle,
        {
          transform: [
            { translateX: Math.cos(angle) * distance },
            { translateY: Math.sin(angle) * distance },
            { scale: 1.3 },
          ],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

/**
 * Displays a single reaction bubble with animation effects.
 *
 * Features:
 * - Reanimated v4 spring scale on press
 * - Bounce animation for the emoji
 * - Super reaction: particle burst (premium)
 * - Visual distinction for user's own reactions
 */
export const AnimatedReactionBubble = memo(function AnimatedReactionBubble({
  reaction,
  isOwnMessage,
  onPress,
  colors,
  isSuperReaction,
}: AnimatedReactionBubbleProps & { isSuperReaction?: boolean }) {
  const scale = useSharedValue(1);
  const emojiY = useSharedValue(0);
  const [showBurst, setShowBurst] = React.useState(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: emojiY.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Bounce sequence
    const peakScale = isSuperReaction ? 1.6 : 1.3;
    scale.value = withSequence(
      withSpring(peakScale, SPRING_PRESETS.bouncy),
      withSpring(1, SPRING_PRESETS.snappy)
    );

    // Emoji vertical bounce
    emojiY.value = withSequence(
      withTiming(-8, { duration: durations.instant.ms, easing: Easing.out(Easing.quad) }),
      withSpring(0, SPRING_PRESETS.snappy)
    );

    // Super reaction particle burst
    if (isSuperReaction) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 800);
    }

    onPress();
  };

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.reactionBubble,
            animStyle,
            {
              backgroundColor: reaction.hasReacted
                ? isOwnMessage
                  ? 'rgba(255,255,255,0.25)'
                  : colors.primary + '25'
                : isOwnMessage
                  ? 'rgba(255,255,255,0.12)'
                  : colors.surface,
              borderColor: reaction.hasReacted ? colors.primary : 'transparent',
              borderWidth: reaction.hasReacted ? 1.5 : 0,
            },
          ]}
        >
          {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */}
          <Animated.View style={[styles.reactionEmoji, emojiStyle as any]}>
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
        </Animated.View>
      </Pressable>

      {/* Super reaction burst particles */}
      {showBurst && (
        <View style={styles.burstContainer} pointerEvents="none">
          {Array.from({ length: SUPER_PARTICLE_COUNT }).map((_, i) => (
            <BurstParticle key={i} emoji={reaction.emoji} index={i} total={SUPER_PARTICLE_COUNT} />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginTop: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '500',
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 14,
  },
});

export default AnimatedReactionBubble;

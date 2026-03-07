/**
 * ReactionBar — compact horizontal reaction pills below message bubble.
 * @module components/chat/reaction-bar
 */
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { space, radius } from '../../theme/tokens';
import { LottieRenderer, emojiToCodepoint, getWebPFallbackUrl } from '@/lib/lottie';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: string[];
}

interface ReactionBarProps {
  reactions: Reaction[];
  onToggle?: (emoji: string) => void;
  onAdd?: () => void;
  onLongPress?: (emoji: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * ReactionBar — tappable emoji pills with counts.
 * Tap to toggle reaction, long-press to view who reacted.
 */
export const ReactionBar = memo(function ReactionBar({
  reactions,
  onToggle,
  onAdd,
  onLongPress,
}: ReactionBarProps) {
  if (reactions.length === 0) return null;

  return (
    <Animated.View
      layout={Layout.springify()}
      style={styles.container}
    >
      {reactions.map((r) => (
        <ReactionPill
          key={r.emoji}
          reaction={r}
          onToggle={onToggle}
          onLongPress={onLongPress}
        />
      ))}

      {/* Add reaction button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAdd?.();
        }}
        style={styles.addButton}
      >
        <Text style={styles.addIcon}>+</Text>
      </Pressable>
    </Animated.View>
  );
});

interface ReactionPillProps {
  reaction: Reaction;
  onToggle?: (emoji: string) => void;
  onLongPress?: (emoji: string) => void;
}

const ReactionPill = memo(function ReactionPill({
  reaction,
  onToggle,
  onLongPress,
}: ReactionPillProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle?.(reaction.emoji);
  }, [reaction.emoji, onToggle]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(reaction.emoji);
  }, [reaction.emoji, onLongPress]);

  return (
    <AnimatedPressable
      entering={FadeIn.springify()}
      exiting={FadeOut.springify()}
      layout={Layout.springify()}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[
        styles.pill,
        reaction.hasReacted && styles.pillActive,
      ]}
    >
      <LottieRenderer
        emoji={reaction.emoji}
        size={14}
        autoplay={reaction.hasReacted}
        fallbackSrc={getWebPFallbackUrl(emojiToCodepoint(reaction.emoji))}
      />
      <Text
        style={[
          styles.count,
          reaction.hasReacted && styles.countActive,
        ]}
      >
        {reaction.count}
      </Text>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    marginTop: space[1],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[1.5],
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: {
    borderColor: 'rgba(124,58,237,0.4)',
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    fontVariant: ['tabular-nums'],
  },
  countActive: {
    color: '#FFFFFF',
  },
  addButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  addIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
  },
});

export default ReactionBar;

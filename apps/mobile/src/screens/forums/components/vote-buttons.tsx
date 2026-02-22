/**
 * VoteButtons – Animated vertical vote component for mobile forums.
 *
 * Uses Reanimated v4 (ADR-018) with spring physics, haptic feedback,
 * and floating +1/-1 indicator.
 *
 * @module screens/forums/components/VoteButtons
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SPRING_PRESETS } from '@/lib/animations/animation-library';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface VoteButtonsProps {
  /** Current aggregate vote count */
  voteCount: number;
  /** Current user's vote: 1, -1, or 0 (none) */
  myVote: 0 | 1 | -1;
  /** Called when user taps a vote arrow */
  onVote: (direction: 1 | -1) => void;
  /** Icon size (pt) */
  size?: number;
  /** Override colors */
  colors?: {
    primary?: string;
    error?: string;
    textSecondary?: string;
    text?: string;
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_COLORS = {
  primary: '#10B981',
  error: '#EF4444',
  textSecondary: '#9CA3AF',
  text: '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function VoteButtons({
  voteCount,
  myVote,
  onVote,
  size = 24,
  colors: colorsProp,
}: VoteButtonsProps) {
  const colors = { ...DEFAULT_COLORS, ...colorsProp };

  // Shared values for arrow bounce animations
  const upScale = useSharedValue(1);
  const downScale = useSharedValue(1);

  // Floating indicator state
  const [floatingLabel, setFloatingLabel] = useState<string | null>(null);

  const clearFloating = useCallback(() => {
    setTimeout(() => setFloatingLabel(null), 600);
  }, []);

  const handleVote = useCallback(
    (direction: 1 | -1) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const scale = direction === 1 ? upScale : downScale;
      scale.value = withSequence(
        withSpring(1.35, SPRING_PRESETS.bouncy),
        withSpring(1, SPRING_PRESETS.bouncy),
      );

      setFloatingLabel(direction === 1 ? '+1' : '-1');
      runOnJS(clearFloating)();

      onVote(direction);
    },
    [onVote, upScale, downScale, clearFloating],
  );

  // Animated styles
  const upAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: upScale.value }],
  }));

  const downAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: downScale.value }],
  }));

  // Vote count color
  const countColor =
    voteCount > 0 ? colors.primary : voteCount < 0 ? colors.error : colors.textSecondary;

  return (
    <View style={styles.container}>
      {/* Up arrow */}
      <Pressable onPress={() => handleVote(1)} hitSlop={8}>
        <Animated.View style={upAnimatedStyle}>
          <Ionicons
            name={myVote === 1 ? 'arrow-up' : 'arrow-up-outline'}
            size={size}
            color={myVote === 1 ? colors.primary : colors.textSecondary}
          />
        </Animated.View>
      </Pressable>

      {/* Score */}
      <View style={styles.scoreWrapper}>
        <Text style={[styles.score, { color: countColor }]}>
          {voteCount}
        </Text>

        {/* Floating indicator */}
        {floatingLabel && (
          <Animated.Text
            entering={SlideInUp.duration(250).springify()}
            exiting={FadeOut.duration(300)}
            style={[
              styles.floatingLabel,
              { color: floatingLabel === '+1' ? colors.primary : colors.error },
            ]}
          >
            {floatingLabel}
          </Animated.Text>
        )}
      </View>

      {/* Down arrow */}
      <Pressable onPress={() => handleVote(-1)} hitSlop={8}>
        <Animated.View style={downAnimatedStyle}>
          <Ionicons
            name={myVote === -1 ? 'arrow-down' : 'arrow-down-outline'}
            size={size}
            color={myVote === -1 ? colors.error : colors.textSecondary}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
  },
  scoreWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    top: -18,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default VoteButtons;

/**
 * Vote Button (Mobile) — Horizontal vote control with haptic feedback
 *
 * Features:
 * - Horizontal layout (↑ count ↓)
 * - Haptic feedback on vote
 * - Animated count change
 * - Toggle and swing vote logic
 *
 * @module components/forum/vote-button
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

type VoteDirection = 'up' | 'down' | null;

interface VoteButtonProps {
  count: number;
  userVote?: VoteDirection;
  onVote?: (direction: VoteDirection) => void;
  size?: 'sm' | 'md';
}

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Vote Button component. */
export function VoteButton({
  count,
  userVote = null,
  onVote,
  size = 'md',
}: VoteButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const iconSize = size === 'sm' ? 16 : 20;
  const fontSize = size === 'sm' ? 12 : 14;

  const handleVote = useCallback(
    (direction: 'up' | 'down') => {
      // toggle off if same direction, otherwise swing
      const newDir = userVote === direction ? null : direction;
      Haptics.impactAsync(
        newDir ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
      scale.value = withSequence(
        withSpring(1.15, { damping: 6, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      onVote?.(newDir);
    },
    [userVote, onVote, scale]
  );

  const animatedCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const upColor = userVote === 'up' ? '#6366f1' : 'rgba(255,255,255,0.4)';
  const downColor = userVote === 'down' ? '#ef4444' : 'rgba(255,255,255,0.4)';
  const countColor =
    userVote === 'up' ? '#6366f1' : userVote === 'down' ? '#ef4444' : 'rgba(255,255,255,0.6)';

  return (
    <View style={[styles.container, size === 'sm' && styles.containerSm]}>
      <Pressable
        onPress={() => handleVote('up')}
        hitSlop={8}
        style={({ pressed }) => [styles.voteBtn, pressed && styles.voteBtnPressed]}
      >
        <MaterialCommunityIcons name="arrow-up-bold" size={iconSize} color={upColor} />
      </Pressable>

      <Animated.View style={animatedCountStyle}>
        <Text style={[styles.count, { fontSize, color: countColor }]}>{formatCount(count)}</Text>
      </Animated.View>

      <Pressable
        onPress={() => handleVote('down')}
        hitSlop={8}
        style={({ pressed }) => [styles.voteBtn, pressed && styles.voteBtnPressed]}
      >
        <MaterialCommunityIcons name="arrow-down-bold" size={iconSize} color={downColor} />
      </Pressable>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  containerSm: {
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  voteBtn: {
    padding: 4,
    borderRadius: 6,
  },
  voteBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  count: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 20,
    textAlign: 'center',
  },
});

export default VoteButton;

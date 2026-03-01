/**
 * RankProgressBar — Shows progress toward next forum rank.
 *
 * Displays current score / next rank threshold with animated fill.
 * Shows current rank badge (left) and next rank badge (right).
 * Label: "250 / 500 to Veteran"
 *
 * @module screens/forums/components/rank-progress-bar
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { durations } from '@cgraph/animation-constants';
import { useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

export interface RankInfo {
  name: string;
  color: string;
  imageUrl?: string | null;
  minScore: number;
  maxScore?: number | null;
}

export interface RankProgressBarProps {
  currentScore: number;
  currentRank: RankInfo;
  nextRank: RankInfo | null;
  progressPercent: number;
  scoreToNextRank: number | null;
}

// ── Component ──────────────────────────────────────────────────────────

export function RankProgressBar({
  currentScore,
  currentRank,
  nextRank,
  progressPercent,
  scoreToNextRank,
}: RankProgressBarProps) {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(progressPercent, {
      duration: durations.smooth.ms,
      easing: Easing.out(Easing.ease),
    });
  }, [progressPercent]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Rank labels */}
      <View style={styles.labelRow}>
        <View style={styles.rankLabel}>
          <View style={[styles.rankDot, { backgroundColor: currentRank.color }]} />
          <Text style={[styles.rankName, { color: currentRank.color }]}>
            {currentRank.name}
          </Text>
        </View>

        {nextRank && (
          <View style={styles.rankLabel}>
            <Text style={[styles.rankName, { color: nextRank.color }]}>
              {nextRank.name}
            </Text>
            <View style={[styles.rankDot, { backgroundColor: nextRank.color }]} />
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              animatedFillStyle,
              {
                backgroundColor: currentRank.color,
              },
            ]}
          />
        </View>
      </View>

      {/* Score label */}
      <Text style={styles.scoreLabel}>
        {nextRank && scoreToNextRank != null ? (
          <>
            <Text style={styles.scoreBold}>{Math.round(currentScore)}</Text>
            {' / '}
            {nextRank.minScore} to {nextRank.name}
          </>
        ) : (
          <>
            <Text style={styles.scoreBold}>{Math.round(currentScore)}</Text>
            {' pts — Max rank!'}
          </>
        )}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rankName: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackContainer: {
    marginBottom: 6,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  scoreLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
  },
  scoreBold: {
    fontWeight: '700',
    color: '#E5E7EB',
  },
});

export default RankProgressBar;

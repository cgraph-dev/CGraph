/**
 * LeaderboardSection - Leaderboard display with rankings
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { LeaderboardEntry } from '../types';

export interface LeaderboardSectionProps {
  leaderboard: LeaderboardEntry[];
  onSeeAll?: () => void;
}

/**
 *
 */
export function LeaderboardSection({ leaderboard, onSeeAll }: LeaderboardSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <BlurView intensity={40} tint="dark" style={styles.card}>
        {leaderboard.map((entry, index) => (
          <View
            key={entry.userId}
            style={[
              styles.row,
              entry.isCurrentUser && styles.rowHighlight,
              index > 0 && styles.rowBorder,
            ]}
          >
            <View
              style={[
                styles.rank,
                entry.rank === 1 && styles.rank1,
                entry.rank === 2 && styles.rank2,
                entry.rank === 3 && styles.rank3,
              ]}
            >
              <Text style={[styles.rankText, entry.rank <= 3 && styles.rankTextTop]}>
                {entry.rank}
              </Text>
            </View>
            <Text
              style={[styles.username, entry.isCurrentUser && styles.usernameHighlight]}
              numberOfLines={1}
            >
              {entry.username}
            </Text>
            <Text style={styles.count}>{entry.referralCount} referrals</Text>
          </View>
        ))}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  seeAllText: {
    fontSize: 13,
    color: AnimationColors.primary,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.3)',
  },
  rowHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginRight: 12,
  },
  rank1: { backgroundColor: '#fbbf24' },
  rank2: { backgroundColor: '#9ca3af' },
  rank3: { backgroundColor: '#f97316' },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  rankTextTop: {
    color: '#111827',
  },
  username: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  usernameHighlight: {
    color: AnimationColors.primary,
  },
  count: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default LeaderboardSection;

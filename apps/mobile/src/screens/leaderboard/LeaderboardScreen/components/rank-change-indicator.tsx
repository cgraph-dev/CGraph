/**
 * RankChangeIndicator - Shows rank movement
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface RankChangeIndicatorProps {
  current: number;
  previous: number;
}

export function RankChangeIndicator({ current, previous }: RankChangeIndicatorProps) {
  const diff = previous - current;

  if (diff > 0) {
    return (
      <View style={[styles.rankChange, styles.rankUp]}>
        <Ionicons name="trending-up" size={12} color="#10b981" />
        <Text style={styles.rankUpText}>+{diff}</Text>
      </View>
    );
  } else if (diff < 0) {
    return (
      <View style={[styles.rankChange, styles.rankDown]}>
        <Ionicons name="trending-down" size={12} color="#ef4444" />
        <Text style={styles.rankDownText}>{diff}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.rankChange, styles.rankSame]}>
      <Ionicons name="remove" size={12} color="#6b7280" />
    </View>
  );
}

const styles = StyleSheet.create({
  rankChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  rankUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  rankDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  rankSame: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
  },
  rankUpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  rankDownText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
});

export default RankChangeIndicator;

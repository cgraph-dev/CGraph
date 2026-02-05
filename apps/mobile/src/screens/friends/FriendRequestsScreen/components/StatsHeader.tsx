/**
 * StatsHeader Component
 *
 * Displays request counts with animations.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/GlassCard';
import type { StatsHeaderProps } from '../types';

export function StatsHeader({ incomingCount, outgoingCount }: StatsHeaderProps) {
  return (
    <View style={styles.statsContainer}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.statsCard}>
        <View style={styles.statItem}>
          <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.statIcon}>
            <Ionicons name="arrow-down" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.statNumber}>{incomingCount}</Text>
          <Text style={styles.statLabel}>Incoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.statIcon}>
            <Ionicons name="arrow-up" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.statNumber}>{outgoingCount}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
  },
});

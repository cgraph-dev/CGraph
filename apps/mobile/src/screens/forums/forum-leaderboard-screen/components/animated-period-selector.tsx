/**
 * AnimatedPeriodSelector Component
 *
 * Period selection pills for filtering leaderboard data with:
 * - Daily/Weekly/Monthly/All Time options
 * - Active state with gradient background
 * - Haptic feedback on selection
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../../../components/ui/glass-card';
import { TimePeriod } from '../../forum-leaderboard-screen';

// =============================================================================
// TYPES
// =============================================================================

interface PeriodSelectorProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all', label: 'All Time' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function AnimatedPeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  return (
    <View style={styles.periodContainer}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.periodCard}>
        <View style={styles.periodButtons}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodButton, period === p.key && styles.periodButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPeriodChange(p.key);
              }}
              activeOpacity={0.8}
            >
              {period === p.key ? (
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.periodButtonGradient}>
                  <Text style={styles.periodButtonTextActive}>{p.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.periodButtonText}>{p.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  periodContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  periodCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  periodButtons: {
    flexDirection: 'row',
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    overflow: 'hidden',
  },
  periodButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  periodButtonTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});

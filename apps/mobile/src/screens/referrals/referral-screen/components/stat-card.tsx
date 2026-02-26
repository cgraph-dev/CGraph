/**
 * StatCard - Referral stat display card
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface StatCardProps {
  icon: string;
  iconColor: string;
  value: number | string;
  label: string;
  trend?: number;
}

/**
 *
 */
export function StatCard({ icon, iconColor, value, label, trend }: StatCardProps) {
  return (
    <BlurView intensity={40} tint="dark" style={styles.container}>
      <View style={[styles.icon, { backgroundColor: iconColor + '20' }]}>
        { }
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
      </View>
      <View style={styles.value}>
        <Text style={styles.valueText}>{value}</Text>
        {trend !== undefined && trend !== 0 && (
          <View style={[styles.trendBadge, trend > 0 ? styles.trendUp : styles.trendDown]}>
            <Ionicons
              name={trend > 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend > 0 ? '#10b981' : '#ef4444'}
            />
          </View>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: (SCREEN_WIDTH - 48) / 2,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  trendBadge: {
    padding: 2,
    borderRadius: 4,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default StatCard;

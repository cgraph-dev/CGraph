/**
 * StatCard - Dashboard statistics card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

/**
 *
 */
export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color={color} />
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.isPositive ? '#10b98120' : '#ef444420' },
            ]}
          >
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.trendText, { color: trend.isPositive ? '#10b981' : '#ef4444' }]}>
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default StatCard;

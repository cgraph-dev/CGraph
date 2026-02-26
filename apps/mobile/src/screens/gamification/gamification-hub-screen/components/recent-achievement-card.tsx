/**
 * RecentAchievementCard - Achievement display with XP reward
 *
 * Features:
 * - Icon/emoji display
 * - XP reward badge
 * - Gradient card styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface RecentAchievementCardProps {
  achievement: {
    icon?: string;
    name: string;
    description: string;
    xpReward: number;
  };
}

/**
 *
 */
export function RecentAchievementCard({ achievement }: RecentAchievementCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f59e0b20', '#1f2937']} style={styles.gradient}>
        <Text style={styles.icon}>{achievement.icon || '🏆'}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{achievement.name}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
        <View style={styles.reward}>
          <Ionicons name="sparkles" size={14} color="#8b5cf6" />
          <Text style={styles.rewardText}>+{achievement.xpReward} XP</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  icon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
});

export default RecentAchievementCard;

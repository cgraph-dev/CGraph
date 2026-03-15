/**
 * NextTierProgress - Progress card to next reward tier
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { RewardTier } from '../types';

export interface NextTierProgressProps {
  tier: RewardTier;
  currentReferrals: number;
  progress: number;
}

/**
 * Next Tier Progress component.
 *
 */
export function NextTierProgress({ tier, currentReferrals, progress }: NextTierProgressProps) {
  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return 'sparkles';
      case 'coins':
        return 'logo-bitcoin';
      case 'premium':
        return 'star';
      default:
        return 'gift';
    }
  };

  return (
    <BlurView intensity={50} tint="dark" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress to {tier.name}</Text>
        <Text style={styles.count}>
          {currentReferrals} / {tier.referralsRequired}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={[AnimationColors.primary, '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress}%` }]}
        />
      </View>
      <View style={styles.rewards}>
        {tier.rewards.slice(0, 3).map((reward, i) => (
          <View key={i} style={styles.reward}>
            <Ionicons
               
              name={getRewardIcon(reward.type) as keyof typeof Ionicons.glyphMap}
              size={12}
              color="#9ca3af"
            />
            <Text style={styles.rewardText}>{reward.description}</Text>
          </View>
        ))}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  count: {
    fontSize: 13,
    color: '#9ca3af',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rewardText: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default NextTierProgress;

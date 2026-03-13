/**
 * RewardTierCard - Reward tier progress and claim card
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { RewardTier } from '../types';

export interface RewardTierCardProps {
  tier: RewardTier;
  currentReferrals: number;
  onClaim: (tierId: string) => void;
}

/**
 * Reward Tier Card component.
 *
 */
export function RewardTierCard({ tier, currentReferrals, onClaim }: RewardTierCardProps) {
  const progress = Math.min((currentReferrals / tier.referralsRequired) * 100, 100);
  const canClaim = tier.achieved && !tier.claimed;

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return 'sparkles';
      case 'coins':
        return 'logo-bitcoin';
      case 'premium':
        return 'star';
      case 'badge':
        return 'medal';
      default:
        return 'ribbon';
    }
  };

  return (
    <BlurView
      intensity={tier.achieved ? 60 : 40}
      tint="dark"
      style={[styles.container, tier.achieved && styles.achieved, canClaim && styles.claimable]}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={[styles.name, tier.achieved && styles.nameAchieved]}>{tier.name}</Text>
          <Text style={styles.description}>{tier.description}</Text>
        </View>

        {tier.claimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={AnimationColors.primary} />
          </View>
        )}

        {canClaim && (
          <TouchableOpacity onPress={() => onClaim(tier.id)} style={styles.claimButton}>
            <LinearGradient
              colors={[AnimationColors.primary, '#059669']}
              style={styles.claimButtonGradient}
            >
              <Ionicons name="gift" size={14} color="#fff" />
              <Text style={styles.claimButtonText}>Claim</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
              tier.achieved && styles.progressFillAchieved,
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentReferrals} / {tier.referralsRequired}
        </Text>
      </View>

      {/* Rewards */}
      <View style={styles.rewards}>
        {tier.rewards.map((reward, index) => (
          <View key={index} style={styles.rewardTag}>
            <Ionicons
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              name={getRewardIcon(reward.type) as keyof typeof Ionicons.glyphMap}
              size={12}
              color={tier.achieved ? AnimationColors.primary : '#9ca3af'}
            />
            <Text style={[styles.rewardTagText, tier.achieved && styles.rewardTagTextAchieved]}>
              {reward.description}
            </Text>
          </View>
        ))}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
  },
  achieved: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  claimable: {
    borderColor: '#10b981',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9ca3af',
  },
  nameAchieved: {
    color: '#ffffff',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  claimedBadge: {
    padding: 4,
  },
  claimButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6b7280',
    borderRadius: 3,
  },
  progressFillAchieved: {
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 11,
    color: '#9ca3af',
    minWidth: 50,
    textAlign: 'right',
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  rewardTagText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  rewardTagTextAchieved: {
    color: '#10b981',
  },
});

export default RewardTierCard;

/**
 * RewardBadge - Displays quest reward with icon
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';

import { RewardBadgeProps } from '../types';
import { REWARD_ICONS } from '../constants';
import { styles } from '../styles';

export function RewardBadge({ reward }: RewardBadgeProps) {
  const icon = REWARD_ICONS[reward.type] || 'gift';

  return (
    <View style={styles.rewardBadge}>
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={12}
        color={AnimationColors.primary}
      />
      <Text style={styles.rewardText}>
        {reward.amount ? `+${reward.amount}` : ''} {reward.name || reward.type.toUpperCase()}
      </Text>
    </View>
  );
}

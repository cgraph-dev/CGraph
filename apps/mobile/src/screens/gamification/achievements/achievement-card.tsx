/**
 * AchievementCard component for the achievements list.
 *
 * @module screens/gamification/achievements/achievement-card
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { AchievementWithProgress } from './types';
import { RARITY_COLORS } from './types';
import { styles } from './styles';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onPress: (achievement: AchievementWithProgress) => void;
}

export function AchievementCard({ achievement, onPress }: AchievementCardProps) {
  const colors = RARITY_COLORS[achievement.rarity];
  const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        { borderColor: achievement.unlocked ? colors.border : '#374151' },
      ]}
      onPress={() => {
        HapticFeedback.light();
        onPress(achievement);
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={achievement.unlocked ? [colors.bg, '#1f2937'] : ['#1f2937', '#111827']}
        style={styles.achievementGradient}
      >
        {/* Icon */}
        <View
          style={[
            styles.achievementIcon,
            { backgroundColor: achievement.unlocked ? colors.border + '40' : '#37415180' },
          ]}
        >
          <Text style={styles.iconEmoji}>{achievement.icon || '🏆'}</Text>
          {achievement.unlocked && (
            <View style={styles.unlockedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.achievementContent}>
          <View style={styles.achievementHeader}>
            <Text
              style={[
                styles.achievementName,
                { color: achievement.unlocked ? colors.text : '#9ca3af' },
              ]}
              numberOfLines={1}
            >
              {achievement.name}
            </Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.rarityText, { color: colors.text }]}>
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.achievementDescription} numberOfLines={2}>
            {achievement.description}
          </Text>

          {/* Progress bar */}
          {!achievement.unlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: colors.border },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.requirement}
              </Text>
            </View>
          )}

          {/* Rewards */}
          <View style={styles.rewardsRow}>
            {achievement.xpReward > 0 && (
              <View style={styles.rewardBadge}>
                <Ionicons name="sparkles" size={12} color="#8b5cf6" />
                <Text style={styles.rewardText}>{achievement.xpReward} XP</Text>
              </View>
            )}
            {achievement.coinReward > 0 && (
              <View style={styles.rewardBadge}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <Text style={styles.rewardText}>{achievement.coinReward}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

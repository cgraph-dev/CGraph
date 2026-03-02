/**
 * Detail modal for viewing a single achievement.
 *
 * @module screens/gamification/achievements/detail-modal
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { type AchievementWithProgress, RARITY_COLORS } from './types';
import { styles } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DetailModalProps {
  achievement: AchievementWithProgress | null;
  visible: boolean;
  onClose: () => void;
}

/**
 *
 */
export function DetailModal({ achievement, visible, onClose }: DetailModalProps) {
  if (!achievement) return null;

  const colors = RARITY_COLORS[achievement.rarity];
  const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />

        <View
          style={[styles.modalContent, { borderColor: colors.border, width: SCREEN_WIDTH - 48 }]}
        >
          <LinearGradient colors={[colors.bg, '#1f2937', '#111827']} style={styles.modalGradient}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>

            {/* Achievement icon large */}
            <View style={[styles.largeIcon, { backgroundColor: colors.border + '40' }]}>
              <Text style={styles.largeIconEmoji}>{achievement.icon || '🏆'}</Text>
              {achievement.unlocked && (
                <View style={styles.largeUnlockedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
              )}
            </View>

            {/* Name and rarity */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>{achievement.name}</Text>
            <View
              style={[
                styles.modalRarityBadge,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.modalRarityText, { color: colors.text }]}>
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.modalDescription}>{achievement.description}</Text>

            {/* Progress */}
            {!achievement.unlocked && (
              <View style={styles.modalProgressSection}>
                <Text style={styles.modalProgressLabel}>Progress</Text>
                <View style={styles.modalProgressBar}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      { width: `${progressPercent}%`, backgroundColor: colors.border },
                    ]}
                  />
                </View>
                <Text style={styles.modalProgressText}>
                  {achievement.progress} / {achievement.requirement} ({Math.round(progressPercent)}
                  %)
                </Text>
              </View>
            )}

            {/* Unlock date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <View style={styles.unlockedInfo}>
                <Ionicons name="calendar" size={16} color="#9ca3af" />
                <Text style={styles.unlockedDate}>
                  Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Rewards */}
            <View style={styles.modalRewards}>
              <Text style={styles.modalRewardsLabel}>Rewards</Text>
              <View style={styles.modalRewardsRow}>
                {achievement.xpReward > 0 && (
                  <View style={styles.modalRewardBadge}>
                    <Ionicons name="sparkles" size={20} color="#8b5cf6" />
                    <Text style={styles.modalRewardText}>{achievement.xpReward} XP</Text>
                  </View>
                )}
                {achievement.coinReward > 0 && (
                  <View style={styles.modalRewardBadge}>
                    <Text style={{ fontSize: 20 }}>🪙</Text>
                    <Text style={styles.modalRewardText}>{achievement.coinReward} Coins</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}

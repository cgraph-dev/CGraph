/**
 * QuestCard - Individual quest display with actions
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/animation-engine';

import { QuestCardProps } from '../types';
import { QUEST_TYPE_CONFIG } from '../constants';
import { styles } from '../styles';
import { QuestProgressBar } from './quest-progress-bar';
import { RewardBadge } from './reward-badge';
import { CountdownTimer } from './countdown-timer';

/**
 *
 */
export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const scaleAnim = useSharedValue(1);

  const config = QUEST_TYPE_CONFIG[quest.type];
  const isComplete = quest.currentProgress >= quest.targetProgress;
  const canClaim = isComplete && quest.status !== 'claimed';
  const isLocked = quest.status === 'locked';

  useEffect(() => {
    if (canClaim) {
      scaleAnim.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: durations.verySlow.ms }),
          withTiming(1, { duration: durations.verySlow.ms })
        ),
        -1
      );
    }
  }, [canClaim, scaleAnim]);

  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;

    setIsClaiming(true);
    HapticFeedback.success();

    // Celebration animation
    scaleAnim.value = withSequence(
      withSpring(1.1, { stiffness: 200, damping: 10 }),
      withSpring(1, { stiffness: 100, damping: 10 })
    );

    try {
      await onClaim(quest.id);
    } catch (error) {
      console.error('Failed to claim quest:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const scaleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={scaleAnimatedStyle}>
      <BlurView
        intensity={40}
        tint="dark"
        style={[
          styles.questCard,
          isLocked && styles.questCardLocked,
          canClaim && styles.questCardReady,
        ]}
      >
        {/* Quest Type Badge */}
        <View style={[styles.questTypeBadge, { backgroundColor: config.bgColor }]}>
          <LinearGradient
            colors={config.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.questTypeIconContainer}
          >
            { }
            <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={14} color="#fff" />
          </LinearGradient>
          <Text style={[styles.questTypeLabel, { color: config.colors[0] }]}>{config.label}</Text>
        </View>

        {/* Quest Content */}
        <View style={styles.questContent}>
          <View style={styles.questHeader}>
            <View style={styles.questIconContainer}>
              <Ionicons
                 
                name={quest.iconName as keyof typeof Ionicons.glyphMap}
                size={24}
                color={isLocked ? '#6b7280' : config.colors[0]}
              />
            </View>
            <View style={styles.questInfo}>
              <Text style={[styles.questTitle, isLocked && styles.textLocked]}>{quest.title}</Text>
              <Text style={[styles.questDescription, isLocked && styles.textLocked]}>
                {quest.description}
              </Text>
            </View>
          </View>

          {/* Progress */}
          {!isLocked && (
            <QuestProgressBar
              current={quest.currentProgress}
              target={quest.targetProgress}
              colors={config.colors}
            />
          )}

          {/* Rewards */}
          <View style={styles.rewardsRow}>
            {quest.rewards.map((reward, index) => (
              <RewardBadge key={index} reward={reward} />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.questFooter}>
            {quest.expiresAt && !isLocked && <CountdownTimer expiresAt={quest.expiresAt} compact />}

            {isLocked && (
              <View style={styles.lockedIndicator}>
                <Ionicons name="lock-closed" size={14} color="#6b7280" />
                <Text style={styles.lockedText}>Complete prerequisite</Text>
              </View>
            )}

            {canClaim && (
              <TouchableOpacity
                onPress={handleClaim}
                disabled={isClaiming}
                style={styles.claimButton}
              >
                <LinearGradient
                  colors={[AnimationColors.primary, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.claimButtonGradient}
                >
                  {isClaiming ? (
                    <Ionicons name="hourglass" size={14} color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="gift" size={14} color="#fff" />
                      <Text style={styles.claimButtonText}>Claim</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {quest.status === 'claimed' && (
              <View style={styles.claimedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={AnimationColors.primary} />
                <Text style={styles.claimedText}>Claimed!</Text>
              </View>
            )}
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

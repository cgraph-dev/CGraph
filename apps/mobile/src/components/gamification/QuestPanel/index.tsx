/**
 * QuestPanel Component - Mobile
 *
 * Displays daily, weekly, and special quests for the user to complete.
 * Provides a core engagement loop with clear objectives and rewards.
 *
 * Features:
 * - Quest categories: Daily, Weekly, Special, Story
 * - Progress tracking with animated progress bars
 * - Countdown timers for time-limited quests
 * - Reward previews with animations
 * - Claim button with celebration effects
 * - Quest chains and story progression
 * - Collapsible sections for organization
 * - Pull-to-refresh functionality
 *
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';

import { QuestPanelProps, Quest, QuestType } from './types';
import { styles } from './styles';
import { QuestSection } from './components';

// Re-export types for external use
export type { Quest, QuestType, QuestStatus, QuestReward, QuestPanelProps } from './types';

export default function QuestPanel({
  quests,
  onClaimQuest,
  onRefresh,
  showHeader = true,
  maxHeight,
}: QuestPanelProps) {
  const [refreshing, setRefreshing] = useState(false);

  // Group quests by type
  const questsByType = quests.reduce<Record<QuestType, Quest[]>>(
    (acc, quest) => {
      if (!acc[quest.type]) {
        acc[quest.type] = [];
      }
      acc[quest.type].push(quest);
      return acc;
    },
    {} as Record<QuestType, Quest[]>
  );

  // Calculate overall progress
  const totalQuests = quests.length;
  const completedQuests = quests.filter((q) => q.status === 'claimed').length;
  const availableQuests = quests.filter(
    (q) => q.status !== 'claimed' && q.status !== 'locked'
  ).length;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    HapticFeedback.light();
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <View style={[styles.container, maxHeight ? { maxHeight } : {}]}>
      {showHeader && (
        <BlurView intensity={60} tint="dark" style={styles.headerContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Quests</Text>
              <Text style={styles.headerSubtitle}>
                {completedQuests} of {totalQuests} completed
              </Text>
            </View>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatNumber}>{availableQuests}</Text>
                <Text style={styles.headerStatLabel}>Available</Text>
              </View>
            </View>
          </View>

          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <View style={styles.overallProgressBar}>
              <View
                style={[
                  styles.overallProgressFill,
                  { width: `${(completedQuests / totalQuests) * 100}%` },
                ]}
              />
            </View>
          </View>
        </BlurView>
      )}

      <ScrollView
        style={styles.questList}
        contentContainerStyle={styles.questListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={AnimationColors.primary}
              colors={[AnimationColors.primary]}
            />
          ) : undefined
        }
      >
        {Object.entries(questsByType).map(([type, typeQuests]) => (
          <QuestSection
            key={type}
            type={type as QuestType}
            quests={typeQuests}
            onClaim={onClaimQuest}
            initialExpanded={type === 'daily'}
          />
        ))}

        {quests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyStateText}>No quests available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new challenges!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

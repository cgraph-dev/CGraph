/**
 * QuestsScreen - Mobile
 *
 * Quest management screen with daily, weekly, and special quests.
 * Users can view available quests, track progress, accept new quests,
 * and claim rewards for completed quests.
 *
 * Features:
 * - Tab-based quest filtering (Active, Daily, Weekly, Completed)
 * - Quest acceptance flow
 * - Progress tracking with objectives
 * - Reward claiming with haptic feedback
 * - Pull-to-refresh
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGamification } from '@/hooks/useGamification';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type QuestTab = 'active' | 'daily' | 'weekly' | 'completed';

interface QuestObjective {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

interface QuestReward {
  type: 'xp' | 'coins' | 'item' | 'title';
  amount: number;
  itemId?: string;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  expiresAt: string | null;
}

interface UserQuest {
  id: string;
  quest: Quest;
  accepted: boolean;
  progress: Record<string, number>;
  completed: boolean;
  claimed: boolean;
  acceptedAt: string;
  completedAt: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS: { id: QuestTab; name: string; icon: string }[] = [
  { id: 'active', name: 'Active', icon: 'play-circle' },
  { id: 'daily', name: 'Daily', icon: 'today' },
  { id: 'weekly', name: 'Weekly', icon: 'calendar' },
  { id: 'completed', name: 'Done', icon: 'checkmark-circle' },
];

const QUEST_TYPE_COLORS: Record<string, { primary: string; secondary: string }> = {
  daily: { primary: '#10b981', secondary: '#064e3b' },
  weekly: { primary: '#3b82f6', secondary: '#1e3a8a' },
  special: { primary: '#f59e0b', secondary: '#78350f' },
};

// ============================================================================
// QUEST CARD
// ============================================================================

interface QuestCardProps {
  userQuest: UserQuest;
  onAccept?: (questId: string) => void;
  onClaim?: (userQuestId: string) => void;
}

function QuestCard({ userQuest, onAccept, onClaim }: QuestCardProps) {
  const { quest, completed, claimed, accepted } = userQuest;
  const colors = QUEST_TYPE_COLORS[quest.type] || QUEST_TYPE_COLORS.daily;

  // Calculate overall progress
  const totalObjectives = quest.objectives.length;
  const completedObjectives = quest.objectives.filter((o) => o.completed).length;
  const progressPercent = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

  // Time remaining
  const timeRemaining = useMemo(() => {
    if (!quest.expiresAt) return null;
    const expires = new Date(quest.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  }, [quest.expiresAt]);

  const handleAction = () => {
    HapticFeedback.medium();
    if (!accepted && onAccept) {
      onAccept(quest.id);
    } else if (completed && !claimed && onClaim) {
      onClaim(userQuest.id);
    }
  };

  return (
    <View style={[styles.questCard, { borderColor: colors.primary + '40' }]}>
      <LinearGradient colors={[colors.secondary, '#1f2937']} style={styles.questGradient}>
        {/* Header */}
        <View style={styles.questHeader}>
          <View style={[styles.questTypeBadge, { backgroundColor: colors.primary + '30' }]}>
            <Text style={[styles.questTypeText, { color: colors.primary }]}>
              {quest.type.charAt(0).toUpperCase() + quest.type.slice(1)}
            </Text>
          </View>

          {timeRemaining && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={styles.timeText}>{timeRemaining}</Text>
            </View>
          )}
        </View>

        {/* Quest Name */}
        <Text style={styles.questName}>{quest.name}</Text>
        <Text style={styles.questDescription}>{quest.description}</Text>

        {/* Objectives */}
        <View style={styles.objectivesContainer}>
          {quest.objectives.map((objective, index) => (
            <View key={objective.id} style={styles.objectiveRow}>
              <View
                style={[
                  styles.objectiveCheck,
                  objective.completed && styles.objectiveCheckComplete,
                ]}
              >
                {objective.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text
                style={[styles.objectiveText, objective.completed && styles.objectiveTextComplete]}
              >
                {objective.description}
              </Text>
              <Text style={styles.objectiveProgress}>
                {objective.currentValue}/{objective.targetValue}
              </Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        {accepted && !completed && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
          </View>
        )}

        {/* Rewards */}
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsLabel}>Rewards:</Text>
          <View style={styles.rewardsRow}>
            {quest.rewards.map((reward, index) => (
              <View key={index} style={styles.rewardBadge}>
                {reward.type === 'xp' && <Ionicons name="sparkles" size={14} color="#8b5cf6" />}
                {reward.type === 'coins' && <Text style={{ fontSize: 14 }}>🪙</Text>}
                {reward.type === 'item' && <Ionicons name="gift" size={14} color="#f59e0b" />}
                {reward.type === 'title' && <Ionicons name="ribbon" size={14} color="#ec4899" />}
                <Text style={styles.rewardText}>
                  {reward.amount} {reward.type.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        {!accepted && onAccept && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleAction}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Accept Quest</Text>
          </TouchableOpacity>
        )}

        {completed && !claimed && onClaim && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
            onPress={handleAction}
          >
            <Ionicons name="gift" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Claim Rewards</Text>
          </TouchableOpacity>
        )}

        {claimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.claimedText}>Completed & Claimed</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

/**
 *
 */
export default function QuestsScreen() {
  const navigation = useNavigation();
  const {
    activeQuests,
    dailyQuests,
    weeklyQuests,
    refreshQuests,
    acceptQuest,
    claimQuestRewards,
    isLoading,
    stats,
  } = useGamification();

  const [activeTab, setActiveTab] = useState<QuestTab>('active');

  // Initial load
  useEffect(() => {
    refreshQuests();
  }, []);

  // Filtered quests based on tab
  const displayedQuests = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return activeQuests.filter((q) => q.accepted && !q.completed);
      case 'daily':
        return dailyQuests;
      case 'weekly':
        return weeklyQuests;
      case 'completed':
        return [...activeQuests, ...dailyQuests, ...weeklyQuests].filter((q) => q.completed);
      default:
        return [];
    }
  }, [activeTab, activeQuests, dailyQuests, weeklyQuests]);

  // Stats
  const totalActive = activeQuests.filter((q) => q.accepted && !q.completed).length;
  const totalCompleted = [...activeQuests, ...dailyQuests, ...weeklyQuests].filter(
    (q) => q.completed
  ).length;

  const handleAcceptQuest = useCallback(
    async (questId: string) => {
      try {
        await acceptQuest(questId);
        HapticFeedback.success();
        Alert.alert('Quest Accepted!', 'Good luck on your quest!');
      } catch (error) {
        HapticFeedback.error();
        Alert.alert('Error', 'Failed to accept quest. Please try again.');
      }
    },
    [acceptQuest]
  );

  const handleClaimRewards = useCallback(
    async (userQuestId: string) => {
      try {
        const success = await claimQuestRewards(userQuestId);
        if (success) {
          HapticFeedback.success();
          Alert.alert('Rewards Claimed!', 'Your rewards have been added to your account.');
        }
      } catch (error) {
        HapticFeedback.error();
        Alert.alert('Error', 'Failed to claim rewards. Please try again.');
      }
    },
    [claimQuestRewards]
  );

  const handleRefresh = useCallback(() => {
    HapticFeedback.light();
    refreshQuests();
  }, [refreshQuests]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1f2937', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quests</Text>
          <Text style={styles.headerSubtitle}>
            {totalActive} active • {totalCompleted} completed
          </Text>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.questCountBadge}>
            <Ionicons name="map" size={20} color="#10b981" />
            <Text style={styles.questCountText}>{totalActive}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              HapticFeedback.light();
              setActiveTab(tab.id);
            }}
          >
            <Ionicons
               
              name={tab.icon as string}
              size={18}
              color={activeTab === tab.id ? '#8b5cf6' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quest List */}
      <FlatList
        data={displayedQuests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuestCard userQuest={item} onAccept={handleAcceptQuest} onClaim={handleClaimRewards} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#4b5563" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'completed' ? 'No completed quests yet' : 'No quests available'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'completed'
                ? 'Complete quests to see them here'
                : 'Check back later for new quests'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerStats: {
    alignItems: 'center',
  },
  questCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  questCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#374151',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  questCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  questGradient: {
    padding: 16,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  questName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 20,
  },
  objectivesContainer: {
    backgroundColor: '#11182740',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  objectiveCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  objectiveCheckComplete: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
  },
  objectiveTextComplete: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  objectiveProgress: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  rewardsContainer: {
    marginBottom: 12,
  },
  rewardsLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  rewardText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  claimedText: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
    textAlign: 'center',
  },
});

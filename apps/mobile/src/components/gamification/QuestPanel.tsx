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
 * Quests drive engagement by giving users clear goals and tangible
 * rewards, creating a satisfying gameplay loop within the app.
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

export type QuestType = 'daily' | 'weekly' | 'special' | 'story';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'claimed' | 'locked';

export interface QuestReward {
  type: 'xp' | 'coins' | 'badge' | 'title' | 'item';
  amount?: number;
  id?: string;
  name?: string;
  icon?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  currentProgress: number;
  targetProgress: number;
  rewards: QuestReward[];
  expiresAt?: string;
  unlocksAt?: string;
  prerequisiteQuestId?: string;
  iconName: string;
}

interface QuestPanelProps {
  quests: Quest[];
  onClaimQuest: (questId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  showHeader?: boolean;
  maxHeight?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUEST_TYPE_CONFIG: Record<QuestType, {
  label: string;
  icon: string;
  colors: readonly [string, string];
  bgColor: string;
}> = {
  daily: {
    label: 'Daily',
    icon: 'sunny',
    colors: ['#f59e0b', '#d97706'] as const,
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  weekly: {
    label: 'Weekly',
    icon: 'calendar',
    colors: ['#3b82f6', '#2563eb'] as const,
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  special: {
    label: 'Special',
    icon: 'star',
    colors: ['#8b5cf6', '#7c3aed'] as const,
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  story: {
    label: 'Story',
    icon: 'book',
    colors: ['#ec4899', '#db2777'] as const,
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
};

const REWARD_ICONS: Record<string, string> = {
  xp: 'sparkles',
  coins: 'logo-bitcoin',
  badge: 'medal',
  title: 'ribbon',
  item: 'gift',
};

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

interface CountdownTimerProps {
  expiresAt: string;
  compact?: boolean;
}

function CountdownTimer({ expiresAt, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(hours < 1);

      if (compact) {
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, compact]);

  return (
    <View style={[styles.timerContainer, isUrgent && styles.timerUrgent]}>
      <Ionicons 
        name="time-outline" 
        size={12} 
        color={isUrgent ? '#ef4444' : '#9ca3af'} 
      />
      <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
        {timeLeft}
      </Text>
    </View>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface QuestProgressBarProps {
  current: number;
  target: number;
  colors: readonly [string, string, ...string[]];
}

function QuestProgressBar({ current, target, colors }: QuestProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percent,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.questProgressContainer}>
      <View style={styles.questProgressBar}>
        <Animated.View style={[styles.questProgressFill, { width: progressWidth }]}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.questProgressGradient}
          />
        </Animated.View>
      </View>
      <Text style={styles.questProgressText}>
        {current} / {target}
      </Text>
    </View>
  );
}

// ============================================================================
// REWARD BADGE
// ============================================================================

interface RewardBadgeProps {
  reward: QuestReward;
}

function RewardBadge({ reward }: RewardBadgeProps) {
  const icon = REWARD_ICONS[reward.type] || 'gift';
  
  return (
    <View style={styles.rewardBadge}>
      <Ionicons 
        name={icon as any} 
        size={12} 
        color={AnimationColors.primary} 
      />
      <Text style={styles.rewardText}>
        {reward.amount ? `+${reward.amount}` : ''} {reward.name || reward.type.toUpperCase()}
      </Text>
    </View>
  );
}

// ============================================================================
// QUEST CARD
// ============================================================================

interface QuestCardProps {
  quest: Quest;
  onClaim: (questId: string) => Promise<void>;
}

function QuestCard({ quest, onClaim }: QuestCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const claimAnim = useRef(new Animated.Value(0)).current;
  
  const config = QUEST_TYPE_CONFIG[quest.type];
  const isComplete = quest.currentProgress >= quest.targetProgress;
  const canClaim = isComplete && quest.status !== 'claimed';
  const isLocked = quest.status === 'locked';

  useEffect(() => {
    if (canClaim) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canClaim]);

  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;
    
    setIsClaiming(true);
    HapticFeedback.success();

    // Celebration animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onClaim(quest.id);
    } catch (error) {
      console.error('Failed to claim quest:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
            <Ionicons name={config.icon as any} size={14} color="#fff" />
          </LinearGradient>
          <Text style={[styles.questTypeLabel, { color: config.colors[0] }]}>
            {config.label}
          </Text>
        </View>

        {/* Quest Content */}
        <View style={styles.questContent}>
          <View style={styles.questHeader}>
            <View style={styles.questIconContainer}>
              <Ionicons 
                name={quest.iconName as any} 
                size={24} 
                color={isLocked ? '#6b7280' : config.colors[0]} 
              />
            </View>
            <View style={styles.questInfo}>
              <Text style={[styles.questTitle, isLocked && styles.textLocked]}>
                {quest.title}
              </Text>
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
            {quest.expiresAt && !isLocked && (
              <CountdownTimer expiresAt={quest.expiresAt} compact />
            )}

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

// ============================================================================
// QUEST SECTION
// ============================================================================

interface QuestSectionProps {
  type: QuestType;
  quests: Quest[];
  onClaim: (questId: string) => Promise<void>;
  initialExpanded?: boolean;
}

function QuestSection({ type, quests, onClaim, initialExpanded = true }: QuestSectionProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const heightAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;
  
  const config = QUEST_TYPE_CONFIG[type];
  const completedCount = quests.filter(q => q.status === 'claimed').length;

  const toggleExpanded = () => {
    HapticFeedback.light();
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue,
        tension: 100,
        friction: 15,
        useNativeDriver: false,
      }),
      Animated.spring(rotateAnim, {
        toValue,
        tension: 100,
        friction: 15,
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const containerHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, quests.length * 200], // Approximate height per quest
  });

  return (
    <View style={styles.questSection}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
        <View style={[styles.sectionHeader, { backgroundColor: config.bgColor }]}>
          <View style={styles.sectionHeaderLeft}>
            <LinearGradient
              colors={config.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIcon}
            >
              <Ionicons name={config.icon as any} size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>{config.label} Quests</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>
                {completedCount}/{quests.length}
              </Text>
            </View>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.sectionContent, { maxHeight: containerHeight }]}>
        {isExpanded && quests.map(quest => (
          <QuestCard key={quest.id} quest={quest} onClaim={onClaim} />
        ))}
      </Animated.View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuestPanel({
  quests,
  onClaimQuest,
  onRefresh,
  showHeader = true,
  maxHeight,
}: QuestPanelProps) {
  const [refreshing, setRefreshing] = useState(false);

  // Group quests by type
  const questsByType = quests.reduce<Record<QuestType, Quest[]>>((acc, quest) => {
    if (!acc[quest.type]) {
      acc[quest.type] = [];
    }
    acc[quest.type].push(quest);
    return acc;
  }, {} as Record<QuestType, Quest[]>);

  // Calculate overall progress
  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.status === 'claimed').length;
  const availableQuests = quests.filter(q => q.status !== 'claimed' && q.status !== 'locked').length;

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
                  { width: `${(completedQuests / totalQuests) * 100}%` }
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
            <Text style={styles.emptyStateSubtext}>
              Check back later for new challenges!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
  },
  headerStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: AnimationColors.primary,
  },
  headerStatLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  overallProgress: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  overallProgressBar: {
    height: 4,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: AnimationColors.primary,
    borderRadius: 2,
  },

  // Quest List
  questList: {
    flex: 1,
  },
  questListContent: {
    padding: 16,
    paddingTop: 0,
  },

  // Quest Section
  questSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionCount: {
    marginLeft: 8,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  sectionContent: {
    overflow: 'hidden',
    marginTop: 8,
  },

  // Quest Card
  questCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  questCardLocked: {
    opacity: 0.6,
  },
  questCardReady: {
    borderColor: AnimationColors.primary + '50',
    shadowColor: AnimationColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  questTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  questTypeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  questTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questContent: {
    padding: 12,
  },
  questHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
  },
  textLocked: {
    color: '#6b7280',
  },

  // Quest Progress
  questProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressGradient: {
    flex: 1,
  },
  questProgressText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },

  // Rewards
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: AnimationColors.primary,
  },

  // Quest Footer
  questFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  timerTextUrgent: {
    color: '#ef4444',
    fontWeight: '600',
  },
  lockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: {
    fontSize: 11,
    color: '#6b7280',
  },
  claimButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '600',
    color: AnimationColors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

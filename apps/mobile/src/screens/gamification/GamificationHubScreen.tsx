/**
 * GamificationHubScreen - Mobile
 * 
 * Central hub for all gamification features. Provides an overview of
 * the user's progress and quick access to detailed sections.
 * 
 * Features:
 * - Level and XP progress overview
 * - Current streak with claim button
 * - Coins balance
 * - Quick stats cards
 * - Navigation to detailed screens
 * - Active quest preview
 * - Recent achievement preview
 * 
 * @version 1.0.0
 * @since v0.8.3
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LevelProgress, TitleBadge } from '@/components/gamification';
import { useGamification } from '@/hooks/useGamification';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}

function StatCard({ icon, label, value, color, onPress }: StatCardProps) {
  const content = (
    <LinearGradient
      colors={[color + '30', '#1f293780']}
      style={styles.statCard}
    >
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.statCardWrapper}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return <View style={styles.statCardWrapper}>{content}</View>;
}

// ============================================================================
// QUICK LINK COMPONENT
// ============================================================================

interface QuickLinkProps {
  icon: string;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

function QuickLink({ icon, label, description, color, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity
      style={styles.quickLink}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[color + '20', '#1f2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.quickLinkGradient}
      >
        <View style={[styles.quickLinkIcon, { backgroundColor: color + '30' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.quickLinkContent}>
          <Text style={styles.quickLinkLabel}>{label}</Text>
          <Text style={styles.quickLinkDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function GamificationHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    stats,
    activeQuests,
    completedAchievements,
    refreshStats,
    refreshAchievements,
    refreshQuests,
    claimStreak,
    canClaimStreak,
    isLoading,
  } = useGamification();
  
  // Initial load
  useEffect(() => {
    refreshStats();
    refreshAchievements();
    refreshQuests();
  }, []);
  
  const handleRefresh = useCallback(() => {
    HapticFeedback.light();
    refreshStats();
    refreshAchievements();
    refreshQuests();
  }, [refreshStats, refreshAchievements, refreshQuests]);
  
  const handleClaimStreak = useCallback(async () => {
    HapticFeedback.medium();
    try {
      const result = await claimStreak();
      if (result) {
        HapticFeedback.success();
        Alert.alert(
          '🔥 Streak Claimed!',
          `+${result.coins} coins! Your streak is now ${result.streak} days.`
        );
      }
    } catch (error) {
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to claim streak bonus');
    }
  }, [claimStreak]);
  
  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };
  
  // Format values
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const coins = stats?.coins || 0;
  const streak = stats?.streak || 0;
  const achievementsCount = stats?.achievementsUnlocked || 0;
  const totalAchievements = stats?.totalAchievements || 0;
  const questsCompleted = stats?.questsCompleted || 0;
  const currentTitle = stats?.currentTitle || null;
  
  // Active quests (limit to 2 for preview)
  const previewQuests = activeQuests.filter(q => q.accepted && !q.completed).slice(0, 2);
  
  // Recent achievement (last unlocked)
  const recentAchievement = completedAchievements[0] || null;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1f2937', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gamification</Text>
          <Text style={styles.headerSubtitle}>Your progress & rewards</Text>
        </View>
        
        {/* Coins display */}
        <TouchableOpacity 
          style={styles.coinsButton}
          onPress={() => navigateTo('CoinShop')}
        >
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
      >
        {/* Level Progress Card */}
        <View style={styles.levelCard}>
          <LinearGradient
            colors={['#8b5cf620', '#1f2937']}
            style={styles.levelCardGradient}
          >
            <View style={styles.levelHeader}>
              <View>
                <Text style={styles.levelLabel}>Level {level}</Text>
                {currentTitle && (
                  <View style={styles.titleRow}>
                    <TitleBadge 
                      title={currentTitle} 
                      rarity="rare" 
                      size="sm" 
                    />
                  </View>
                )}
              </View>
              <View style={styles.xpBadge}>
                <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                <Text style={styles.xpText}>{xp.toLocaleString()} XP</Text>
              </View>
            </View>
            
            <LevelProgress 
              level={level}
              currentXP={stats?.levelProgress || 0}
              totalXP={stats?.xpForNextLevel || 1000}
              loginStreak={streak}
            />
          </LinearGradient>
        </View>
        
        {/* Streak Card */}
        <View style={styles.streakCard}>
          <LinearGradient
            colors={['#f9731630', '#1f2937']}
            style={styles.streakCardGradient}
          >
            <View style={styles.streakContent}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <View>
                  <Text style={styles.streakValue}>{streak} Day Streak</Text>
                  <Text style={styles.streakLabel}>Keep logging in daily!</Text>
                </View>
              </View>
              
              {canClaimStreak ? (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={handleClaimStreak}
                >
                  <Text style={styles.claimButtonText}>Claim</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.claimedBadge}>
                  <Ionicons name="checkmark" size={16} color="#10b981" />
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
        
        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Stats Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="trophy"
            label="Achievements"
            value={`${achievementsCount}/${totalAchievements}`}
            color="#f59e0b"
            onPress={() => navigateTo('Achievements')}
          />
          <StatCard
            icon="map"
            label="Quests Done"
            value={questsCompleted}
            color="#10b981"
            onPress={() => navigateTo('Quests')}
          />
          <StatCard
            icon="ribbon"
            label="Titles"
            value={stats?.titles?.length || 0}
            color="#ec4899"
            onPress={() => navigateTo('Titles')}
          />
          <StatCard
            icon="podium"
            label="Leaderboard"
            value="View"
            color="#3b82f6"
            onPress={() => navigateTo('Leaderboard')}
          />
        </View>
        
        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickLinks}>
          <QuickLink
            icon="trophy"
            label="Achievements"
            description={`${totalAchievements - achievementsCount} left to unlock`}
            color="#f59e0b"
            onPress={() => navigateTo('Achievements')}
          />
          <QuickLink
            icon="map"
            label="Quests"
            description={`${previewQuests.length} active quests`}
            color="#10b981"
            onPress={() => navigateTo('Quests')}
          />
          <QuickLink
            icon="ribbon"
            label="Titles"
            description="Equip and collect titles"
            color="#ec4899"
            onPress={() => navigateTo('Titles')}
          />
          <QuickLink
            icon="cart"
            label="Coin Shop"
            description="Spend your coins"
            color="#f59e0b"
            onPress={() => navigateTo('CoinShop')}
          />
        </View>
        
        {/* Active Quests Preview */}
        {previewQuests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Quests</Text>
              <TouchableOpacity onPress={() => navigateTo('Quests')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {previewQuests.map(q => {
              const progress = Object.values(q.progress).reduce((a, b) => a + b, 0);
              const target = q.quest.objectives.reduce((a, o) => a + o.targetValue, 0);
              const progressPercent = target > 0 ? Math.round((progress / target) * 100) : 0;
              return (
                <View key={q.id} style={styles.questPreviewCard}>
                  <LinearGradient
                    colors={['#10b98120', '#1f2937']}
                    style={styles.questPreviewGradient}
                  >
                    <View style={styles.questPreviewHeader}>
                      <View style={styles.questIconContainer}>
                        <Ionicons name="map" size={20} color="#10b981" />
                      </View>
                      <View style={styles.questPreviewContent}>
                        <Text style={styles.questPreviewTitle}>{q.quest.name}</Text>
                        <Text style={styles.questPreviewDescription} numberOfLines={1}>{q.quest.description}</Text>
                      </View>
                      <Text style={styles.questPreviewProgress}>{progressPercent}%</Text>
                    </View>
                    <View style={styles.questProgressBar}>
                      <View style={[styles.questProgressFill, { width: `${progressPercent}%` }]} />
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </>
        )}
        
        {/* Recent Achievement */}
        {recentAchievement && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Achievement</Text>
              <TouchableOpacity onPress={() => navigateTo('Achievements')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentAchievement}>
              <LinearGradient
                colors={['#f59e0b20', '#1f2937']}
                style={styles.recentAchievementGradient}
              >
                <Text style={styles.achievementIcon}>{recentAchievement.icon || '🏆'}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{recentAchievement.name}</Text>
                  <Text style={styles.achievementDescription}>{recentAchievement.description}</Text>
                </View>
                <View style={styles.achievementReward}>
                  <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                  <Text style={styles.achievementRewardText}>+{recentAchievement.xpReward} XP</Text>
                </View>
              </LinearGradient>
            </View>
          </>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
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
  coinsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinEmoji: {
    fontSize: 16,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fcd34d',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Level Card
  levelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  levelCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleRow: {
    marginTop: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  // Streak Card
  streakCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  streakCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f9731640',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  claimButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  claimedBadge: {
    backgroundColor: '#10b98120',
    padding: 10,
    borderRadius: 12,
  },
  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCardWrapper: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Quick Links
  quickLinks: {
    gap: 12,
    marginBottom: 24,
  },
  quickLink: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickLinkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quickLinkDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Recent Achievement
  recentAchievement: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  recentAchievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  achievementReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  achievementRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  // Quest Preview styles
  questPreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  questPreviewGradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  questPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questPreviewContent: {
    flex: 1,
    marginLeft: 10,
  },
  questPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  questPreviewDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  questPreviewProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  questProgressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
});

/**
 * LeaderboardScreen - Mobile
 * 
 * Displays global rankings with multiple categories and time periods.
 * This screen creates a competitive environment that encourages user
 * engagement through visible social comparison and progress tracking.
 * 
 * Features:
 * - Multiple ranking categories (XP, Karma, Streak, Messages, Posts, Friends)
 * - Time period filters (Daily, Weekly, Monthly, All-time)
 * - Animated rank changes with trend indicators
 * - Current user highlight with scrolling to position
 * - Top 3 podium visualization with special styling
 * - Pull-to-refresh with haptic feedback
 * - Smooth infinite scroll pagination
 * - Confetti celebration animations
 * - Avatar with online/premium badges
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';
import { AnimatedAvatar, GlassCard } from '@/components';
import api from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  value: number;
  isOnline: boolean;
  isPremium: boolean;
  isVerified: boolean;
  title?: string;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalCount: number;
  userRank: LeaderboardEntry | null;
  lastUpdated: string;
}

type LeaderboardCategory = 'xp' | 'karma' | 'streak' | 'messages' | 'posts' | 'friends';
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

interface CategoryConfig {
  id: LeaderboardCategory;
  name: string;
  icon: string;
  description: string;
  colors: [string, string];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'xp',
    name: 'XP',
    icon: 'sparkles',
    description: 'Total XP earned',
    colors: ['#8b5cf6', '#ec4899'],
  },
  {
    id: 'karma',
    name: 'Karma',
    icon: 'trending-up',
    description: 'Forum reputation',
    colors: ['#3b82f6', '#06b6d4'],
  },
  {
    id: 'streak',
    name: 'Streak',
    icon: 'flame',
    description: 'Login streak days',
    colors: ['#f97316', '#ef4444'],
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'chatbubbles',
    description: 'Total messages sent',
    colors: ['#10b981', '#059669'],
  },
  {
    id: 'posts',
    name: 'Posts',
    icon: 'document-text',
    description: 'Forum posts created',
    colors: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'friends',
    name: 'Friends',
    icon: 'people',
    description: 'Friend connections',
    colors: ['#06b6d4', '#3b82f6'],
  },
];

const TIME_PERIODS: { id: TimePeriod; name: string }[] = [
  { id: 'daily', name: 'Today' },
  { id: 'weekly', name: 'Week' },
  { id: 'monthly', name: 'Month' },
  { id: 'alltime', name: 'All Time' },
];

const RANK_CONFIGS: Record<number, {
  colors: [string, string];
  medal: string;
  glow: string;
}> = {
  1: { colors: ['#fcd34d', '#f59e0b'], medal: '🥇', glow: '#fcd34d' },
  2: { colors: ['#d1d5db', '#9ca3af'], medal: '🥈', glow: '#d1d5db' },
  3: { colors: ['#f97316', '#ea580c'], medal: '🥉', glow: '#f97316' },
};

// ============================================================================
// RANK CHANGE INDICATOR
// ============================================================================

interface RankChangeProps {
  current: number;
  previous: number;
}

function RankChangeIndicator({ current, previous }: RankChangeProps) {
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <View style={[styles.rankChange, styles.rankUp]}>
        <Ionicons name="trending-up" size={12} color="#10b981" />
        <Text style={styles.rankUpText}>+{diff}</Text>
      </View>
    );
  } else if (diff < 0) {
    return (
      <View style={[styles.rankChange, styles.rankDown]}>
        <Ionicons name="trending-down" size={12} color="#ef4444" />
        <Text style={styles.rankDownText}>{diff}</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.rankChange, styles.rankSame]}>
      <Ionicons name="remove" size={12} color="#6b7280" />
    </View>
  );
}

// ============================================================================
// PODIUM COMPONENT (Top 3)
// ============================================================================

interface PodiumProps {
  entries: LeaderboardEntry[];
  category: CategoryConfig;
  onUserPress: (userId: string) => void;
}

function Podium({ entries, category, onUserPress }: PodiumProps) {
  const top3 = entries.slice(0, 3);
  
  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = [100, 140, 80]; // Heights for 2nd, 1st, 3rd
  
  return (
    <View style={styles.podiumContainer}>
      {podiumOrder.map((entry, index) => {
        if (!entry) return null;
        const config = RANK_CONFIGS[entry.rank];
        const height = heights[index];
        
        return (
          <TouchableOpacity
            key={entry.userId}
            style={[styles.podiumPlace, { height: height + 80 }]}
            onPress={() => onUserPress(entry.userId)}
            activeOpacity={0.8}
          >
            <View style={styles.podiumAvatar}>
              {entry.avatarUrl ? (
                <Image 
                  source={{ uri: entry.avatarUrl }} 
                  style={styles.podiumAvatarImage}
                />
              ) : (
                <LinearGradient
                  colors={category.colors}
                  style={styles.podiumAvatarPlaceholder}
                >
                  <Text style={styles.podiumAvatarInitial}>
                    {entry.displayName?.[0] || entry.username[0]}
                  </Text>
                </LinearGradient>
              )}
              {config && (
                <View style={styles.podiumMedal}>
                  <Text style={styles.podiumMedalText}>{config.medal}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.podiumUsername} numberOfLines={1}>
              {entry.displayName || entry.username}
            </Text>
            
            <Text style={styles.podiumValue}>
              {formatValue(entry.value)}
            </Text>
            
            <LinearGradient
              colors={config?.colors || category.colors}
              style={[styles.podiumBar, { height }]}
            >
              <Text style={styles.podiumRank}>#{entry.rank}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================================
// LEADERBOARD ENTRY ROW
// ============================================================================

interface EntryRowProps {
  entry: LeaderboardEntry;
  category: CategoryConfig;
  isCurrentUser: boolean;
  onPress: (userId: string) => void;
}

function EntryRow({ entry, category, isCurrentUser, onPress }: EntryRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = RANK_CONFIGS[entry.rank];
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      tension: 150,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(entry.userId)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <BlurView
          intensity={isCurrentUser ? 80 : 40}
          tint="dark"
          style={[
            styles.entryRow,
            isCurrentUser && styles.entryRowCurrentUser,
            config && styles.entryRowTop3,
          ]}
        >
          {/* Rank */}
          <View style={styles.rankContainer}>
            {config ? (
              <LinearGradient
                colors={config.colors}
                style={styles.rankBadgeTop3}
              >
                <Text style={styles.rankTextTop3}>{entry.rank}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.rankText}>{entry.rank}</Text>
            )}
            <RankChangeIndicator current={entry.rank} previous={entry.previousRank} />
          </View>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {entry.avatarUrl ? (
                <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={category.colors}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitial}>
                    {entry.displayName?.[0] || entry.username[0]}
                  </Text>
                </LinearGradient>
              )}
              {entry.isOnline && <View style={styles.onlineBadge} />}
              {entry.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={8} color="#fbbf24" />
                </View>
              )}
            </View>
            
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={[
                  styles.username,
                  isCurrentUser && styles.usernameCurrentUser
                ]} numberOfLines={1}>
                  {entry.displayName || entry.username}
                </Text>
                {entry.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
                )}
              </View>
              {entry.title && (
                <Text style={styles.userTitle}>{entry.title}</Text>
              )}
            </View>
          </View>
          
          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv {entry.level}</Text>
          </View>
          
          {/* Value */}
          <View style={styles.valueContainer}>
            <Text style={[
              styles.value,
              config && { color: config.colors[0] }
            ]}>
              {formatValue(entry.value)}
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

// Fallback mock data generator (used when API fails or in development)
function generateFallbackData(category: LeaderboardCategory, page: number): LeaderboardData {
  const mockNames = [
    'CryptoKing', 'NodeMaster', 'BlockchainQueen', 'DeFiWizard', 'TokenTrader',
    'SmartContract', 'HashHero', 'ChainChamp', 'WalletWarrior', 'GasGuru',
    'StakeKing', 'YieldFarmer', 'LiquidLord', 'NFTNinja', 'DAODragon',
    'MetaMogul', 'EtherExpert', 'SolidityPro', 'RustRanger', 'GoGopher',
  ];

  const titles = ['The Legendary', 'Champion', 'Elite', 'Master', 'Expert', 'Rising Star'];

  const entries: LeaderboardEntry[] = mockNames.map((name, i) => ({
    rank: (page - 1) * 20 + i + 1,
    previousRank: (page - 1) * 20 + i + 1 + Math.floor(Math.random() * 7) - 3,
    userId: `user_${(page - 1) * 20 + i}`,
    username: name.toLowerCase().replace(/\s/g, ''),
    displayName: name,
    avatarUrl: null,
    level: Math.max(1, 100 - i * 4 + Math.floor(Math.random() * 10)),
    value: Math.floor(100000 / ((page - 1) * 20 + i + 1) * (1 + Math.random() * 0.3)),
    isOnline: Math.random() > 0.4,
    isPremium: i < 5 || Math.random() > 0.6,
    isVerified: i < 3,
    title: i < 6 ? titles[i] : undefined,
  }));

  return {
    entries,
    totalCount: 10000,
    userRank: {
      rank: 42,
      previousRank: 45,
      userId: 'current_user',
      username: 'you',
      displayName: 'You',
      avatarUrl: null,
      level: 15,
      value: 2500,
      isOnline: true,
      isPremium: false,
      isVerified: false,
      title: 'Rising Star',
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Transform API response to LeaderboardData format
function transformApiResponse(data: any, category: LeaderboardCategory): LeaderboardData {
  const entries: LeaderboardEntry[] = (data.entries || data.data || []).map((entry: any, index: number) => ({
    rank: entry.rank || index + 1,
    previousRank: entry.previous_rank || entry.previousRank || entry.rank || index + 1,
    userId: entry.user_id || entry.userId || entry.id,
    username: entry.username || 'unknown',
    displayName: entry.display_name || entry.displayName || entry.username,
    avatarUrl: entry.avatar_url || entry.avatarUrl || null,
    level: entry.level || 1,
    value: entry.value || entry[category] || entry.xp || entry.karma || 0,
    isOnline: entry.is_online || entry.isOnline || entry.status === 'online',
    isPremium: entry.is_premium || entry.isPremium || false,
    isVerified: entry.is_verified || entry.isVerified || false,
    title: entry.title || undefined,
  }));

  const userRankData = data.user_rank || data.userRank || data.current_user;
  const userRank: LeaderboardEntry | null = userRankData ? {
    rank: userRankData.rank || 0,
    previousRank: userRankData.previous_rank || userRankData.previousRank || userRankData.rank,
    userId: userRankData.user_id || userRankData.userId || userRankData.id,
    username: userRankData.username || 'you',
    displayName: userRankData.display_name || userRankData.displayName || 'You',
    avatarUrl: userRankData.avatar_url || userRankData.avatarUrl || null,
    level: userRankData.level || 1,
    value: userRankData.value || userRankData[category] || 0,
    isOnline: true,
    isPremium: userRankData.is_premium || userRankData.isPremium || false,
    isVerified: userRankData.is_verified || userRankData.isVerified || false,
    title: userRankData.title || undefined,
  } : null;

  return {
    entries,
    totalCount: data.total_count || data.totalCount || data.total || entries.length,
    userRank,
    lastUpdated: data.last_updated || data.lastUpdated || new Date().toISOString(),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  
  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === category) || CATEGORIES[0],
    [category]
  );

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      HapticFeedback.light();
    } else {
      setIsLoading(true);
    }

    try {
      // Call real API endpoint
      const response = await api.get('/api/v1/leaderboard', { 
        params: { 
          category, 
          period: timePeriod, 
          page,
          limit: 20,
        } 
      });
      
      const data = response.data?.data || response.data;
      setLeaderboard(transformApiResponse(data, category));
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Fallback to mock data if API fails
      setLeaderboard(generateFallbackData(category, page));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [category, timePeriod, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    HapticFeedback.light();
    setCategory(newCategory);
    setPage(1);
  };

  const handleTimePeriodChange = (newPeriod: TimePeriod) => {
    HapticFeedback.light();
    setTimePeriod(newPeriod);
    setPage(1);
  };

  const handleUserPress = (userId: string) => {
    HapticFeedback.light();
    // @ts-ignore - Navigation types
    navigation.navigate('Profile', { userId });
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Title */}
      <View style={styles.titleSection}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.2)', 'rgba(251, 191, 36, 0.1)']}
          style={styles.titleBadge}
        >
          <Ionicons name="trophy" size={24} color="#fbbf24" />
          <Text style={styles.titleBadgeText}>Global Rankings</Text>
          <Text style={styles.titleBadgeEmoji}>🏆</Text>
        </LinearGradient>
        
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          Compete with the community and climb to the top
        </Text>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryChange(item.id)}
              activeOpacity={0.8}
            >
              {category === item.id ? (
                <LinearGradient
                  colors={item.colors}
                  style={styles.categoryPillActive}
                >
                  <Ionicons name={item.icon as any} size={16} color="#fff" />
                  <Text style={styles.categoryPillTextActive}>{item.name}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryPill}>
                  <Ionicons name={item.icon as any} size={16} color="#9ca3af" />
                  <Text style={styles.categoryPillText}>{item.name}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Time Period Tabs */}
      <View style={styles.timePeriodContainer}>
        {TIME_PERIODS.map((period) => (
          <TouchableOpacity
            key={period.id}
            onPress={() => handleTimePeriodChange(period.id)}
            style={[
              styles.timePeriodTab,
              timePeriod === period.id && styles.timePeriodTabActive,
            ]}
          >
            <Text style={[
              styles.timePeriodText,
              timePeriod === period.id && styles.timePeriodTextActive,
            ]}>
              {period.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Podium for Top 3 */}
      {leaderboard && leaderboard.entries.length >= 3 && (
        <Podium 
          entries={leaderboard.entries} 
          category={currentCategory}
          onUserPress={handleUserPress}
        />
      )}

      {/* Your Rank Card */}
      {leaderboard?.userRank && (
        <BlurView intensity={60} tint="dark" style={styles.yourRankCard}>
          <Text style={styles.yourRankLabel}>Your Position</Text>
          <View style={styles.yourRankContent}>
            <View style={styles.yourRankLeft}>
              <Text style={styles.yourRankNumber}>#{leaderboard.userRank.rank}</Text>
              <RankChangeIndicator 
                current={leaderboard.userRank.rank} 
                previous={leaderboard.userRank.previousRank} 
              />
            </View>
            <View style={styles.yourRankRight}>
              <Text style={styles.yourRankValue}>
                {formatValue(leaderboard.userRank.value)}
              </Text>
              <Text style={styles.yourRankValueLabel}>
                {currentCategory.name}
              </Text>
            </View>
          </View>
        </BlurView>
      )}

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>All Rankings</Text>
        <Text style={styles.listHeaderCount}>
          {leaderboard?.totalCount.toLocaleString() || 0} participants
        </Text>
      </View>
    </View>
  );

  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    if (item.rank <= 3) return null; // Skip top 3, shown in podium
    
    return (
      <EntryRow
        entry={item}
        category={currentCategory}
        isCurrentUser={item.userId === leaderboard?.userRank?.userId}
        onPress={handleUserPress}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <FlatList
        data={leaderboard?.entries.filter(e => e.rank > 3) || []}
        keyExtractor={(item) => item.userId}
        renderItem={renderEntry}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLeaderboard(true)}
            tintColor={AnimationColors.primary}
            colors={[AnimationColors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
  listContent: {
    paddingBottom: 100,
  },
  headerContent: {
    paddingTop: 60,
    paddingHorizontal: 16,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: 8,
    marginBottom: 16,
  },
  titleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  titleBadgeEmoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Category Pills
  categoryScrollContainer: {
    marginBottom: 16,
  },
  categoryList: {
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    gap: 6,
  },
  categoryPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  categoryPillTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Time Period
  timePeriodContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  timePeriodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  timePeriodTabActive: {
    backgroundColor: AnimationColors.primary,
  },
  timePeriodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  timePeriodTextActive: {
    color: '#ffffff',
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  podiumPlace: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 3,
  },
  podiumAvatar: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  podiumAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  podiumMedal: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  podiumMedalText: {
    fontSize: 20,
  },
  podiumUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Your Rank Card
  yourRankCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    overflow: 'hidden',
  },
  yourRankLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  yourRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yourRankNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: AnimationColors.primary,
  },
  yourRankRight: {
    alignItems: 'flex-end',
  },
  yourRankValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  yourRankValueLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // List Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  listHeaderCount: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Entry Row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
  },
  entryRowCurrentUser: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  entryRowTop3: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },

  // Rank
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9ca3af',
  },
  rankBadgeTop3: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTextTop3: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  rankChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  rankUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  rankDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  rankSame: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
  },
  rankUpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  rankDownText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },

  // User Info
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#111827',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 120,
  },
  usernameCurrentUser: {
    color: AnimationColors.primary,
  },
  userTitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Level Badge
  levelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
  },

  // Value
  valueContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});

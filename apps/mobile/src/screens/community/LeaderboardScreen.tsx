/**
 * LeaderboardScreen - Revolutionary Animated Leaderboard
 * Features:
 * - Animated 3D-style podium for top 3
 * - Particle effects background
 * - Category filters (XP, Karma, Streak, Messages, Posts, Connections)
 * - Time period filters (Daily, Weekly, Monthly, All-time)
 * - Animated rank change indicators
 * - Pull to refresh with haptics
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { getValidImageUrl } from '../../lib/imageUtils';
import { UserCardSkeleton } from '../../components/Skeleton';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import GlassCard from '../../components/ui/GlassCard';
import api from '../../lib/api';
import { FriendsStackParamList } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<FriendsStackParamList, 'Leaderboard'>;
};

type LeaderboardCategory = 'karma' | 'xp' | 'streak' | 'messages' | 'posts';
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

interface LeaderboardUser {
  rank: number;
  previousRank?: number;
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  karma: number;
  level?: number;
  is_verified?: boolean;
  is_premium?: boolean;
}

interface LeaderboardMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

const CATEGORIES: { key: LeaderboardCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'karma', label: 'Karma', icon: 'heart', color: '#ec4899' },
  { key: 'xp', label: 'XP', icon: 'star', color: '#f59e0b' },
  { key: 'streak', label: 'Streak', icon: 'flame', color: '#ef4444' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble', color: '#3b82f6' },
  { key: 'posts', label: 'Posts', icon: 'document-text', color: '#10b981' },
];

const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <LinearGradient colors={['#fbbf24', '#f59e0b']} style={[styles.rankBadge, styles.rankGold]}>
        <Ionicons name="trophy" size={18} color="#fff" />
      </LinearGradient>
    );
  }
  if (rank === 2) {
    return (
      <LinearGradient colors={['#9ca3af', '#6b7280']} style={[styles.rankBadge, styles.rankSilver]}>
        <Text style={styles.rankText}>2</Text>
      </LinearGradient>
    );
  }
  if (rank === 3) {
    return (
      <LinearGradient colors={['#d97706', '#b45309']} style={[styles.rankBadge, styles.rankBronze]}>
        <Text style={styles.rankText}>3</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.rankBadge, styles.rankDefault]}>
      <Text style={styles.rankTextSmall}>#{rank}</Text>
    </View>
  );
}

function RankChangeIndicator({ current, previous }: { current: number; previous?: number }) {
  if (!previous || current === previous) return null;

  const change = previous - current;
  const isUp = change > 0;

  return (
    <View style={styles.rankChangeContainer}>
      <Ionicons
        name={isUp ? 'caret-up' : 'caret-down'}
        size={12}
        color={isUp ? '#10b981' : '#ef4444'}
      />
      <Text style={[styles.rankChangeText, { color: isUp ? '#10b981' : '#ef4444' }]}>
        {Math.abs(change)}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<LeaderboardCategory>('karma');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const podiumAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Podium animations (staggered)
    setTimeout(() => {
      Animated.stagger(200, [
        Animated.spring(podiumAnims[1], {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(podiumAnims[0], {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(podiumAnims[2], {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  }, []);

  const fetchLeaderboard = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }

      const response = await api.get('/api/v1/users/leaderboard', {
        params: { page: pageNum, limit: 25, category, period: timePeriod }
      });

      const data = response.data?.data || [];
      const metaData = response.data?.meta || {};

      if (pageNum === 1) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }

      setMeta({
        page: metaData.page || pageNum,
        per_page: metaData.per_page || 25,
        total: metaData.total || data.length,
        total_pages: metaData.total_pages || 1,
      });
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [category, timePeriod]);

  useEffect(() => {
    fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  const onRefresh = () => fetchLeaderboard(1, true);

  const loadMore = () => {
    if (meta && page < meta.total_pages && !isLoading) {
      fetchLeaderboard(page + 1);
    }
  };

  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    if (newCategory !== category) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCategory(newCategory);
    }
  };

  const handleTimePeriodChange = (newPeriod: TimePeriod) => {
    if (newPeriod !== timePeriod) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimePeriod(newPeriod);
    }
  };

  const getCategoryColor = () => {
    return CATEGORIES.find(c => c.key === category)?.color || '#10b981';
  };

  const renderUser = ({ item, index }: { item: LeaderboardUser; index: number }) => {
    const isTopThree = item.rank <= 3;

    // Staggered animation for list items
    const itemAnim = new Animated.Value(0);
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 30,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={{
          opacity: itemAnim,
          transform: [
            {
              translateX: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[
            styles.userCard,
            { backgroundColor: colors.surface },
            isTopThree && [styles.userCardHighlight, { borderColor: getCategoryColor() + '40' }],
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('UserProfile', { userId: item.id });
          }}
        >
          <View style={styles.rankWrapper}>
            <RankBadge rank={item.rank} />
            <RankChangeIndicator current={item.rank} previous={item.previousRank} />
          </View>

          {item.is_premium || isTopThree ? (
            <AnimatedAvatar
              source={
                getValidImageUrl(item.avatar_url)
                  ? { uri: getValidImageUrl(item.avatar_url)! }
                  : require('../../assets/default-avatar.png')
              }
              size={44}
              borderAnimation={isTopThree ? (item.rank === 1 ? 'rainbow' : 'gradient') : 'glow'}
              shape="circle"
              levelBadge={item.level}
              isPremium={item.is_premium}
            />
          ) : getValidImageUrl(item.avatar_url) ? (
            <Image source={{ uri: getValidImageUrl(item.avatar_url)! }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {(item.display_name || item.username || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
                {item.display_name || item.username || 'Anonymous'}
              </Text>
              {item.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              )}
              {item.is_premium && (
                <Ionicons name="star" size={14} color="#f59e0b" />
              )}
            </View>
            <Text style={[styles.username, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
          </View>

          <View style={[styles.karmaBadge, { backgroundColor: getCategoryColor() + '20' }]}>
            <Ionicons name={CATEGORIES.find(c => c.key === category)?.icon || 'trophy'} size={14} color={getCategoryColor()} />
            <Text style={[styles.karmaText, { color: getCategoryColor() }]}>
              {formatKarma(item.karma)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPodium = () => {
    const top3 = users.slice(0, 3);
    if (top3.length < 3) return null;

    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

    return (
      <View style={styles.podiumContainer}>
        <View style={styles.podiumRow}>
          {podiumOrder.map((index, position) => {
            const user = top3[index];
            if (!user) return null;

            const podiumHeight = [160, 120, 100][index];
            const avatarSize = [80, 64, 56][index];

            const translateY = podiumAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            });

            const scale = podiumAnims[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.5, 1.1, 1],
            });

            return (
              <Animated.View
                key={user.id}
                style={[
                  styles.podiumItem,
                  {
                    transform: [{ translateY }, { scale }],
                    opacity: podiumAnims[index],
                  },
                ]}
              >
                {/* Crown for #1 */}
                {index === 0 && <Text style={styles.crown}>👑</Text>}

                <AnimatedAvatar
                  source={
                    getValidImageUrl(user.avatar_url)
                      ? { uri: getValidImageUrl(user.avatar_url)! }
                      : require('../../assets/default-avatar.png')
                  }
                  size={avatarSize}
                  borderAnimation={index === 0 ? 'rainbow' : index === 1 ? 'glow' : 'gradient'}
                  shape="circle"
                  particleEffect={index === 0 ? 'sparkles' : 'none'}
                  levelBadge={user.level}
                  isPremium={user.is_premium}
                />

                <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                  {user.display_name || user.username}
                </Text>

                <Text style={[styles.podiumValue, { color: getCategoryColor() }]}>
                  {formatKarma(user.karma)}
                </Text>

                <View style={[styles.podiumBase, { height: podiumHeight }]}>
                  <LinearGradient
                    colors={[
                      index === 0 ? '#fbbf24' : index === 1 ? '#6b7280' : '#d97706',
                      index === 0 ? '#f59e0b' : index === 1 ? '#4b5563' : '#b45309',
                    ]}
                    style={styles.podiumGradient}
                  >
                    <Text style={styles.podiumRank}>{['1st', '2nd', '3rd'][index]}</Text>
                    <Text style={styles.podiumBadge}>{['🏆', '🥈', '🥉'][index]}</Text>
                  </LinearGradient>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>

      {/* Time Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timePeriodContainer}
      >
        {TIME_PERIODS.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.timePeriodTab,
              { backgroundColor: colors.surface },
              timePeriod === period.key && { backgroundColor: getCategoryColor() + '30' },
            ]}
            onPress={() => handleTimePeriodChange(period.key)}
          >
            <Text
              style={[
                styles.timePeriodText,
                { color: colors.textSecondary },
                timePeriod === period.key && { color: getCategoryColor() },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              { backgroundColor: colors.surface },
              category === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color },
            ]}
            onPress={() => handleCategoryChange(cat.key)}
          >
            <Ionicons
              name={cat.icon}
              size={18}
              color={category === cat.key ? cat.color : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryText,
                { color: colors.textSecondary },
                category === cat.key && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Podium for Top 3 */}
      {renderPodium()}

      <Text style={[styles.listHeader, { color: colors.text }]}>Rankings</Text>
    </Animated.View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <UserCardSkeleton key={i} />
      ))}
    </View>
  );

  if (isLoading && users.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        {renderSkeleton()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              👥 No users yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Be the first to earn karma!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Time Period
  timePeriodContainer: {
    paddingBottom: 12,
    gap: 8,
  },
  timePeriodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timePeriodText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Categories
  categoryContainer: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Podium
  podiumContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  crown: {
    fontSize: 28,
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    maxWidth: 90,
    textAlign: 'center',
  },
  podiumValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },
  podiumBase: {
    width: SCREEN_WIDTH / 3.5,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  podiumGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  podiumBadge: {
    fontSize: 24,
    marginTop: 4,
  },

  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },

  // Rank change indicator
  rankChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rankChangeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rankWrapper: {
    alignItems: 'center',
    marginRight: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  userCardHighlight: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankGold: {
    backgroundColor: '#F59E0B',
  },
  rankSilver: {
    backgroundColor: '#9CA3AF',
  },
  rankBronze: {
    backgroundColor: '#D97706',
  },
  rankDefault: {
    backgroundColor: '#374151',
  },
  rankText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rankTextSmall: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  karmaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});

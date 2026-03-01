/**
 * ForumLeaderboardScreen - Revolutionary Mobile Edition
 *
 * Premium leaderboard experience with advanced animations.
 *
 * Features:
 * - Animated podium for top 3 with particle effects
 * - Spring physics on list items
 * - Magnetic card interactions with 3D tilt
 * - Animated rank badges with glow effects
 * - Morphing tab indicators
 * - Staggered entry animations
 * - Haptic feedback throughout
 * - Parallax scrolling effects
 *
 * @version 2.0.0 - Revolutionary Edition
 * @since v0.9.0
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { ForumsStackParamList, UserBasic } from '../../types';
import {
  AnimatedPodium,
  AnimatedListItem,
  AnimatedTabBar,
  AnimatedPeriodSelector,
  EmptyState,
} from './forum-leaderboard-screen/components';
import { RankProgressBar } from './components/rank-progress-bar';
import type { RankInfo } from './components/rank-progress-bar';

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumLeaderboard'>;
  route: RouteProp<ForumsStackParamList, 'ForumLeaderboard'>;
};

export interface LeaderboardForum {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
  description?: string;
  member_count: number;
  post_count: number;
  growth_rate: number;
  rank: number;
  previous_rank?: number;
  category?: string;
}

export interface TopContributor {
  id: string;
  user: UserBasic;
  xp: number;
  posts: number;
  comments: number;
  karma: number;
  rank: number;
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';
export type LeaderboardType = 'forums' | 'contributors';
export type LeaderboardItem = LeaderboardForum | TopContributor;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 *
 */
export default function ForumLeaderboardScreen({ navigation, route }: Props) {
  const { forumId } = route.params || {};
  const { colors } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('forums');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [forums, setForums] = useState<LeaderboardForum[]>([]);
  const [contributors, setContributors] = useState<TopContributor[]>([]);
  const [myRankData, setMyRankData] = useState<{
    position: number;
    score: number;
    currentRank: RankInfo;
    nextRank: RankInfo | null;
    progressPercent: number;
    scoreToNextRank: number | null;
  } | null>(null);

  // Header animation (reanimated v4)
  const headerOpacity = useSharedValue(0);
  const headerSlide = useSharedValue(-20);

  const _headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerSlide.value }],
  }));

  useEffect(() => {
    navigation.setOptions({
      title: forumId ? 'Leaderboard' : 'Forum Rankings',
      headerStyle: {
        backgroundColor: '#111827',
      },
      headerTitleStyle: {
        color: '#FFF',
        fontWeight: '700',
      },
    });

    headerOpacity.value = withTiming(1, { duration: durations.smooth.ms, easing: Easing.out(Easing.ease) });
    headerSlide.value = withSpring(0, { damping: 12, stiffness: 100 });

    fetchLeaderboardData();
  }, [forumId, activeTab, timePeriod]);

  const fetchLeaderboardData = async () => {
    try {
      if (activeTab === 'forums') {
        const response = await api.get('/api/v1/forums/leaderboard', {
          params: { period: timePeriod },
        });
        setForums(response.data?.data || []);
      } else {
        const endpoint = forumId
          ? `/api/v1/forums/${forumId}/contributors`
          : '/api/v1/users/leaderboard';
        const response = await api.get(endpoint, {
          params: { period: timePeriod },
        });
        setContributors(response.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }

    // Fetch my rank if viewing a specific forum
    if (forumId) {
      try {
        const rankResp = await api.get(`/api/v1/forums/${forumId}/leaderboard/my-rank`);
        const d = rankResp.data?.data;
        if (d?.progress) {
          const cr = d.progress.current_rank;
          const nr = d.progress.next_rank;
          setMyRankData({
            position: d.position,
            score: d.score ?? 0,
            currentRank: cr ? { name: cr.name, color: cr.color, imageUrl: cr.image_url, minScore: cr.min_score, maxScore: cr.max_score } : { name: 'Newcomer', color: '#9CA3AF', minScore: 0 },
            nextRank: nr ? { name: nr.name, color: nr.color, imageUrl: nr.image_url, minScore: nr.min_score, maxScore: nr.max_score } : null,
            progressPercent: d.progress.progress_percent ?? 0,
            scoreToNextRank: d.progress.score_to_next_rank ?? null,
          });
        }
      } catch {
        // Non-critical
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchLeaderboardData();
  }, [activeTab, timePeriod, forumId]);

  const handleTabChange = (tab: LeaderboardType) => {
    setActiveTab(tab);
    setIsLoading(true);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    setIsLoading(true);
  };

  const handleForumPress = (forum: LeaderboardForum) => {
    navigation.navigate('Forum', { forumId: forum.id });
  };

  const handleContributorPress = (contributor: TopContributor) => {
    // Navigate to user profile
    // eslint-disable-next-line no-console
    if (__DEV__) console.log('Navigate to user:', contributor.user?.username);
  };

  const currentData: LeaderboardItem[] = activeTab === 'forums' ? forums : contributors;
  const topThree = currentData.slice(0, 3);
  const restOfList = currentData.slice(3);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#111827', '#0F172A', '#111827']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
        <Text style={styles.loadingText}>Loading rankings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient colors={['#111827', '#0F172A', '#111827']} style={StyleSheet.absoluteFill} />

      {/* Tab bar */}
      {!forumId && (
        <AnimatedTabBar activeTab={activeTab} onTabChange={handleTabChange} colors={colors} />
      )}

      <FlatList<LeaderboardItem>
        data={restOfList}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem
            item={item}
            index={index}
            type={activeTab}
            onPress={() =>
              activeTab === 'forums'
                 
                ? handleForumPress(item as LeaderboardForum)
                 
                : handleContributorPress(item as TopContributor)
            }
            colors={colors}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Period selector */}
            <AnimatedPeriodSelector period={timePeriod} onPeriodChange={handlePeriodChange} />

            {/* My Rank Progress Bar */}
            {myRankData && forumId && (
              <RankProgressBar
                currentScore={myRankData.score}
                currentRank={myRankData.currentRank}
                nextRank={myRankData.nextRank}
                progressPercent={myRankData.progressPercent}
                scoreToNextRank={myRankData.scoreToNextRank}
              />
            )}

            {/* Podium for top 3 */}
            {topThree.length > 0 && (
              <AnimatedPodium
                items={topThree}
                type={activeTab}
                onItemPress={(item) =>
                  activeTab === 'forums'
                     
                    ? handleForumPress(item as LeaderboardForum)
                     
                    : handleContributorPress(item as TopContributor)
                }
              />
            )}

            {/* Section divider */}
            {restOfList.length > 0 && (
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Rankings</Text>
                <View style={styles.sectionLine} />
              </View>
            )}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

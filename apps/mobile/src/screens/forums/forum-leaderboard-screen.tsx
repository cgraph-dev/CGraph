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

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/theme-context';
import api from '../../lib/api';
import { ForumsStackParamList, UserBasic } from '../../types';
import {
  AnimatedPodium,
  AnimatedListItem,
  AnimatedTabBar,
  AnimatedPeriodSelector,
  EmptyState,
} from './forum-leaderboard-screen/components';

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

export default function ForumLeaderboardScreen({ navigation, route }: Props) {
  const { forumId } = route.params || {};
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('forums');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [forums, setForums] = useState<LeaderboardForum[]>([]);
  const [contributors, setContributors] = useState<TopContributor[]>([]);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

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

    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

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

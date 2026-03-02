/**
 * LeaderboardScreen - Orchestrator
 * Delegates to sub-components in ./leaderboard/
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { UserCardSkeleton } from '../../components/skeleton';
import api from '../../lib/api';
import { FriendsStackParamList } from '../../types';
import {
  LeaderboardCategory,
  TimePeriod,
  LeaderboardUser,
  LeaderboardMeta,
  getCategoryColor,
} from './leaderboard/leaderboard-types';
import { PodiumSection } from './leaderboard/podium-section';
import { RankItem } from './leaderboard/rank-item';
import { CategoryFilters } from './leaderboard/category-filters';

type Props = {
  navigation: NativeStackNavigationProp<FriendsStackParamList, 'Leaderboard'>;
};

/**
 *
 */
export default function LeaderboardScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<LeaderboardCategory>('karma');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const podiumAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: durations.smooth.ms, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 50, friction: 10, useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.stagger(200, [
        Animated.spring(podiumAnims[1], { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(podiumAnims[0], { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(podiumAnims[2], { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
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
        params: { page: pageNum, limit: 25, category, period: timePeriod },
      });

      const data = response.data?.data || [];
      const metaData = response.data?.meta || {};

      if (pageNum === 1) setUsers(data);
      else setUsers((prev) => [...prev, ...data]);

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

  useEffect(() => { fetchLeaderboard(1); }, [fetchLeaderboard]);

  const onRefresh = () => fetchLeaderboard(1, true);
  const loadMore = () => {
    if (meta && page < meta.total_pages && !isLoading) fetchLeaderboard(page + 1);
  };

  const handleCategoryChange = (c: LeaderboardCategory) => {
    if (c !== category) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCategory(c); }
  };
  const handleTimePeriodChange = (p: TimePeriod) => {
    if (p !== timePeriod) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTimePeriod(p); }
  };

  const catColor = getCategoryColor(category);

  const renderHeader = () => (
    <Animated.View
      style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
      <CategoryFilters
        category={category}
        timePeriod={timePeriod}
        onCategoryChange={handleCategoryChange}
        onTimePeriodChange={handleTimePeriodChange}
        categoryColor={catColor}
        colors={colors as unknown as Record<string, string>}
      />
      <PodiumSection
        users={users}
        podiumAnims={podiumAnims}
        categoryColor={catColor}
        colors={colors as unknown as { text: string; [key: string]: string }}
      />
      <Text style={[styles.listHeader, { color: colors.text }]}>Rankings</Text>
    </Animated.View>
  );

  if (isLoading && users.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={users}
        renderItem={({ item, index }) => (
          <RankItem
            item={item}
            index={index}
            category={category}
            categoryColor={catColor}
            colors={colors as unknown as Record<string, string>}
            onPress={(userId) => navigation.navigate('UserProfile', { userId })}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
  container: { flex: 1 },
  listContent: { paddingBottom: 24 },
  header: { paddingTop: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  listHeader: { fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 12 },
  skeletonContainer: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 4 },
});

/**
 * LeaderboardScreen
 *
 * Displays global rankings with multiple categories and time periods.
 *
 * @refactored Extracted from 1117-line file:
 * - types.ts: Types, constants, helper functions
 * - components/RankChangeIndicator: Rank movement display
 * - components/Podium: Top 3 visualization
 * - components/EntryRow: Individual entry item
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';
import api from '../../../lib/api';
import type { LeaderboardCategory, TimePeriod, LeaderboardData, LeaderboardEntry } from './types';
import {
  CATEGORIES,
  TIME_PERIODS,
  formatValue,
  generateFallbackData,
  transformApiResponse,
} from './types';
import { Podium, EntryRow, RankChangeIndicator } from './components';

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const currentCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === category) || CATEGORIES[0],
    [category]
  );

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
        HapticFeedback.light();
      } else {
        setIsLoading(true);
      }

      try {
        const response = await api.get('/api/v1/leaderboard', {
          params: { category, period: timePeriod, page, limit: 20 },
        });
        const data = response.data?.data || response.data;
        setLeaderboard(transformApiResponse(data, category));
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboard(generateFallbackData(category, page));
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [category, timePeriod, page]
  );

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
    // @ts-expect-error - Navigation types
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
        <Text style={styles.subtitle}>Compete with the community and climb to the top</Text>
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
            <TouchableOpacity onPress={() => handleCategoryChange(item.id)} activeOpacity={0.8}>
              {category === item.id ? (
                <LinearGradient colors={item.colors} style={styles.categoryPillActive}>
                  <Ionicons name={item.icon} size={16} color="#fff" />
                  <Text style={styles.categoryPillTextActive}>{item.name}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryPill}>
                  <Ionicons name={item.icon} size={16} color="#9ca3af" />
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
            style={[styles.timePeriodTab, timePeriod === period.id && styles.timePeriodTabActive]}
          >
            <Text
              style={[
                styles.timePeriodText,
                timePeriod === period.id && styles.timePeriodTextActive,
              ]}
            >
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
              <Text style={styles.yourRankValue}>{formatValue(leaderboard.userRank.value)}</Text>
              <Text style={styles.yourRankValueLabel}>{currentCategory.name}</Text>
            </View>
          </View>
        </BlurView>
      )}

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>All Rankings</Text>
        <Text style={styles.listHeaderCount}>
          {(leaderboard?.totalCount ?? 0).toLocaleString()} participants
        </Text>
      </View>
    </View>
  );

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    if (item.rank <= 3) return null;

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
        data={leaderboard?.entries.filter((e) => e.rank > 3) || []}
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
});

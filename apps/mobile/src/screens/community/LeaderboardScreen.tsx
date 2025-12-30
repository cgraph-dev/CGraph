import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { UserCardSkeleton } from '../../components/Skeleton';
import api from '../../lib/api';
import { FriendsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<FriendsStackParamList, 'Leaderboard'>;
};

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  karma: number;
  is_verified?: boolean;
}

interface LeaderboardMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <View style={[styles.rankBadge, styles.rankGold]}>
        <Ionicons name="trophy" size={18} color="#fff" />
      </View>
    );
  }
  if (rank === 2) {
    return (
      <View style={[styles.rankBadge, styles.rankSilver]}>
        <Text style={styles.rankText}>2</Text>
      </View>
    );
  }
  if (rank === 3) {
    return (
      <View style={[styles.rankBadge, styles.rankBronze]}>
        <Text style={styles.rankText}>3</Text>
      </View>
    );
  }
  return (
    <View style={[styles.rankBadge, styles.rankDefault]}>
      <Text style={styles.rankTextSmall}>#{rank}</Text>
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

  const fetchLeaderboard = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setIsLoading(true);

      const response = await api.get('/api/v1/users/leaderboard', {
        params: { page: pageNum, limit: 25 }
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
  }, []);

  useEffect(() => {
    fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  const onRefresh = () => fetchLeaderboard(1, true);

  const loadMore = () => {
    if (meta && page < meta.total_pages && !isLoading) {
      fetchLeaderboard(page + 1);
    }
  };

  const renderUser = ({ item }: { item: LeaderboardUser }) => {
    const isTopThree = item.rank <= 3;

    return (
      <TouchableOpacity
        style={[
          styles.userCard,
          { backgroundColor: colors.surface },
          isTopThree && styles.userCardHighlight,
        ]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <RankBadge rank={item.rank} />

        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(item.display_name || item.username).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {item.display_name || item.username}
            </Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{item.username}
          </Text>
        </View>

        <View style={[styles.karmaBadge, { backgroundColor: colors.surfaceHover }]}>
          <Ionicons name="trophy" size={14} color="#F59E0B" />
          <Text style={[styles.karmaText, { color: colors.text }]}>
            {formatKarma(item.karma)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="trophy" size={28} color="#F59E0B" />
      </View>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Top Contributors</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        Users ranked by karma earned from community engagement
      </Text>
    </View>
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
              No users yet
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
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
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

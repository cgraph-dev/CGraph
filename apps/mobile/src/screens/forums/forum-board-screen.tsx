/**
 * Forum board screen displaying threads within a specific board.
 * @module screens/forums/forum-board-screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/theme-context';
import api from '../../lib/api';
import { safeFormatMessageTime } from '../../lib/dateUtils';
import { ForumsStackParamList, Post, UserBasic } from '../../types';

// =============================================================================
// FORUM BOARD SCREEN
// =============================================================================
// Displays a specific board within a forum (MyBB-style):
// - Board description and stats
// - List of threads/posts in the board
// - Pinned threads at top
// - Sorting options (newest, popular, active)
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumBoard'>;
  route: RouteProp<ForumsStackParamList, 'ForumBoard'>;
};

interface Board {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thread_count: number;
  post_count: number;
  last_post?: {
    id: string;
    title: string;
    author: UserBasic;
    created_at: string;
  };
  icon?: string;
  is_locked: boolean;
}

interface Thread {
  id: string;
  title: string;
  author: UserBasic;
  created_at: string;
  last_reply_at?: string;
  last_reply_by?: UserBasic;
  reply_count: number;
  view_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_hot: boolean;
  prefix?: { name: string; color: string };
}

type SortOption = 'newest' | 'popular' | 'active';

export default function ForumBoardScreen({ navigation, route }: Props) {
  const { forumId, boardId, boardName } = route.params;
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    fetchBoardData();
  }, [forumId, boardId]);

  useEffect(() => {
    if (board) {
      navigation.setOptions({
        title: board.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CreatePost', {
                forumId,
              })
            }
            style={{ marginRight: 8 }}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [board, colors]);

  const fetchBoardData = async () => {
    try {
      const boardEndpoint = `/api/v1/forums/${forumId}/boards/${boardId}`;

      const [boardRes, threadsRes] = await Promise.all([
        api.get(boardEndpoint),
        api
          .get(`/api/v1/boards/${boardId}/threads`, {
            params: { sort: sortBy },
          })
          .catch(() => ({ data: { data: [] } })),
      ]);

      setBoard(boardRes.data?.data);
      setThreads(threadsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBoardData();
  }, [forumId, boardId, sortBy]);

  const handleSortChange = (sort: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(sort);
    setIsLoading(true);
    fetchBoardData();
  };

  const renderSortTabs = () => (
    <View
      style={[
        styles.sortTabs,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      {(['newest', 'popular', 'active'] as SortOption[]).map((sort) => (
        <TouchableOpacity
          key={sort}
          style={[
            styles.sortTab,
            sortBy === sort && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => handleSortChange(sort)}
        >
          <Text
            style={[
              styles.sortTabText,
              { color: sortBy === sort ? colors.primary : colors.textSecondary },
            ]}
          >
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderThread = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      style={[styles.threadItem, { backgroundColor: colors.surface }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('Post', { postId: item.id });
      }}
      activeOpacity={0.7}
    >
      {/* Thread indicators */}
      <View style={styles.threadIndicators}>
        {item.is_pinned && (
          <View style={[styles.indicator, { backgroundColor: colors.warning }]}>
            <Ionicons name="pin" size={12} color="#fff" />
          </View>
        )}
        {item.is_locked && (
          <View style={[styles.indicator, { backgroundColor: colors.error }]}>
            <Ionicons name="lock-closed" size={12} color="#fff" />
          </View>
        )}
        {item.is_hot && (
          <View style={[styles.indicator, { backgroundColor: colors.primary }]}>
            <Ionicons name="flame" size={12} color="#fff" />
          </View>
        )}
      </View>

      {/* Thread content */}
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          {item.prefix && (
            <View style={[styles.prefix, { backgroundColor: item.prefix.color }]}>
              <Text style={styles.prefixText}>{item.prefix.name}</Text>
            </View>
          )}
          <Text style={[styles.threadTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        <View style={styles.threadMeta}>
          <Text style={[styles.threadAuthor, { color: colors.textSecondary }]}>
            by u/{item.author?.username || 'unknown'}
          </Text>
          <Text style={[styles.threadDate, { color: colors.textSecondary }]}>
            {safeFormatMessageTime(item.created_at)}
          </Text>
        </View>

        <View style={styles.threadStats}>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.reply_count}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.view_count}
            </Text>
          </View>
          {item.last_reply_at && (
            <Text style={[styles.lastReply, { color: colors.textSecondary }]}>
              Last: {safeFormatMessageTime(item.last_reply_at)}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderBoardHeader = () => (
    <View style={[styles.boardHeader, { backgroundColor: colors.surface }]}>
      <View style={styles.boardInfo}>
        <View style={[styles.boardIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name={(board?.icon as string) || 'chatbubbles'} size={24} color="#fff" />
        </View>
        <View style={styles.boardDetails}>
          <Text style={[styles.boardName, { color: colors.text }]}>{board?.name}</Text>
          {board?.description && (
            <Text
              style={[styles.boardDescription, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {board.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.boardStats}>
        <View style={styles.boardStat}>
          <Text style={[styles.boardStatValue, { color: colors.text }]}>
            {(board?.thread_count ?? 0).toLocaleString()}
          </Text>
          <Text style={[styles.boardStatLabel, { color: colors.textSecondary }]}>Threads</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.boardStat}>
          <Text style={[styles.boardStatValue, { color: colors.text }]}>
            {(board?.post_count ?? 0).toLocaleString()}
          </Text>
          <Text style={[styles.boardStatLabel, { color: colors.textSecondary }]}>Posts</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Separate pinned and regular threads
  const pinnedThreads = threads.filter((t) => t.is_pinned);
  const regularThreads = threads.filter((t) => !t.is_pinned);
  const sortedThreads = [...pinnedThreads, ...regularThreads];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sortedThreads}
        renderItem={renderThread}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {renderBoardHeader()}
            {renderSortTabs()}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No threads yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Be the first to start a discussion!
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() =>
                navigation.navigate('CreatePost', {
                  forumId,
                })
              }
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Thread</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  boardHeader: {
    padding: 16,
    marginBottom: 1,
  },
  boardInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  boardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  boardDetails: {
    flex: 1,
  },
  boardName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  boardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  boardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardStat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  boardStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  boardStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  sortTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  sortTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sortTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  threadIndicators: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  prefix: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prefixText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  threadTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  threadAuthor: {
    fontSize: 12,
  },
  threadDate: {
    fontSize: 12,
  },
  threadStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  lastReply: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

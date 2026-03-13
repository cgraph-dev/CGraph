/**
 * Thread List (Mobile) — FlatList of thread cards
 *
 * Features:
 * - Single column FlatList (no grid on mobile)
 * - Pull-to-refresh
 * - Sort/filter horizontal pill row at top
 * - Infinite scroll via onEndReached
 *
 * @module components/forum/thread-list
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThreadCard } from './thread-card';

// ── Types ──────────────────────────────────────────────────────────────

type SortMode = 'latest' | 'hot' | 'top' | 'unanswered';

interface Thread {
  id: string;
  title: string;
  preview?: string;
  thumbnailUrl?: string;
  author: { displayName: string; avatarUrl?: string };
  tags?: Array<{ id: string; label: string; color: string }>;
  voteCount: number;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isHot?: boolean;
  userVote?: 'up' | 'down' | null;
}

interface ThreadListProps {
  threads: Thread[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onThreadPress?: (threadId: string) => void;
  onVote?: (threadId: string, direction: 'up' | 'down') => void;
}

// ── Sort Options ───────────────────────────────────────────────────────

const sortOptions: { value: SortMode; label: string; icon: string }[] = [
  { value: 'latest', label: 'Latest', icon: 'clock-outline' },
  { value: 'hot', label: 'Hot', icon: 'fire' },
  { value: 'top', label: 'Top', icon: 'trending-up' },
  { value: 'unanswered', label: 'Unanswered', icon: 'help-circle-outline' },
];

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Thread List component. */
export function ThreadList({
  threads,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onLoadMore,
  onThreadPress,
  onVote,
}: ThreadListProps): React.ReactElement {
  const [sortBy, setSortBy] = useState<SortMode>('latest');

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
        >
          {sortOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSortBy(opt.value)}
              style={[styles.sortPill, sortBy === opt.value && styles.sortPillActive]}
            >
              <MaterialCommunityIcons
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                name={opt.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={14}
                color={sortBy === opt.value ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[styles.sortText, sortBy === opt.value && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    ),
    [sortBy]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="forum-outline" size={48} color="rgba(255,255,255,0.2)" />
        <Text style={styles.emptyTitle}>No threads yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to start a discussion</Text>
      </View>
    );
  }, [isLoading]);

  const renderItem = useCallback(
    ({ item, index }: { item: Thread; index: number }) => (
      <ThreadCard thread={item} index={index} onPress={onThreadPress} onVote={onVote} />
    ),
    [onThreadPress, onVote]
  );

  return (
    <FlatList
      data={threads}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.5)"
          />
        ) : undefined
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      windowSize={7}
      maxToRenderPerBatch={10}
    />
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  sortRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ThreadList;

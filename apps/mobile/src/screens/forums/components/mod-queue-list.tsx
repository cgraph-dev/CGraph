import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useTheme } from '../../../theme/use-theme';

// ── Types ──────────────────────────────────────────────────────────
interface ModQueueItem {
  id: string;
  content_type: 'thread' | 'post' | 'comment';
  content_preview: string;
  reporter: { id: string; username: string; avatar_url?: string };
  reported_user: { id: string; username: string };
  reason: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface ModQueueListProps {
  items: ModQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

// ── Content Type Badge ─────────────────────────────────────────────
function ContentTypeBadge({ type }: { type: ModQueueItem['content_type'] }) {
  const { colors } = useTheme();

  const config = {
    thread: { label: 'Thread', color: '#6366f1' },
    post: { label: 'Post', color: '#0ea5e9' },
    comment: { label: 'Comment', color: '#8b5cf6' },
  };

  const { label, color } = config[type];

  return (
    <View style={[styles.typeBadge, { backgroundColor: color }]}>
      <Text style={styles.typeBadgeText}>{label}</Text>
    </View>
  );
}

// ── Swipe Actions ──────────────────────────────────────────────────
function SwipeApproveAction() {
  return (
    <View style={[styles.swipeAction, { backgroundColor: '#10b981' }]}>
      <Text style={styles.swipeActionText}>✓ Approve</Text>
    </View>
  );
}

function SwipeRejectAction() {
  return (
    <View style={[styles.swipeAction, { backgroundColor: '#ef4444' }]}>
      <Text style={styles.swipeActionText}>✗ Reject</Text>
    </View>
  );
}

// ── Queue Item ─────────────────────────────────────────────────────
function QueueItem({
  item,
  onApprove,
  onReject,
}: {
  item: ModQueueItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { colors } = useTheme();

  const handleSwipeOpen = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        onApprove(item.id);
      } else {
        onReject(item.id);
      }
    },
    [item.id, onApprove, onReject],
  );

  return (
    <Swipeable
      renderLeftActions={() => <SwipeApproveAction />}
      renderRightActions={() => <SwipeRejectAction />}
      onSwipeableOpen={handleSwipeOpen}
      overshootLeft={false}
      overshootRight={false}
    >
      <View style={[styles.queueItem, { backgroundColor: colors.surface }]}>
        <View style={styles.queueItemHeader}>
          <ContentTypeBadge type={item.content_type} />
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text
          style={[styles.contentPreview, { color: colors.text }]}
          numberOfLines={3}
        >
          {item.content_preview}
        </Text>

        <View style={styles.reportInfo}>
          <Text style={[styles.reporterText, { color: colors.textSecondary }]}>
            Reported by{' '}
            <Text style={{ fontWeight: '600' }}>{item.reporter.username}</Text>
          </Text>
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
            Reason: {item.reason}
          </Text>
        </View>

        <View style={styles.reportedUser}>
          <Text style={[styles.reportedLabel, { color: colors.textTertiary }]}>
            User:{' '}
          </Text>
          <Text style={[styles.reportedUsername, { color: colors.text }]}>
            {item.reported_user.username}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
            onPress={() => onApprove(item.id)}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={() => onReject(item.id)}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
}

// ── Empty State ────────────────────────────────────────────────────
function EmptyQueue() {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Queue Clear!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        No items need moderation right now.
      </Text>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function ModQueueList({
  items,
  onApprove,
  onReject,
  onRefresh,
  refreshing,
}: ModQueueListProps) {
  const { colors } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: ModQueueItem }) => (
      <QueueItem item={item} onApprove={onApprove} onReject={onReject} />
    ),
    [onApprove, onReject],
  );

  const keyExtractor = useCallback((item: ModQueueItem) => item.id, []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.listContent,
        items.length === 0 && styles.emptyListContent,
      ]}
      ListEmptyComponent={<EmptyQueue />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: { padding: 16 },
  emptyListContent: { flex: 1 },
  separator: { height: 12 },
  queueItem: {
    borderRadius: 12,
    padding: 16,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  timestamp: { fontSize: 12 },
  contentPreview: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  reportInfo: { gap: 2, marginBottom: 8 },
  reporterText: { fontSize: 13 },
  reasonText: { fontSize: 13, fontStyle: 'italic' },
  reportedUser: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reportedLabel: { fontSize: 12 },
  reportedUsername: { fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 12,
  },
  swipeActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14 },
});

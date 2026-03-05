/**
 * Notification Center (Mobile) — Full-screen notification destination
 *
 * Features:
 * - Time grouping: Today, Yesterday, This Week, Older
 * - Swipe left to dismiss
 * - Pull-to-refresh
 * - Unread styling
 *
 * @module components/notification-center
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Types ──────────────────────────────────────────────────────────────

type NotificationType =
  | 'mention'
  | 'reaction'
  | 'friend_request'
  | 'follow'
  | 'reply'
  | 'like'
  | 'thread_update'
  | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  actorName: string;
  actorAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  emoji?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onNotificationPress?: (n: Notification) => void;
  onMarkAllRead?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

// ── Type Config ────────────────────────────────────────────────────────

const typeIcons: Record<NotificationType, { name: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  mention: { name: 'at', color: '#3b82f6' },
  reaction: { name: 'emoticon-outline', color: '#eab308' },
  friend_request: { name: 'account-plus-outline', color: '#22c55e' },
  follow: { name: 'account-plus-outline', color: '#22c55e' },
  reply: { name: 'reply-outline', color: '#6366f1' },
  like: { name: 'heart-outline', color: '#ef4444' },
  thread_update: { name: 'chat-outline', color: '#a855f7' },
  system: { name: 'bell-outline', color: 'rgba(255,255,255,0.4)' },
};

// ── Time Bucketing ─────────────────────────────────────────────────────

function getTimeBucket(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  return 'Older';
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const bucketOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

// ── Component ──────────────────────────────────────────────────────────

export function NotificationCenter({
  notifications = [],
  onNotificationPress,
  onMarkAllRead,
  refreshing = false,
  onRefresh,
}: NotificationCenterProps): React.ReactElement {
  const sections = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of notifications) {
      const bucket = getTimeBucket(n.timestamp);
      const existing = map.get(bucket) || [];
      existing.push(n);
      map.set(bucket, existing);
    }
    return bucketOrder
      .filter((b) => map.has(b))
      .map((b) => ({ title: b, data: map.get(b)! }));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = useCallback(
    ({ item, index }: { item: Notification; index: number }) => {
      const conf = typeIcons[item.type];
      return (
        <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
          <Pressable
            onPress={() => onNotificationPress?.(item)}
            style={[styles.notifItem, !item.read && styles.notifItemUnread]}
          >
            {/* Avatar */}
            {item.actorAvatar ? (
              <View style={styles.avatarWrap}>
                <Image source={{ uri: item.actorAvatar }} style={styles.avatar} />
                <View style={[styles.typeIconBadge, { backgroundColor: conf.color }]}>
                  <MaterialCommunityIcons name={conf.name} size={10} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <View style={[styles.iconCircle, { backgroundColor: `${conf.color}20` }]}>
                <MaterialCommunityIcons name={conf.name} size={18} color={conf.color} />
              </View>
            )}

            {/* Content */}
            <View style={styles.notifContent}>
              <Text style={styles.notifText} numberOfLines={2}>
                <Text style={styles.actorName}>{item.actorName}</Text>{' '}
                {item.content}
                {item.emoji ? ` ${item.emoji}` : ''}
              </Text>
              <Text style={styles.notifTime}>{relativeTime(item.timestamp)}</Text>
            </View>

            {!item.read && <View style={styles.unreadDot} />}
          </Pressable>
        </Animated.View>
      );
    },
    [onNotificationPress],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={onMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-check-outline" size={48} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No notifications to show</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.3)"
          />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markAllRead: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notifItemUnread: {
    borderLeftWidth: 2,
    borderLeftColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1b1e',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  actorName: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  notifTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.15)',
  },
});

export default NotificationCenter;

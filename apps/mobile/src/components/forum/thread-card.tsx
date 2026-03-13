/**
 * Thread Card (Mobile) — Forum thread preview card
 *
 * Single-column card with author, title, preview, votes, replies.
 * Tap to navigate. Vote buttons at left edge.
 *
 * @module components/forum/thread-card
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

interface ThreadTag {
  id: string;
  label: string;
  color: string;
}

interface ThreadCardData {
  id: string;
  title: string;
  preview?: string;
  thumbnailUrl?: string;
  author: {
    displayName: string;
    avatarUrl?: string;
  };
  tags?: ThreadTag[];
  voteCount: number;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isHot?: boolean;
  userVote?: 'up' | 'down' | null;
}

interface ThreadCardProps {
  thread: ThreadCardData;
  index?: number;
  onPress?: (threadId: string) => void;
  onVote?: (threadId: string, direction: 'up' | 'down') => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Thread Card component. */
export function ThreadCard({
  thread,
  index = 0,
  onPress,
  onVote,
}: ThreadCardProps): React.ReactElement {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .duration(300)
        .springify()}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(thread.id);
        }}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
          thread.isPinned && styles.cardPinned,
        ]}
      >
        <View style={styles.cardContent}>
          {/* Vote column */}
          <View style={styles.voteColumn}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onVote?.(thread.id, 'up');
              }}
            >
              <MaterialCommunityIcons
                name="arrow-up-bold"
                size={20}
                color={thread.userVote === 'up' ? '#6366f1' : 'rgba(255,255,255,0.3)'}
              />
            </Pressable>
            <Text
              style={[
                styles.voteCount,
                thread.userVote === 'up' && styles.voteCountUp,
                thread.userVote === 'down' && styles.voteCountDown,
              ]}
            >
              {thread.voteCount}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onVote?.(thread.id, 'down');
              }}
            >
              <MaterialCommunityIcons
                name="arrow-down-bold"
                size={20}
                color={thread.userVote === 'down' ? '#EF4444' : 'rgba(255,255,255,0.3)'}
              />
            </Pressable>
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>
            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                {thread.author.avatarUrl ? (
                  <Image source={{ uri: thread.author.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {thread.author.displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.authorName}>{thread.author.displayName}</Text>
              <Text style={styles.timestamp}>{formatRelativeTime(thread.createdAt)}</Text>
              {thread.isPinned && <MaterialCommunityIcons name="pin" size={12} color="#6366f1" />}
              {thread.isLocked && (
                <MaterialCommunityIcons name="lock" size={12} color="rgba(255,255,255,0.3)" />
              )}
              {thread.isHot && <MaterialCommunityIcons name="fire" size={12} color="#F97316" />}
            </View>

            {/* Tags */}
            {thread.tags && thread.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {thread.tags.slice(0, 3).map((tag) => (
                  <View key={tag.id} style={[styles.tag, { backgroundColor: `${tag.color}20` }]}>
                    <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {thread.title}
            </Text>

            {/* Preview */}
            {thread.preview && (
              <Text style={styles.preview} numberOfLines={2}>
                {thread.preview}
              </Text>
            )}

            {/* Thumbnail */}
            {thread.thumbnailUrl && (
              <Image
                source={{ uri: thread.thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            )}

            {/* Stats bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={14}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={styles.statText}>{thread.replyCount}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={14}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={styles.statText}>{thread.viewCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardPinned: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  voteColumn: {
    alignItems: 'center',
    paddingRight: 8,
    gap: 2,
  },
  voteCount: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  voteCountUp: {
    color: '#6366f1',
  },
  voteCountDown: {
    color: '#EF4444',
  },
  mainContent: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarInitial: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  authorName: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  preview: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
    lineHeight: 18,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default ThreadCard;

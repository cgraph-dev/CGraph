/**
 * ThreadPreview — compact pill showing thread metadata below a message.
 * @module components/chat/thread-preview
 */
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../ui/avatar';
import { space, radius } from '../../theme/tokens';

interface ThreadUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ThreadPreviewProps {
  replyCount: number;
  lastReplyAt?: string;
  participants: ThreadUser[];
  maxAvatars?: number;
  hasUnread?: boolean;
  onPress?: () => void;
}

/**
 * ThreadPreview — tappable pill with reply count, avatar stack, and timestamp.
 */
export const ThreadPreview = memo(function ThreadPreview({
  replyCount,
  lastReplyAt,
  participants,
  maxAvatars = 3,
  hasUnread = false,
  onPress,
}: ThreadPreviewProps) {
  if (replyCount === 0) return null;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const visible = participants.slice(0, maxAvatars);
  const timeLabel = lastReplyAt ? formatRelative(lastReplyAt) : '';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {/* Unread dot */}
      {hasUnread && <View style={styles.unreadDot} />}

      {/* Avatar stack */}
      <View style={styles.avatarStack}>
        {visible.map((user, i) => (
          <View key={user.id} style={[styles.avatarWrap, { marginLeft: i > 0 ? -6 : 0, zIndex: visible.length - i }]}>
            <Avatar size="xs" name={user.name} src={user.avatarUrl} />
          </View>
        ))}
      </View>

      <Text style={styles.countText}>
        {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
      </Text>

      {timeLabel ? <Text style={styles.timeText}>{timeLabel}</Text> : null}
    </Pressable>
  );
});

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1.5],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    marginTop: space[1],
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderWidth: 1,
    borderColor: 'rgb(18,18,24)',
    borderRadius: 100,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00AFF4',
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default ThreadPreview;

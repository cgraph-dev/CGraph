/**
 * Channel List Item (Mobile) — Individual channel row for mobile
 *
 * Features:
 * - Icon + channel name + unread badge
 * - Tap to navigate
 * - Long-press context menu (mute, notifications, copy link)
 * - Active state highlighting
 *
 * @module components/groups/channel-list-item
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum' | 'stage';
  isPrivate?: boolean;
  isMuted?: boolean;
  unreadCount?: number;
  mentionCount?: number;
}

interface ChannelListItemProps {
  channel: Channel;
  isActive?: boolean;
  index?: number;
  onPress?: (channel: Channel) => void;
  onLongPress?: (channel: Channel) => void;
}

// ── Icon Map ───────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  text: 'pound',
  voice: 'volume-high',
  announcement: 'bullhorn',
  forum: 'forum',
  stage: 'access-point',
};

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Channel List Item component. */
export function ChannelListItem({
  channel,
  isActive = false,
  index = 0,
  onPress,
  onLongPress,
}: ChannelListItemProps): React.ReactElement {
  const hasUnread = (channel.unreadCount ?? 0) > 0;
  const hasMentions = (channel.mentionCount ?? 0) > 0;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(channel);
  }, [channel, onPress]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onLongPress) {
      onLongPress(channel);
    } else {
      // Default context menu
      Alert.alert(`#${channel.name}`, undefined, [
        { text: channel.isMuted ? 'Unmute' : 'Mute Channel', onPress: () => {} },
        { text: 'Notification Settings', onPress: () => {} },
        { text: 'Copy Link', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [channel, onLongPress]);

  return (
    <Animated.View entering={FadeInRight.delay(index * 30).duration(200)}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.container,
          isActive && styles.containerActive,
          pressed && styles.containerPressed,
        ]}
      >
        {/* Unread left indicator */}
        {hasUnread && !isActive && <View style={styles.unreadDot} />}

        {/* Channel icon */}
        <MaterialCommunityIcons
          name={channel.isPrivate ? 'lock' : (CHANNEL_ICONS[channel.type] ?? 'pound')}
          size={18}
          color={isActive || hasUnread ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}
          style={channel.isMuted ? styles.mutedIcon : undefined}
        />

        {/* Channel name */}
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            isActive && styles.nameActive,
            hasUnread && !isActive && styles.nameUnread,
            channel.isMuted && styles.nameMuted,
          ]}
        >
          {channel.name}
        </Text>

        {/* Mention badge */}
        {hasMentions && (
          <View style={styles.mentionBadge}>
            <Text style={styles.mentionText}>
              {(channel.mentionCount ?? 0) > 99 ? '99+' : channel.mentionCount}
            </Text>
          </View>
        )}

        {/* Unread count badge (no mentions) */}
        {hasUnread && !hasMentions && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {(channel.unreadCount ?? 0) > 99 ? '99+' : channel.unreadCount}
            </Text>
          </View>
        )}

        {/* Muted icon */}
        {channel.isMuted && (
          <MaterialCommunityIcons name="volume-off" size={14} color="rgba(255, 255, 255, 0.25)" />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 8,
    position: 'relative',
  },
  containerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  containerPressed: {
    opacity: 0.7,
  },
  unreadDot: {
    position: 'absolute',
    left: -2,
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  nameActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nameUnread: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nameMuted: {
    color: 'rgba(255, 255, 255, 0.25)',
  },
  mutedIcon: {
    opacity: 0.4,
  },
  mentionBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  mentionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unreadBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChannelListItem;

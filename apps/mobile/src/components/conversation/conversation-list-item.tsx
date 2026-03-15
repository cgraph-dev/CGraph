/**
 * ConversationListItem — mobile conversation row with swipe actions.
 * @module components/conversation/conversation-list-item
 */
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Avatar from '../ui/avatar';
import { space } from '../../theme/tokens';

interface ConversationListItemProps {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  isMuted?: boolean;
  isGroup?: boolean;
  onPress?: (id: string) => void;
  onLongPress?: (id: string) => void;
  index?: number;
}

/**
 * Mobile conversation row (72px tall, 48px avatar).
 */
export const ConversationListItem = memo(function ConversationListItem({
  id,
  name,
  avatarUrl,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isOnline = false,
  isMuted = false,
  onPress,
  onLongPress,
  index = 0,
}: ConversationListItemProps) {
  const handlePress = useCallback(() => {
    onPress?.(id);
  }, [id, onPress]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(id);
  }, [id, onLongPress]);

  return (
    <Animated.View entering={FadeInRight.delay(index * 30).springify()}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        <Avatar size="lg" name={name} src={avatarUrl} status={isOnline ? 'online' : undefined} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {lastMessageTime && (
              <Text style={[styles.time, unreadCount > 0 && styles.timeUnread]}>
                {lastMessageTime}
              </Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.preview, isMuted && styles.previewMuted]} numberOfLines={1}>
              {lastMessage || 'No messages yet'}
            </Text>

            {isMuted && <Text style={styles.mutedIcon}>🔇</Text>}

            {unreadCount > 0 && !isMuted && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    height: 72,
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  timeUnread: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  previewMuted: {
    color: 'rgba(255,255,255,0.2)',
  },
  mutedIcon: {
    fontSize: 12,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ConversationListItem;

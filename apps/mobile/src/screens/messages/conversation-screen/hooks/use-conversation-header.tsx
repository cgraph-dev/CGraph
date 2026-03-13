/**
 * useConversationHeader Hook
 *
 * Manages navigation header display with status, typing, and action buttons.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { MessagesStackParamList, UserBasic } from '../../../../types';
import { styles } from '../styles';

interface UseConversationHeaderOptions {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Conversation'>;
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    surfaceHover: string;
  };
  isOtherUserOnline: boolean;
  isOtherUserTyping: boolean;
  otherParticipantLastSeen: string | null;
  otherParticipantId: string | null;
  otherUser: UserBasic | null;
  onStartCall: (type: 'audio' | 'video') => void;
  /** Callback to open disappearing messages toggle */
  onOpenDisappearingMessages?: () => void;
}

/**
 * Format last seen timestamp for display
 */
export function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return '';

  const lastSeen = new Date(lastSeenAt);
  if (isNaN(lastSeen.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return lastSeen.toLocaleDateString();
}

/**
 * Hook for managing conversation header display.
 */
export function useConversationHeader({
  navigation,
  colors,
  isOtherUserOnline,
  isOtherUserTyping,
  otherParticipantLastSeen,
  otherParticipantId,
  otherUser,
  onStartCall,
  onOpenDisappearingMessages,
}: UseConversationHeaderOptions) {
  const [displayName, setDisplayName] = useState<string>('Conversation');
  const lastUpdateRef = useRef<string>('');

  // Update header with current status
  const updateHeader = useCallback(
    (name: string) => {
      setDisplayName(name);

      // Determine status text with priority: typing > online > last seen > offline
      const lastSeenText = formatLastSeen(otherParticipantLastSeen);
      let statusText = lastSeenText ? `Last seen ${lastSeenText}` : 'Offline';
      let statusColor = '#6b7280';
      let showPulse = false;

      if (isOtherUserTyping) {
        statusText = 'Typing...';
        statusColor = '#3b82f6';
        showPulse = true;
      } else if (isOtherUserOnline) {
        statusText = 'Online';
        statusColor = '#22c55e';
        showPulse = true;
      }

      // Create unique key to prevent unnecessary updates
      const updateKey = `${name}-${statusText}-${otherParticipantId}-${otherUser?.avatar_url}`;
      if (updateKey === lastUpdateRef.current) return;
      lastUpdateRef.current = updateKey;

      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity
            style={styles.headerTitleContainer}
            onPress={() => {
              if (otherParticipantId) {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                (navigation as NavigationProp<ParamListBase>).navigate('FriendsTab', {
                  screen: 'UserProfile',
                  params: { userId: otherParticipantId },
                });
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.headerAvatar, { backgroundColor: colors.surfaceHover }]}>
              {otherUser?.avatar_url ? (
                <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatarImage} />
              ) : (
                <Ionicons name="person" size={20} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{name}</Text>
              <View style={styles.headerStatusRow}>
                {(isOtherUserOnline || isOtherUserTyping) && (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColor },
                      showPulse && styles.statusDotPulse,
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.headerSubtitle,
                    {
                      color:
                        isOtherUserOnline || isOtherUserTyping ? statusColor : colors.textSecondary,
                    },
                    (isOtherUserOnline || isOtherUserTyping) && { fontWeight: '500' },
                  ]}
                >
                  {statusText}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => {
                if (otherParticipantId) {
                  navigation.navigate('SafetyNumber', {
                    recipientId: otherParticipantId,
                    recipientName: name,
                  });
                }
              }}
            >
              <Ionicons name="finger-print-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            {onOpenDisappearingMessages && (
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
                onPress={onOpenDisappearingMessages}
              >
                <Ionicons name="timer-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => onStartCall('audio')}
            >
              <Ionicons name="call-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => onStartCall('video')}
            >
              <Ionicons name="videocam-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        ),
      });
    },
    [
      colors,
      isOtherUserOnline,
      isOtherUserTyping,
      otherParticipantLastSeen,
      otherParticipantId,
      otherUser,
      navigation,
      onStartCall,
      onOpenDisappearingMessages,
    ]
  );

  // Re-update header when presence/typing changes
  useEffect(() => {
    if (displayName !== 'Conversation') {
      updateHeader(displayName);
    }
  }, [isOtherUserOnline, isOtherUserTyping, otherParticipantLastSeen, displayName, updateHeader]);

  return {
    displayName,
    updateHeader,
    formatLastSeen,
  };
}

export default useConversationHeader;

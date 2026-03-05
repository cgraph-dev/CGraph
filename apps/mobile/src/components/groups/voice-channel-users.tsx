/**
 * Voice Channel Users (Mobile) — Connected user avatars below voice channel
 *
 * Horizontal avatar row showing users connected to a voice channel.
 * Tap to join. Tap user to see profile sheet.
 *
 * @module components/groups/voice-channel-users
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

interface VoiceUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

interface VoiceChannelUsersProps {
  users: VoiceUser[];
  onJoinChannel?: () => void;
  onUserPress?: (userId: string) => void;
}

// ── Avatar ─────────────────────────────────────────────────────────────

function VoiceAvatar({
  user,
  onPress,
}: {
  user: VoiceUser;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={styles.avatarContainer}
      >
        <View
          style={[
            styles.avatar,
            user.isSpeaking && styles.avatarSpeaking,
          ]}
        >
          {user.avatarUrl ? (
            <Animated.Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarInitial}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Muted indicator */}
        {user.isMuted && (
          <View style={styles.muteIndicator}>
            <MaterialCommunityIcons
              name="microphone-off"
              size={8}
              color="#EF4444"
            />
          </View>
        )}

        {/* Deafened indicator */}
        {user.isDeafened && (
          <View style={styles.deafIndicator}>
            <MaterialCommunityIcons
              name="headphones-off"
              size={8}
              color="#EF4444"
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export function VoiceChannelUsers({
  users,
  onJoinChannel,
  onUserPress,
}: VoiceChannelUsersProps): React.ReactElement | null {
  if (users.length === 0) return null;

  const handleJoin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoinChannel?.();
  }, [onJoinChannel]);

  const handleUserPress = useCallback(
    (userId: string) => {
      onUserPress?.(userId);
    },
    [onUserPress],
  );

  return (
    <View style={styles.container}>
      {/* User avatars */}
      <View style={styles.avatarRow}>
        {users.slice(0, 8).map((user) => (
          <VoiceAvatar
            key={user.id}
            user={user}
            onPress={() => handleUserPress(user.id)}
          />
        ))}
        {users.length > 8 && (
          <View style={styles.overflowBadge}>
            <Text style={styles.overflowText}>+{users.length - 8}</Text>
          </View>
        )}
      </View>

      {/* Join button */}
      <Pressable onPress={handleJoin} style={styles.joinButton}>
        <MaterialCommunityIcons name="phone" size={14} color="#10B981" />
        <Text style={styles.joinText}>Join</Text>
      </Pressable>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 24,
  },
  avatarRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarSpeaking: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  muteIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1e1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deafIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1e1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default VoiceChannelUsers;

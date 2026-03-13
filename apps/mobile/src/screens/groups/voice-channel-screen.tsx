/**
 * Voice Channel Screen
 *
 * Full-screen view for persistent voice channels on mobile.
 * Displays a participant grid with active speaker highlight,
 * and control bar for mute/deafen/speaker/disconnect.
 *
 * @module screens/groups/voice-channel-screen
 * @since v0.9.50
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useVoiceStateStore, type VoiceMember } from '@/stores/voiceStateStore';
import { useThemeStore } from '@/stores';

// ── Types ──────────────────────────────────────────────────────────────

type VoiceChannelParams = {
  VoiceChannel: {
    channelId: string;
    channelName: string;
    groupId: string;
  };
};

type Props = {
  navigation: NativeStackNavigationProp<VoiceChannelParams, 'VoiceChannel'>;
  route: RouteProp<VoiceChannelParams, 'VoiceChannel'>;
};

// ── Component ──────────────────────────────────────────────────────────

export default function VoiceChannelScreen({ navigation, route }: Props) {
  const { channelId, channelName, groupId } = route.params;
  const { colors } = useThemeStore();
  const [showParticipants, setShowParticipants] = useState(true);

  const {
    currentChannelId,
    isMuted,
    isDeafened,
    channelMembers,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
  } = useVoiceStateStore();

  const members = channelMembers[channelId] ?? [];
  const isConnected = currentChannelId === channelId;

  // Auto-join on mount if not already connected
  useEffect(() => {
    if (!isConnected) {
      joinChannel(channelId, groupId);
    }
  }, [channelId, groupId, isConnected, joinChannel]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Don't auto-leave — voice channels persist while navigating
    };
  }, []);

  const handleDisconnect = useCallback(() => {
    leaveChannel();
    navigation.goBack();
  }, [leaveChannel, navigation]);

  const handleToggleParticipants = useCallback(() => {
    setShowParticipants((prev) => !prev);
  }, []);

  // ── Participant Tile ────────────────────────────────────────────────

  const renderParticipant = useCallback(
    ({ item: member }: { item: VoiceMember }) => (
      <View
        style={[
          styles.participantTile,
          {
            backgroundColor: colors.card,
            borderColor: member.isSpeaking ? '#22c55e' : colors.border,
            borderWidth: member.isSpeaking ? 2 : 1,
          },
        ]}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {member.avatarUrl ? (
            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {(member.username ?? member.userId).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Mute badge */}
          {member.selfMute && (
            <View style={styles.muteBadge}>
              <Ionicons name="mic-off" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
          {member.displayName ?? member.username ?? member.userId}
        </Text>

        {/* Deafen indicator */}
        {member.selfDeafen && (
          <Ionicons name="volume-mute" size={14} color="#ef4444" style={styles.deafenIcon} />
        )}
      </View>
    ),
    [colors]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            <Ionicons name="volume-high" size={16} color="#22c55e" /> {channelName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {members.length} {members.length === 1 ? 'member' : 'members'} connected
          </Text>
          {/* E2EE badge would require a LiveKit Room instance */}
        </View>
        <TouchableOpacity onPress={handleToggleParticipants} style={styles.headerAction}>
          <Ionicons
            name={showParticipants ? 'people' : 'people-outline'}
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Participant Grid */}
      {showParticipants && (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          renderItem={renderParticipant}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="volume-high-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isConnected ? 'No other members in this channel' : 'Connecting...'}
              </Text>
            </View>
          }
        />
      )}

      {/* Control Bar */}
      <View style={[styles.controlBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {/* Mute */}
        <TouchableOpacity
          onPress={toggleMute}
          style={[
            styles.controlButton,
            isMuted && styles.controlButtonDanger,
          ]}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? '#ef4444' : '#fff'} />
          <Text style={[styles.controlLabel, isMuted && styles.controlLabelDanger]}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        {/* Deafen */}
        <TouchableOpacity
          onPress={toggleDeafen}
          style={[
            styles.controlButton,
            isDeafened && styles.controlButtonDanger,
          ]}
        >
          <Ionicons
            name={isDeafened ? 'volume-mute' : 'volume-high'}
            size={24}
            color={isDeafened ? '#ef4444' : '#fff'}
          />
          <Text style={[styles.controlLabel, isDeafened && styles.controlLabelDanger]}>
            {isDeafened ? 'Undeafen' : 'Deafen'}
          </Text>
        </TouchableOpacity>

        {/* Speaker Toggle */}
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="volume-medium" size={24} color="#fff" />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>

        {/* Disconnect */}
        <TouchableOpacity
          onPress={handleDisconnect}
          style={[styles.controlButton, styles.disconnectButton]}
        >
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={[styles.controlLabel, { color: '#fff' }]}>Leave</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  encryptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  headerAction: {
    padding: 4,
  },
  grid: {
    padding: 12,
    flexGrow: 1,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  participantTile: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  muteBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  deafenIcon: {
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlButtonDanger: {
    // Visual override handled by icon color
  },
  controlLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  controlLabelDanger: {
    color: '#ef4444',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

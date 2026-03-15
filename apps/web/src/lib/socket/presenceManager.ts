/**
 * Presence Manager
 *
 * Handles the presence lobby channel for tracking online friends,
 * status changes, and presence queries across all channels.
 *
 * @module lib/socket/presenceManager
 */

import type { Socket, Channel } from 'phoenix';
import { Presence } from 'phoenix';
import { socketLogger as logger } from '../logger';

/** Customization data received from presence broadcasts. */
export interface FriendCustomization {
  avatar_border_id?: string | null;
  bubble_style?: string | null;
  bubble_color?: string | null;
  message_effect?: string | null;
  profile_theme?: string | null;
  title_id?: string | null;
  equipped_badges?: string[];
  particle_effect?: string | null;
  entrance_animation?: string | null;
}

/** Per-user customization cache, keyed by user ID. */
const friendCustomizations = new Map<string, FriendCustomization>();

/**
 * Join the global presence lobby for tracking friend online status.
 */
export function joinPresenceLobby(
  socket: Socket | null,
  channels: Map<string, Channel>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>,
  notifyStatusChange: (conversationId: string, userId: string, isOnline: boolean) => void
): Channel | null {
  const topic = 'presence:lobby';

  if (channels.has(topic)) {
    return channels.get(topic)!;
  }

  if (!socket) {
    logger.warn('Cannot join presence lobby: socket not connected');
    return null;
  }

  const channel = socket.channel(topic, { include_contact_presence: true });
  const presence = new Presence(channel);

  presence.onSync(() => {
    const onlineFriends = new Set<string>();
    presence.list((id: string) => {
      onlineFriends.add(id);
      return id;
    });
    onlineUsers.set('lobby', onlineFriends);
    logger.log('Presence sync: online friends count =', onlineFriends.size);
  });

  // Handle initial presence state with customizations
  channel.on('presence_state', (payload: unknown) => {
     
    const data = payload as { users?: Record<string, { customization?: FriendCustomization }> };
    if (data.users) {
      for (const [userId, info] of Object.entries(data.users)) {
        if (info.customization) {
          friendCustomizations.set(userId, info.customization);
        }
      }
    }
  });

  channel.on('friend_online', (payload: unknown) => {
     
    const data = payload as {
      user_id: string;
      status: string;
      customization?: FriendCustomization;
    };
    onlineUsers.get('lobby')?.add(data.user_id);
    if (data.customization) {
      friendCustomizations.set(data.user_id, data.customization);
    }
    notifyStatusChange('lobby', data.user_id, true);
    logger.log('Friend came online:', data.user_id);
  });

  channel.on('friend_offline', (payload: unknown) => {
     
    const data = payload as { user_id: string; last_seen?: string };
    onlineUsers.get('lobby')?.delete(data.user_id);
    friendCustomizations.delete(data.user_id);
    notifyStatusChange('lobby', data.user_id, false);
    logger.log('Friend went offline:', data.user_id);
  });

  channel.on('friend_customization_changed', (payload: unknown) => {
     
    const data = payload as { user_id: string; customization: FriendCustomization };
    if (data.customization) {
      friendCustomizations.set(data.user_id, data.customization);
    }
    logger.log('Friend customization updated:', data.user_id);
  });

  const handleStatusUpdate = (payload: unknown) => {
     
    const data = payload as { user_id: string; status: string };
    logger.log('Friend status update:', data.user_id, '->', data.status);
  };

  channel.on('status_update', handleStatusUpdate);
  channel.on('friend_status_changed', handleStatusUpdate);

  channel
    .join()
    .receive('ok', () => {
      logger.log('Joined presence lobby');
      onlineUsers.set('lobby', new Set());
    })
    .receive('error', (resp: unknown) => {
      logger.error('Failed to join presence lobby:', resp);
      channels.delete(topic);
    });

  channels.set(topic, channel);
  presences.set(topic, presence);
  return channel;
}

/**
 * Leave and clean up the presence lobby.
 */
export function leavePresenceLobby(
  channels: Map<string, Channel>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>
): void {
  const topic = 'presence:lobby';
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
    presences.delete(topic);
    onlineUsers.delete('lobby');
    friendCustomizations.clear();
  }
}

// ── Presence Queries ──────────────────────────────────────────────

/**
 * Check if a specific friend is currently online.
 */
export function isFriendOnline(userId: string, onlineUsers: Map<string, Set<string>>): boolean {
  const lobbyUsers = onlineUsers.get('lobby');
  if (!lobbyUsers) return false;
  if (lobbyUsers.has(userId)) return true;

  const userIdStr = String(userId);
  for (const id of lobbyUsers) {
    if (String(id) === userIdStr) return true;
  }
  return false;
}

/**
 * Get all currently online friends.
 */
export function getOnlineFriends(onlineUsers: Map<string, Set<string>>): string[] {
  return Array.from(onlineUsers.get('lobby') || []);
}

/**
 * Get online users for a specific conversation/channel.
 */
export function getOnlineUsers(
  conversationId: string,
  onlineUsers: Map<string, Set<string>>
): string[] {
  return Array.from(onlineUsers.get(conversationId) || []);
}

/**
 * Check if a specific user is online in a conversation/channel.
 */
export function isUserOnline(
  conversationId: string,
  userId: string,
  onlineUsers: Map<string, Set<string>>
): boolean {
  const onlineSet = onlineUsers.get(conversationId);
  if (!onlineSet || !userId) return false;
  if (onlineSet.has(userId)) return true;

  const userIdStr = String(userId);
  for (const id of onlineSet) {
    if (String(id) === userIdStr) return true;
  }
  return false;
}

/**
 * Get a snapshot of all online statuses across all channels.
 */
export function getAllOnlineStatuses(
  onlineUsers: Map<string, Set<string>>
): Map<string, Set<string>> {
  return new Map(onlineUsers);
}

/**
 * Get cached customization data for a friend.
 * Returns null if the friend's customization data hasn't been received yet.
 */
export function getFriendCustomization(userId: string): FriendCustomization | null {
  return friendCustomizations.get(userId) ?? null;
}

/**
 * Get all cached friend customizations.
 */
export function getAllFriendCustomizations(): Map<string, FriendCustomization> {
  return new Map(friendCustomizations);
}

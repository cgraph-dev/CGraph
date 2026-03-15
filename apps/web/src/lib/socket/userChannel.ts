/**
 * User Channel Handlers
 *
 * Manages the per-user Phoenix channel for receiving friend requests,
 * message previews, conversation events, contact presence, incoming calls,
 * and E2EE key revocation events.
 *
 * @module lib/socket/userChannel
 */

import type { Socket, Channel } from 'phoenix';
import { useChatStore, type Conversation } from '@/modules/chat/store';
import { useE2EEStore } from '@/lib/crypto/e2eeStore';
import { useIncomingCallStore, type IncomingCall } from '@/modules/calls/store';
import { useNotificationStore, type Notification } from '@/modules/social/store';
import { useFriendStore } from '@/modules/social/store';
import { socketLogger as logger } from '../logger';
import { normalizeConversation } from '../apiUtils';

/**
 * Join the user-specific channel and wire up all event handlers.
 */
export function joinUserChannel(
  socket: Socket | null,
  userId: string,
  channels: Map<string, Channel>,
  onlineUsers: Map<string, Set<string>>,
  notifyStatusChange: (conversationId: string, userId: string, isOnline: boolean) => void
): Channel | null {
  const topic = `user:${userId}`;

  if (channels.has(topic)) {
    return channels.get(topic)!;
  }

  if (!socket) {
    logger.warn('Cannot join user channel: socket not connected');
    return null;
  }

  const channel = socket.channel(topic, {});

  // E2EE key revocation — CRITICAL for forward secrecy
  channel.on('e2ee:key_revoked', (payload) => {
     
    const data = payload as { user_id: string; key_id: string; revoked_at: string };
    logger.log('E2EE key revoked event received:', data);
    useE2EEStore.getState().handleKeyRevoked(data.user_id, data.key_id);
  });

  channel.on('friend_request', (payload) => {
    logger.log('Friend request received:', payload);
    // Refresh pending requests in real-time
    useFriendStore.getState().fetchPendingRequests();
  });

  // Real-time notification delivery — backend broadcasts serialized notifications
  channel.on('notification', (payload) => {
    logger.log('Real-time notification received:', payload);
     
    const data = payload as {
      id: string;
      type: string;
      title: string;
      body: string;
      read: boolean;
      data: Record<string, unknown>;
      actor?: { id: string; username: string; avatar_url: string | null };
      created_at: string;
    };

    const notification: Notification = {
      id: data.id,
       
      type: data.type as Notification['type'],
      title: data.title,
      body: data.body || '',
      isRead: data.read ?? false,
      data: data.data || {},
      sender: data.actor
        ? {
            id: data.actor.id,
            username: data.actor.username,
            displayName: null,
            avatarUrl: data.actor.avatar_url || null,
          }
        : undefined,
      createdAt: data.created_at || new Date().toISOString(),
    };

    // Deduplicate: don't add if we already have this notification ID
    const existing = useNotificationStore.getState().notifications;
    if (!existing.some((n) => n.id === notification.id)) {
      useNotificationStore.getState().addNotification(notification);
    }
  });

  // Real-time notification dismissal — removes cancelled/declined friend request notifications
  channel.on('notifications:dismissed', (payload) => {
    logger.log('Notifications dismissed:', payload);
     
    const data = payload as { notification_ids: string[]; reason: string };
    const idsToRemove = new Set(data.notification_ids || []);

    if (idsToRemove.size > 0) {
      const store = useNotificationStore.getState();
      const remaining = store.notifications.filter((n) => !idsToRemove.has(n.id));
      const removedUnread = store.notifications.filter(
        (n) => idsToRemove.has(n.id) && !n.isRead
      ).length;

      useNotificationStore.setState({
        notifications: remaining,
        unreadCount: Math.max(0, store.unreadCount - removedUnread),
      });
    }

    // Also refresh friend lists since this likely means a request was cancelled
    if (data.reason === 'friend_request_cancelled') {
      useFriendStore.getState().fetchPendingRequests();
    }
  });

  // Real-time friend list sync — any friend action (send/accept/decline/cancel/unfriend)
  // triggers a refresh of the relevant stores
  channel.on('friend_list:updated', (payload) => {
    logger.log('Friend list updated:', payload);
    const friendStore = useFriendStore.getState();
    friendStore.fetchFriends();
    friendStore.fetchPendingRequests();
    friendStore.fetchSentRequests();
  });

  channel.on('message_preview', (payload) => {
    logger.log('Message preview:', payload);
  });

  channel.on('conversation_created', (payload) => {
    logger.log('New conversation created:', payload);

     
    const data = payload as { conversation: Record<string, unknown> };
    if (data.conversation) {
       
      const normalized = normalizeConversation(data.conversation) as unknown as Conversation; // safe downcast – structural boundary
      logger.debug('Normalized conversation:', normalized);
      useChatStore.getState().addConversation(normalized);
    }
  });

  channel.on('conversation_updated', (payload) => {
    logger.log('Conversation updated:', payload);

     
    const data = payload as { conversation: Partial<Conversation> & { id: string } };
    if (data.conversation?.id) {
      useChatStore.getState().updateConversation(data.conversation);
    }
  });

  channel.on('contact_presence', (payload) => {
     
    const data = payload as { contacts?: Record<string, { online?: boolean }> };
    const contacts = data.contacts || {};
    const onlineSet = new Set<string>();

    Object.entries(contacts).forEach(([uid, status]) => {
      if (status?.online) onlineSet.add(uid);
    });

    onlineUsers.set('lobby', onlineSet);
    logger.log('Contact presence snapshot:', onlineSet.size);
  });

  channel.on('contact_status_changed', (payload) => {
     
    const data = payload as { user_id: string; online: boolean };
    const onlineSet = onlineUsers.get('lobby') || new Set<string>();

    if (data.online) {
      onlineSet.add(data.user_id);
      notifyStatusChange('lobby', data.user_id, true);
    } else {
      onlineSet.delete(data.user_id);
      notifyStatusChange('lobby', data.user_id, false);
    }

    onlineUsers.set('lobby', onlineSet);
  });

  // Incoming WebRTC calls
  channel.on('incoming_call', (payload) => {
    logger.log('Incoming call received:', payload);

     
    const data = payload as { room_id: string; caller_id: string; type: 'audio' | 'video' };

    const callerUser = useChatStore
      .getState()
      .conversations.flatMap((conv) => conv.participants)
      .find((p) => p.userId === data.caller_id);

    const incomingCall: IncomingCall = {
      roomId: data.room_id,
      callerId: data.caller_id,
      callerName: callerUser?.user?.username || callerUser?.user?.displayName || 'Unknown User',
      callerAvatar: callerUser?.user?.avatarUrl || null,
      type: data.type,
      timestamp: Date.now(),
    };

    useIncomingCallStore.getState().setIncomingCall(incomingCall);
  });

  channel
    .join()
    .receive('ok', () => logger.log(`Joined user channel: ${topic}`))
    .receive('error', (resp: unknown) => {
      logger.error(`Failed to join user channel: ${topic}`, resp);
      channels.delete(topic);
    });

  channels.set(topic, channel);
  return channel;
}

/**
 * Leave and clean up the user channel.
 */
export function leaveUserChannel(userId: string, channels: Map<string, Channel>): void {
  const topic = `user:${userId}`;
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
  }
}

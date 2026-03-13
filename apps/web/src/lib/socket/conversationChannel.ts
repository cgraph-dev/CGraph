/**
 * Conversation Channel Handlers
 *
 * Manages joining/leaving DM conversation channels with presence
 * tracking, message events, typing indicators, and reactions.
 *
 * @module lib/socket/conversationChannel
 */

import type { Socket, Channel } from 'phoenix';
import { Presence } from 'phoenix';
import { useChatStore, type Message } from '@/modules/chat/store';
import { useAuthStore } from '@/modules/auth/store';
import { socketLogger as logger } from '../logger';
import { normalizeMessage } from '../apiUtils';

/**
 * Join a conversation channel with full presence and event handling.
 */
export function joinConversation(
  socket: Socket | null,
  conversationId: string,
  channels: Map<string, Channel>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>,
  channelHandlersSetUp: Set<string>,
  lastJoinAttempts: Map<string, number>,
  joinDebounceMs: number,
  notifyStatusChange: (conversationId: string, userId: string, isOnline: boolean) => void,
  connectFn: () => Promise<void>
): Channel | null {
  const topic = `conversation:${conversationId}`;

  // Debounce rapid join attempts
  const now = Date.now();
  const lastAttempt = lastJoinAttempts.get(topic) || 0;
  if (now - lastAttempt < joinDebounceMs) {
    logger.log(`Debouncing join for ${topic}`);
    return channels.get(topic) || null;
  }

  const existingChannel = channels.get(topic);
  if (existingChannel) {
    const state = existingChannel.state;
    if (state === 'joined' || state === 'joining') {
      return existingChannel;
    }
    channels.delete(topic);
    channelHandlersSetUp.delete(topic);
    presences.delete(topic);
    onlineUsers.delete(conversationId);
  }

  if (!socket) {
    logger.warn('Cannot join conversation: socket not connected');
    connectFn().then(() => {
      if (!channels.has(topic)) {
        // Retry after reconnect — caller should re-invoke
        logger.log('Socket reconnected, conversation join can be retried');
      }
    });
    return null;
  }

  if (!socket.isConnected()) {
    logger.warn('Socket exists but not connected, waiting...');
    return null;
  }

  lastJoinAttempts.set(topic, now);
  const channel = socket.channel(topic, {});
  channels.set(topic, channel);

  if (!channelHandlersSetUp.has(topic)) {
    channelHandlersSetUp.add(topic);

    const presence = new Presence(channel);
    presences.set(topic, presence);
    onlineUsers.set(conversationId, new Set());

    presence.onSync(() => {
      const onlineSet = new Set<string>();
      presence.list((id: string) => {
        onlineSet.add(id);
        return id;
      });

      const previousSet = onlineUsers.get(conversationId) || new Set();
      onlineSet.forEach((uid) => {
        if (!previousSet.has(uid)) notifyStatusChange(conversationId, uid, true);
      });
      previousSet.forEach((uid) => {
        if (!onlineSet.has(uid)) notifyStatusChange(conversationId, uid, false);
      });

      onlineUsers.set(conversationId, onlineSet);
      if (
        import.meta.env.DEV &&
        (previousSet.size !== onlineSet.size ||
          Array.from(previousSet).some((u) => !onlineSet.has(u)))
      ) {
        logger.log(`Presence sync for ${conversationId}:`, Array.from(onlineSet));
      }
    });

    presence.onJoin((id: string) => {
      onlineUsers.get(conversationId)?.add(id);
    });

    presence.onLeave(() => {
      // Handled by onSync
    });

    channel.on('new_message', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { message: Record<string, unknown> };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const normalized = normalizeMessage(data.message) as unknown as Message; // safe downcast – structural boundary
      logger.log('Received new_message:', normalized);

      // Route through decrypt pipeline — handles encrypted + unencrypted messages
      useChatStore.getState().decryptAndAddMessage(normalized);

      // Auto-acknowledge delivery: push msg_ack back to the server
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId && normalized.senderId !== currentUserId) {
        channel.push('msg_ack', { message_id: normalized.id });
      }
    });

    channel.on('msg_delivered', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { message_id: string; conversation_id?: string };
      const convId = data.conversation_id || conversationId;
      useChatStore.getState().updateMessageStatus(convId, data.message_id, 'delivered');
    });

    channel.on('message_read', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as {
        message_id: string;
        user_id: string;
        read_at: string;
        conversation_id?: string;
      };
      const convId = data.conversation_id || conversationId;
      const store = useChatStore.getState();
      store.addReadReceipt(convId, data.message_id, data.user_id, data.read_at);
      store.updateMessageStatus(convId, data.message_id, 'read');
    });

    channel.on('message_updated', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { message: Record<string, unknown> };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const normalized = normalizeMessage(data.message) as unknown as Message; // safe downcast – structural boundary
      useChatStore.getState().updateMessage(normalized);
    });

    channel.on('message_deleted', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { message_id: string };
      useChatStore.getState().markMessageDeleted(data.message_id);
    });

    channel.on('link_preview_updated', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { message: Record<string, unknown> };
      if (data.message) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const normalized = normalizeMessage(data.message) as unknown as Message;
        useChatStore.getState().updateMessage(normalized);
      }
    });

    channel.on('typing', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { user_id: string; is_typing: boolean; started_at?: string };
      useChatStore
        .getState()
        .setTypingUser(conversationId, data.user_id, data.is_typing, data.started_at);
    });

    channel.on('presence_state', (state) => logger.log('Presence state:', state));
    channel.on('presence_diff', (diff) => logger.log('Presence diff:', diff));

    channel.on('reaction_added', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as {
        message_id: string;
        user_id: string;
        emoji: string;
        user?: { id: string; username: string; display_name?: string; avatar_url?: string };
      };
      useChatStore
        .getState()
        .addReactionToMessage(data.message_id, data.emoji, data.user_id, data.user?.username);
    });

    channel.on('reaction_removed', (payload) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = payload as { message_id: string; user_id: string; emoji: string };
      useChatStore.getState().removeReactionFromMessage(data.message_id, data.emoji, data.user_id);
    });
  }

  channel
    .join()
    .receive('ok', () => logger.log(`Joined conversation ${conversationId}`))
    .receive('error', (resp: unknown) => {
      logger.error(`Failed to join conversation ${conversationId}:`, resp);
      channels.delete(topic);
      channelHandlersSetUp.delete(topic);
      lastJoinAttempts.delete(topic);
    });

  return channel;
}

/**
 * Leave and clean up a conversation channel.
 */
export function leaveConversation(
  conversationId: string,
  channels: Map<string, Channel>,
  channelHandlersSetUp: Set<string>,
  presences: Map<string, Presence>,
  onlineUsers: Map<string, Set<string>>,
  lastJoinAttempts: Map<string, number>
): void {
  const topic = `conversation:${conversationId}`;
  const channel = channels.get(topic);
  if (channel) {
    logger.log(`Leaving conversation: ${topic}`);
    channel.leave();
    channels.delete(topic);
    channelHandlersSetUp.delete(topic);
    presences.delete(topic);
    onlineUsers.delete(conversationId);
    lastJoinAttempts.delete(topic);
  }
}

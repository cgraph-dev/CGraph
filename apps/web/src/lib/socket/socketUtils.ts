/**
 * Socket Utility Methods
 *
 * Utility functions for sending typing indicators, reactions,
 * and peeking conversation presence.
 *
 * @module lib/socket/socketUtils
 */

import type { Socket, Channel } from 'phoenix';
import { useChatStore } from '@/modules/chat/store';

/**
 * Send a typing indicator on a channel topic.
 */
export function sendTyping(topic: string, isTyping: boolean, channels: Map<string, Channel>) {
  const channel = channels.get(topic);
  if (channel) {
    channel.push('typing', { typing: isTyping, is_typing: isTyping });
  }
}

/**
 * Send or remove a reaction on a message.
 */
export function sendReaction(
  conversationId: string,
  messageId: string,
  emoji: string,
  action: 'add' | 'remove',
  channels: Map<string, Channel>
): void {
  const topic = `conversation:${conversationId}`;
  const channel = channels.get(topic);
  if (channel?.state === 'joined') {
    const eventName = action === 'add' ? 'add_reaction' : 'remove_reaction';
    channel.push(eventName, { message_id: messageId, emoji });
  }
}

/**
 * Temporarily join conversations to peek at presence, then auto-leave.
 */
export async function peekConversationsPresence(
  conversationIds: string[],
  socket: Socket | null,
  channels: Map<string, Channel>,
  peekTimeouts: Set<ReturnType<typeof setTimeout>>,
  connectFn: () => Promise<void>,
  joinConversationFn: (id: string) => Channel | null,
  leaveConversationFn: (id: string) => void
): Promise<() => void> {
  if (!socket?.isConnected()) {
    try {
      await connectFn();
    } catch {
      return () => {};
    }
  }

  const channelsToLeave: string[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  conversationIds.forEach((convId) => {
    const topic = `conversation:${convId}`;
    const existingChannel = channels.get(topic);
    if (!existingChannel || existingChannel.state !== 'joined') {
      joinConversationFn(convId);
      channelsToLeave.push(convId);
    }
  });

  if (channelsToLeave.length > 0) {
    timeoutId = setTimeout(() => {
      if (timeoutId) peekTimeouts.delete(timeoutId);
      channelsToLeave.forEach((convId) => {
        const { activeConversationId } = useChatStore.getState();
        if (convId !== activeConversationId) {
          leaveConversationFn(convId);
        }
      });
    }, 2000);
    peekTimeouts.add(timeoutId);
  }

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      peekTimeouts.delete(timeoutId);
    }
    channelsToLeave.forEach((convId) => {
      const { activeConversationId } = useChatStore.getState();
      if (convId !== activeConversationId) {
        leaveConversationFn(convId);
      }
    });
  };
}

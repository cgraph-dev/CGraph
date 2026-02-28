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

// ── Debounced Typing ─────────────────────────────────────────────────

/** Typing throttle/debounce state per topic. */
const typingState = new Map<
  string,
  { lastSentAt: number; inactivityTimer: ReturnType<typeof setTimeout> | null }
>();

const TYPING_THROTTLE_MS = 3000; // Max once per 3 seconds
const TYPING_INACTIVITY_MS = 5000; // Auto-stop after 5 seconds of inactivity

/**
 * Debounced typing indicator.
 *
 * - Throttles `isTyping=true` pushes to max once per 3 seconds.
 * - After 5 seconds of inactivity, auto-sends `isTyping=false`.
 * - `isTyping=false` is always sent immediately.
 */
export function sendTypingDebounced(
  topic: string,
  isTyping: boolean,
  channels: Map<string, Channel>
) {
  let state = typingState.get(topic);
  if (!state) {
    state = { lastSentAt: 0, inactivityTimer: null };
    typingState.set(topic, state);
  }

  // Clear existing inactivity timer
  if (state.inactivityTimer) {
    clearTimeout(state.inactivityTimer);
    state.inactivityTimer = null;
  }

  if (!isTyping) {
    // Always send stop-typing immediately
    sendTyping(topic, false, channels);
    state.lastSentAt = 0;
    return;
  }

  // Throttle: only send if enough time has passed since last send
  const now = Date.now();
  if (now - state.lastSentAt >= TYPING_THROTTLE_MS) {
    sendTyping(topic, true, channels);
    state.lastSentAt = now;
  }

  // Set inactivity timer: auto-send stop after 5s of no further calls
  state.inactivityTimer = setTimeout(() => {
    sendTyping(topic, false, channels);
    state!.lastSentAt = 0;
    state!.inactivityTimer = null;
  }, TYPING_INACTIVITY_MS);
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

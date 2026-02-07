/**
 * Chat Store — Utility Functions
 *
 * Pure helper functions used across chat store action slices.
 *
 * @module modules/chat/store/chatStore.utils
 */

import type { Message, Reaction } from './chatStore.types';

/**
 * Finds the conversation ID that contains a given message.
 * Returns null if the message is not found in any conversation.
 */
export function findConversationForMessage(
  messages: Record<string, { id: string }[]>,
  messageId: string
): string | null {
  for (const [convId, convMessages] of Object.entries(messages)) {
    if (convMessages.some((msg) => msg.id === messageId)) {
      return convId;
    }
  }
  return null;
}

/**
 * Updates a message's reactions across all conversations.
 * Returns a new messages object with the updated message.
 */
export function updateMessageReactions(
  messages: Record<string, Message[]>,
  messageId: string,
  updateFn: (reactions: Reaction[]) => Reaction[]
): Record<string, Message[]> {
  const updatedMessages: Record<string, Message[]> = {};

  for (const [convId, convMessages] of Object.entries(messages)) {
    const messageIndex = convMessages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
      updatedMessages[convId] = convMessages;
      continue;
    }

    const message = convMessages[messageIndex];
    if (!message) {
      updatedMessages[convId] = convMessages;
      continue;
    }

    const updatedReactions = updateFn(message.reactions || []);
    const updatedMessage: Message = { ...message, reactions: updatedReactions };
    const updatedList = [...convMessages];
    updatedList[messageIndex] = updatedMessage;
    updatedMessages[convId] = updatedList;
  }

  return updatedMessages;
}

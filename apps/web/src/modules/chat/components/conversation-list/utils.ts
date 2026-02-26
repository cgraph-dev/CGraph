/**
 * ConversationList utility functions
 * @module modules/chat/components/conversation-list
 */

import { format, isToday, isYesterday } from 'date-fns';
import type { Conversation } from '@/modules/chat/store';
import { getAvatarBorderId } from '@/lib/utils';

/**
 * unknown for the chat module.
 */
/**
 * Retrieves conversation name.
 *
 * @param conversation - The conversation.
 * @param currentUserId - The current user id.
 * @returns The conversation name.
 */
export function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.isGroup) {
    return conversation.name || 'Group Chat';
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.displayName || otherParticipant?.user?.username || 'Unknown';
}

/**
 * unknown for the chat module.
 */
/**
 * Retrieves conversation avatar.
 *
 * @param conversation - The conversation.
 * @param currentUserId - The current user id.
 * @returns The conversation avatar.
 */
export function getConversationAvatar(
  conversation: Conversation,
  currentUserId?: string
): string | null {
  if (conversation.isGroup) {
    return null;
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.avatarUrl || null;
}

/**
 * unknown for the chat module.
 */
/**
 * Retrieves conversation avatar border id.
 *
 * @param conversation - The conversation.
 * @param currentUserId - The current user id.
 * @returns The conversation avatar border id.
 */
export function getConversationAvatarBorderId(
  conversation: Conversation,
  currentUserId?: string
): string | null {
  if (conversation.isGroup) {
    return null;
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
   
  const user = (otherParticipant as Record<string, unknown> | undefined)?.user; // type assertion: dynamic participant shape
  return getAvatarBorderId(user);
}

/**
 * unknown for the chat module.
 */
/**
 * Retrieves conversation online status.
 *
 * @param conversation - The conversation.
 * @param currentUserId - The current user id.
 * @returns The conversation online status.
 */
export function getConversationOnlineStatus(
  conversation: Conversation,
  currentUserId?: string
): boolean {
  if (conversation.isGroup) return false;
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.status === 'online';
}

/**
 * unknown for the chat module.
 */
/**
 * Formats message time.
 *
 * @param dateString - The date string.
 * @returns The processed result.
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

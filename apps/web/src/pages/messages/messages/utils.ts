/**
 * Messages Utilities
 *
 * Helper functions for the messages page.
 */

import type { Conversation } from '@/modules/chat/store';
import { getAvatarBorderId } from '@/lib/utils';

/**
 * Get conversation display name
 */
export function getConversationName(conv: Conversation, currentUserId: string): string {
  if (conv.name) return conv.name;
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
    if (otherParticipant) {
      return (
        otherParticipant.nickname ||
        otherParticipant.user.displayName ||
        otherParticipant.user.username
      );
    }
  }
  return 'Unknown';
}

/**
 * Get conversation avatar URL
 */
export function getConversationAvatar(conv: Conversation, currentUserId: string): string | null {
  if (conv.avatarUrl) return conv.avatarUrl;
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.user.avatarUrl;
    }
  }
  return null;
}

/**
 * Get conversation avatar border ID
 */
export function getConversationAvatarBorderId(
  conv: Conversation,
  currentUserId: string
): string | null {
  if (conv.type === 'direct') {
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
     
    const user = (otherParticipant as Record<string, unknown> | undefined)?.user; // safe downcast – structural boundary
    return getAvatarBorderId(user);
  }

  return getAvatarBorderId(conv);
}

/**
 * Filter conversations by search query
 */
export function filterConversations(
  conversations: Conversation[],
  searchQuery: string,
  currentUserId: string
): Conversation[] {
  if (!searchQuery) return conversations;

  return conversations.filter((conv) => {
    const name = getConversationName(conv, currentUserId);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });
}

/**
 * ConversationList utility functions
 * @module modules/chat/components/conversation-list
 */

import { format, isToday, isYesterday } from 'date-fns';
import type { Conversation } from '@/stores/chatStore';
import { getAvatarBorderId } from '@/lib/utils';

export function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.isGroup) {
    return conversation.name || 'Group Chat';
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.displayName || otherParticipant?.user?.username || 'Unknown';
}

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

export function getConversationAvatarBorderId(
  conversation: Conversation,
  currentUserId?: string
): string | null {
  if (conversation.isGroup) {
    return null;
  }
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  const user = (otherParticipant as Record<string, unknown> | undefined)?.user;
  return getAvatarBorderId(user);
}

export function getConversationOnlineStatus(
  conversation: Conversation,
  currentUserId?: string
): boolean {
  if (conversation.isGroup) return false;
  const otherParticipant = conversation.participants?.find((p) => p.userId !== currentUserId);
  return otherParticipant?.user?.status === 'online';
}

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

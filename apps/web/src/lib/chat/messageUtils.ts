/**
 * Message Utility Functions
 *
 * Helper functions for message display and formatting.
 *
 * @module lib/chat/messageUtils
 * @version 1.0.0
 */

import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import type { Message } from '@/stores/chatStore';

/**
 * Format a date for display as a message group header
 */
export function formatDateHeader(date: Date): string {
  if (!date || isNaN(date.getTime())) return 'Unknown';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format last seen timestamp into human-readable text
 */
export function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return 'Offline';

  const lastSeen = new Date(lastSeenAt);
  if (isNaN(lastSeen.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;
  return `Last seen ${format(lastSeen, 'MMM d')}`;
}

/**
 * Safe date parser that handles various formats and invalid dates
 */
export function parseMessageDate(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Group messages by date for display with date headers
 */
export interface MessageGroup {
  date: Date;
  messages: Message[];
}

export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groupedMessages: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((msg) => {
    const msgDate = parseMessageDate(msg.createdAt);
    if (!currentGroup || !isSameDay(currentGroup.date, msgDate)) {
      currentGroup = { date: msgDate, messages: [msg] };
      groupedMessages.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return groupedMessages;
}

/**
 * GroupChannel Utilities
 *
 * Helper functions and utilities for the group channel page.
 */

import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import type { ChannelMessage, GroupedMessages } from './types';

/**
 * Format date header text
 */
export function formatDateHeader(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format message timestamp
 */
export function formatMessageTime(date: Date): string {
  return format(date, 'MM/dd/yyyy h:mm a');
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: ChannelMessage[]): GroupedMessages[] {
  const groupedMessages: GroupedMessages[] = [];
  let currentGroup: GroupedMessages | null = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    if (!currentGroup || !isSameDay(currentGroup.date, msgDate)) {
      currentGroup = { date: msgDate, messages: [msg] };
      groupedMessages.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return groupedMessages;
}

/**
 * Get first character of username for avatar fallback
 */
export function getAvatarInitial(username?: string | null, displayName?: string | null): string {
  return (username || displayName || '?').charAt(0).toUpperCase();
}

/**
 * Get display name for a user
 */
export function getDisplayName(username?: string | null, displayName?: string | null): string {
  return displayName || username || 'Unknown User';
}

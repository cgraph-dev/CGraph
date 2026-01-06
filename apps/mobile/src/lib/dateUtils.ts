/**
 * Date utility functions with safe error handling.
 * 
 * These functions prevent "Invalid time value" RangeError by validating
 * date strings before parsing. This is critical for mobile where backend
 * data might have null/undefined dates or invalid formats.
 */

import { formatDistanceToNow } from 'date-fns';

/**
 * Check if a date string is valid and can be parsed.
 */
export function isValidDate(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Safely parse a date string, returning null if invalid.
 */
export function safeParseDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Safely format a date as relative time (e.g., "2 hours ago").
 * Returns empty string for invalid dates.
 */
export function safeFormatDistanceToNow(
  dateString: string | undefined | null,
  options?: { addSuffix?: boolean }
): string {
  const date = safeParseDate(dateString);
  if (!date) return '';
  
  try {
    return formatDistanceToNow(date, { addSuffix: true, ...options });
  } catch {
    return '';
  }
}

/**
 * Safely format a date as time (e.g., "2:30 PM").
 * Returns empty string for invalid dates.
 */
export function safeFormatTime(
  dateString: string | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = safeParseDate(dateString);
  if (!date) return '';
  
  try {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  } catch {
    return '';
  }
}

/**
 * Safely format a date as relative time for messages.
 * Shows "just now", "Xh ago", "Xd ago", "Xw ago".
 * Returns empty string for invalid dates.
 */
export function safeFormatMessageTime(dateString: string | undefined | null): string {
  const date = safeParseDate(dateString);
  if (!date) return '';
  
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return `${Math.floor(diffHours / 168)}w ago`;
  } catch {
    return '';
  }
}

/**
 * Safely format a date for conversation list (smart time display).
 * Shows time for today, "Yesterday", weekday, or date.
 * Returns empty string for invalid dates.
 */
export function safeFormatConversationTime(dateString: string | undefined | null): string {
  const date = safeParseDate(dateString);
  if (!date) return '';
  
  try {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  } catch {
    return '';
  }
}

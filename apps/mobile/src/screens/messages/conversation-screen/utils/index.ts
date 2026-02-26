/**
 * ConversationScreen Utilities
 *
 * Helper functions for message processing, file handling, and reactions.
 *
 * @module screens/messages/ConversationScreen
 */

import type { Message } from '../../../../types';

interface ProcessedReaction {
  emoji: string;
  count: number;
  users: Array<{
    id: string;
    username: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    status: string;
  }>;
  hasReacted: boolean;
}

type ProcessedMessage = Message;

// =============================================================================
// MIME Type Utilities
// =============================================================================

/** MIME type mapping for common file extensions */
const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  // Videos
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
};

/**
 * Get MIME type from file extension or filename.
 *
 * @param filename - The filename to extract MIME type from
 * @param defaultType - Default MIME type if extension not found
 * @returns The MIME type string
 */
export function getMimeType(filename: string | undefined, defaultType: string): string {
  if (!filename) return defaultType;

  const ext = filename.toLowerCase().split('.').pop();
  return ext ? MIME_TYPE_MAP[ext] || defaultType : defaultType;
}

/**
 * File icon mapping by extension.
 */
const FILE_ICON_MAP: Record<string, string> = {
  pdf: 'document-text-outline',
  doc: 'document-text-outline',
  docx: 'document-text-outline',
  xls: 'grid-outline',
  xlsx: 'grid-outline',
  ppt: 'easel-outline',
  pptx: 'easel-outline',
  zip: 'archive-outline',
  rar: 'archive-outline',
  '7z': 'archive-outline',
  mp3: 'musical-notes-outline',
  wav: 'musical-notes-outline',
  aac: 'musical-notes-outline',
  mp4: 'videocam-outline',
  mov: 'videocam-outline',
  avi: 'videocam-outline',
  txt: 'document-outline',
};

/**
 * Get appropriate Ionicon name for a file type based on extension.
 *
 * @param filename - The filename to get icon for
 * @returns The Ionicon name string
 */
export function getFileIcon(filename?: string): string {
  if (!filename) return 'document-outline';
  const ext = filename.toLowerCase().split('.').pop();
  return ext ? FILE_ICON_MAP[ext] || 'document-outline' : 'document-outline';
}

/**
 * Check if a MIME type represents an image.
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if a MIME type represents a video.
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if a MIME type represents an audio file.
 */
export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

// =============================================================================
// Reaction Processing
// =============================================================================

/**
 * Process messages to add hasReacted flag based on current user.
 *
 * @param messages - Array of messages to process
 * @param currentUserId - The current user's ID
 * @returns Processed messages with hasReacted flags
 */
export function processMessagesWithReactions(
  messages: Message[],
  currentUserId: string | undefined
): ProcessedMessage[] {
  if (!currentUserId) return messages;

  return messages.map((msg) => {
    if (!msg.reactions || msg.reactions.length === 0) return msg;

    const processedReactions: ProcessedReaction[] = msg.reactions.map((reaction) => {
      // Check if current user is in the users array for this reaction
      // Handle multiple formats:
      // 1. Array of user objects: [{ id: "...", username: "..." }, ...]
      // 2. Array of user IDs: ["user-id-1", "user-id-2", ...]
      // 3. Mixed formats from different backend responses
      const hasReacted =
        reaction.users?.some((u) => {
          // If u is a string (just user ID), compare directly
          if (typeof u === 'string') {
            return String(u) === String(currentUserId);
          }
          // If u is an object, check various ID fields
           
          const uObj = u as { id?: string; user_id?: string };
          return (
            String(uObj.id) === String(currentUserId) ||
            String(uObj.user_id) === String(currentUserId)
          );
        }) || false;

      // Normalize users array to always be objects with id field
      const normalizedUsers =
        reaction.users?.map((u) => {
          if (typeof u === 'string') {
            return {
              id: u,
              username: null,
              display_name: null,
              avatar_url: null,
              status: 'offline' as const,
            };
          }
          return u;
        }) || [];

      return {
        ...reaction,
        users: normalizedUsers,
        hasReacted,
      };
    });

    return { ...msg, reactions: processedReactions };
  });
}

// =============================================================================
// Time Formatting
// =============================================================================

/**
 * Format a timestamp for display in message list.
 *
 * @param timestamp - ISO timestamp or Date object
 * @returns Formatted time string
 */
export function formatMessageTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Within last week - show day name
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (daysDiff < 7) {
    return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Older - show full date
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration in seconds to MM:SS format.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// File Size Formatting
// =============================================================================

/**
 * Format file size in bytes to human-readable string.
 *
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// =============================================================================
// Message Grouping
// =============================================================================

/**
 * Check if two messages should be grouped together.
 *
 * Messages are grouped if they're from the same sender and within 5 minutes.
 *
 * @param current - Current message
 * @param previous - Previous message
 * @returns Whether the messages should be grouped
 */
export function shouldGroupMessages(current: Message, previous: Message): boolean {
  if (!previous) return false;
  if (current.sender_id !== previous.sender_id) return false;

  const currentTime = new Date(current.inserted_at).getTime();
  const previousTime = new Date(previous.inserted_at).getTime();
  const timeDiff = currentTime - previousTime;

  // Group if within 5 minutes (300000 ms)
  return timeDiff < 300000;
}

// =============================================================================
// Date/Time Formatting Utilities
// =============================================================================

/**
 * Format a date string to simple local time (HH:MM format).
 * Handles invalid dates gracefully. Use this for message timestamps.
 *
 * @param dateString - The date string to format
 * @returns Formatted time string or empty string if invalid
 */
export function formatSimpleTime(dateString: string | undefined | null): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Format last seen timestamp for display.
 * Returns human-readable relative time.
 *
 * @param lastSeenAt - The last seen timestamp
 * @returns Formatted string like "just now", "5m ago", "yesterday", etc.
 */
export function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return '';

  const lastSeen = new Date(lastSeenAt);
  if (isNaN(lastSeen.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return lastSeen.toLocaleDateString();
}

/**
 * Get message status icon and color based on delivery state.
 *
 * @param status - Message status string
 * @param colors - Theme colors object
 * @returns Object with icon name and color
 */
export function getMessageStatusInfo(
  status: string | undefined,
  colors: { textTertiary: string }
): { icon: string; color: string } {
  switch (status) {
    case 'sending':
      return { icon: 'time-outline', color: colors.textTertiary };
    case 'sent':
      return { icon: 'checkmark-outline', color: colors.textTertiary };
    case 'delivered':
      return { icon: 'checkmark-done-outline', color: colors.textTertiary };
    case 'read':
      return { icon: 'checkmark-done-outline', color: '#3b82f6' };
    case 'failed':
      return { icon: 'alert-circle-outline', color: '#ef4444' };
    default:
      return { icon: 'checkmark-outline', color: colors.textTertiary };
  }
}

// =============================================================================
// Message Validation Utilities
// =============================================================================

/**
 * Check if a message is valid for rendering.
 * Returns false for messages without ID, sender, or content.
 */
export function isValidMessage(message: Message): boolean {
  if (!message.id) return false;

  // Must have sender info
  const hasSender = message.sender_id || message.sender?.id;
  if (!hasSender) return false;

  // Must have content or media
  const hasTextContent =
    message.content && message.content.trim().length > 0 && message.content !== '[Voice Message]';
  const hasMediaUrl = message.metadata?.url || message.file_url;
  const isVoiceWithUrl = message.type === 'voice' && hasMediaUrl;
  const isFileWithUrl = (message.type === 'file' || message.type === 'image') && hasMediaUrl;

  return hasTextContent || isVoiceWithUrl || isFileWithUrl;
}

/**
 * Extract sender ID from message with proper string conversion.
 */
export function getMessageSenderId(message: Message): string {
  if (message.sender_id) return String(message.sender_id);
  if (message.sender?.id) return String(message.sender.id);
  return '';
}

/**
 * Check if message is from current user.
 */
export function isOwnMessage(message: Message, currentUserId: string | undefined): boolean {
  if (!currentUserId) return false;
  const senderId = getMessageSenderId(message);
  return senderId !== '' && String(currentUserId) === senderId;
}

/**
 * Extract sender display info from message.
 */
export function getSenderInfo(message: Message): {
  displayName: string;
  avatarUrl: string | undefined;
} {
  const displayName =
    message.sender?.display_name ||
     
    (message.sender as Record<string, unknown>)?.displayName ||
    message.sender?.username ||
    'User';

  const avatarUrl =
     
    message.sender?.avatar_url || (message.sender as Record<string, unknown>)?.avatarUrl;

  return {
    displayName: String(displayName),
     
    avatarUrl: avatarUrl as string | undefined,
  };
}

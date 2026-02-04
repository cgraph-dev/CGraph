/**
 * ConversationScreen Utilities
 *
 * Helper functions for message processing, file handling, and reactions.
 *
 * @module screens/messages/ConversationScreen
 */

import type { Message } from '../../../types';
import type { ProcessedMessage, ProcessedReaction } from './types';

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

/**
 * Data normalizers for API and WebSocket responses.
 * 
 * Handles transformation between backend camelCase format and mobile snake_case conventions.
 * Provides robust extraction of message metadata for voice, file, and image attachments.
 * Resolves relative media URLs to absolute URLs for proper resource loading.
 */

import { Message, UserBasic } from '../types';
import { API_URL } from './api';

/**
 * Resolves a potentially relative URL to an absolute URL.
 * 
 * Backend may return relative paths like `/uploads/voice/uuid.opus` which need
 * to be prefixed with the API base URL for mobile clients to access.
 * 
 * @param url - The URL to resolve (may be relative or absolute)
 * @returns The absolute URL, or undefined if input was falsy
 */
function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  
  // Already an absolute URL (http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Data URLs should pass through unchanged
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Relative URL - prefix with API base URL
  // Ensure single slash between base and path
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${base}${path}`;
}

/**
 * Normalizes a message object from various sources (HTTP API, WebSocket).
 * Converts all formats to snake_case for mobile app compatibility.
 * 
 * Handles three potential sources for file/attachment data:
 * 1. metadata object (pre-populated by backend for voice/file messages)
 * 2. attachment object (from message_json.ex build_attachment)
 * 3. Root-level file fields (fileUrl, fileName, etc.)
 */
export function normalizeMessage(raw: Record<string, unknown>): Message {
  if (!raw || typeof raw !== 'object') {
    return raw as unknown as Message;
  }

  const sender = normalizeSender(raw.sender as Record<string, unknown> | null);
  
  // Extract sender_id - API returns camelCase (senderId), normalize to snake_case
  // Fallback chain: senderId -> sender_id -> sender.id
  const senderId = String(raw.senderId ?? raw.sender_id ?? sender?.id ?? '');
  
  // Determine message type from various possible field names
  const messageType = (raw.type ?? raw.messageType ?? raw.message_type ?? raw.contentType ?? raw.content_type ?? 'text') as Message['type'];
  
  // Extract metadata - backend now sends populated metadata for voice/file messages
  // We check multiple sources to ensure maximum compatibility
  const rawMetadata = raw.metadata as Record<string, unknown> | undefined;
  const attachment = raw.attachment as Record<string, unknown> | null;
  
  // Build final metadata object
  let metadata: Message['metadata'] = {};
  
  // Check if backend already populated metadata with url
  if (rawMetadata && typeof rawMetadata === 'object' && rawMetadata.url) {
    metadata = {
      url: resolveMediaUrl(rawMetadata.url as string),
      filename: (rawMetadata.filename ?? rawMetadata.fileName) as string,
      size: rawMetadata.size as number,
      mimeType: (rawMetadata.mimeType ?? rawMetadata.mime_type) as string,
      duration: rawMetadata.duration as number,
      waveform: rawMetadata.waveform as number[],
      thumbnail: resolveMediaUrl(rawMetadata.thumbnailUrl as string ?? rawMetadata.thumbnail_url as string ?? rawMetadata.thumbnail as string),
      // Include grid_images for multi-photo messages
      grid_images: rawMetadata.grid_images as string[] | undefined,
      image_count: rawMetadata.image_count as number | undefined,
    };
    // Resolve URLs in grid_images array
    if (metadata.grid_images && Array.isArray(metadata.grid_images)) {
      metadata.grid_images = metadata.grid_images.map(url => resolveMediaUrl(url) || url);
    }
  }
  
  // If metadata.url is still missing, try attachment and root-level fields
  if (!metadata || !metadata.url) {
    const attachmentUrl = attachment?.url as string | undefined;
    const fileUrl = attachmentUrl ?? raw.fileUrl ?? raw.file_url;
    
    if (fileUrl) {
      const attachmentFilename = attachment?.filename as string | undefined;
      const attachmentSize = attachment?.size as number | undefined;
      const attachmentMimeType = (attachment?.mime_type ?? attachment?.mimeType) as string | undefined;
      const attachmentThumbnail = (attachment?.thumbnail_url ?? attachment?.thumbnailUrl) as string | undefined;
      
      metadata = {
        url: resolveMediaUrl(fileUrl as string),
        filename: (attachmentFilename ?? raw.fileName ?? raw.file_name) as string,
        size: (attachmentSize ?? raw.fileSize ?? raw.file_size) as number,
        mimeType: (attachmentMimeType ?? raw.fileMimeType ?? raw.file_mime_type) as string,
        duration: rawMetadata?.duration as number,
        waveform: rawMetadata?.waveform as number[],
        thumbnail: resolveMediaUrl(attachmentThumbnail ?? raw.thumbnailUrl as string ?? raw.thumbnail_url as string ?? raw.thumbnail as string),
      };
    }
  }
  
  return {
    id: raw.id as string,
    content: (raw.content ?? '') as string,
    type: messageType,
    attachments: (raw.attachments ?? []) as Message['attachments'],
    metadata: metadata,
    sender: sender,
    sender_id: senderId,
    conversation_id: (raw.conversationId ?? raw.conversation_id ?? null) as string | undefined,
    channel_id: (raw.channelId ?? raw.channel_id ?? null) as string | undefined,
    reply_to_id: (raw.replyToId ?? raw.reply_to_id ?? null) as string | undefined,
    reply_to: raw.replyTo ?? raw.reply_to ? normalizeMessage(raw.replyTo as Record<string, unknown> ?? raw.reply_to as Record<string, unknown>) : undefined,
    reactions: (raw.reactions ?? []) as Message['reactions'],
    is_edited: (raw.isEdited ?? raw.is_edited ?? false) as boolean,
    is_deleted: Boolean(raw.isDeleted ?? raw.is_deleted ?? raw.deletedAt ?? raw.deleted_at ?? false),
    is_pinned: (raw.isPinned ?? raw.is_pinned ?? false) as boolean,
    pinned_at: (raw.pinnedAt ?? raw.pinned_at) as string | undefined,
    pinned_by_id: (raw.pinnedById ?? raw.pinned_by_id) as string | undefined,
    inserted_at: (raw.createdAt ?? raw.created_at ?? raw.insertedAt ?? raw.inserted_at ?? new Date().toISOString()) as string,
    updated_at: (raw.updatedAt ?? raw.updated_at ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
  };
}

/**
 * Normalizes sender data from various formats.
 * Handles both camelCase (from WebSocket) and snake_case (from HTTP API).
 */
function normalizeSender(sender: Record<string, unknown> | null | undefined): UserBasic {
  if (!sender || typeof sender !== 'object') {
    return {
      id: '',
      username: null,
      display_name: null,
      avatar_url: null,
      status: 'offline',
    };
  }

  return {
    id: sender.id as string,
    username: (sender.username ?? null) as string | null,
    display_name: (sender.displayName ?? sender.display_name ?? null) as string | null,
    avatar_url: (sender.avatarUrl ?? sender.avatar_url ?? null) as string | null,
    status: (sender.status ?? 'offline') as string,
    karma: sender.karma as number | undefined,
    is_verified: Boolean(sender.isVerified ?? sender.is_verified ?? false) || undefined,
  };
}

/**
 * Normalizes an array of messages.
 */
export function normalizeMessages(messages: unknown[]): Message[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map((m) => normalizeMessage(m as Record<string, unknown>));
}

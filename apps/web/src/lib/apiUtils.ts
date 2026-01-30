/**
 * API Response Utilities
 *
 * Provides type-safe helper functions for parsing API responses
 * and ensuring consistent data extraction across the application.
 */

// API base URL for resolving relative media paths
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Resolves a potentially relative URL to an absolute URL.
 *
 * Backend may return relative paths like `/uploads/voice/uuid.opus` which need
 * to be prefixed with the API base URL for proper resource loading.
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
 * Safely extracts an array from API response data.
 * Handles various response formats:
 * - Direct array: []
 * - Wrapped in key: { friends: [], requests: [], data: [] }
 * - Nested data: { data: { items: [] } }
 *
 * @param data - The raw API response data
 * @param key - Optional primary key to look for (e.g., 'friends', 'requests')
 * @returns A type-safe array, or empty array if extraction fails
 *
 * @example
 * ```typescript
 * const response = await api.get('/api/v1/friends');
 * const friends = ensureArray<Friend>(response.data, 'friends');
 * ```
 */
export function ensureArray<T>(data: unknown, key?: string): T[] {
  // Handle null/undefined
  if (data == null) {
    return [];
  }

  // Handle direct array
  if (Array.isArray(data)) {
    return data as T[];
  }

  // Handle object with keys
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Try the specified key first
    if (key && Array.isArray(obj[key])) {
      return obj[key] as T[];
    }

    // Try common wrapper keys
    const commonKeys = ['data', 'items', 'results', 'list', 'records'];
    for (const k of commonKeys) {
      if (Array.isArray(obj[k])) {
        return obj[k] as T[];
      }
    }
  }

  return [];
}

/**
 * Safely extracts a single object from API response data.
 * Handles various response formats:
 * - Direct object: { id: '1', name: 'test' }
 * - Wrapped: { data: { id: '1', name: 'test' } }
 * - Wrapped with key: { user: { id: '1', name: 'test' } }
 *
 * @param data - The raw API response data
 * @param key - Optional primary key to look for (e.g., 'user', 'group')
 * @returns The extracted object or null if extraction fails
 *
 * @example
 * ```typescript
 * const response = await api.get('/api/v1/users/123');
 * const user = ensureObject<User>(response.data, 'user');
 * ```
 */
export function ensureObject<T extends object>(data: unknown, key?: string): T | null {
  // Handle null/undefined
  if (data == null) {
    return null;
  }

  // Handle direct object (not array)
  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    // Try the specified key first
    if (key && obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      return obj[key] as T;
    }

    // Try 'data' wrapper
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as T;
    }

    // Return as-is if it looks like the target object (has properties beyond just 'data')
    const keys = Object.keys(obj);
    if (keys.length > 0 && !keys.every((k) => ['data', 'meta', 'status', 'message'].includes(k))) {
      return obj as unknown as T;
    }
  }

  return null;
}

// Type guards for extractPagination
function isNumber(v: unknown): v is number {
  return typeof v === 'number';
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

/**
 * Extract a typed value from multiple possible keys.
 * Returns the first valid value found, or the fallback.
 */
function extractValue<T>(
  meta: Record<string, unknown>,
  keys: string[],
  typeCheck: (v: unknown) => v is T,
  fallback: T
): T {
  for (const key of keys) {
    if (typeCheck(meta[key])) {
      return meta[key];
    }
  }
  return fallback;
}

/**
 * Extracts pagination metadata from API response.
 *
 * @param data - The raw API response data
 * @returns Pagination metadata or defaults
 */
export function extractPagination(data: unknown): {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
} {
  const defaults = {
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };

  if (data == null || typeof data !== 'object') {
    return defaults;
  }

  const obj = data as Record<string, unknown>;
  const meta = (obj.meta || obj.pagination || obj) as Record<string, unknown>;

  return {
    page: extractValue(meta, ['page'], isNumber, defaults.page),
    perPage: extractValue(meta, ['per_page', 'perPage', 'limit'], isNumber, defaults.perPage),
    total: extractValue(meta, ['total', 'total_count'], isNumber, defaults.total),
    totalPages: extractValue(meta, ['total_pages', 'totalPages'], isNumber, defaults.totalPages),
    hasMore: extractValue(meta, ['has_more', 'hasMore'], isBoolean, defaults.hasMore),
  };
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid ID (non-empty string or number)
 */
export function isValidId(value: unknown): value is string | number {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && !isNaN(value))
  );
}

/**
 * Safely extracts an error message from an API error response
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): string {
  if (error == null) {
    return defaultMessage;
  }

  // Handle axios-style errors
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Try response.data.error
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.error === 'string') return data.error;
        // Handle error object with message property: {"error": {"message": "...", "code": "..."}}
        if (data.error && typeof data.error === 'object') {
          const errorObj = data.error as Record<string, unknown>;
          if (typeof errorObj.message === 'string') return errorObj.message;
        }
        if (typeof data.message === 'string') return data.message;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors
            .map((e: unknown) =>
              typeof e === 'string' ? e : (e as Record<string, unknown>)?.message || ''
            )
            .filter(Boolean)
            .join(', ');
        }
      }
    }

    // Try direct message property
    if (typeof err.message === 'string') {
      return err.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}

// ============================================================================
// Type-safe Accessors for Normalized Data
// ============================================================================

/**
 * Type-safe extraction of participant user ID.
 * Handles both camelCase frontend types and snake_case API responses.
 */
export function getParticipantUserId(
  participant: Record<string, unknown> | null | undefined
): string | null {
  if (!participant) return null;
  return (
    (participant.userId as string) ||
    (participant.user_id as string) ||
    ((participant.user as Record<string, unknown>)?.id as string) ||
    (participant.id as string) ||
    null
  );
}

/**
 * Type-safe extraction of participant display name.
 * Tries nickname first, then user display name, then username.
 */
export function getParticipantDisplayName(
  participant: Record<string, unknown> | null | undefined
): string {
  if (!participant) return 'Unknown';
  const user = participant.user as Record<string, unknown> | null;
  return (
    (participant.nickname as string) ||
    (user?.displayName as string) ||
    (user?.display_name as string) ||
    (user?.username as string) ||
    (participant.displayName as string) ||
    (participant.display_name as string) ||
    (participant.username as string) ||
    'Unknown'
  );
}

/**
 * Type-safe extraction of user avatar URL.
 */
export function getParticipantAvatarUrl(
  participant: Record<string, unknown> | null | undefined
): string | null {
  if (!participant) return null;
  const user = participant.user as Record<string, unknown> | null;
  return (
    (user?.avatarUrl as string) ||
    (user?.avatar_url as string) ||
    (participant.avatarUrl as string) ||
    (participant.avatar_url as string) ||
    null
  );
}

/**
 * Type-safe extraction of sender ID from a message.
 */
export function getMessageSenderId(
  message: Record<string, unknown> | null | undefined
): string | null {
  if (!message) return null;
  const sender = message.sender as Record<string, unknown> | null;
  return (
    (message.senderId as string) ||
    (message.sender_id as string) ||
    (sender?.id as string) ||
    (sender?.user_id as string) ||
    null
  );
}

/**
 * Normalizes a message object from various sources (HTTP API, WebSocket).
 * Converts snake_case to camelCase and ensures all required fields exist.
 * Handles both camelCase and snake_case input for maximum compatibility.
 */
export function normalizeMessage(raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const senderId = raw.senderId ?? raw.sender_id ?? null;
  const sender = normalizeSender(raw.sender as Record<string, unknown> | null);
  const contentType = raw.contentType ?? raw.content_type ?? 'text';

  // Build metadata - for voice/audio/file messages, extract from multiple possible sources
  // Priority: existing metadata.url > attachment.url > fileUrl/file_url
  let metadata = (raw.metadata as Record<string, unknown>) || {};
  const attachment = raw.attachment as Record<string, unknown> | null;

  // If metadata already has a URL, ensure it's resolved to absolute
  if (metadata.url) {
    metadata = {
      ...metadata,
      url: resolveMediaUrl(metadata.url as string),
      thumbnailUrl: metadata.thumbnailUrl
        ? resolveMediaUrl(metadata.thumbnailUrl as string)
        : undefined,
    };
  }

  // For voice/audio messages, ensure metadata has the required fields
  if ((contentType === 'voice' || contentType === 'audio') && !metadata.url) {
    // Check attachment object first (from message_json.ex serialization)
    const attachmentUrl = attachment?.url as string | undefined;
    const attachmentFilename = attachment?.filename as string | undefined;
    const attachmentSize = attachment?.size as number | undefined;
    const attachmentMimeType = attachment?.mime_type as string | undefined;

    // Fallback to root-level file fields
    const fileUrl = attachmentUrl ?? raw.fileUrl ?? raw.file_url;
    const fileName = attachmentFilename ?? raw.fileName ?? raw.file_name;
    const fileSize = attachmentSize ?? raw.fileSize ?? raw.file_size;
    const fileMimeType = attachmentMimeType ?? raw.fileMimeType ?? raw.file_mime_type;

    if (fileUrl) {
      metadata = {
        ...metadata,
        url: resolveMediaUrl(fileUrl as string),
        filename: fileName as string,
        size: fileSize as number,
        mimeType: fileMimeType as string,
        duration: metadata.duration,
        waveform: metadata.waveform,
      };
    }
  }

  // For file/image messages, ensure metadata has the required fields
  if ((contentType === 'file' || contentType === 'image') && !metadata.url) {
    // Check attachment object first (from message_json.ex serialization)
    const attachmentUrl = attachment?.url as string | undefined;
    const attachmentFilename = attachment?.filename as string | undefined;
    const attachmentSize = attachment?.size as number | undefined;
    const attachmentThumbnail = attachment?.thumbnail_url as string | undefined;

    // Fallback to root-level file fields
    const fileUrl = attachmentUrl ?? raw.fileUrl ?? raw.file_url;
    const fileName = attachmentFilename ?? raw.fileName ?? raw.file_name;
    const fileSize = attachmentSize ?? raw.fileSize ?? raw.file_size;
    const thumbnailUrl = attachmentThumbnail ?? raw.thumbnailUrl ?? raw.thumbnail_url;

    if (fileUrl) {
      metadata = {
        ...metadata,
        url: resolveMediaUrl(fileUrl as string),
        filename: fileName as string,
        size: fileSize as number,
        thumbnailUrl: resolveMediaUrl(thumbnailUrl as string),
      };
    }
  }

  return {
    id: raw.id,
    conversationId: raw.conversationId ?? raw.conversation_id ?? null,
    channelId: raw.channelId ?? raw.channel_id ?? null,
    senderId: senderId ?? sender?.id ?? null,
    content: raw.content ?? '',
    contentType: contentType,
    messageType: raw.messageType ?? raw.message_type ?? contentType,
    encryptedContent: raw.encryptedContent ?? raw.encrypted_content ?? null,
    isEncrypted: raw.isEncrypted ?? raw.is_encrypted ?? false,
    isEdited: raw.isEdited ?? raw.is_edited ?? false,
    isPinned: raw.isPinned ?? raw.is_pinned ?? false,
    replyToId: raw.replyToId ?? raw.reply_to_id ?? null,
    replyTo: raw.replyTo ?? raw.reply_to ?? null,
    deletedAt: raw.deletedAt ?? raw.deleted_at ?? null,
    metadata: metadata,
    reactions: raw.reactions ?? [],
    sender: sender,
    createdAt:
      raw.createdAt ??
      raw.created_at ??
      raw.insertedAt ??
      raw.inserted_at ??
      new Date().toISOString(),
    updatedAt:
      raw.updatedAt ??
      raw.updated_at ??
      raw.createdAt ??
      raw.created_at ??
      new Date().toISOString(),
    // E2EE fields - extract from metadata or root level
    ephemeralPublicKey:
      metadata?.ephemeral_public_key ?? raw.ephemeralPublicKey ?? raw.ephemeral_public_key ?? null,
    nonce: metadata?.nonce ?? raw.nonce ?? null,
    senderIdentityKey:
      metadata?.sender_identity_key ?? raw.senderIdentityKey ?? raw.sender_identity_key ?? null,
  };
}

/**
 * Normalizes sender data from various formats.
 */
function normalizeSender(
  sender: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!sender || typeof sender !== 'object') {
    return null;
  }

  return {
    id: sender.id,
    username: sender.username,
    displayName: sender.displayName ?? sender.display_name ?? null,
    avatarUrl: sender.avatarUrl ?? sender.avatar_url ?? null,
    avatarBorderId: sender.avatarBorderId ?? sender.avatar_border_id ?? null,
    status: sender.status ?? 'offline',
  };
}

/**
 * Normalizes a conversation participant from API response.
 * Handles both nested user objects and flat structures.
 */
export function normalizeParticipant(raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const userObj = raw.user as Record<string, unknown> | null;
  const userId = raw.userId ?? raw.user_id ?? userObj?.id ?? raw.id;

  return {
    id: raw.id,
    participantId: raw.id,
    userId: userId,
    nickname: raw.nickname ?? null,
    isMuted: raw.isMuted ?? raw.is_muted ?? false,
    mutedUntil: raw.mutedUntil ?? raw.muted_until ?? null,
    joinedAt: raw.joinedAt ?? raw.joined_at ?? raw.insertedAt ?? raw.inserted_at,
    user: userObj
      ? {
          id: userObj.id,
          username: userObj.username,
          displayName: userObj.displayName ?? userObj.display_name ?? null,
          avatarUrl: userObj.avatarUrl ?? userObj.avatar_url ?? null,
          avatarBorderId: userObj.avatarBorderId ?? userObj.avatar_border_id ?? null,
          status: userObj.status ?? 'offline',
        }
      : null,
  };
}

/**
 * Normalizes a conversation object from API response.
 * Ensures all participant data is properly structured.
 */
export function normalizeConversation(raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const participants = raw.participants as Record<string, unknown>[] | null;
  const lastMessage = raw.lastMessage ?? raw.last_message;

  return {
    id: raw.id,
    type: raw.type ?? 'direct',
    name: raw.name ?? null,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? null,
    participants: Array.isArray(participants)
      ? participants.map((p) => normalizeParticipant(p))
      : [],
    lastMessage: lastMessage ? normalizeMessage(lastMessage as Record<string, unknown>) : null,
    lastMessageAt: raw.lastMessageAt ?? raw.last_message_at ?? null,
    unreadCount: raw.unreadCount ?? raw.unread_count ?? 0,
    muted: raw.muted ?? false,
    pinned: raw.pinned ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.insertedAt ?? raw.inserted_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

/**
 * Normalizes an array of conversations.
 */
export function normalizeConversations(conversations: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(conversations)) {
    return [];
  }
  return conversations.map((c) => normalizeConversation(c as Record<string, unknown>));
}

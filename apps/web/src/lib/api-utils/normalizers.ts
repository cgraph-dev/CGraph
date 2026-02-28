/**
 * API Data Normalizers
 *
 * Functions that normalize API response objects from various formats
 * (snake_case, camelCase, nested structures) into a consistent shape.
 */

// API base URL for resolving relative media paths
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/** Type guard for Record<string, unknown> */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Safely extract a string from an unknown value */
function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/** Safely extract a number from an unknown value */
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/**
 * Resolves a potentially relative URL to an absolute URL.
 *
 * Backend may return relative paths like `/uploads/voice/uuid.opus` which need
 * to be prefixed with the API base URL for proper resource loading.
 *
 * @param url - The URL to resolve (may be relative or absolute)
 * @returns The absolute URL, or undefined if input was falsy
 */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
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
 * Normalizes an array of edit history entries from snake_case to camelCase.
 */
function normalizeEdits(raw: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((edit: Record<string, unknown>) => ({
    id: edit.id,
    messageId: edit.messageId ?? edit.message_id,
    previousContent: edit.previousContent ?? edit.previous_content ?? '',
    editNumber: edit.editNumber ?? edit.edit_number ?? 0,
    editedById: edit.editedById ?? edit.edited_by_id ?? '',
    createdAt: edit.createdAt ?? edit.created_at ?? edit.inserted_at ?? '',
  }));
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
  const sender = normalizeSender(isRecord(raw.sender) ? raw.sender : null);
  const contentType = raw.contentType ?? raw.content_type ?? 'text';

  // Build metadata - for voice/audio/file messages, extract from multiple possible sources
  // Priority: existing metadata.url > attachment.url > fileUrl/file_url
  let metadata = isRecord(raw.metadata) ? raw.metadata : {};
  const attachment = isRecord(raw.attachment) ? raw.attachment : null;

  // If metadata already has a URL, ensure it's resolved to absolute
  if (metadata.url) {
    metadata = {
      ...metadata,
      url: resolveMediaUrl(asString(metadata.url)),
      thumbnailUrl: metadata.thumbnailUrl
        ? resolveMediaUrl(asString(metadata.thumbnailUrl))
        : undefined,
    };
  }

  // For voice/audio messages, ensure metadata has the required fields
  if ((contentType === 'voice' || contentType === 'audio') && !metadata.url) {
    // Check attachment object first (from message_json.ex serialization)
    const attachmentUrl = asString(attachment?.url);
    const attachmentFilename = asString(attachment?.filename);
    const attachmentSize = asNumber(attachment?.size);
    const attachmentMimeType = asString(attachment?.mime_type);

    // Fallback to root-level file fields
    const fileUrl = attachmentUrl ?? raw.fileUrl ?? raw.file_url;
    const fileName = attachmentFilename ?? raw.fileName ?? raw.file_name;
    const fileSize = attachmentSize ?? raw.fileSize ?? raw.file_size;
    const fileMimeType = attachmentMimeType ?? raw.fileMimeType ?? raw.file_mime_type;

    if (fileUrl) {
      metadata = {
        ...metadata,
        url: resolveMediaUrl(asString(fileUrl)),
        filename: asString(fileName),
        size: asNumber(fileSize),
        mimeType: asString(fileMimeType),
        duration: metadata.duration,
        waveform: metadata.waveform,
      };
    }
  }

  // For file/image messages, ensure metadata has the required fields
  if ((contentType === 'file' || contentType === 'image') && !metadata.url) {
    // Check attachment object first (from message_json.ex serialization)
    const attachmentUrl = asString(attachment?.url);
    const attachmentFilename = asString(attachment?.filename);
    const attachmentSize = asNumber(attachment?.size);
    const attachmentThumbnail = asString(attachment?.thumbnail_url);

    // Fallback to root-level file fields
    const fileUrl = attachmentUrl ?? raw.fileUrl ?? raw.file_url;
    const fileName = attachmentFilename ?? raw.fileName ?? raw.file_name;
    const fileSize = attachmentSize ?? raw.fileSize ?? raw.file_size;
    const thumbnailUrl = attachmentThumbnail ?? raw.thumbnailUrl ?? raw.thumbnail_url;

    if (fileUrl) {
      metadata = {
        ...metadata,
        url: resolveMediaUrl(asString(fileUrl)),
        filename: asString(fileName),
        size: asNumber(fileSize),
        thumbnailUrl: resolveMediaUrl(asString(thumbnailUrl)),
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
    edits: normalizeEdits(raw.edits),
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
    // Ephemeral / disappearing message support
    expiresAt: raw.expiresAt ?? raw.expires_at ?? null,
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

  const userObj = isRecord(raw.user) ? raw.user : null;
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

  const participants = Array.isArray(raw.participants)
     
    ? (raw.participants as Record<string, unknown>[]) // safe: elements validated by normalizeParticipant
    : null;
  const lastMessage = raw.lastMessage ?? raw.last_message;

  return {
    id: raw.id,
    type: raw.type ?? 'direct',
    name: raw.name ?? null,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? null,
    participants: Array.isArray(participants)
      ? participants.map((p) => normalizeParticipant(p))
      : [],
    lastMessage: isRecord(lastMessage) ? normalizeMessage(lastMessage) : null,
    lastMessageAt: raw.lastMessageAt ?? raw.last_message_at ?? null,
    unreadCount: raw.unreadCount ?? raw.unread_count ?? 0,
    muted: raw.muted ?? false,
    pinned: raw.pinned ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.insertedAt ?? raw.inserted_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    messageTTL: raw.messageTTL ?? raw.message_ttl ?? null,
  };
}

/**
 * Normalizes an array of conversations.
 */
export function normalizeConversations(conversations: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(conversations)) {
    return [];
  }
   
  return conversations.map((c) => normalizeConversation(c as Record<string, unknown>)); // safe: normalizeConversation validates input
}

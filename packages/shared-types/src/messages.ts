/**
 * Message forwarding types.
 * @module
 */

/**
 * Information about a forwarded message's origin.
 */
export interface ForwardedMessageInfo {
  originalMessageId: string;
  originalSenderId: string;
  originalSenderName: string;
}

/**
 * Request body for forwarding a message.
 */
export interface ForwardMessageRequest {
  conversation_ids: string[];
}

/**
 * Response from the forward message endpoint.
 */
export interface ForwardMessageResponse {
  data: {
    forwarded_count: number;
  };
}

/**
 * A saved/bookmarked message.
 */
export interface SavedMessage {
  id: string;
  messageId: string;
  note?: string;
  savedAt: string;
}

/**
 * Configuration for disappearing/ephemeral messages.
 */
export interface DisappearingConfig {
  /** TTL in seconds. null = off, 86400 = 24h, 604800 = 7d, 2592000 = 30d */
  ttl: number | null;
  /** ISO 8601 timestamp when the message expires */
  expiresAt?: string;
}

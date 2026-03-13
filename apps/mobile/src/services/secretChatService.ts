/**
 * Secret Chat Service — HTTP wrappers for secret chat API endpoints.
 *
 * Handles session management, encrypted message relay, and panic wipe.
 * Follows the pattern established by forumService and other services.
 * Uses the shared `api` client from `lib/api`.
 *
 * @module services/secretChatService
 */

import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateSessionPayload {
  recipientId: string;
  conversationId: string;
  sessionId: string;
}

interface RelayMessagePayload {
  conversationId: string;
  recipientId: string;
  ciphertext: string;
  messageId: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const secretChatService = {
  // ─── Session Management ──────────────────────────────────────────────

  /** Fetch a recipient's prekey bundle for PQXDH key exchange. */
  fetchPrekeyBundle: (recipientId: string) =>
    api.get(`/api/v1/secret-chat/prekey-bundle/${recipientId}`),

  /** Create a new secret chat session on the server. */
  createSession: (payload: CreateSessionPayload) =>
    api.post('/api/v1/secret-chat/sessions', payload),

  /** Close and delete a secret chat session. */
  deleteSession: (sessionId: string) => api.delete(`/api/v1/secret-chat/sessions/${sessionId}`),

  /** List active secret chat sessions for the current user. */
  listSessions: () => api.get('/api/v1/secret-chat/sessions'),

  // ─── Message Relay ───────────────────────────────────────────────────

  /** Relay an encrypted message to the recipient via the server. */
  relayMessage: (payload: RelayMessagePayload) => api.post('/api/v1/secret-chat/messages', payload),

  /** Fetch pending encrypted messages for the current user. */
  fetchPendingMessages: () => api.get('/api/v1/secret-chat/messages/pending'),

  /** Acknowledge receipt of messages (server can delete them). */
  acknowledgeMessages: (messageIds: string[]) =>
    api.post('/api/v1/secret-chat/messages/ack', { message_ids: messageIds }),

  // ─── Panic Wipe ──────────────────────────────────────────────────────

  /** Signal server to wipe all secret chat data for the current user. */
  panicWipe: () => api.delete('/api/v1/secret-chat/wipe'),

  // ─── Key Management ──────────────────────────────────────────────────

  /** Upload new prekey bundle to the server. */
  uploadPrekeyBundle: (bundle: Record<string, unknown>) =>
    api.post('/api/v1/secret-chat/prekey-bundle', bundle),

  /** Refresh one-time prekeys on the server. */
  refreshOneTimeKeys: (keys: Record<string, unknown>[]) =>
    api.post('/api/v1/secret-chat/prekey-bundle/refresh', { keys }),
};

export default secretChatService;

/**
 * API Response Utilities
 *
 * This module has been split into smaller submodules in ./api-utils/.
 * This file re-exports everything for backward compatibility.
 *
 * @see ./api-utils/response-extractors.ts - ensureArray, ensureObject, extractPagination, extractErrorMessage
 * @see ./api-utils/type-guards.ts - isNonEmptyString, isValidId
 * @see ./api-utils/accessors.ts - getParticipantUserId, getParticipantDisplayName, getParticipantAvatarUrl, getMessageSenderId
 * @see ./api-utils/normalizers.ts - resolveMediaUrl, normalizeMessage, normalizeParticipant, normalizeConversation, normalizeConversations
 */

export {
  ensureArray,
  ensureObject,
  extractPagination,
  extractErrorMessage,
  isNonEmptyString,
  isValidId,
  getParticipantUserId,
  getParticipantDisplayName,
  getParticipantAvatarUrl,
  getMessageSenderId,
  resolveMediaUrl,
  normalizeMessage,
  normalizeParticipant,
  normalizeConversation,
  normalizeConversations,
} from './api-utils';

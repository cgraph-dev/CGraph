/**
 * API Utilities
 *
 * Barrel re-export for all API utility functions.
 */

export {
  ensureArray,
  ensureObject,
  extractPagination,
  extractErrorMessage,
  isRecord,
  asString,
  asNumber,
  asBool,
  asOptionalString,
  asOptionalNumber,
  asArray,
  typedKeys,
} from './response-extractors';
export { isNonEmptyString, isValidId } from './type-guards';
export {
  getParticipantUserId,
  getParticipantDisplayName,
  getParticipantAvatarUrl,
  getMessageSenderId,
} from './accessors';
export {
  resolveMediaUrl,
  normalizeMessage,
  normalizeParticipant,
  normalizeConversation,
  normalizeConversations,
} from './normalizers';

/**
 * Type-safe Accessors for Normalized Data
 *
 * Provides safe extraction of fields from API response objects,
 * handling both camelCase and snake_case variations.
 * Uses runtime type guards instead of type assertions.
 */

import { isRecord } from './response-extractors';

/**
 * Type-safe extraction of participant user ID.
 * Handles both camelCase frontend types and snake_case API responses.
 */
export function getParticipantUserId(
  participant: Record<string, unknown> | null | undefined
): string | null {
  if (!participant) return null;
  if (typeof participant.userId === 'string' && participant.userId) return participant.userId;
  if (typeof participant.user_id === 'string' && participant.user_id) return participant.user_id;
  const user = isRecord(participant.user) ? participant.user : null;
  if (user && typeof user.id === 'string' && user.id) return user.id;
  if (typeof participant.id === 'string' && participant.id) return participant.id;
  return null;
}

/**
 * Type-safe extraction of participant display name.
 * Tries nickname first, then user display name, then username.
 */
export function getParticipantDisplayName(
  participant: Record<string, unknown> | null | undefined
): string {
  if (!participant) return 'Unknown';
  const user = isRecord(participant.user) ? participant.user : null;
  if (typeof participant.nickname === 'string' && participant.nickname) return participant.nickname;
  if (user && typeof user.displayName === 'string' && user.displayName) return user.displayName;
  if (user && typeof user.display_name === 'string' && user.display_name) return user.display_name;
  if (user && typeof user.username === 'string' && user.username) return user.username;
  if (typeof participant.displayName === 'string' && participant.displayName)
    return participant.displayName;
  if (typeof participant.display_name === 'string' && participant.display_name)
    return participant.display_name;
  if (typeof participant.username === 'string' && participant.username) return participant.username;
  return 'Unknown';
}

/**
 * Type-safe extraction of user avatar URL.
 */
export function getParticipantAvatarUrl(
  participant: Record<string, unknown> | null | undefined
): string | null {
  if (!participant) return null;
  const user = isRecord(participant.user) ? participant.user : null;
  if (user && typeof user.avatarUrl === 'string' && user.avatarUrl) return user.avatarUrl;
  if (user && typeof user.avatar_url === 'string' && user.avatar_url) return user.avatar_url;
  if (typeof participant.avatarUrl === 'string' && participant.avatarUrl)
    return participant.avatarUrl;
  if (typeof participant.avatar_url === 'string' && participant.avatar_url)
    return participant.avatar_url;
  return null;
}

/**
 * Type-safe extraction of sender ID from a message.
 */
export function getMessageSenderId(
  message: Record<string, unknown> | null | undefined
): string | null {
  if (!message) return null;
  const sender = isRecord(message.sender) ? message.sender : null;
  if (typeof message.senderId === 'string' && message.senderId) return message.senderId;
  if (typeof message.sender_id === 'string' && message.sender_id) return message.sender_id;
  if (sender && typeof sender.id === 'string' && sender.id) return sender.id;
  if (sender && typeof sender.user_id === 'string' && sender.user_id) return sender.user_id;
  return null;
}

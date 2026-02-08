/**
 * Type-safe Accessors for Normalized Data
 *
 * Provides safe extraction of fields from API response objects,
 * handling both camelCase and snake_case variations.
 */

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

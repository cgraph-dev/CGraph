/**
 * Friend Store – Normalizers
 *
 * Helper functions that transform raw API responses into typed
 * Friend / FriendRequest objects.
 *
 * @module stores/friendStore/normalizers
 */

import type { Friend, FriendRequest } from './friend-types';

/**
 * Normalize a raw API response object to our FriendRequest format.
 *
 * Backend returns `from` for incoming and `to` for outgoing requests.
 */
export function normalizeRequest(
  data: Record<string, unknown>,
  type: 'incoming' | 'outgoing'
): FriendRequest {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const userData = (type === 'incoming' ? data.from : data.to) as  // type assertion: API response field has dynamic shape
    | Record<string, unknown>
    | undefined;

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: data.id as string, // type assertion: API response field is string at runtime
    user: userData
      ? {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          id: userData.id as string, // type assertion: API response field is string at runtime

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          username: (userData.username as string) || 'Unknown', // type assertion: API response field is string at runtime
          displayName:
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            (userData.display_name as string | null) || // type assertion: API field narrowed from unknown
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            (userData.displayName as string | null) ||
            null,
          avatarUrl:
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            (userData.avatar_url as string | null) || (userData.avatarUrl as string | null) || null, // type assertion: API fields narrowed from unknown
          avatarBorderId:
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            (userData.avatar_border_id as string | null) || // type assertion: API field narrowed from unknown
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            (userData.avatarBorderId as string | null) ||
            null,

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          avatar_border_id: (userData.avatar_border_id as string | null) || null, // type assertion: API field narrowed from unknown
        }
      : {
          id: 'unknown',
          username: 'Unknown User',
          displayName: null,
          avatarUrl: null,
        },

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (data.sent_at as string) || (data.created_at as string) || new Date().toISOString(), // type assertion: API date fields are strings at runtime
    type,
  };
}

/**
 * Normalize friend data from API into our Friend interface.
 */
export function normalizeFriend(data: Record<string, unknown>): Friend {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const userData = data.user as Record<string, unknown> | undefined; // type assertion: dynamic API response shape

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: (userData?.id as string) || (data.id as string), // type assertion: API response fields are strings at runtime

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    username: (userData?.username as string) || 'Unknown', // type assertion: API response field is string at runtime
    displayName:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (userData?.display_name as string | null) || (userData?.displayName as string | null) || null, // type assertion: API fields narrowed from unknown
    avatarUrl:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (userData?.avatar_url as string | null) || (userData?.avatarUrl as string | null) || null, // type assertion: API fields narrowed from unknown
    avatarBorderId:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (userData?.avatar_border_id as string | null) || // type assertion: API field narrowed from unknown
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (userData?.avatarBorderId as string | null) ||
      null,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    avatar_border_id: (userData?.avatar_border_id as string | null) || null, // type assertion: API field narrowed from unknown
    status: 'offline',
    statusMessage: null,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    friendshipId: data.id as string, // type assertion: API response field is string at runtime

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (data.since as string) || (data.created_at as string) || new Date().toISOString(), // type assertion: API date fields are strings at runtime
  };
}

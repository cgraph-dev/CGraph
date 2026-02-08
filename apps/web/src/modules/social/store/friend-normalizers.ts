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
  const userData = (type === 'incoming' ? data.from : data.to) as
    | Record<string, unknown>
    | undefined;

  return {
    id: data.id as string,
    user: userData
      ? {
          id: userData.id as string,
          username: (userData.username as string) || 'Unknown',
          displayName:
            (userData.display_name as string | null) ||
            (userData.displayName as string | null) ||
            null,
          avatarUrl:
            (userData.avatar_url as string | null) || (userData.avatarUrl as string | null) || null,
          avatarBorderId:
            (userData.avatar_border_id as string | null) ||
            (userData.avatarBorderId as string | null) ||
            null,
          avatar_border_id: (userData.avatar_border_id as string | null) || null,
        }
      : {
          id: 'unknown',
          username: 'Unknown User',
          displayName: null,
          avatarUrl: null,
        },
    createdAt: (data.sent_at as string) || (data.created_at as string) || new Date().toISOString(),
    type,
  };
}

/**
 * Normalize friend data from API into our Friend interface.
 */
export function normalizeFriend(data: Record<string, unknown>): Friend {
  const userData = data.user as Record<string, unknown> | undefined;

  return {
    id: (userData?.id as string) || (data.id as string),
    username: (userData?.username as string) || 'Unknown',
    displayName:
      (userData?.display_name as string | null) || (userData?.displayName as string | null) || null,
    avatarUrl:
      (userData?.avatar_url as string | null) || (userData?.avatarUrl as string | null) || null,
    avatarBorderId:
      (userData?.avatar_border_id as string | null) ||
      (userData?.avatarBorderId as string | null) ||
      null,
    avatar_border_id: (userData?.avatar_border_id as string | null) || null,
    status: 'offline',
    statusMessage: null,
    friendshipId: data.id as string,
    createdAt: (data.since as string) || (data.created_at as string) || new Date().toISOString(),
  };
}

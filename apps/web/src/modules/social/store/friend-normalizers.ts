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
   
  const userData = (type === 'incoming' ? data.from : data.to) as  // type assertion: API response field has dynamic shape
    | Record<string, unknown>
    | undefined;

  return {
     
    id: data.id as string, // type assertion: API response field is string at runtime
    user: userData
      ? {
           
          id: userData.id as string, // type assertion: API response field is string at runtime

           
          username: (userData.username as string) || 'Unknown', // type assertion: API response field is string at runtime
          displayName:
             
            (userData.display_name as string | null) || // type assertion: API field narrowed from unknown
             
            (userData.displayName as string | null) ||
            null,
          avatarUrl:
             
            (userData.avatar_url as string | null) || (userData.avatarUrl as string | null) || null, // type assertion: API fields narrowed from unknown
          avatarBorderId:
             
            (userData.avatar_border_id as string | null) || // type assertion: API field narrowed from unknown
             
            (userData.avatarBorderId as string | null) ||
            null,

           
          avatar_border_id: (userData.avatar_border_id as string | null) || null, // type assertion: API field narrowed from unknown
        }
      : {
          id: 'unknown',
          username: 'Unknown User',
          displayName: null,
          avatarUrl: null,
        },

     
    createdAt: (data.sent_at as string) || (data.created_at as string) || new Date().toISOString(), // type assertion: API date fields are strings at runtime
    type,
  };
}

/**
 * Normalize friend data from API into our Friend interface.
 */
export function normalizeFriend(data: Record<string, unknown>): Friend {
   
  const userData = data.user as Record<string, unknown> | undefined; // type assertion: dynamic API response shape

  return {
     
    id: (userData?.id as string) || (data.id as string), // type assertion: API response fields are strings at runtime

     
    username: (userData?.username as string) || 'Unknown', // type assertion: API response field is string at runtime
    displayName:
       
      (userData?.display_name as string | null) || (userData?.displayName as string | null) || null, // type assertion: API fields narrowed from unknown
    avatarUrl:
       
      (userData?.avatar_url as string | null) || (userData?.avatarUrl as string | null) || null, // type assertion: API fields narrowed from unknown
    avatarBorderId:
       
      (userData?.avatar_border_id as string | null) || // type assertion: API field narrowed from unknown
       
      (userData?.avatarBorderId as string | null) ||
      null,

     
    avatar_border_id: (userData?.avatar_border_id as string | null) || null, // type assertion: API field narrowed from unknown
    status: 'offline',
    statusMessage: null,

     
    friendshipId: data.id as string, // type assertion: API response field is string at runtime

     
    createdAt: (data.since as string) || (data.created_at as string) || new Date().toISOString(), // type assertion: API date fields are strings at runtime
  };
}

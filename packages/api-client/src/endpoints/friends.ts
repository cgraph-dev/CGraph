/**
 * Friends endpoints — friend list, requests, suggestions, blocking.
 */
import type { HttpHelpers, ApiResponse, PaginatedResponse, PaginationParams } from '../client';

export interface Friend {
  readonly id: string;
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly status: 'online' | 'offline' | 'busy' | 'idle' | 'invisible';
  readonly custom_status: string | null;
}

export interface FriendRequest {
  readonly id: string;
  readonly from_user_id: string;
  readonly from_username: string;
  readonly from_avatar_url: string | null;
  readonly message: string | null;
  readonly inserted_at: string;
}

export interface FriendSuggestion {
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly mutual_friend_count: number;
  readonly reason: string;
}

export interface FriendsEndpoints {
  getFriends(params?: PaginationParams): Promise<PaginatedResponse<Friend>>;
  getRequests(): Promise<ApiResponse<FriendRequest[]>>;
  sendRequest(userId: string, message?: string): Promise<ApiResponse<void>>;
  acceptRequest(requestId: string): Promise<ApiResponse<void>>;
  declineRequest(requestId: string): Promise<ApiResponse<void>>;
  removeFriend(friendId: string): Promise<ApiResponse<void>>;
  blockUser(userId: string): Promise<ApiResponse<void>>;
  unblockUser(userId: string): Promise<ApiResponse<void>>;
  getSuggestions(params?: PaginationParams): Promise<PaginatedResponse<FriendSuggestion>>;
  getMutualFriends(userId: string): Promise<ApiResponse<Friend[]>>;
}

export function createFriendsEndpoints(http: HttpHelpers): FriendsEndpoints {
  return {
    getFriends: (params) =>
      http.get('/api/v1/friends', { cursor: params?.cursor, limit: params?.limit }),
    getRequests: () =>
      http.get('/api/v1/friends/requests'),
    sendRequest: (userId, message) =>
      http.post('/api/v1/friends/requests', { user_id: userId, message }),
    acceptRequest: (requestId) =>
      http.post(`/api/v1/friends/requests/${requestId}/accept`),
    declineRequest: (requestId) =>
      http.post(`/api/v1/friends/requests/${requestId}/decline`),
    removeFriend: (friendId) =>
      http.del(`/api/v1/friends/${friendId}`),
    blockUser: (userId) =>
      http.post(`/api/v1/users/${userId}/block`),
    unblockUser: (userId) =>
      http.del(`/api/v1/users/${userId}/block`),
    getSuggestions: (params) =>
      http.get('/api/v1/friends/suggestions', { cursor: params?.cursor, limit: params?.limit }),
    getMutualFriends: (userId) =>
      http.get(`/api/v1/users/${userId}/mutual-friends`),
  };
}

/**
 * Admin User Management API
 *
 * User listing, details, banning, and deletion endpoints.
 */

import { api as apiClient } from '@/lib/api';
import type { AdminUser, UsersListResponse, ApiUserResponse } from './types';

// ============================================================================
// Response Transformer
// ============================================================================

function transformUserResponse(data: ApiUserResponse): AdminUser {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    status: data.status,
    insertedAt: data.inserted_at,
    lastSeenAt: data.last_seen_at,
    isPremium: data.is_premium || false,
    bannedAt: data.banned_at,
    banReason: data.ban_reason,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export const userManagementApi = {
  /**
   * List users with filtering and pagination
   */
  async listUsers(params: {
    search?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    perPage?: number;
  }): Promise<UsersListResponse> {
    const response = await apiClient.get('/api/v1/admin/users', { params });
    return {
      users: response.data.data.map(transformUserResponse),
      totalCount: response.data.meta.total_count,
      page: response.data.meta.page,
      perPage: response.data.meta.per_page,
    };
  },

  /**
   * Get details for a specific user
   */
  async getUser(userId: string): Promise<AdminUser> {
    const response = await apiClient.get(`/api/v1/admin/users/${userId}`);
    return transformUserResponse(response.data.data);
  },

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string, duration?: number): Promise<AdminUser> {
    const response = await apiClient.post(`/api/v1/admin/users/${userId}/ban`, {
      reason,
      duration,
    });
    return transformUserResponse(response.data.data);
  },

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<AdminUser> {
    const response = await apiClient.delete(`/api/v1/admin/users/${userId}/ban`);
    return transformUserResponse(response.data.data);
  },

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/users/${userId}`);
  },
};

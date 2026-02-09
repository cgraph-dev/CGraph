/**
 * Groups endpoints — CRUD, channels, members, roles, invites.
 */
import type { HttpHelpers, ApiResponse, PaginatedResponse, PaginationParams } from '../client';

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon_url: string | null;
  readonly banner_url: string | null;
  readonly owner_id: string;
  readonly member_count: number;
  readonly is_public: boolean;
  readonly inserted_at: string;
}

export interface GroupChannel {
  readonly id: string;
  readonly group_id: string;
  readonly name: string;
  readonly type: 'text' | 'voice' | 'announcement';
  readonly category_id: string | null;
  readonly position: number;
}

export interface GroupMember {
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly role: string;
  readonly joined_at: string;
}

export interface GroupRole {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly permissions: number;
  readonly position: number;
}

export interface CreateGroupRequest {
  readonly name: string;
  readonly description?: string;
  readonly is_public?: boolean;
}

export interface CreateChannelRequest {
  readonly name: string;
  readonly type?: 'text' | 'voice' | 'announcement';
  readonly category_id?: string;
}

export interface GroupsEndpoints {
  getGroups(params?: PaginationParams): Promise<PaginatedResponse<Group>>;
  getGroup(id: string): Promise<ApiResponse<Group>>;
  createGroup(data: CreateGroupRequest): Promise<ApiResponse<Group>>;
  updateGroup(id: string, data: Partial<CreateGroupRequest>): Promise<ApiResponse<Group>>;
  deleteGroup(id: string): Promise<ApiResponse<void>>;
  joinGroup(id: string): Promise<ApiResponse<void>>;
  leaveGroup(id: string): Promise<ApiResponse<void>>;
  getChannels(groupId: string): Promise<ApiResponse<GroupChannel[]>>;
  createChannel(groupId: string, data: CreateChannelRequest): Promise<ApiResponse<GroupChannel>>;
  deleteChannel(groupId: string, channelId: string): Promise<ApiResponse<void>>;
  getMembers(groupId: string, params?: PaginationParams): Promise<PaginatedResponse<GroupMember>>;
  kickMember(groupId: string, userId: string): Promise<ApiResponse<void>>;
  getRoles(groupId: string): Promise<ApiResponse<GroupRole[]>>;
  createRole(groupId: string, data: { name: string; color?: string; permissions?: number }): Promise<ApiResponse<GroupRole>>;
}

export function createGroupsEndpoints(http: HttpHelpers): GroupsEndpoints {
  return {
    getGroups: (params) =>
      http.get('/api/v1/groups', { cursor: params?.cursor, limit: params?.limit }),
    getGroup: (id) =>
      http.get(`/api/v1/groups/${id}`),
    createGroup: (data) =>
      http.post('/api/v1/groups', data),
    updateGroup: (id, data) =>
      http.patch(`/api/v1/groups/${id}`, data),
    deleteGroup: (id) =>
      http.del(`/api/v1/groups/${id}`),
    joinGroup: (id) =>
      http.post(`/api/v1/groups/${id}/join`),
    leaveGroup: (id) =>
      http.post(`/api/v1/groups/${id}/leave`),
    getChannels: (groupId) =>
      http.get(`/api/v1/groups/${groupId}/channels`),
    createChannel: (groupId, data) =>
      http.post(`/api/v1/groups/${groupId}/channels`, data),
    deleteChannel: (groupId, channelId) =>
      http.del(`/api/v1/groups/${groupId}/channels/${channelId}`),
    getMembers: (groupId, params) =>
      http.get(`/api/v1/groups/${groupId}/members`, { cursor: params?.cursor, limit: params?.limit }),
    kickMember: (groupId, userId) =>
      http.del(`/api/v1/groups/${groupId}/members/${userId}`),
    getRoles: (groupId) =>
      http.get(`/api/v1/groups/${groupId}/roles`),
    createRole: (groupId, data) =>
      http.post(`/api/v1/groups/${groupId}/roles`, data),
  };
}

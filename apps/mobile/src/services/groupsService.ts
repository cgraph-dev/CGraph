/**
 * Groups Service
 *
 * Backend API integration for group management:
 * - Group CRUD operations
 * - Member management
 * - Invites
 * - Roles & permissions
 *
 * @module services/groupsService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  onlineCount: number;
  channelCount: number;
  isPublic: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  category: string;
  tags: string[];
  features: GroupFeatures;
  createdAt: string;
  joinedAt: string | null;
  role: GroupRole | null;
}

export interface GroupFeatures {
  forums: boolean;
  events: boolean;
  polls: boolean;
  voice: boolean;
  stage: boolean;
  announcements: boolean;
}

export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

export interface GroupMember {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: GroupRole;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  customStatus: string | null;
  joinedAt: string;
  nickname: string | null;
  level: number;
  xpInGroup: number;
}

export interface GroupInvite {
  id: string;
  code: string;
  groupId: string;
  groupName: string;
  groupAvatar: string | null;
  creatorId: string;
  creatorUsername: string;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface GroupChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum' | 'stage';
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  position: number;
  isPrivate: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface GroupCategory {
  id: string;
  name: string;
  position: number;
  channels: GroupChannel[];
  collapsed: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  category?: string;
  features?: Partial<GroupFeatures>;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  category?: string;
  features?: Partial<GroupFeatures>;
}

export interface GroupBan {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reason: string | null;
  bannedBy: string;
  bannedByUsername: string;
  bannedAt: string;
  expiresAt: string | null;
}

export interface GroupSettings {
  defaultRole: GroupRole;
  allowInvites: boolean;
  joinApproval: boolean;
  memberListVisibility: 'public' | 'members' | 'admins';
  messageHistory: 'all' | 'none' | 'limited';
  slowMode: number | null;
  explicitContentFilter: 'off' | 'members' | 'all';
}

export interface GroupStats {
  memberCount: number;
  onlineCount: number;
  messageCount: number;
  activeToday: number;
  activeThisWeek: number;
  growth: {
    day: number;
    week: number;
    month: number;
  };
}

// ==================== GROUPS API ====================

/**
 * Get user's groups
 */
export async function getMyGroups(): Promise<Group[]> {
  const response = await api.get('/api/v1/groups');
  return (response.data.data || response.data.groups || []).map(transformGroup);
}

/**
 * Get group by ID
 */
export async function getGroup(groupId: string): Promise<Group> {
  const response = await api.get(`/api/v1/groups/${groupId}`);
  return transformGroup(response.data.data || response.data);
}

/**
 * Create group
 */
export async function createGroup(data: CreateGroupRequest): Promise<Group> {
  const response = await api.post('/api/v1/groups', {
    name: data.name,
    description: data.description,
    is_public: data.isPublic,
    category: data.category,
    features: data.features,
  });
  return transformGroup(response.data.data || response.data);
}

/**
 * Update group
 */
export async function updateGroup(groupId: string, data: UpdateGroupRequest): Promise<Group> {
  const response = await api.patch(`/api/v1/groups/${groupId}`, {
    name: data.name,
    description: data.description,
    is_public: data.isPublic,
    category: data.category,
    features: data.features,
  });
  return transformGroup(response.data.data || response.data);
}

/**
 * Delete group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  await api.delete(`/api/v1/groups/${groupId}`);
}

/**
 * Upload group avatar
 */
export async function uploadGroupAvatar(
  groupId: string,
  file: { uri: string; type: string; name: string }
): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file as unknown as Blob);

  const response = await api.post(`/api/v1/groups/${groupId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data?.url || response.data.url;
}

/**
 * Upload group banner
 */
export async function uploadGroupBanner(
  groupId: string,
  file: { uri: string; type: string; name: string }
): Promise<string> {
  const formData = new FormData();
  formData.append('banner', file as unknown as Blob);

  const response = await api.post(`/api/v1/groups/${groupId}/banner`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data?.url || response.data.url;
}

/**
 * Join group
 */
export async function joinGroup(groupId: string): Promise<Group> {
  const response = await api.post(`/api/v1/groups/${groupId}/join`);
  return transformGroup(response.data.data || response.data);
}

/**
 * Leave group
 */
export async function leaveGroup(groupId: string): Promise<void> {
  await api.post(`/api/v1/groups/${groupId}/leave`);
}

/**
 * Get public groups
 */
export async function getPublicGroups(options?: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sortBy?: 'members' | 'activity' | 'created';
}): Promise<Group[]> {
  const params = {
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    category: options?.category,
    search: options?.search,
    sort_by: options?.sortBy,
  };
  const response = await api.get('/api/v1/groups/public', { params });
  return (response.data.data || response.data.groups || []).map(transformGroup);
}

/**
 * Get featured groups
 */
export async function getFeaturedGroups(): Promise<Group[]> {
  const response = await api.get('/api/v1/groups/featured');
  return (response.data.data || response.data.groups || []).map(transformGroup);
}

// ==================== MEMBERS API ====================

/**
 * Get group members
 */
export async function getGroupMembers(
  groupId: string,
  options?: {
    limit?: number;
    offset?: number;
    role?: GroupRole;
    status?: 'online' | 'offline' | 'all';
    search?: string;
  }
): Promise<GroupMember[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
    role: options?.role,
    status: options?.status !== 'all' ? options?.status : undefined,
    search: options?.search,
  };
  const response = await api.get(`/api/v1/groups/${groupId}/members`, { params });
  return (response.data.data || response.data.members || []).map(transformGroupMember);
}

/**
 * Get group member
 */
export async function getGroupMember(groupId: string, userId: string): Promise<GroupMember> {
  const response = await api.get(`/api/v1/groups/${groupId}/members/${userId}`);
  return transformGroupMember(response.data.data || response.data);
}

/**
 * Update member role
 */
export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: GroupRole
): Promise<GroupMember> {
  const response = await api.patch(`/api/v1/groups/${groupId}/members/${userId}`, { role });
  return transformGroupMember(response.data.data || response.data);
}

/**
 * Set member nickname
 */
export async function setMemberNickname(
  groupId: string,
  userId: string,
  nickname: string | null
): Promise<void> {
  await api.patch(`/api/v1/groups/${groupId}/members/${userId}`, { nickname });
}

/**
 * Kick member
 */
export async function kickMember(groupId: string, userId: string, reason?: string): Promise<void> {
  await api.delete(`/api/v1/groups/${groupId}/members/${userId}`, { data: { reason } });
}

// ==================== INVITES API ====================

/**
 * Get group invites
 */
export async function getGroupInvites(groupId: string): Promise<GroupInvite[]> {
  const response = await api.get(`/api/v1/groups/${groupId}/invites`);
  return (response.data.data || response.data.invites || []).map(transformGroupInvite);
}

/**
 * Create group invite
 */
export async function createGroupInvite(
  groupId: string,
  options?: {
    maxUses?: number;
    expiresIn?: number; // hours
  }
): Promise<GroupInvite> {
  const response = await api.post(`/api/v1/groups/${groupId}/invites`, {
    max_uses: options?.maxUses,
    expires_in: options?.expiresIn,
  });
  return transformGroupInvite(response.data.data || response.data);
}

/**
 * Delete group invite
 */
export async function deleteGroupInvite(groupId: string, inviteId: string): Promise<void> {
  await api.delete(`/api/v1/groups/${groupId}/invites/${inviteId}`);
}

/**
 * Join group by invite code
 */
export async function joinGroupByInvite(code: string): Promise<Group> {
  const response = await api.post(`/api/v1/invites/${code}/join`);
  return transformGroup(response.data.data || response.data);
}

/**
 * Get invite info
 */
export async function getInviteInfo(code: string): Promise<GroupInvite> {
  const response = await api.get(`/api/v1/invites/${code}`);
  return transformGroupInvite(response.data.data || response.data);
}

// ==================== BANS API ====================

/**
 * Get group bans
 */
export async function getGroupBans(groupId: string): Promise<GroupBan[]> {
  const response = await api.get(`/api/v1/groups/${groupId}/bans`);
  return (response.data.data || response.data.bans || []).map(transformGroupBan);
}

/**
 * Ban member
 */
export async function banMember(
  groupId: string,
  userId: string,
  options?: {
    reason?: string;
    deleteMessages?: boolean;
    duration?: number; // hours, null for permanent
  }
): Promise<GroupBan> {
  const response = await api.post(`/api/v1/groups/${groupId}/bans`, {
    user_id: userId,
    reason: options?.reason,
    delete_messages: options?.deleteMessages,
    duration: options?.duration,
  });
  return transformGroupBan(response.data.data || response.data);
}

/**
 * Unban member
 */
export async function unbanMember(groupId: string, banId: string): Promise<void> {
  await api.delete(`/api/v1/groups/${groupId}/bans/${banId}`);
}

// ==================== CHANNELS API ====================

/**
 * Get group channels
 */
export async function getGroupChannels(groupId: string): Promise<GroupCategory[]> {
  const response = await api.get(`/api/v1/groups/${groupId}/channels`);
  return (response.data.data || response.data.categories || []).map(transformGroupCategory);
}

/**
 * Create channel
 */
export async function createChannel(
  groupId: string,
  data: {
    name: string;
    type: 'text' | 'voice' | 'announcement' | 'forum';
    categoryId?: string;
    description?: string;
    isPrivate?: boolean;
  }
): Promise<GroupChannel> {
  const response = await api.post(`/api/v1/groups/${groupId}/channels`, {
    name: data.name,
    type: data.type,
    category_id: data.categoryId,
    description: data.description,
    is_private: data.isPrivate,
  });
  return transformGroupChannel(response.data.data || response.data);
}

/**
 * Create category
 */
export async function createCategory(groupId: string, name: string): Promise<GroupCategory> {
  const response = await api.post(`/api/v1/groups/${groupId}/categories`, { name });
  return transformGroupCategory(response.data.data || response.data);
}

// ==================== SETTINGS API ====================

/**
 * Get group settings
 */
export async function getGroupSettings(groupId: string): Promise<GroupSettings> {
  const response = await api.get(`/api/v1/groups/${groupId}/settings`);
  return transformGroupSettings(response.data.data || response.data);
}

/**
 * Update group settings
 */
export async function updateGroupSettings(
  groupId: string,
  settings: Partial<GroupSettings>
): Promise<GroupSettings> {
  const response = await api.patch(`/api/v1/groups/${groupId}/settings`, {
    default_role: settings.defaultRole,
    allow_invites: settings.allowInvites,
    join_approval: settings.joinApproval,
    member_list_visibility: settings.memberListVisibility,
    message_history: settings.messageHistory,
    slow_mode: settings.slowMode,
    explicit_content_filter: settings.explicitContentFilter,
  });
  return transformGroupSettings(response.data.data || response.data);
}

/**
 * Get group stats
 */
export async function getGroupStats(groupId: string): Promise<GroupStats> {
  const response = await api.get(`/api/v1/groups/${groupId}/stats`);
  return transformGroupStats(response.data.data || response.data);
}

// ==================== TRANSFORMERS ====================

/** API response type for transform functions */
/** API response data 2014 typed as any at the boundary, return types enforce safety */
type ApiData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function transformGroupFeatures(data: ApiData): GroupFeatures {
  return {
    forums: data?.forums ?? true,
    events: data?.events ?? true,
    polls: data?.polls ?? true,
    voice: data?.voice ?? false, // FUTURE
    stage: data?.stage ?? false, // FUTURE
    announcements: data?.announcements ?? true,
  };
}

function transformGroup(data: ApiData): Group {
  return {
    id: data.id,
    name: data.name,
    description: data.description || null,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    bannerUrl: data.banner_url || data.bannerUrl || null,
    ownerId: data.owner_id || data.ownerId,
    ownerUsername: data.owner_username || data.ownerUsername || data.owner?.username,
    memberCount: data.member_count ?? data.memberCount ?? 0,
    onlineCount: data.online_count ?? data.onlineCount ?? 0,
    channelCount: data.channel_count ?? data.channelCount ?? 0,
    isPublic: data.is_public ?? data.isPublic ?? true,
    isVerified: data.is_verified ?? data.isVerified ?? false,
    isFeatured: data.is_featured ?? data.isFeatured ?? false,
    category: data.category || 'general',
    tags: data.tags || [],
    features: transformGroupFeatures(data.features),
    createdAt: data.created_at || data.createdAt,
    joinedAt: data.joined_at || data.joinedAt || null,
    role: data.role || null,
  };
}

function transformGroupMember(data: ApiData): GroupMember {
  return {
    id: data.id,
    userId: data.user_id || data.userId,
    username: data.username || data.user?.username,
    displayName: data.display_name || data.displayName || data.user?.display_name || null,
    avatarUrl: data.avatar_url || data.avatarUrl || data.user?.avatar_url || null,
    role: data.role || 'member',
    status: data.status || 'offline',
    customStatus: data.custom_status || data.customStatus || null,
    joinedAt: data.joined_at || data.joinedAt,
    nickname: data.nickname || null,
    level: data.level || 1,
    xpInGroup: data.xp_in_group ?? data.xpInGroup ?? 0,
  };
}

function transformGroupInvite(data: ApiData): GroupInvite {
  return {
    id: data.id,
    code: data.code,
    groupId: data.group_id || data.groupId,
    groupName: data.group_name || data.groupName || data.group?.name,
    groupAvatar: data.group_avatar || data.groupAvatar || data.group?.avatar_url || null,
    creatorId: data.creator_id || data.creatorId,
    creatorUsername: data.creator_username || data.creatorUsername || data.creator?.username,
    uses: data.uses || 0,
    maxUses: data.max_uses ?? data.maxUses ?? null,
    expiresAt: data.expires_at || data.expiresAt || null,
    createdAt: data.created_at || data.createdAt,
  };
}

function transformGroupChannel(data: ApiData): GroupChannel {
  return {
    id: data.id,
    name: data.name,
    type: data.type || 'text',
    description: data.description || null,
    categoryId: data.category_id || data.categoryId || null,
    categoryName: data.category_name || data.categoryName || null,
    position: data.position || 0,
    isPrivate: data.is_private ?? data.isPrivate ?? false,
    unreadCount: data.unread_count ?? data.unreadCount ?? 0,
    lastMessageAt: data.last_message_at || data.lastMessageAt || null,
  };
}

function transformGroupCategory(data: ApiData): GroupCategory {
  return {
    id: data.id,
    name: data.name,
    position: data.position || 0,
    channels: (data.channels || []).map(transformGroupChannel),
    collapsed: data.collapsed ?? false,
  };
}

function transformGroupBan(data: ApiData): GroupBan {
  return {
    id: data.id,
    userId: data.user_id || data.userId,
    username: data.username || data.user?.username,
    displayName: data.display_name || data.displayName || data.user?.display_name || null,
    avatarUrl: data.avatar_url || data.avatarUrl || data.user?.avatar_url || null,
    reason: data.reason || null,
    bannedBy: data.banned_by || data.bannedBy,
    bannedByUsername: data.banned_by_username || data.bannedByUsername || data.banner?.username,
    bannedAt: data.banned_at || data.bannedAt,
    expiresAt: data.expires_at || data.expiresAt || null,
  };
}

function transformGroupSettings(data: ApiData): GroupSettings {
  return {
    defaultRole: data.default_role || data.defaultRole || 'member',
    allowInvites: data.allow_invites ?? data.allowInvites ?? true,
    joinApproval: data.join_approval ?? data.joinApproval ?? false,
    memberListVisibility: data.member_list_visibility || data.memberListVisibility || 'public',
    messageHistory: data.message_history || data.messageHistory || 'all',
    slowMode: data.slow_mode ?? data.slowMode ?? null,
    explicitContentFilter: data.explicit_content_filter || data.explicitContentFilter || 'off',
  };
}

function transformGroupStats(data: ApiData): GroupStats {
  return {
    memberCount: data.member_count ?? data.memberCount ?? 0,
    onlineCount: data.online_count ?? data.onlineCount ?? 0,
    messageCount: data.message_count ?? data.messageCount ?? 0,
    activeToday: data.active_today ?? data.activeToday ?? 0,
    activeThisWeek: data.active_this_week ?? data.activeThisWeek ?? 0,
    growth: {
      day: data.growth?.day ?? 0,
      week: data.growth?.week ?? 0,
      month: data.growth?.month ?? 0,
    },
  };
}

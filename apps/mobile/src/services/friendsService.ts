/**
 * Friends Service
 * 
 * Backend API integration for friend-related features:
 * - Friend list management
 * - Friend requests
 * - User profiles
 * - Blocking/Reporting
 * 
 * @module services/friendsService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface Friend {
  id: string;
  friendshipId: string;
  user: FriendUser;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  customStatus: string | null;
  nickname: string | null;
  isFavorite: boolean;
  addedAt: string;
  lastInteractionAt: string | null;
}

export interface FriendUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  title: string | null;
  isVerified: boolean;
  isPremium: boolean;
}

export interface FriendRequest {
  id: string;
  from: FriendUser;
  to: FriendUser;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  expiresAt: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  level: number;
  xp: number;
  karma: number;
  title: string | null;
  badges: UserBadge[];
  createdAt: string;
  lastSeenAt: string | null;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  customStatus: string | null;
  isVerified: boolean;
  isPremium: boolean;
  premiumTier: 'free' | 'plus' | 'pro' | 'ultimate';
  friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'blocked';
  mutualFriendsCount: number;
  mutualGroupsCount: number;
  profileVisibility: 'public' | 'friends' | 'private';
  stats: UserStats;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';
  awardedAt: string;
}

export interface UserStats {
  messagesCount: number;
  postsCount: number;
  groupsCount: number;
  achievementsCount: number;
  streakDays: number;
  joinedAt: string;
}

export interface MutualFriend {
  id: string;
  user: FriendUser;
}

export interface MutualGroup {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
}

export interface BlockedUser {
  id: string;
  user: FriendUser;
  blockedAt: string;
  reason: string | null;
}

export interface FriendSuggestion {
  id: string;
  user: FriendUser;
  mutualFriendsCount: number;
  mutualGroupsCount: number;
  reason: string;
}

// ==================== FRIEND LIST API ====================

/**
 * Get friend list
 */
export async function getFriends(options?: { 
  limit?: number; 
  offset?: number; 
  status?: 'online' | 'offline' | 'all';
  search?: string;
}): Promise<Friend[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
    status: options?.status !== 'all' ? options?.status : undefined,
    search: options?.search,
  };
  const response = await api.get('/api/v1/friends', { params });
  return (response.data.data || response.data.friends || []).map(transformFriend);
}

/**
 * Get online friends count
 */
export async function getOnlineFriendsCount(): Promise<number> {
  const response = await api.get('/api/v1/friends/online/count');
  return response.data.data?.count ?? response.data.count ?? 0;
}

/**
 * Get favorite friends
 */
export async function getFavoriteFriends(): Promise<Friend[]> {
  const response = await api.get('/api/v1/friends/favorites');
  return (response.data.data || response.data.friends || []).map(transformFriend);
}

/**
 * Toggle favorite status
 */
export async function toggleFavoriteFriend(friendshipId: string): Promise<boolean> {
  const response = await api.post(`/api/v1/friends/${friendshipId}/favorite`);
  return response.data.data?.isFavorite ?? response.data.is_favorite ?? true;
}

/**
 * Set friend nickname
 */
export async function setFriendNickname(friendshipId: string, nickname: string | null): Promise<void> {
  await api.patch(`/api/v1/friends/${friendshipId}`, { nickname });
}

/**
 * Remove friend
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  await api.delete(`/api/v1/friends/${friendshipId}`);
}

// ==================== FRIEND REQUESTS API ====================

/**
 * Get incoming friend requests
 */
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await api.get('/api/v1/friends/requests/incoming');
  return (response.data.data || response.data.requests || []).map(transformFriendRequest);
}

/**
 * Get outgoing friend requests
 */
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const response = await api.get('/api/v1/friends/requests/outgoing');
  return (response.data.data || response.data.requests || []).map(transformFriendRequest);
}

/**
 * Send friend request
 */
export async function sendFriendRequest(username: string, message?: string): Promise<FriendRequest> {
  const response = await api.post('/api/v1/friends/requests', { 
    username, 
    message 
  });
  return transformFriendRequest(response.data.data || response.data);
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(requestId: string): Promise<Friend> {
  const response = await api.post(`/api/v1/friends/requests/${requestId}/accept`);
  return transformFriend(response.data.data || response.data);
}

/**
 * Reject friend request
 */
export async function rejectFriendRequest(requestId: string): Promise<void> {
  await api.post(`/api/v1/friends/requests/${requestId}/reject`);
}

/**
 * Cancel outgoing friend request
 */
export async function cancelFriendRequest(requestId: string): Promise<void> {
  await api.delete(`/api/v1/friends/requests/${requestId}`);
}

// ==================== USER PROFILE API ====================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await api.get(`/api/v1/users/${userId}/profile`);
  return transformUserProfile(response.data.data || response.data);
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile> {
  const response = await api.get(`/api/v1/users/username/${username}/profile`);
  return transformUserProfile(response.data.data || response.data);
}

/**
 * Get mutual friends with a user
 */
export async function getMutualFriends(userId: string): Promise<MutualFriend[]> {
  const response = await api.get(`/api/v1/users/${userId}/mutual-friends`);
  return (response.data.data || response.data.friends || []).map(transformMutualFriend);
}

/**
 * Get mutual groups with a user
 */
export async function getMutualGroups(userId: string): Promise<MutualGroup[]> {
  const response = await api.get(`/api/v1/users/${userId}/mutual-groups`);
  return (response.data.data || response.data.groups || []).map(transformMutualGroup);
}

/**
 * Get friend suggestions
 */
export async function getFriendSuggestions(limit?: number): Promise<FriendSuggestion[]> {
  const params = limit ? { limit } : {};
  const response = await api.get('/api/v1/friends/suggestions', { params });
  return (response.data.data || response.data.suggestions || []).map(transformFriendSuggestion);
}

// ==================== BLOCKING API ====================

/**
 * Get blocked users
 */
export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const response = await api.get('/api/v1/users/me/blocked');
  return (response.data.data || response.data.blocked || []).map(transformBlockedUser);
}

/**
 * Block a user
 */
export async function blockUser(userId: string, reason?: string): Promise<void> {
  await api.post(`/api/v1/users/${userId}/block`, { reason });
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/api/v1/users/${userId}/block`);
}

/**
 * Report a user
 */
export async function reportUser(userId: string, reason: string, details?: string): Promise<void> {
  await api.post(`/api/v1/users/${userId}/report`, { 
    reason, 
    details 
  });
}

// ==================== SEARCH API ====================

/**
 * Search users
 */
export async function searchUsers(query: string, options?: { limit?: number; offset?: number }): Promise<FriendUser[]> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
  };
  const response = await api.get('/api/v1/users/search', { params });
  return (response.data.data || response.data.users || []).map(transformFriendUser);
}

// ==================== TRANSFORMERS ====================

function transformFriendUser(data: any): FriendUser {
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name || data.displayName || null,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    level: data.level || 1,
    title: data.title || null,
    isVerified: data.is_verified ?? data.isVerified ?? false,
    isPremium: data.is_premium ?? data.isPremium ?? false,
  };
}

function transformFriend(data: any): Friend {
  return {
    id: data.id,
    friendshipId: data.friendship_id || data.friendshipId || data.id,
    user: transformFriendUser(data.user || data),
    status: data.status || 'offline',
    customStatus: data.custom_status || data.customStatus || null,
    nickname: data.nickname || null,
    isFavorite: data.is_favorite ?? data.isFavorite ?? false,
    addedAt: data.added_at || data.addedAt || data.created_at || data.createdAt,
    lastInteractionAt: data.last_interaction_at || data.lastInteractionAt || null,
  };
}

function transformFriendRequest(data: any): FriendRequest {
  return {
    id: data.id,
    from: transformFriendUser(data.from || data.sender),
    to: transformFriendUser(data.to || data.recipient),
    message: data.message || null,
    status: data.status || 'pending',
    createdAt: data.created_at || data.createdAt,
    expiresAt: data.expires_at || data.expiresAt || null,
  };
}

function transformUserBadge(data: any): UserBadge {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    imageUrl: data.image_url || data.imageUrl,
    rarity: data.rarity || 'common',
    awardedAt: data.awarded_at || data.awardedAt,
  };
}

function transformUserStats(data: any): UserStats {
  return {
    messagesCount: data.messages_count ?? data.messagesCount ?? 0,
    postsCount: data.posts_count ?? data.postsCount ?? 0,
    groupsCount: data.groups_count ?? data.groupsCount ?? 0,
    achievementsCount: data.achievements_count ?? data.achievementsCount ?? 0,
    streakDays: data.streak_days ?? data.streakDays ?? 0,
    joinedAt: data.joined_at || data.joinedAt || data.created_at || data.createdAt,
  };
}

function transformUserProfile(data: any): UserProfile {
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name || data.displayName || null,
    bio: data.bio || null,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    bannerUrl: data.banner_url || data.bannerUrl || null,
    level: data.level || 1,
    xp: data.xp || 0,
    karma: data.karma || 0,
    title: data.title || null,
    badges: (data.badges || []).map(transformUserBadge),
    createdAt: data.created_at || data.createdAt,
    lastSeenAt: data.last_seen_at || data.lastSeenAt || null,
    status: data.status || 'offline',
    customStatus: data.custom_status || data.customStatus || null,
    isVerified: data.is_verified ?? data.isVerified ?? false,
    isPremium: data.is_premium ?? data.isPremium ?? false,
    premiumTier: data.premium_tier || data.premiumTier || 'free',
    friendshipStatus: data.friendship_status || data.friendshipStatus || 'none',
    mutualFriendsCount: data.mutual_friends_count ?? data.mutualFriendsCount ?? 0,
    mutualGroupsCount: data.mutual_groups_count ?? data.mutualGroupsCount ?? 0,
    profileVisibility: data.profile_visibility || data.profileVisibility || 'public',
    stats: transformUserStats(data.stats || {}),
  };
}

function transformMutualFriend(data: any): MutualFriend {
  return {
    id: data.id,
    user: transformFriendUser(data.user || data),
  };
}

function transformMutualGroup(data: any): MutualGroup {
  return {
    id: data.id,
    name: data.name,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    memberCount: data.member_count ?? data.memberCount ?? 0,
  };
}

function transformBlockedUser(data: any): BlockedUser {
  return {
    id: data.id,
    user: transformFriendUser(data.user || data),
    blockedAt: data.blocked_at || data.blockedAt,
    reason: data.reason || null,
  };
}

function transformFriendSuggestion(data: any): FriendSuggestion {
  return {
    id: data.id,
    user: transformFriendUser(data.user || data),
    mutualFriendsCount: data.mutual_friends_count ?? data.mutualFriendsCount ?? 0,
    mutualGroupsCount: data.mutual_groups_count ?? data.mutualGroupsCount ?? 0,
    reason: data.reason || 'Suggested for you',
  };
}

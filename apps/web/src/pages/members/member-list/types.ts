/**
 * Type definitions for MemberList module
 */

export interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  userGroup: string;
  userGroupId: string;
  userGroupColor: string | null;
  isOnline: boolean;
  lastActive: string | null;
  joinedAt: string;
  postCount: number;
  threadCount: number;
  reputation: number;
  stars: number;
  signature?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  color: string | null;
  memberCount: number;
}

export type SortField = 'username' | 'joined_at' | 'post_count' | 'reputation' | 'last_active';
export type SortOrder = 'asc' | 'desc';

export interface MemberFilters {
  searchQuery: string;
  filterGroup: string;
  filterOnlineOnly: boolean;
  filterJoinedAfter: string;
  filterJoinedBefore: string;
}

export interface PaginationState {
  page: number;
  totalPages: number;
  totalMembers: number;
  perPage: number;
}

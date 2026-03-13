/**
 * Types, fallback data, and utilities for the member list screen.
 * @module screens/community/member-list-screen/types
 */

export interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  userGroup: string;
  userGroupColor: string | null;
  isOnline: boolean;
  lastActive: string | null;
  joinedAt: string;
  postCount: number;
  reputation: number;
}

export interface UserGroup {
  id: string;
  name: string;
  color: string | null;
  memberCount: number;
}

export type SortField = 'username' | 'joined_at' | 'post_count' | 'reputation' | 'last_active';
export type SortOrder = 'asc' | 'desc';

/** Description. */
/** Generate fallback members. */
export function generateFallbackMembers(): Member[] {
  return [
    {
      id: '1',
      username: 'admin',
      displayName: 'Administrator',
      avatarUrl: null,
      userGroup: 'Admin',
      userGroupColor: '#ef4444',
      isOnline: true,
      lastActive: new Date().toISOString(),
      joinedAt: '2024-01-01T00:00:00Z',
      postCount: 1234,
      reputation: 999,
    },
    {
      id: '2',
      username: 'moderator',
      displayName: 'Mod User',
      avatarUrl: null,
      userGroup: 'Moderator',
      userGroupColor: '#3b82f6',
      isOnline: true,
      lastActive: new Date().toISOString(),
      joinedAt: '2024-02-15T00:00:00Z',
      postCount: 567,
      reputation: 450,
    },
    {
      id: '3',
      username: 'john_doe',
      displayName: 'John Doe',
      avatarUrl: null,
      userGroup: 'Member',
      userGroupColor: '#10b981',
      isOnline: false,
      lastActive: '2026-01-12T10:00:00Z',
      joinedAt: '2025-03-20T00:00:00Z',
      postCount: 89,
      reputation: 42,
    },
    {
      id: '4',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      avatarUrl: null,
      userGroup: 'Premium',
      userGroupColor: '#8b5cf6',
      isOnline: true,
      lastActive: new Date().toISOString(),
      joinedAt: '2025-06-10T00:00:00Z',
      postCount: 234,
      reputation: 156,
    },
    {
      id: '5',
      username: 'new_user',
      displayName: null,
      avatarUrl: null,
      userGroup: 'Member',
      userGroupColor: '#10b981',
      isOnline: false,
      lastActive: '2026-01-10T15:30:00Z',
      joinedAt: '2026-01-05T00:00:00Z',
      postCount: 5,
      reputation: 2,
    },
  ];
}

/** Description. */
/** Transforms api members. */
export function transformApiMembers(data: Record<string, unknown>[]): Member[] {
  return data.map((m) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: m.id as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    username: (m.username as string) || 'Unknown',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    displayName: (m.display_name as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    avatarUrl: (m.avatar_url as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    userGroup: (m.user_group as string) || 'Member',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    userGroupColor: (m.user_group_color as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isOnline: (m.is_online as boolean) || false,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    lastActive: (m.last_active as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    joinedAt: (m.joined_at as string) || new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    postCount: (m.post_count as number) || 0,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    reputation: (m.reputation as number) || 0,
  }));
}

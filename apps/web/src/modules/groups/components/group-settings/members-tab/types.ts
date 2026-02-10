/**
 * MembersTab type definitions
 * @module modules/groups/components/group-settings/members-tab
 */

export interface GroupMember {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  roles: Array<{ id: string; name: string; color: string }>;
  joinedAt: string;
  isMuted: boolean;
  mutedUntil: string | null;
}

export interface GroupRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

export type MemberAction = 'none' | 'kick' | 'ban' | 'mute';

export const ROLE_COLORS: Record<string, string> = {
  owner: 'text-yellow-400 bg-yellow-400/10',
  admin: 'text-red-400 bg-red-400/10',
  moderator: 'text-blue-400 bg-blue-400/10',
  member: 'text-gray-400 bg-gray-400/10',
};

/**
 * Groups Types
 * 
 * TypeScript types and interfaces for groups feature.
 */

// Re-export from shared types
export type {
  Group,
  Channel,
  Role,
  Member,
  Invite,
} from '@cgraph/shared-types';

// Feature-specific types
export interface GroupWithDetails {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  ownerId: string;
  memberCount: number;
  channelCount: number;
  isPublic: boolean;
  features: GroupFeature[];
  createdAt: Date;
  updatedAt: Date;
}

export type GroupFeature = 
  | 'VERIFIED'
  | 'PARTNERED'
  | 'DISCOVERABLE'
  | 'COMMUNITY'
  | 'MONETIZED'
  | 'ANIMATED_ICON';

export interface ChannelWithDetails {
  id: string;
  groupId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  position: number;
  parentId?: string; // For category nesting
  isPrivate: boolean;
  permissionOverwrites: PermissionOverwrite[];
  lastMessageAt?: Date;
  createdAt: Date;
}

export type ChannelType = 
  | 'text'
  | 'voice'
  | 'announcement'
  | 'forum'
  | 'stage'
  | 'category';

export interface PermissionOverwrite {
  id: string;
  type: 'role' | 'member';
  allow: bigint;
  deny: bigint;
}

export interface RoleWithDetails {
  id: string;
  groupId: string;
  name: string;
  color: string;
  permissions: bigint;
  position: number;
  isHoisted: boolean;
  isMentionable: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface MemberWithDetails {
  userId: string;
  groupId: string;
  nickname?: string;
  avatar?: string;
  roles: string[];
  joinedAt: Date;
  premiumSince?: Date;
  isOwner: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  communicationDisabledUntil?: Date;
}

export interface InviteWithDetails {
  code: string;
  groupId: string;
  channelId?: string;
  creatorId: string;
  uses: number;
  maxUses?: number;
  expiresAt?: Date;
  isTemporary: boolean;
  createdAt: Date;
}

export interface GroupSettings {
  id: string;
  groupId: string;
  defaultMessageNotifications: 'all' | 'mentions' | 'none';
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all';
  verificationLevel: 'none' | 'low' | 'medium' | 'high' | 'very_high';
  afkChannelId?: string;
  afkTimeout: number;
  systemChannelId?: string;
  rulesChannelId?: string;
}

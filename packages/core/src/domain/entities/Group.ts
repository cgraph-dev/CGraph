/**
 * Group Entity
 * 
 * Core domain entity representing a group (server) in the CGraph platform.
 */

export interface GroupEntity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  ownerId: string;
  memberCount: number;
  isPublic: boolean;
  isVerified: boolean;
  isPartnered: boolean;
  features: GroupFeature[];
  settings: GroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type GroupFeature = 
  | 'VERIFIED'
  | 'PARTNERED'
  | 'DISCOVERABLE'
  | 'COMMUNITY'
  | 'MONETIZED'
  | 'ANIMATED_ICON'
  | 'BANNER'
  | 'VANITY_URL'
  | 'ROLE_ICONS';

export interface GroupSettings {
  defaultNotifications: 'all' | 'mentions' | 'none';
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all';
  verificationLevel: VerificationLevel;
  afkChannelId?: string;
  afkTimeout: number;
  systemChannelId?: string;
  rulesChannelId?: string;
}

export type VerificationLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

export interface ChannelEntity {
  id: string;
  groupId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  position: number;
  parentId?: string;
  isPrivate: boolean;
  isNSFW: boolean;
  rateLimitPerUser?: number;
  permissionOverwrites: PermissionOverwrite[];
  createdAt: Date;
  updatedAt: Date;
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

export interface RoleEntity {
  id: string;
  groupId: string;
  name: string;
  color: string;
  permissions: bigint;
  position: number;
  isHoisted: boolean;
  isMentionable: boolean;
  isDefault: boolean;
  icon?: string;
  createdAt: Date;
}

export interface MemberEntity {
  userId: string;
  groupId: string;
  nickname?: string;
  avatar?: string;
  roles: string[];
  joinedAt: Date;
  premiumSince?: Date;
  isPending: boolean;
  communicationDisabledUntil?: Date;
}

// Permission bit flags
export const Permissions = {
  // General
  ADMINISTRATOR: 1n << 0n,
  VIEW_CHANNELS: 1n << 1n,
  MANAGE_CHANNELS: 1n << 2n,
  MANAGE_ROLES: 1n << 3n,
  MANAGE_GROUP: 1n << 4n,
  
  // Membership
  CREATE_INVITE: 1n << 5n,
  KICK_MEMBERS: 1n << 6n,
  BAN_MEMBERS: 1n << 7n,
  MODERATE_MEMBERS: 1n << 8n,
  
  // Messaging
  SEND_MESSAGES: 1n << 9n,
  SEND_ATTACHMENTS: 1n << 10n,
  EMBED_LINKS: 1n << 11n,
  ADD_REACTIONS: 1n << 12n,
  USE_EXTERNAL_EMOJI: 1n << 13n,
  MENTION_EVERYONE: 1n << 14n,
  MANAGE_MESSAGES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  
  // Voice
  CONNECT: 1n << 17n,
  SPEAK: 1n << 18n,
  MUTE_MEMBERS: 1n << 19n,
  DEAFEN_MEMBERS: 1n << 20n,
  MOVE_MEMBERS: 1n << 21n,
  USE_VOICE_ACTIVITY: 1n << 22n,
  PRIORITY_SPEAKER: 1n << 23n,
  STREAM: 1n << 24n,
} as const;

/**
 * Check if permissions include a specific permission
 */
export function hasPermission(permissions: bigint, permission: bigint): boolean {
  if ((permissions & Permissions.ADMINISTRATOR) === Permissions.ADMINISTRATOR) {
    return true;
  }
  return (permissions & permission) === permission;
}

/**
 * Compute effective permissions for a member in a channel
 */
export function computePermissions(
  member: MemberEntity,
  roles: RoleEntity[],
  channel?: ChannelEntity
): bigint {
  // Start with @everyone role permissions
  const everyoneRole = roles.find(r => r.isDefault);
  let permissions = everyoneRole?.permissions ?? 0n;
  
  // Add permissions from member's roles
  for (const roleId of member.roles) {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      permissions |= role.permissions;
    }
  }
  
  // Administrator bypasses all checks
  if (hasPermission(permissions, Permissions.ADMINISTRATOR)) {
    return BigInt(Number.MAX_SAFE_INTEGER);
  }
  
  // Apply channel permission overwrites
  if (channel) {
    for (const overwrite of channel.permissionOverwrites) {
      if (overwrite.type === 'role' && member.roles.includes(overwrite.id)) {
        permissions &= ~overwrite.deny;
        permissions |= overwrite.allow;
      }
      if (overwrite.type === 'member' && overwrite.id === member.userId) {
        permissions &= ~overwrite.deny;
        permissions |= overwrite.allow;
      }
    }
  }
  
  return permissions;
}

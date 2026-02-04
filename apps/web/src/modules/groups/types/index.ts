/**
 * Groups Module Types
 *
 * Type definitions for group functionality.
 *
 * @module modules/groups/types
 * @version 1.0.0
 */

// Re-export store types
export type {
  Group,
  Channel,
  ChannelCategory,
  Member,
  Role,
  ChannelMessage,
  GroupState,
} from '../store/groupStore.impl';

/**
 * Channel type
 */
export type ChannelType = 'text' | 'voice' | 'video' | 'announcement' | 'forum';

/**
 * Group visibility
 */
export type GroupVisibility = 'public' | 'private' | 'unlisted';

/**
 * Group invite
 */
export interface GroupInvite {
  code: string;
  groupId: string;
  groupName: string;
  groupIconUrl: string | null;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  isRevoked: boolean;
}

/**
 * Group settings
 */
export interface GroupSettings {
  defaultNotificationLevel: 'all' | 'mentions' | 'none';
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members';
  verificationLevel: 'none' | 'low' | 'medium' | 'high' | 'very_high';
  messageDeleteTimeout: number;
  afkTimeout: number;
  afkChannelId: string | null;
  systemChannelId: string | null;
  welcomeMessage: string | null;
  boostLevel: number;
  features: GroupFeature[];
}

/**
 * Group feature
 */
export type GroupFeature =
  | 'animated_icon'
  | 'animated_banner'
  | 'custom_invite_link'
  | 'vanity_url'
  | 'more_stickers'
  | 'more_emojis'
  | 'welcome_screen'
  | 'member_profiles'
  | 'role_icons'
  | 'private_threads';

/**
 * Permission flags
 */
export type PermissionFlag =
  | 'VIEW_CHANNEL'
  | 'SEND_MESSAGES'
  | 'EMBED_LINKS'
  | 'ATTACH_FILES'
  | 'ADD_REACTIONS'
  | 'USE_EXTERNAL_EMOJIS'
  | 'MENTION_EVERYONE'
  | 'MANAGE_MESSAGES'
  | 'READ_MESSAGE_HISTORY'
  | 'CONNECT'
  | 'SPEAK'
  | 'VIDEO'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS'
  | 'USE_VOICE_ACTIVITY'
  | 'PRIORITY_SPEAKER'
  | 'STREAM'
  | 'MANAGE_CHANNEL'
  | 'MANAGE_ROLES'
  | 'MANAGE_WEBHOOKS'
  | 'MANAGE_GUILD'
  | 'KICK_MEMBERS'
  | 'BAN_MEMBERS'
  | 'ADMINISTRATOR';

/**
 * Role permissions
 */
export interface RolePermissions {
  allow: PermissionFlag[];
  deny: PermissionFlag[];
}

/**
 * Channel permission override
 */
export interface ChannelPermissionOverride {
  id: string;
  type: 'role' | 'member';
  targetId: string;
  allow: number;
  deny: number;
}

/**
 * Group ban
 */
export interface GroupBan {
  userId: string;
  username: string;
  reason: string | null;
  bannedBy: string;
  bannedAt: string;
}

/**
 * Audit log entry
 */
export interface GroupAuditLogEntry {
  id: string;
  actionType: GroupAuditLogAction;
  userId: string;
  username: string;
  targetId?: string;
  targetType?: 'channel' | 'role' | 'member' | 'invite';
  changes: AuditLogChange[];
  reason?: string;
  timestamp: string;
}

/**
 * Audit log action
 */
export type GroupAuditLogAction =
  | 'GUILD_UPDATE'
  | 'CHANNEL_CREATE'
  | 'CHANNEL_UPDATE'
  | 'CHANNEL_DELETE'
  | 'ROLE_CREATE'
  | 'ROLE_UPDATE'
  | 'ROLE_DELETE'
  | 'MEMBER_KICK'
  | 'MEMBER_BAN'
  | 'MEMBER_UNBAN'
  | 'MEMBER_ROLE_UPDATE'
  | 'INVITE_CREATE'
  | 'INVITE_DELETE'
  | 'MESSAGE_DELETE'
  | 'MESSAGE_BULK_DELETE';

/**
 * Audit log change
 */
export interface AuditLogChange {
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Group emoji
 */
export interface GroupEmoji {
  id: string;
  name: string;
  url: string;
  animated: boolean;
  createdBy: string;
  createdAt: string;
}

/**
 * Group sticker
 */
export interface GroupSticker {
  id: string;
  name: string;
  description: string;
  url: string;
  formatType: 'png' | 'apng' | 'lottie';
  tags: string[];
  createdBy: string;
  createdAt: string;
}

/**
 * Voice state
 */
export interface VoiceState {
  userId: string;
  channelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSelfMuted: boolean;
  isSelfDeafened: boolean;
  isStreaming: boolean;
  isVideoEnabled: boolean;
}

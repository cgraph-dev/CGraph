/**
 * Types and constants for the ChannelPermissionsPanel
 *
 * @module modules/groups/components/group-settings/channel-permissions
 */

export interface PermissionOverwrite {
  id: string;
  type: 'role' | 'member';
  roleId: string | null;
  memberId: string | null;
  roleName?: string;
  memberName?: string;
  allow: number;
  deny: number;
}

export interface RoleOption {
  id: string;
  name: string;
  color: string;
}

export interface ChannelPermissionsPanelProps {
  groupId: string;
  channelId: string;
  channelName: string;
  onClose: () => void;
}

export type PermState = 'allow' | 'deny' | 'inherit';

/**
 * Permission flags matching Discord's permission system.
 * Stored as bitmask integers.
 */
export const PERMISSION_FLAGS = [
  { bit: 1 << 0, label: 'View Channel', description: 'Allow viewing the channel' },
  { bit: 1 << 1, label: 'Send Messages', description: 'Allow sending messages' },
  { bit: 1 << 2, label: 'Embed Links', description: 'Allow embedding links' },
  { bit: 1 << 3, label: 'Attach Files', description: 'Allow attaching files' },
  { bit: 1 << 4, label: 'Add Reactions', description: 'Allow adding reactions' },
  { bit: 1 << 5, label: 'Use External Emoji', description: 'Allow external emoji' },
  { bit: 1 << 6, label: 'Mention Everyone', description: 'Allow @everyone mentions' },
  { bit: 1 << 7, label: 'Manage Messages', description: 'Allow deleting/pinning messages' },
  { bit: 1 << 8, label: 'Read Message History', description: 'Allow reading history' },
  { bit: 1 << 9, label: 'Connect', description: 'Allow connecting to voice' },
  { bit: 1 << 10, label: 'Speak', description: 'Allow speaking in voice' },
] as const;

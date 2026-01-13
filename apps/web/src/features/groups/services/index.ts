/**
 * Groups Services
 * 
 * API and business logic services for groups.
 */

// API endpoints for groups
export const groupsApi = {
  // Groups
  getGroups: () => '/api/v1/groups',
  getGroup: (id: string) => `/api/v1/groups/${id}`,
  createGroup: () => '/api/v1/groups',
  updateGroup: (id: string) => `/api/v1/groups/${id}`,
  deleteGroup: (id: string) => `/api/v1/groups/${id}`,
  
  // Channels
  getChannels: (groupId: string) => `/api/v1/groups/${groupId}/channels`,
  getChannel: (groupId: string, channelId: string) => `/api/v1/groups/${groupId}/channels/${channelId}`,
  createChannel: (groupId: string) => `/api/v1/groups/${groupId}/channels`,
  updateChannel: (groupId: string, channelId: string) => `/api/v1/groups/${groupId}/channels/${channelId}`,
  deleteChannel: (groupId: string, channelId: string) => `/api/v1/groups/${groupId}/channels/${channelId}`,
  
  // Members
  getMembers: (groupId: string) => `/api/v1/groups/${groupId}/members`,
  getMember: (groupId: string, userId: string) => `/api/v1/groups/${groupId}/members/${userId}`,
  updateMember: (groupId: string, userId: string) => `/api/v1/groups/${groupId}/members/${userId}`,
  kickMember: (groupId: string, userId: string) => `/api/v1/groups/${groupId}/members/${userId}/kick`,
  banMember: (groupId: string, userId: string) => `/api/v1/groups/${groupId}/members/${userId}/ban`,
  
  // Roles
  getRoles: (groupId: string) => `/api/v1/groups/${groupId}/roles`,
  getRole: (groupId: string, roleId: string) => `/api/v1/groups/${groupId}/roles/${roleId}`,
  createRole: (groupId: string) => `/api/v1/groups/${groupId}/roles`,
  updateRole: (groupId: string, roleId: string) => `/api/v1/groups/${groupId}/roles/${roleId}`,
  deleteRole: (groupId: string, roleId: string) => `/api/v1/groups/${groupId}/roles/${roleId}`,
  assignRole: (groupId: string, userId: string, roleId: string) => `/api/v1/groups/${groupId}/members/${userId}/roles/${roleId}`,
  
  // Invites
  getInvites: (groupId: string) => `/api/v1/groups/${groupId}/invites`,
  createInvite: (groupId: string) => `/api/v1/groups/${groupId}/invites`,
  deleteInvite: (groupId: string, inviteCode: string) => `/api/v1/groups/${groupId}/invites/${inviteCode}`,
  joinWithInvite: (inviteCode: string) => `/api/v1/invites/${inviteCode}/join`,
};

// Permission constants
export const PERMISSIONS = {
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
} as const;

// Helper to check permissions
export function hasPermission(userPermissions: bigint, permission: bigint): boolean {
  if ((userPermissions & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR) {
    return true;
  }
  return (userPermissions & permission) === permission;
}

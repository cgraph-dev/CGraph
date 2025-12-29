/**
 * Permission flags (matching the Elixir backend)
 */
export const Permissions = {
  // General
  VIEW_CHANNELS: 1n << 0n,
  MANAGE_CHANNELS: 1n << 1n,
  MANAGE_ROLES: 1n << 2n,
  MANAGE_GROUP: 1n << 3n,
  
  // Membership
  KICK_MEMBERS: 1n << 4n,
  BAN_MEMBERS: 1n << 5n,
  CREATE_INVITES: 1n << 6n,
  CHANGE_NICKNAME: 1n << 7n,
  MANAGE_NICKNAMES: 1n << 8n,
  
  // Text Channels
  SEND_MESSAGES: 1n << 9n,
  EMBED_LINKS: 1n << 10n,
  ATTACH_FILES: 1n << 11n,
  ADD_REACTIONS: 1n << 12n,
  USE_EXTERNAL_EMOJIS: 1n << 13n,
  MENTION_EVERYONE: 1n << 14n,
  MANAGE_MESSAGES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  
  // Voice Channels
  CONNECT: 1n << 17n,
  SPEAK: 1n << 18n,
  VIDEO: 1n << 19n,
  MUTE_MEMBERS: 1n << 20n,
  DEAFEN_MEMBERS: 1n << 21n,
  MOVE_MEMBERS: 1n << 22n,
  
  // Admin
  ADMINISTRATOR: 1n << 31n,
} as const;

export type Permission = keyof typeof Permissions;

/**
 * Check if a permission set has a specific permission
 */
export function hasPermission(
  permissions: bigint | number,
  permission: Permission
): boolean {
  const permValue = BigInt(permissions);
  const flag = Permissions[permission];
  
  // Administrator has all permissions
  if ((permValue & Permissions.ADMINISTRATOR) === Permissions.ADMINISTRATOR) {
    return true;
  }
  
  return (permValue & flag) === flag;
}

/**
 * Check if a permission set has any of the specified permissions
 */
export function hasAnyPermission(
  permissions: bigint | number,
  permissionList: Permission[]
): boolean {
  return permissionList.some((perm) => hasPermission(permissions, perm));
}

/**
 * Check if a permission set has all of the specified permissions
 */
export function hasAllPermissions(
  permissions: bigint | number,
  permissionList: Permission[]
): boolean {
  return permissionList.every((perm) => hasPermission(permissions, perm));
}

/**
 * Add a permission to a permission set
 */
export function addPermission(
  permissions: bigint | number,
  permission: Permission
): bigint {
  return BigInt(permissions) | Permissions[permission];
}

/**
 * Remove a permission from a permission set
 */
export function removePermission(
  permissions: bigint | number,
  permission: Permission
): bigint {
  return BigInt(permissions) & ~Permissions[permission];
}

/**
 * Toggle a permission in a permission set
 */
export function togglePermission(
  permissions: bigint | number,
  permission: Permission
): bigint {
  return BigInt(permissions) ^ Permissions[permission];
}

/**
 * Combine multiple roles' permissions
 */
export function combineRolePermissions(
  roles: { permissions: bigint | number }[]
): bigint {
  return roles.reduce(
    (combined, role) => combined | BigInt(role.permissions),
    0n
  );
}

/**
 * Get a list of all permissions in a permission set
 */
export function getPermissionList(permissions: bigint | number): Permission[] {
  const permValue = BigInt(permissions);
  return (Object.keys(Permissions) as Permission[]).filter(
    (perm) => (permValue & Permissions[perm]) === Permissions[perm]
  );
}

/**
 * Create a permission set from a list of permissions
 */
export function createPermissionSet(permissionList: Permission[]): bigint {
  return permissionList.reduce(
    (set, perm) => set | Permissions[perm],
    0n
  );
}

/**
 * Default member permissions
 */
export const DEFAULT_MEMBER_PERMISSIONS = createPermissionSet([
  'VIEW_CHANNELS',
  'SEND_MESSAGES',
  'EMBED_LINKS',
  'ATTACH_FILES',
  'ADD_REACTIONS',
  'USE_EXTERNAL_EMOJIS',
  'READ_MESSAGE_HISTORY',
  'CONNECT',
  'SPEAK',
  'VIDEO',
  'CHANGE_NICKNAME',
  'CREATE_INVITES',
]);

/**
 * Moderator permissions
 */
export const MODERATOR_PERMISSIONS = createPermissionSet([
  'VIEW_CHANNELS',
  'SEND_MESSAGES',
  'EMBED_LINKS',
  'ATTACH_FILES',
  'ADD_REACTIONS',
  'USE_EXTERNAL_EMOJIS',
  'MENTION_EVERYONE',
  'MANAGE_MESSAGES',
  'READ_MESSAGE_HISTORY',
  'CONNECT',
  'SPEAK',
  'VIDEO',
  'MUTE_MEMBERS',
  'MOVE_MEMBERS',
  'CHANGE_NICKNAME',
  'MANAGE_NICKNAMES',
  'CREATE_INVITES',
  'KICK_MEMBERS',
]);

/**
 * Admin permissions
 */
export const ADMIN_PERMISSIONS = Permissions.ADMINISTRATOR;

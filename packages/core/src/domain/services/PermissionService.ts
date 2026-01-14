/**
 * Permission Service
 * 
 * Domain service for computing and checking permissions.
 */

import { 
  MemberEntity, 
  RoleEntity, 
  ChannelEntity, 
  Permissions,
  hasPermission,
  computePermissions 
} from '../entities/Group';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  missingPermissions?: string[];
}

/**
 * Permission Service for checking user permissions in groups/channels
 */
export class PermissionService {
  /**
   * Check if a member has a specific permission
   */
  static check(
    member: MemberEntity,
    roles: RoleEntity[],
    permission: bigint,
    channel?: ChannelEntity
  ): PermissionCheckResult {
    const permissions = computePermissions(member, roles, channel);
    const allowed = hasPermission(permissions, permission);
    
    if (!allowed) {
      return {
        allowed: false,
        reason: 'Missing required permission',
        missingPermissions: [this.getPermissionName(permission)],
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Check multiple permissions at once
   */
  static checkAll(
    member: MemberEntity,
    roles: RoleEntity[],
    requiredPermissions: bigint[],
    channel?: ChannelEntity
  ): PermissionCheckResult {
    const permissions = computePermissions(member, roles, channel);
    const missing: string[] = [];
    
    for (const required of requiredPermissions) {
      if (!hasPermission(permissions, required)) {
        missing.push(this.getPermissionName(required));
      }
    }
    
    if (missing.length > 0) {
      return {
        allowed: false,
        reason: 'Missing required permissions',
        missingPermissions: missing,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Check if member can manage another member
   */
  static canManageMember(
    actor: MemberEntity,
    target: MemberEntity,
    roles: RoleEntity[]
  ): PermissionCheckResult {
    // Can't manage yourself
    if (actor.userId === target.userId) {
      return { allowed: false, reason: 'Cannot manage yourself' };
    }
    
    // Get highest role position for each member
    const actorHighestRole = this.getHighestRole(actor.roles, roles);
    const targetHighestRole = this.getHighestRole(target.roles, roles);
    
    // Both must have roles to compare
    if (!actorHighestRole || !targetHighestRole) {
      return { allowed: false, reason: 'Role information unavailable' };
    }
    
    // Actor must have higher role than target
    if (actorHighestRole.position <= targetHighestRole.position) {
      return { allowed: false, reason: 'Target has equal or higher role' };
    }
    
    return { allowed: true };
  }
  
  /**
   * Get permission name from bit flag
   */
  private static getPermissionName(permission: bigint): string {
    for (const [name, value] of Object.entries(Permissions)) {
      if (value === permission) {
        return name;
      }
    }
    return 'UNKNOWN';
  }
  
  /**
   * Get highest role for a member
   */
  private static getHighestRole(memberRoles: string[], allRoles: RoleEntity[]): RoleEntity | undefined {
    const roles = allRoles.filter(r => memberRoles.includes(r.id));
    if (roles.length === 0) return undefined;
    return roles.reduce((highest, role) => 
      role.position > highest.position ? role : highest
    , roles[0]!);
  }
}

// Export permission constants for convenience
export { Permissions };

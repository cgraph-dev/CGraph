/**
 * Member List Module Types
 *
 * Type definitions for the group member list components.
 *
 * @module modules/groups/components/member-list
 */

import type { Member } from '@/stores/groupStore';

/** Props for the main MemberList component */
export interface MemberListProps {
  /** Group ID to display members for */
  groupId: string;
  /** Additional CSS classes */
  className?: string;
}

/** Online status type */
export type StatusType = 'online' | 'idle' | 'dnd' | 'offline';

/** Props for individual member row */
export interface MemberItemProps {
  /** Member data */
  member: Member;
  /** Role color for name display */
  roleColor?: string;
  /** Click handler for context menu */
  onClick: (event: React.MouseEvent) => void;
}

/** Props for member context menu */
export interface MemberContextMenuProps {
  /** Target member */
  member: Member;
  /** Menu position coordinates */
  position: { x: number; y: number };
  /** Whether the current user owns the group */
  isOwner: boolean;
  /** Close the context menu */
  onClose: () => void;
}

/** Props for role-grouped member section */
export interface RoleSectionProps {
  /** Role to display */
  role: import('@/stores/groupStore').Role;
  /** Members with this role */
  members: Member[];
  /** Click handler for member rows */
  onMemberClick: (member: Member, event: React.MouseEvent) => void;
}

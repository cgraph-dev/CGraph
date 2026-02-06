/**
 * Member List Module
 *
 * Group member listing with role-based sections, online status indicators,
 * search filtering, and context menu actions.
 *
 * @module modules/groups/components/member-list
 */

// Main component
export { MemberList, default } from './MemberList';

// Sub-components
export { MemberItem } from './MemberItem';

// Types
export type {
  MemberListProps,
  StatusType,
  MemberItemProps,
  MemberContextMenuProps,
  RoleSectionProps,
} from './types';

// Constants
export { statusColors, statusLabels } from './constants';

/**
 * GroupList Module
 *
 * Barrel exports for the modular group list.
 */

// Main component
export { GroupList } from './group-list';
export { GroupList as default } from './group-list';

// Sub-components
export { GroupIcon } from './group-icon';
export { GroupCard } from './group-card';
export { GroupListItem } from './group-list-item';
export { CreateGroupModal } from './create-group-modal';

// Types
export type {
  GroupListVariant,
  GroupListProps,
  GroupIconProps,
  GroupCardProps,
  GroupListItemProps,
  CreateGroupModalProps,
  Group,
} from './types';

/**
 * GroupList Module
 *
 * Barrel exports for the modular group list.
 */

// Main component
export { GroupList } from './GroupList';
export { GroupList as default } from './GroupList';

// Sub-components
export { GroupIcon } from './GroupIcon';
export { GroupCard } from './GroupCard';
export { GroupListItem } from './GroupListItem';
export { CreateGroupModal } from './CreateGroupModal';

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

/**
 * GroupList Types
 *
 * Type definitions for the group list components.
 */

import type { Group } from '../../store';

export type GroupListVariant = 'sidebar' | 'grid' | 'list';

export interface GroupListProps {
  variant?: GroupListVariant;
  showSearch?: boolean;
  showCreateButton?: boolean;
  className?: string;
}

export interface GroupIconProps {
  group: Group;
  isActive?: boolean;
  onClick: () => void;
}

export interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export interface GroupListItemProps {
  group: Group;
  onClick: () => void;
}

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; description: string; isPublic: boolean }) => Promise<void>;
}

// Re-export Group type for convenience
export type { Group } from '../../store';

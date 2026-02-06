/**
 * ForumOrderingAdmin type definitions
 * @module modules/admin/components/forum-ordering-admin
 */

export interface ForumItem {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  type: 'forum' | 'category' | 'board';
  parent_id?: string;
  children?: ForumItem[];
  is_hidden?: boolean;
  icon?: string;
}

export interface ForumOrderingAdminProps {
  /** List of items to order (forums, categories, or boards) */
  items: ForumItem[];
  /** Callback when order changes */
  onOrderChange: (items: ForumItem[]) => Promise<void>;
  /** Type of items being ordered */
  itemType: 'forum' | 'category' | 'board';
  /** Whether nested ordering is enabled */
  allowNested?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Parent item ID (for nested views) */
  parentId?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface OrderableItemProps {
  item: ForumItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  depth?: number;
}

export interface OrderingToolbarProps {
  hasChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onReset: () => void;
}

export interface HistoryState {
  items: ForumItem[];
  timestamp: number;
}

export type ItemType = 'forum' | 'category' | 'board';

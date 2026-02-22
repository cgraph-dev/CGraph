/**
 * ForumOrderingAdmin module exports
 * @module modules/admin/components/forum-ordering-admin
 */

export { ForumOrderingAdmin, default } from './forum-ordering-admin';

// Components
export { OrderableItem } from './orderable-item';
export { OrderingToolbar } from './ordering-toolbar';
export { LoadingState } from './loading-state';
export { EmptyState } from './empty-state';
export { HelpText } from './help-text';

// Hooks
export { useForumOrdering } from './useForumOrdering';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';

// Utilities
export { updateDisplayOrders, moveItem } from './utils';

// Types
export type {
  ForumItem,
  ForumOrderingAdminProps,
  OrderableItemProps,
  OrderingToolbarProps,
  HistoryState,
  ItemType,
} from './types';

// Constants
export { MAX_HISTORY_LENGTH, ITEM_TYPE_ICONS, ITEM_TYPE_COLORS } from './constants';

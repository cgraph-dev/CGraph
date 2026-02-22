/**
 * ModerationQueue module exports
 * @module pages/forums/moderation-queue
 */

export { default } from './moderation-queue';
export { default as ModerationQueue } from './moderation-queue';

// Components
export { QueueItemCard } from './queue-item-card';
export { QueueHeader } from './queue-header';
export { QueueFilters } from './queue-filters';
export { BulkActionsBar } from './bulk-actions-bar';
export { QueueList } from './queue-list';
export { RejectModal } from './reject-modal';
export { AccessRestricted } from './access-restricted';

// Hooks
export { useModerationQueue } from './useModerationQueue';

// Types
export type {
  FilterState,
  FilterKey,
  QueueItemCardProps,
  QueueCounts,
  UseModerationQueueReturn,
} from './types';

// Constants
export { ITEM_TYPE_ICONS, PRIORITY_COLORS, REASON_LABELS, DEFAULT_FILTER_STATE } from './constants';

/**
 * ModerationQueue module exports
 * @module pages/forums/moderation-queue
 */

export { default } from './ModerationQueue';
export { default as ModerationQueue } from './ModerationQueue';

// Components
export { QueueItemCard } from './QueueItemCard';
export { QueueHeader } from './QueueHeader';
export { QueueFilters } from './QueueFilters';
export { BulkActionsBar } from './BulkActionsBar';
export { QueueList } from './QueueList';
export { RejectModal } from './RejectModal';
export { AccessRestricted } from './AccessRestricted';

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

/**
 * ModerationQueue type definitions
 * @module pages/forums/moderation-queue
 */

import type { ModerationQueueItem } from '@/stores/moderationStore';

export interface FilterState {
  status: 'pending' | 'all';
  itemType: 'all' | 'thread' | 'post' | 'comment' | 'user' | 'attachment';
  priority: 'all' | 'low' | 'normal' | 'high' | 'critical';
  reason: 'all' | 'new_user' | 'flagged' | 'auto_spam' | 'reported' | 'manual';
  searchQuery: string;
}

export type FilterKey = keyof FilterState;

export interface QueueItemCardProps {
  item: ModerationQueueItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPreview?: (item: ModerationQueueItem) => void;
}

export interface QueueCounts {
  pending: number;
  reported: number;
  flagged: number;
}

export interface UseModerationQueueReturn {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  selectedItems: Set<string>;
  filteredQueue: ModerationQueueItem[];
  isLoadingQueue: boolean;
  queueCounts: QueueCounts;
  rejectModalOpen: boolean;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  handleApprove: (id: string) => Promise<void>;
  handleReject: (id: string) => void;
  handleBulkApprove: () => Promise<void>;
  handleBulkReject: () => void;
  confirmReject: () => Promise<void>;
  closeRejectModal: () => void;
  refresh: () => void;
}

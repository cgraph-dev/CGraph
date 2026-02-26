/**
 * Moderation queue page for forum moderators and admins.
 * @module pages/forums/moderation-queue/moderation-queue
 */
/**
 * ModerationQueue Page
 *
 * Dedicated moderation queue page for forum moderators and admins.
 * Features filtering, bulk actions, and detailed item review.
 *
 * @version 0.9.4
 * @since 2026-01-20
 */

import { useAuthStore } from '@/modules/auth/store';
import { useModerationQueue } from './useModerationQueue';
import { QueueHeader } from './queue-header';
import { QueueFilters } from './queue-filters';
import { BulkActionsBar } from './bulk-actions-bar';
import { QueueList } from './queue-list';
import { RejectModal } from './reject-modal';
import { AccessRestricted } from './access-restricted';

/**
 * Moderation Queue component.
 */
export default function ModerationQueue() {
  const { user } = useAuthStore();
  const {
    filters,
    setFilters,
    selectedItems,
    filteredQueue,
    isLoadingQueue,
    queueCounts,
    rejectModalOpen,
    rejectReason,
    setRejectReason,
    toggleSelect,
    selectAll,
    clearSelection,
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleBulkReject,
    confirmReject,
    closeRejectModal,
    refresh,
  } = useModerationQueue();

  // Check permissions
  if (!user?.isAdmin) {
    return <AccessRestricted />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <QueueHeader queueCounts={queueCounts} isLoading={isLoadingQueue} onRefresh={refresh} />

      <QueueFilters filters={filters} setFilters={setFilters} />

      <BulkActionsBar
        selectedCount={selectedItems.size}
        onClearSelection={clearSelection}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
      />

      <QueueList
        items={filteredQueue}
        selectedItems={selectedItems}
        isLoading={isLoadingQueue}
        onSelectAll={selectAll}
        onToggleSelect={toggleSelect}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <RejectModal
        isOpen={rejectModalOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={confirmReject}
        onCancel={closeRejectModal}
      />
    </div>
  );
}

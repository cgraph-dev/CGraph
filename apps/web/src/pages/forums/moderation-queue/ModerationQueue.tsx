/**
 * ModerationQueue Page
 *
 * Dedicated moderation queue page for forum moderators and admins.
 * Features filtering, bulk actions, and detailed item review.
 *
 * @version 0.9.4
 * @since 2026-01-20
 */

import { useAuthStore } from '@/stores/authStore';
import { useModerationQueue } from './useModerationQueue';
import { QueueHeader } from './QueueHeader';
import { QueueFilters } from './QueueFilters';
import { BulkActionsBar } from './BulkActionsBar';
import { QueueList } from './QueueList';
import { RejectModal } from './RejectModal';
import { AccessRestricted } from './AccessRestricted';

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

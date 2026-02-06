/**
 * Blocked Users Management Page
 *
 * View and manage blocked users with:
 * - List of blocked users with timestamps
 * - Unblock functionality
 * - Search/filter
 *
 * @version 2.0.0 (modularized)
 * @since v0.9.2
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useBlockedUsers } from './hooks';
import { containerVariants } from './animations';
import { SearchBar } from './SearchBar';
import { BlockedUserCard } from './BlockedUserCard';
import { EmptyState } from './EmptyState';
import { ConfirmUnblockModal } from './ConfirmUnblockModal';

export default function BlockedUsers() {
  const {
    searchQuery,
    setSearchQuery,
    unblockingId,
    showConfirmModal,
    selectedUser,
    blockedUsers,
    filteredUsers,
    isLoading,
    error,
    unblockMutation,
    handleUnblockClick,
    confirmUnblock,
    dismissModal,
  } = useBlockedUsers();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-400">Failed to load blocked users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Blocked Users</h1>
        <p className="text-gray-400">
          Manage users you&apos;ve blocked. Blocked users cannot message you or see your profile.
        </p>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Stats */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-dark-700 bg-dark-800/30 px-4 py-3">
        <span className="text-gray-400">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} blocked
        </span>
        {searchQuery && filteredUsers.length !== blockedUsers.length && (
          <span className="text-xs text-gray-500">
            Showing {filteredUsers.length} of {blockedUsers.length}
          </span>
        )}
      </div>

      {/* Blocked Users List */}
      {filteredUsers.length === 0 ? (
        <EmptyState hasSearchQuery={!!searchQuery} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((block) => (
              <BlockedUserCard
                key={block.id}
                block={block}
                unblockingId={unblockingId}
                onUnblockClick={handleUnblockClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <ConfirmUnblockModal
        show={showConfirmModal}
        user={selectedUser}
        isPending={unblockMutation.isPending}
        onConfirm={confirmUnblock}
        onDismiss={dismissModal}
      />
    </div>
  );
}

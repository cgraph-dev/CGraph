/**
 * Blocked Users Management Page
 *
 * View and manage blocked users with:
 * - List of blocked users with timestamps
 * - Unblock functionality
 * - Search/filter
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

// =============================================================================
// TYPES
// =============================================================================

interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: string;
  blockedUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function BlockedUsers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  // Fetch blocked users
  const {
    data: blockedUsers = [],
    isLoading,
    error,
  } = useQuery<BlockedUser[]>({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const response = await api.get('/api/v1/users/blocked');
      return response.data;
    },
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockedUserId: string) => {
      await api.delete(`/api/v1/users/blocked/${blockedUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      setShowConfirmModal(false);
      setSelectedUser(null);
    },
  });

  // Filter users by search
  const filteredUsers = blockedUsers.filter(
    (block) =>
      block.blockedUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.blockedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle unblock confirmation
  const handleUnblockClick = useCallback((user: BlockedUser) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  }, []);

  const confirmUnblock = useCallback(async () => {
    if (!selectedUser) return;
    setUnblockingId(selectedUser.blockedUserId);
    await unblockMutation.mutateAsync(selectedUser.blockedUserId);
    setUnblockingId(null);
  }, [selectedUser, unblockMutation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmModal) {
        setShowConfirmModal(false);
        setSelectedUser(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal]);

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

      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blocked users..."
          className="w-full rounded-xl border border-dark-600 bg-dark-800/50 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 text-center"
        >
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-dark-800 text-gray-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-white">
            {searchQuery ? 'No users found' : 'No blocked users'}
          </h3>
          <p className="text-gray-400">
            {searchQuery ? 'Try a different search term' : "You haven't blocked anyone yet"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((block) => (
              <motion.div
                key={block.id}
                variants={itemVariants}
                layout
                className="group flex items-center gap-4 rounded-xl border border-dark-700 bg-dark-800/30 p-4 transition-colors hover:border-dark-600"
              >
                {/* Avatar */}
                {block.blockedUser.avatarUrl ? (
                  <ThemedAvatar
                    src={block.blockedUser.avatarUrl}
                    alt={block.blockedUser.displayName}
                    size="medium"
                    className="h-12 w-12 ring-2 ring-dark-600"
                    avatarBorderId={
                      block.blockedUser.avatarBorderId ?? block.blockedUser.avatar_border_id ?? null
                    }
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-lg font-bold text-white">
                    {block.blockedUser.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}

                {/* User Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium text-white">
                    {block.blockedUser.displayName}
                  </h4>
                  <p className="truncate text-sm text-gray-500">@{block.blockedUser.username}</p>
                </div>

                {/* Blocked Time */}
                <div className="hidden text-sm text-gray-500 sm:block">
                  Blocked {formatDistanceToNow(new Date(block.blockedAt), { addSuffix: true })}
                </div>

                {/* Unblock Button */}
                <button
                  onClick={() => handleUnblockClick(block)}
                  disabled={unblockingId === block.blockedUserId}
                  className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unblockingId === block.blockedUserId ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  )}
                  Unblock
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-dark-600 bg-dark-800 shadow-2xl"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  {selectedUser.blockedUser.avatarUrl ? (
                    <ThemedAvatar
                      src={selectedUser.blockedUser.avatarUrl}
                      alt={selectedUser.blockedUser.displayName}
                      size="large"
                      className="h-16 w-16"
                      avatarBorderId={
                        selectedUser.blockedUser.avatarBorderId ??
                        selectedUser.blockedUser.avatar_border_id ??
                        null
                      }
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-2xl font-bold text-white">
                      {selectedUser.blockedUser.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Unblock {selectedUser.blockedUser.displayName}?
                    </h3>
                    <p className="text-sm text-gray-400">@{selectedUser.blockedUser.username}</p>
                  </div>
                </div>

                <p className="mb-6 text-gray-400">
                  They will be able to send you messages and view your profile again. You can block
                  them again at any time.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 rounded-xl bg-dark-700 py-2.5 text-gray-300 transition-colors hover:bg-dark-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUnblock}
                    disabled={unblockMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {unblockMutation.isPending ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Unblocking...
                      </>
                    ) : (
                      'Unblock'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

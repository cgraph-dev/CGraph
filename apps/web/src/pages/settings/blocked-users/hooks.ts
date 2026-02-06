/**
 * Hooks for Blocked Users module
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BlockedUser } from './types';

/**
 * Fetch and manage blocked users list, unblock mutation, search filtering,
 * and confirmation modal state.
 */
export function useBlockedUsers() {
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
  const filteredUsers = useMemo(
    () =>
      blockedUsers.filter(
        (block) =>
          block.blockedUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          block.blockedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [blockedUsers, searchQuery]
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

  const dismissModal = useCallback(() => {
    setShowConfirmModal(false);
    setSelectedUser(null);
  }, []);

  // Keyboard shortcuts (Escape to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmModal) {
        dismissModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal, dismissModal]);

  return {
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
  };
}

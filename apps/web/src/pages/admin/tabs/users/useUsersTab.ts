/**
 * Hook for admin users tab state management.
 * @module
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/modules/admin/api';

const PER_PAGE = 20;

/**
 * unknown for the admin module.
 */
/**
 * Hook for managing users tab.
 */
export function useUsersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search: searchTerm, status: statusFilter, page }],
    queryFn: () =>
      adminApi.listUsers({ search: searchTerm, status: statusFilter, page, perPage: PER_PAGE }),
  });

  const banMutation = useMutation({
    mutationFn: ({
      userId,
      reason,
      duration,
    }: {
      userId: string;
      reason: string;
      duration?: number;
    }) => adminApi.banUser(userId, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    usersData,
    isLoading,
    banMutation,
    unbanMutation,
    perPage: PER_PAGE,
  } as const;
}

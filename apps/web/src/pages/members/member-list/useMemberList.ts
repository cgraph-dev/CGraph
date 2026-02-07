/**
 * useMemberList hook - state and logic for member list
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type { Member, UserGroup, SortField, SortOrder } from './types';

const logger = createLogger('MemberList');
const PER_PAGE = 25;

export function useMemberList() {
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [filterJoinedAfter, setFilterJoinedAfter] = useState('');
  const [filterJoinedBefore, setFilterJoinedBefore] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch user groups for filter dropdown
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const response = await api.get('/api/v1/user-groups');
        const groups = ensureArray(response.data, 'groups') as Record<string, unknown>[];
        setUserGroups(
          groups.map((g) => ({
            id: g.id as string,
            name: (g.name as string) || 'Unknown',
            color: (g.color as string) || null,
            memberCount: (g.member_count as number) || 0,
          }))
        );
      } catch (err) {
        logger.error('[MemberList] Failed to fetch user groups:', err);
      }
    };
    fetchUserGroups();
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        per_page: PER_PAGE,
        sort_by: sortField,
        sort_order: sortOrder,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (filterGroup) params.group_id = filterGroup;
      if (filterOnlineOnly) params.online_only = true;
      if (filterJoinedAfter) params.joined_after = filterJoinedAfter;
      if (filterJoinedBefore) params.joined_before = filterJoinedBefore;

      const response = await api.get('/api/v1/members', { params });
      const data = response.data;

      const memberList = ensureArray(data, 'members') as Record<string, unknown>[];
      setMembers(
        memberList.map((m) => ({
          id: m.id as string,
          username: (m.username as string) || 'Unknown',
          displayName: (m.display_name as string) || null,
          avatarUrl: (m.avatar_url as string) || null,
          avatarBorderId: (m.avatar_border_id as string) || (m.avatarBorderId as string) || null,
          userGroup: (m.user_group as string) || 'Member',
          userGroupId: (m.user_group_id as string) || '',
          userGroupColor: (m.user_group_color as string) || null,
          isOnline: (m.is_online as boolean) || false,
          lastActive: (m.last_active as string) || null,
          joinedAt: (m.joined_at as string) || new Date().toISOString(),
          postCount: (m.post_count as number) || 0,
          threadCount: (m.thread_count as number) || 0,
          reputation: (m.reputation as number) || 0,
          stars: (m.stars as number) || 0,
        }))
      );

      setTotalPages(data.total_pages || 1);
      setTotalMembers(data.total || memberList.length);
    } catch (err) {
      logger.error('[MemberList] Failed to fetch members:', err);
      setError('Failed to load member list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    sortField,
    sortOrder,
    debouncedSearch,
    filterGroup,
    filterOnlineOnly,
    filterJoinedAfter,
    filterJoinedBefore,
  ]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortOrder('asc');
      return field;
    });
    setPage(1);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterGroup('');
    setFilterOnlineOnly(false);
    setFilterJoinedAfter('');
    setFilterJoinedBefore('');
    setPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      !!(filterGroup || filterOnlineOnly || filterJoinedAfter || filterJoinedBefore || searchQuery),
    [filterGroup, filterOnlineOnly, filterJoinedAfter, filterJoinedBefore, searchQuery]
  );

  return {
    // Data
    members,
    userGroups,
    isLoading,
    error,
    // Pagination
    page,
    setPage,
    totalPages,
    totalMembers,
    // Search and filters
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filterGroup,
    setFilterGroup,
    filterOnlineOnly,
    setFilterOnlineOnly,
    filterJoinedAfter,
    setFilterJoinedAfter,
    filterJoinedBefore,
    setFilterJoinedBefore,
    hasActiveFilters,
    clearFilters,
    // Sorting
    sortField,
    sortOrder,
    handleSort,
    // Actions
    fetchMembers,
  };
}

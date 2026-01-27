import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserGroupIcon,
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import UserStars from '@/components/common/UserStars';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

/**
 * Member List Page
 *
 * MyBB-style member list with:
 * - Search by username, email
 * - Filter by group, online status, join date
 * - Sort by various criteria
 * - Pagination
 */

// Member type
interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  userGroup: string;
  userGroupId: string;
  userGroupColor: string | null;
  isOnline: boolean;
  lastActive: string | null;
  joinedAt: string;
  postCount: number;
  threadCount: number;
  reputation: number;
  stars: number;
  signature?: string;
}

// User group for filtering
interface UserGroup {
  id: string;
  name: string;
  color: string | null;
  memberCount: number;
}

// Sort options
type SortField = 'username' | 'joined_at' | 'post_count' | 'reputation' | 'last_active';
type SortOrder = 'asc' | 'desc';

export default function MemberList() {
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const perPage = 25;

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
      setPage(1); // Reset page on search
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
        console.error('[MemberList] Failed to fetch user groups:', err);
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
        per_page: perPage,
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
      console.error('[MemberList] Failed to fetch members:', err);
      setError('Failed to load member list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    perPage,
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
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterGroup('');
    setFilterOnlineOnly(false);
    setFilterJoinedAfter('');
    setFilterJoinedBefore('');
    setPage(1);
  };

  const hasActiveFilters = useMemo(
    () => filterGroup || filterOnlineOnly || filterJoinedAfter || filterJoinedBefore || searchQuery,
    [filterGroup, filterOnlineOnly, filterJoinedAfter, filterJoinedBefore, searchQuery]
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDownIcon className="ml-1 inline h-4 w-4" />
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-foreground text-2xl font-bold">Member List</h1>
            <p className="text-muted-foreground text-sm">
              {(totalMembers ?? 0).toLocaleString()} registered members
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMembers()}
          className="bg-secondary hover:bg-secondary/80 mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors sm:mt-0"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border-border mb-6 rounded-lg border p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border-border focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs">Active</span>
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="border-border mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* User group filter */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">User Group</label>
              <select
                value={filterGroup}
                onChange={(e) => {
                  setFilterGroup(e.target.value);
                  setPage(1);
                }}
                className="bg-background border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
              >
                <option value="">All Groups</option>
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.memberCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Online only */}
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterOnlineOnly}
                  onChange={(e) => {
                    setFilterOnlineOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
                />
                <span className="text-foreground text-sm font-medium">Online Only</span>
              </label>
            </div>

            {/* Joined after */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Joined After</label>
              <input
                type="date"
                value={filterJoinedAfter}
                onChange={(e) => {
                  setFilterJoinedAfter(e.target.value);
                  setPage(1);
                }}
                className="bg-background border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
              />
            </div>

            {/* Joined before */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Joined Before
              </label>
              <input
                type="date"
                value={filterJoinedBefore}
                onChange={(e) => {
                  setFilterJoinedBefore(e.target.value);
                  setPage(1);
                }}
                className="bg-background border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-6 rounded-lg border p-4">
          {error}
        </div>
      )}

      {/* Members table */}
      <div className="bg-card border-border overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-border border-b">
                <th className="text-foreground px-4 py-3 text-left font-medium">
                  <button
                    onClick={() => handleSort('username')}
                    className="hover:text-primary flex items-center transition-colors"
                  >
                    Member
                    <SortIcon field="username" />
                  </button>
                </th>
                <th className="text-foreground hidden px-4 py-3 text-left font-medium sm:table-cell">
                  Group
                </th>
                <th className="text-foreground hidden px-4 py-3 text-left font-medium md:table-cell">
                  <button
                    onClick={() => handleSort('joined_at')}
                    className="hover:text-primary flex items-center transition-colors"
                  >
                    Joined
                    <SortIcon field="joined_at" />
                  </button>
                </th>
                <th className="text-foreground hidden px-4 py-3 text-center font-medium lg:table-cell">
                  <button
                    onClick={() => handleSort('post_count')}
                    className="hover:text-primary flex items-center justify-center transition-colors"
                  >
                    Posts
                    <SortIcon field="post_count" />
                  </button>
                </th>
                <th className="text-foreground hidden px-4 py-3 text-center font-medium lg:table-cell">
                  <button
                    onClick={() => handleSort('reputation')}
                    className="hover:text-primary flex items-center justify-center transition-colors"
                  >
                    Rep
                    <SortIcon field="reputation" />
                  </button>
                </th>
                <th className="text-foreground hidden px-4 py-3 text-left font-medium xl:table-cell">
                  <button
                    onClick={() => handleSort('last_active')}
                    className="hover:text-primary flex items-center transition-colors"
                  >
                    Last Active
                    <SortIcon field="last_active" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-border border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
                        <div className="space-y-2">
                          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                          <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="bg-muted mx-auto h-4 w-12 animate-pulse rounded" />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="bg-muted mx-auto h-4 w-12 animate-pulse rounded" />
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                    <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-border hover:bg-muted/30 border-b transition-colors last:border-0"
                  >
                    {/* Member */}
                    <td className="px-4 py-3">
                      <Link
                        to={`/profile/${member.username}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="relative">
                          {member.avatarUrl ? (
                            <ThemedAvatar
                              src={member.avatarUrl}
                              alt={member.displayName || member.username}
                              size="small"
                              className="h-10 w-10"
                              avatarBorderId={member.avatarBorderId}
                            />
                          ) : (
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                              <UserIcon className="text-primary h-5 w-5" />
                            </div>
                          )}
                          <OnlineStatusIndicator
                            status={member.isOnline ? 'online' : 'offline'}
                            size="sm"
                            className="absolute -bottom-0.5 -right-0.5"
                          />
                        </div>
                        <div>
                          <span
                            className="group-hover:text-primary font-medium transition-colors"
                            style={{ color: member.userGroupColor || undefined }}
                          >
                            {member.displayName || member.username}
                          </span>
                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <span>@{member.username}</span>
                            {member.stars > 0 && <UserStars count={member.stars} size="xs" />}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* Group */}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: member.userGroupColor
                            ? `${member.userGroupColor}20`
                            : undefined,
                          color: member.userGroupColor || undefined,
                        }}
                      >
                        {member.userGroup}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="text-muted-foreground hidden px-4 py-3 text-sm md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {formatDate(member.joinedAt)}
                      </div>
                    </td>

                    {/* Posts */}
                    <td className="hidden px-4 py-3 text-center lg:table-cell">
                      <div className="flex items-center justify-center gap-1.5 text-sm">
                        <ChatBubbleLeftIcon className="text-muted-foreground h-4 w-4" />
                        <span>{(member?.postCount ?? 0).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Reputation */}
                    <td className="hidden px-4 py-3 text-center lg:table-cell">
                      <div
                        className={`flex items-center justify-center gap-1 text-sm ${
                          member.reputation > 0
                            ? 'text-green-500'
                            : member.reputation < 0
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {member.reputation > 0 ? (
                          <StarSolidIcon className="h-4 w-4" />
                        ) : (
                          <StarIcon className="h-4 w-4" />
                        )}
                        <span>
                          {member.reputation >= 0 ? '+' : ''}
                          {member.reputation}
                        </span>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="text-muted-foreground hidden px-4 py-3 text-sm xl:table-cell">
                      {formatRelativeTime(member.lastActive)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <div className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-4 text-center">
          <UserGroupIcon className="text-primary mx-auto mb-2 h-6 w-6" />
          <div className="text-foreground text-2xl font-bold">
            {(totalMembers ?? 0).toLocaleString()}
          </div>
          <div className="text-muted-foreground text-sm">Total Members</div>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 text-center">
          <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center">
            <span className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
          </div>
          <div className="text-foreground text-2xl font-bold">
            {members.filter((m) => m.isOnline).length}
          </div>
          <div className="text-muted-foreground text-sm">Currently Online</div>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 text-center">
          <CalendarDaysIcon className="text-primary mx-auto mb-2 h-6 w-6" />
          <div className="text-foreground text-2xl font-bold">
            {members.length > 0
              ? formatDate(
                  members.reduce((latest, m) =>
                    new Date(m.joinedAt) > new Date(latest.joinedAt) ? m : latest
                  ).joinedAt
                )
              : '-'}
          </div>
          <div className="text-muted-foreground text-sm">Newest Member</div>
        </div>
        <div className="bg-card border-border rounded-lg border p-4 text-center">
          <ChatBubbleLeftIcon className="text-primary mx-auto mb-2 h-6 w-6" />
          <div className="text-foreground text-2xl font-bold">
            {members.reduce((sum, m) => sum + m.postCount, 0).toLocaleString()}
          </div>
          <div className="text-muted-foreground text-sm">Total Posts</div>
        </div>
      </div>
    </div>
  );
}

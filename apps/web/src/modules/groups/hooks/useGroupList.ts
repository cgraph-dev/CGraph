/**
 * Group List Hook
 *
 * Custom React hook for group list management.
 *
 * @module modules/groups/hooks/useGroupList
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useGroupStore } from '../store';

/**
 * Hook for group list management
 */
export function useGroups() {
  const { groups, isLoadingGroups, fetchGroups, createGroup, joinGroup, leaveGroup } =
    useGroupStore();

  // Fetch groups on mount
  useEffect(() => {
    if (groups.length === 0) {
      fetchGroups();
    }
  }, [groups.length, fetchGroups]);

  const myGroups = useMemo(() => groups.filter((g) => g.myMember !== null), [groups]);
  const publicGroups = useMemo(() => groups.filter((g) => g.isPublic), [groups]);

  const join = useCallback(
    async (inviteCode: string) => {
      await joinGroup(inviteCode);
    },
    [joinGroup]
  );

  const leave = useCallback(
    async (groupId: string) => {
      await leaveGroup(groupId);
    },
    [leaveGroup]
  );

  const create = useCallback(
    async (name: string, description?: string, isPublic?: boolean) => {
      return await createGroup({ name, description, isPublic });
    },
    [createGroup]
  );

  return {
    groups,
    myGroups,
    publicGroups,
    isLoading: isLoadingGroups,
    refresh: fetchGroups,
    join,
    leave,
    create,
  };
}

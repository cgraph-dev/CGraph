/**
 * Group Members Hook
 *
 * Custom React hook for group members management.
 *
 * @module modules/groups/hooks/useGroupMembers
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useGroupStore } from '../store';
import type { Member } from '../store';

/**
 * Hook for group members management
 */
export function useGroupMembers(groupId?: string) {
  const { members, fetchMembers } = useGroupStore();

  const groupMembers = useMemo(() => (groupId ? (members[groupId] ?? []) : []), [members, groupId]);

  // Fetch members on mount
  useEffect(() => {
    if (groupId && !members[groupId]) {
      fetchMembers(groupId);
    }
  }, [groupId, members, fetchMembers]);

  const onlineMembers = useMemo(
    () => groupMembers.filter((m) => m.user.status !== 'offline'),
    [groupMembers]
  );

  const offlineMembers = useMemo(
    () => groupMembers.filter((m) => m.user.status === 'offline'),
    [groupMembers]
  );

  const membersByRole = useMemo(() => {
    const map: Record<string, Member[]> = {};
    groupMembers.forEach((member) => {
      const topRole = member.roles[0];
      const roleKey = topRole?.id ?? 'default';
      if (!map[roleKey]) {
        map[roleKey] = [];
      }
      map[roleKey].push(member);
    });
    return map;
  }, [groupMembers]);

  const refresh = useCallback(async () => {
    if (groupId) {
      await fetchMembers(groupId);
    }
  }, [groupId, fetchMembers]);

  return {
    members: groupMembers,
    onlineMembers,
    offlineMembers,
    membersByRole,
    count: groupMembers.length,
    onlineCount: onlineMembers.length,
    refresh,
  };
}

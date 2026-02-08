/**
 * Active Group Hook
 *
 * Custom React hook for active group and channel management.
 *
 * @module modules/groups/hooks/useActiveGroup
 */

import { useCallback, useMemo } from 'react';
import { useGroupStore } from '../store';

/**
 * Hook for active group management
 */
export function useActiveGroup() {
  const {
    groups,
    activeGroupId,
    activeChannelId,
    setActiveGroup,
    setActiveChannel,
    fetchGroup,
    updateGroup,
    deleteGroup,
    createInvite,
  } = useGroupStore();

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  );

  const activeChannel = useMemo(
    () => activeGroup?.channels.find((c) => c.id === activeChannelId) ?? null,
    [activeGroup, activeChannelId]
  );

  const selectGroup = useCallback(
    (groupId: string | null) => {
      setActiveGroup(groupId);
      // Auto-select first text channel
      if (groupId) {
        const group = groups.find((g) => g.id === groupId);
        const firstTextChannel = group?.channels.find((c) => c.type === 'text');
        if (firstTextChannel) {
          setActiveChannel(firstTextChannel.id);
        }
      }
    },
    [groups, setActiveGroup, setActiveChannel]
  );

  const selectChannel = useCallback(
    (channelId: string | null) => {
      setActiveChannel(channelId);
    },
    [setActiveChannel]
  );

  const refresh = useCallback(async () => {
    if (activeGroupId) {
      await fetchGroup(activeGroupId);
    }
  }, [activeGroupId, fetchGroup]);

  const update = useCallback(
    async (data: Parameters<typeof updateGroup>[1]) => {
      if (activeGroupId) {
        return await updateGroup(activeGroupId, data);
      }
      return null;
    },
    [activeGroupId, updateGroup]
  );

  const remove = useCallback(async () => {
    if (activeGroupId) {
      await deleteGroup(activeGroupId);
      setActiveGroup(null);
    }
  }, [activeGroupId, deleteGroup, setActiveGroup]);

  const invite = useCallback(
    async (options?: { maxUses?: number; expiresIn?: number }) => {
      if (activeGroupId) {
        return await createInvite(activeGroupId, options);
      }
      return null;
    },
    [activeGroupId, createInvite]
  );

  return {
    group: activeGroup,
    channel: activeChannel,
    groupId: activeGroupId,
    channelId: activeChannelId,
    selectGroup,
    selectChannel,
    refresh,
    update,
    remove,
    invite,
  };
}

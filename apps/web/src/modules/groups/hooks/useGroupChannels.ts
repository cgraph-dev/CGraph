/**
 * Group Channels Hook
 *
 * Custom React hook for group channel management.
 *
 * @module modules/groups/hooks/useGroupChannels
 */

import { useCallback, useMemo } from 'react';
import { useGroupStore } from '../store';
import type { Channel } from '../store';

/**
 * Hook for group channel management
 */
export function useGroupChannels(groupId?: string) {
  const { groups, updateChannelOrder, setActiveChannel } = useGroupStore();

  const group = useMemo(
    () => (groupId ? groups.find((g) => g.id === groupId) : null),
    [groups, groupId]
  );

  const channels = useMemo(() => group?.channels ?? [], [group]);
  const categories = useMemo(() => group?.categories ?? [], [group]);

  const textChannels = useMemo(() => channels.filter((c) => c.type === 'text'), [channels]);

  const voiceChannels = useMemo(
    () => channels.filter((c) => c.type === 'voice' || c.type === 'video'),
    [channels]
  );

  const channelsByCategory = useMemo(() => {
    const map: Record<string, Channel[]> = { uncategorized: [] };
    categories.forEach((cat) => {
      map[cat.id] = [];
    });
    channels.forEach((channel) => {
      if (channel.categoryId && map[channel.categoryId]) {
        map[channel.categoryId]!.push(channel);
      } else {
        map['uncategorized']!.push(channel);
      }
    });
    return map;
  }, [channels, categories]);

  const reorderChannels = useCallback(
    async (channelIds: string[]) => {
      if (groupId) {
        await updateChannelOrder(groupId, channelIds);
      }
    },
    [groupId, updateChannelOrder]
  );

  const selectChannel = useCallback(
    (channelId: string) => {
      setActiveChannel(channelId);
    },
    [setActiveChannel]
  );

  return {
    channels,
    categories,
    textChannels,
    voiceChannels,
    channelsByCategory,
    reorderChannels,
    selectChannel,
  };
}

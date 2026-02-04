/**
 * Groups Hooks
 *
 * Custom React hooks for group functionality.
 *
 * @module modules/groups/hooks
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useGroupStore } from '../store';
import type { Group, Channel, Member, ChannelMessage } from '../store';

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

/**
 * Hook for channel messages
 */
export function useChannelMessages(channelId?: string) {
  const {
    channelMessages,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    fetchChannelMessages,
    sendChannelMessage,
    addChannelMessage,
    updateChannelMessage,
    removeChannelMessage,
  } = useGroupStore();

  const messages = useMemo(
    () => (channelId ? (channelMessages[channelId] ?? []) : []),
    [channelMessages, channelId]
  );

  const hasMore = useMemo(
    () => (channelId ? (hasMoreMessages[channelId] ?? true) : false),
    [hasMoreMessages, channelId]
  );

  const typing = useMemo(
    () => (channelId ? (typingUsers[channelId] ?? []) : []),
    [typingUsers, channelId]
  );

  // Fetch initial messages
  useEffect(() => {
    if (channelId && messages.length === 0) {
      fetchChannelMessages(channelId);
    }
  }, [channelId, messages.length, fetchChannelMessages]);

  const loadMore = useCallback(async () => {
    if (channelId && hasMore && messages.length > 0) {
      const oldestMessage = messages[messages.length - 1];
      if (oldestMessage) {
        await fetchChannelMessages(channelId, oldestMessage.id);
      }
    }
  }, [channelId, hasMore, messages, fetchChannelMessages]);

  const send = useCallback(
    async (content: string, replyToId?: string) => {
      if (channelId) {
        await sendChannelMessage(channelId, content, replyToId);
      }
    },
    [channelId, sendChannelMessage]
  );

  const addMessage = useCallback(
    (message: ChannelMessage) => {
      addChannelMessage(message);
    },
    [addChannelMessage]
  );

  const updateMessage = useCallback(
    (message: ChannelMessage) => {
      updateChannelMessage(message);
    },
    [updateChannelMessage]
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      if (channelId) {
        removeChannelMessage(messageId, channelId);
      }
    },
    [channelId, removeChannelMessage]
  );

  return {
    messages,
    isLoading: isLoadingMessages,
    hasMore,
    typingUsers: typing,
    loadMore,
    send,
    addMessage,
    updateMessage,
    removeMessage,
  };
}

/**
 * Hook for group typing indicators
 */
export function useGroupTyping(channelId?: string) {
  const { typingUsers, setTypingUser } = useGroupStore();

  const typing = useMemo(
    () => (channelId ? (typingUsers[channelId] ?? []) : []),
    [typingUsers, channelId]
  );

  const setTyping = useCallback(
    (userId: string, isTyping: boolean) => {
      if (channelId) {
        setTypingUser(channelId, userId, isTyping);
      }
    },
    [channelId, setTypingUser]
  );

  return {
    typingUsers: typing,
    isTyping: typing.length > 0,
    setTyping,
  };
}

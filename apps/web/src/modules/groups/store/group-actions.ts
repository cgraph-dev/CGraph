/**
 * Group store action implementations.
 * Contains all zustand action creators for the group store.
 */
import type { StoreApi } from 'zustand';
import { api } from '@/lib/api';
import { createIdempotencyKey } from '@cgraph/utils';
import { ensureArray, ensureObject } from '@/lib/apiUtils';
import type { Group, GroupState, Channel, ChannelMessage, Member } from './group-types';

type SetState = StoreApi<GroupState>['setState'];
type GetState = StoreApi<GroupState>['getState'];

/**
 * unknown for the groups module.
 */
/**
 * Creates a new group actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGroupActions(
  set: SetState,
  get: GetState
): Omit<
  GroupState,
  | 'groups'
  | 'activeGroupId'
  | 'activeChannelId'
  | 'channelMessages'
  | 'members'
  | 'isLoadingGroups'
  | 'isLoadingMessages'
  | 'hasMoreMessages'
  | 'typingUsers'
  | 'justJoinedGroupName'
  | 'clearJoinCelebration'
  | 'reset'
> {
  return {
    fetchGroups: async () => {
      set({ isLoadingGroups: true });
      try {
        const response = await api.get('/api/v1/groups');
        set({
          groups: ensureArray<Group>(response.data, 'groups'),
          isLoadingGroups: false,
        });
      } catch (error) {
        set({ isLoadingGroups: false });
        throw error;
      }
    },

    fetchGroup: async (groupId: string) => {
      const response = await api.get(`/api/v1/groups/${groupId}`);
      const group = ensureObject<Group>(response.data, 'group');
      if (group) {
        set((state) => ({
          groups: state.groups.some((g) => g.id === groupId)
            ? state.groups.map((g) => (g.id === groupId ? group : g))
            : [...state.groups, group].slice(-200),
        }));
      }
    },

    fetchChannelMessages: async (channelId: string, before?: string) => {
      set({ isLoadingMessages: true });
      try {
        const params = before ? { before, limit: 50 } : { limit: 50 };
        const response = await api.get(`/api/v1/channels/${channelId}/messages`, { params });
        const newMessages = ensureArray<ChannelMessage>(response.data, 'messages');
        const hasMore = newMessages.length === 50;

        set((state) => ({
          channelMessages: {
            ...state.channelMessages,
            [channelId]: before
              ? [...newMessages, ...(state.channelMessages[channelId] || [])]
              : newMessages,
          },
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [channelId]: hasMore,
          },
          isLoadingMessages: false,
        }));
      } catch (error) {
        set({ isLoadingMessages: false });
        throw error;
      }
    },

    fetchMembers: async (groupId: string) => {
      const response = await api.get(`/api/v1/groups/${groupId}/members`);
      set((state) => ({
        members: {
          ...state.members,
          [groupId]: ensureArray<Member>(response.data, 'members'),
        },
      }));
    },

    sendChannelMessage: async (channelId: string, content: string, replyToId?: string) => {
      const payload: Record<string, string> = {
        content,
        client_message_id: createIdempotencyKey(),
      };
      if (replyToId) payload.reply_to_id = replyToId;

      const response = await api.post(`/api/v1/channels/${channelId}/messages`, payload);
      const message = ensureObject<ChannelMessage>(response.data, 'message');
      if (message) {
        get().addChannelMessage(message);
      }
    },

    setActiveGroup: (groupId: string | null) => {
      set({ activeGroupId: groupId, activeChannelId: null });
    },

    setActiveChannel: (channelId: string | null) => {
      set({ activeChannelId: channelId });
    },

    addChannelMessage: (message: ChannelMessage) => {
      const MAX_CHANNEL_MESSAGES = 500;
      set((state) => {
        const channelMessages = state.channelMessages[message.channelId] || [];
        if (channelMessages.some((m) => m.id === message.id)) {
          return state;
        }
        const updated = [...channelMessages, message];
        return {
          channelMessages: {
            ...state.channelMessages,
            [message.channelId]:
              updated.length > MAX_CHANNEL_MESSAGES
                ? updated.slice(updated.length - MAX_CHANNEL_MESSAGES)
                : updated,
          },
        };
      });
    },

    updateChannelMessage: (message: ChannelMessage) => {
      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [message.channelId]: (state.channelMessages[message.channelId] || []).map((m) =>
            m.id === message.id ? message : m
          ),
        },
      }));
    },

    removeChannelMessage: (messageId: string, channelId: string) => {
      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [channelId]: (state.channelMessages[channelId] || []).filter((m) => m.id !== messageId),
        },
      }));
    },

    setTypingUser: (channelId: string, userId: string, isTyping: boolean) => {
      set((state) => {
        const current = state.typingUsers[channelId] || [];
        const updated = isTyping
          ? [...new Set([...current, userId])]
          : current.filter((id) => id !== userId);
        return {
          typingUsers: {
            ...state.typingUsers,
            [channelId]: updated,
          },
        };
      });
    },

    createGroup: async (data) => {
      const response = await api.post('/api/v1/groups', data);
      const group = ensureObject<Group>(response.data, 'group');
      if (group) {
        set((state) => ({
          groups: [group, ...state.groups].slice(0, 200),
        }));
        return group;
      }
      throw new Error('Failed to create group');
    },

    joinGroup: async (inviteCode: string) => {
      const response = await api.post(`/api/v1/invites/${inviteCode}/join`);
      const group = ensureObject<Group>(response.data, 'group');
      if (group) {
        set((state) => ({
          groups: state.groups.some((g) => g.id === group.id)
            ? state.groups
            : [...state.groups, group].slice(-200),
          justJoinedGroupName: group.name,
        }));
      }
    },

    leaveGroup: async (groupId: string) => {
      await api.delete(`/api/v1/groups/${groupId}/members/@me`);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      }));
    },

    updateGroup: async (groupId: string, data) => {
      const response = await api.patch(`/api/v1/groups/${groupId}`, data);
      const updatedGroup = ensureObject<Group>(response.data, 'group');
      if (updatedGroup) {
        set((state) => ({
          groups: state.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
        }));
        return updatedGroup;
      }
      throw new Error('Failed to update group');
    },

    deleteGroup: async (groupId: string) => {
      await api.delete(`/api/v1/groups/${groupId}`);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      }));
    },

    updateChannelOrder: async (groupId: string, channelIds: string[]) => {
      await api.put(`/api/v1/groups/${groupId}/channels/reorder`, { channel_ids: channelIds });
      // Optimistic update - reorder channels locally
      set((state) => ({
        groups: state.groups.map((g) => {
          if (g.id !== groupId) return g;
          const orderedChannels = channelIds
            .map((id) => g.channels.find((c) => c.id === id))
            .filter((c): c is Channel => c !== undefined);
          return { ...g, channels: orderedChannels };
        }),
      }));
    },

    createInvite: async (groupId: string, options = {}) => {
      const response = await api.post(`/api/v1/groups/${groupId}/invites`, {
        max_uses: options.maxUses,
        expires_in: options.expiresIn,
      });
      return response.data.invite as { code: string; expiresAt: string };
    },
  };
}

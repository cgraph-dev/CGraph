/**
 * Group store action implementations.
 * Contains all zustand action creators for the group store.
 */
import type { StoreApi } from 'zustand';
import { api } from '@/lib/api';
import { createIdempotencyKey } from '@cgraph/utils';
import { ensureArray, ensureObject } from '@/lib/apiUtils';
import type { Group, GroupState, Channel, ChannelMessage, Member } from './group-types';

/**
 * Normalize a raw API message to ChannelMessage shape.
 * Backend sends sender/senderId; ChannelMessage type expects author/authorId.
 */
function normalizeToChannelMessage(raw: Record<string, unknown>): ChannelMessage {
   
  const sender = (raw.sender ?? raw.author ?? {}) as Record<string, unknown>;
   
  return {
    ...raw,
     
    authorId: (raw.authorId ?? raw.senderId ?? raw.sender_id ?? sender.id ?? '') as string,
    author: {
       
      id: (sender.id ?? '') as string,
       
      username: (sender.username ?? '') as string,
       
      displayName: (sender.displayName ?? sender.display_name ?? null) as string | null,
       
      avatarUrl: (sender.avatarUrl ?? sender.avatar_url ?? null) as string | null,
      member: null,
    },
     
    channelId: (raw.channelId ?? raw.channel_id ?? '') as string,
     
    content: (raw.content ?? '') as string,
     
    messageType: (raw.messageType ??
      raw.message_type ??
      raw.contentType ??
      'text') as ChannelMessage['messageType'],
     
    replyToId: (raw.replyToId ?? raw.reply_to_id ?? null) as string | null,
     
    replyTo: raw.replyTo ? normalizeToChannelMessage(raw.replyTo as Record<string, unknown>) : null,
     
    isPinned: (raw.isPinned ?? raw.is_pinned ?? false) as boolean,
     
    isEdited: (raw.isEdited ?? raw.is_edited ?? false) as boolean,
     
    deletedAt: (raw.deletedAt ?? raw.deleted_at ?? null) as string | null,
     
    metadata: (raw.metadata ?? {}) as Record<string, unknown>,
     
    reactions: (raw.reactions ?? []) as ChannelMessage['reactions'],
     
    createdAt: (raw.createdAt ??
      raw.created_at ??
      raw.insertedAt ??
      raw.inserted_at ??
      '') as string,
  } as ChannelMessage;
}

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
  | 'discoverableGroups'
  | 'isLoadingDiscover'
  | 'discoverSearch'
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
        const rawMessages = ensureArray<Record<string, unknown>>(response.data, 'messages');
        const newMessages = rawMessages.map(normalizeToChannelMessage);
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
      const raw = ensureObject<Record<string, unknown>>(response.data, 'message');
      const message = raw ? normalizeToChannelMessage(raw) : null;
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
      const response = await api.post('/api/v1/groups', {
        name: data.name,
        description: data.description,
        visibility: data.isPublic !== false ? 'public' : 'private',
      });
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
      // Map camelCase props to backend-expected params
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.isPublic !== undefined) payload.visibility = data.isPublic ? 'public' : 'private';
      if (data.iconUrl !== undefined) payload.icon_url = data.iconUrl;
      if (data.bannerUrl !== undefined) payload.banner_url = data.bannerUrl;

      const response = await api.patch(`/api/v1/groups/${groupId}`, payload);
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

    fetchDiscoverableGroups: async (params) => {
      set({ isLoadingDiscover: true, discoverSearch: params?.search ?? '' });
      try {
        const response = await api.get('/api/v1/groups/public', {
          params: {
            search: params?.search,
            sort: params?.sort,
            page: params?.page,
            limit: params?.limit ?? 20,
          },
        });
        set({
          discoverableGroups: ensureArray<Group>(response.data, 'groups'),
          isLoadingDiscover: false,
        });
      } catch (error) {
        set({ isLoadingDiscover: false });
        throw error;
      }
    },

    joinPublicGroup: async (groupId: string) => {
      const response = await api.post(`/api/v1/groups/${groupId}/members`);
      const group = ensureObject<Group>(response.data, 'group');
      if (group) {
        set((state) => ({
          groups: state.groups.some((g) => g.id === group.id)
            ? state.groups
            : [...state.groups, group].slice(-200),
          justJoinedGroupName: group.name,
          // Remove from discoverable list since user has joined
          discoverableGroups: state.discoverableGroups.filter((g) => g.id !== group.id),
        }));
      }
    },
  };
}

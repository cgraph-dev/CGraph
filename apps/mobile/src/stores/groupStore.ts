/**
 * Mobile Group Store
 *
 * Real Zustand store replacing the useCommunityFacade stub for groups.
 * Leverages the existing groupsService for API calls and socketManager
 * for real-time channel messaging.
 *
 * @module stores/groupStore
 * @since v0.9.31
 */

import { create } from 'zustand';
import api from '../lib/api';
import socketManager from '../lib/socket';
import {
  getMyGroups,
  getGroup,
  joinGroupByInvite,
  leaveGroup as leaveGroupApi,
  createGroup as createGroupApi,
  type Group,
  type _GroupChannel,
  type GroupMember,
  type CreateGroupRequest,
} from '../services/groupsService';

// ── Channel Message Type ───────────────────────────────────────────────

export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'system';
  replyToId: string | null;
  replyTo: ChannelMessage | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

// ── Normalizer ─────────────────────────────────────────────────────────

function normalizeChannelMessage(raw: Record<string, unknown>): ChannelMessage {
   
  const author = (raw.author || raw.sender || {}) as Record<string, unknown>;
  return {
     
    id: raw.id as string,
     
    channelId: (raw.channel_id || raw.channelId) as string,
     
    authorId: (raw.author_id || raw.authorId || raw.sender_id || author.id || '') as string,
     
    content: (raw.content || '') as string,
     
    messageType: (raw.message_type || raw.messageType || 'text') as ChannelMessage['messageType'],
     
    replyToId: (raw.reply_to_id || raw.replyToId || null) as string | null,
     
    replyTo: raw.reply_to ? normalizeChannelMessage(raw.reply_to as Record<string, unknown>) : null,
     
    isPinned: (raw.is_pinned ?? raw.isPinned ?? false) as boolean,
     
    isEdited: (raw.is_edited ?? raw.isEdited ?? false) as boolean,
     
    deletedAt: (raw.deleted_at || raw.deletedAt || null) as string | null,
     
    metadata: (raw.metadata || {}) as Record<string, unknown>,
    reactions: normalizeReactions(raw.reactions),
    author: {
       
      id: (author.id || '') as string,
       
      username: (author.username || '') as string,
       
      displayName: (author.display_name || author.displayName || null) as string | null,
       
      avatarUrl: (author.avatar_url || author.avatarUrl || null) as string | null,
    },
     
    createdAt: (raw.created_at || raw.createdAt || raw.inserted_at || '') as string,
  };
}

function normalizeReactions(raw: unknown): { emoji: string; count: number; hasReacted: boolean }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: Record<string, unknown>) => ({
     
    emoji: (r.emoji || '') as string,
     
    count: (r.count || 1) as number,
     
    hasReacted: (r.has_reacted ?? r.hasReacted ?? false) as boolean,
  }));
}

// ── Store Interface ────────────────────────────────────────────────────

const MAX_CHANNEL_MESSAGES = 500;

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  activeChannelId: string | null;
  channelMessages: Record<string, ChannelMessage[]>;
  channelMessageIds: Record<string, Set<string>>;
  members: Record<string, GroupMember[]>;
  isLoadingGroups: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  typingUsers: Record<string, string[]>;
  justJoinedGroupName: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
  fetchChannelMessages: (channelId: string, before?: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, replyToId?: string) => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  createGroup: (data: CreateGroupRequest) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  clearJoinCelebration: () => void;

  // Socket mutations
  addChannelMessage: (message: ChannelMessage) => void;
  updateChannelMessage: (message: ChannelMessage) => void;
  removeChannelMessage: (messageId: string, channelId: string) => void;
  addReactionToChannelMessage: (messageId: string, emoji: string, userId: string) => void;
  removeReactionFromChannelMessage: (messageId: string, emoji: string, userId: string) => void;
  setTypingUser: (channelId: string, userId: string, isTyping: boolean) => void;

  // WebSocket
  subscribeToChannel: (channelId: string) => () => void;
  reset: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  channelMessageIds: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
  justJoinedGroupName: null,

  fetchGroups: async () => {
    if (get().isLoadingGroups) return;
    set({ isLoadingGroups: true });
    try {
      const groups = await getMyGroups();
      set({ groups, isLoadingGroups: false });
    } catch {
      set({ isLoadingGroups: false });
    }
  },

  fetchGroup: async (groupId: string) => {
    try {
      const group = await getGroup(groupId);
      set((state) => ({
        groups: state.groups.some((g) => g.id === groupId)
          ? state.groups.map((g) => (g.id === groupId ? group : g))
          : [...state.groups, group].slice(-200),
      }));
    } catch {
      // silently fail
    }
  },

  fetchChannelMessages: async (channelId: string, before?: string) => {
    set({ isLoadingMessages: true });
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (before) params.before = before;

      const response = await api.get(`/api/v1/channels/${channelId}/messages`, { params });
      const raw = response.data?.messages || response.data?.data || response.data || [];
      const newMessages = (Array.isArray(raw) ? raw : []).map((m: Record<string, unknown>) =>
        normalizeChannelMessage(m)
      );
      const hasMore = newMessages.length === 50;

      set((state) => {
        const existing = state.channelMessages[channelId] || [];
        const MAX_CHANNEL_MESSAGES = 500;
        const merged = before ? [...newMessages, ...existing].slice(-MAX_CHANNEL_MESSAGES) : newMessages;
        return {
          channelMessages: { ...state.channelMessages, [channelId]: merged },
          hasMoreMessages: { ...state.hasMoreMessages, [channelId]: hasMore },
          isLoadingMessages: false,
        };
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  fetchMembers: async (groupId: string) => {
    try {
      const response = await api.get(`/api/v1/groups/${groupId}/members`);
      const raw = response.data?.members || response.data?.data || response.data || [];
      set((state) => ({
        members: { ...state.members, [groupId]: raw },
      }));
    } catch {
      // silently fail
    }
  },

  sendChannelMessage: async (channelId: string, content: string, replyToId?: string) => {
    const payload: Record<string, unknown> = { content };
    if (replyToId) payload.reply_to_id = replyToId;

    const response = await api.post(`/api/v1/channels/${channelId}/messages`, payload);
    const rawMessage = response.data?.message || response.data?.data || response.data;
    if (rawMessage) {
       
      const message = normalizeChannelMessage(rawMessage as Record<string, unknown>);
      get().addChannelMessage(message);
    }
  },

  setActiveGroup: (groupId: string | null) => {
    set({ activeGroupId: groupId });
  },

  setActiveChannel: (channelId: string | null) => {
    set({ activeChannelId: channelId });
  },

  createGroup: async (data: CreateGroupRequest) => {
    const group = await createGroupApi(data);
    set((state) => ({ groups: [group, ...state.groups] }));
    return group;
  },

  joinGroup: async (inviteCode: string) => {
    const group = await joinGroupByInvite(inviteCode);
    set((state) => ({
      groups: [group, ...state.groups].slice(0, 200),
      justJoinedGroupName: group.name,
    }));
  },

  leaveGroup: async (groupId: string) => {
    await leaveGroupApi(groupId);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
    }));
  },

  clearJoinCelebration: () => set({ justJoinedGroupName: null }),

  // ── Socket mutations ───────────────────────────────────────────────

  addChannelMessage: (message: ChannelMessage) => {
    set((state) => {
      const chId = message.channelId;
      const idSet = state.channelMessageIds[chId] || new Set<string>();
      if (idSet.has(message.id)) return state;

      const newSet = new Set(idSet);
      newSet.add(message.id);

      // eslint-disable-next-line prefer-const
      let updated = [...(state.channelMessages[chId] || []), message];
      // Prune oldest messages if exceeding cap
      if (updated.length > MAX_CHANNEL_MESSAGES) {
        const pruned = updated.slice(updated.length - MAX_CHANNEL_MESSAGES);
        const prunedSet = new Set(pruned.map((m) => m.id));
        return {
          channelMessages: { ...state.channelMessages, [chId]: pruned },
          channelMessageIds: { ...state.channelMessageIds, [chId]: prunedSet },
        };
      }
      return {
        channelMessages: { ...state.channelMessages, [chId]: updated },
        channelMessageIds: { ...state.channelMessageIds, [chId]: newSet },
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
      return { typingUsers: { ...state.typingUsers, [channelId]: updated } };
    });
  },

  addReactionToChannelMessage: (messageId: string, emoji: string, _userId: string) => {
    set((state) => {
      const updated: Record<string, ChannelMessage[]> = {};
      for (const [chId, msgs] of Object.entries(state.channelMessages)) {
        updated[chId] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === emoji);
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r
              ),
            };
          }
          return { ...m, reactions: [...m.reactions, { emoji, count: 1, hasReacted: true }] };
        });
      }
      return { channelMessages: { ...state.channelMessages, ...updated } };
    });
  },

  removeReactionFromChannelMessage: (messageId: string, emoji: string, _userId: string) => {
    set((state) => {
      const updated: Record<string, ChannelMessage[]> = {};
      for (const [chId, msgs] of Object.entries(state.channelMessages)) {
        updated[chId] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            reactions: m.reactions
              .map((r) => (r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r))
              .filter((r) => r.count > 0),
          };
        });
      }
      return { channelMessages: { ...state.channelMessages, ...updated } };
    });
  },

  // ── WebSocket subscription ─────────────────────────────────────────

  subscribeToChannel: (channelId: string): (() => void) => {
    const topic = `group:${channelId}`;

    socketManager.joinChannel(topic);

    const unsubMessage = socketManager.onChannelMessage(topic, (event, payload) => {
       
      const data = payload as Record<string, unknown>;

      switch (event) {
        case 'new_message': {
          const msg = normalizeChannelMessage(
             
            data.message ? (data.message as Record<string, unknown>) : data
          );
          useGroupStore.getState().addChannelMessage(msg);
          break;
        }
        case 'message_updated': {
          const msg = normalizeChannelMessage(
             
            data.message ? (data.message as Record<string, unknown>) : data
          );
          useGroupStore.getState().updateChannelMessage(msg);
          break;
        }
        case 'message_deleted': {
           
          const msgId = (data.message_id || data.id) as string;
          if (msgId) useGroupStore.getState().removeChannelMessage(msgId, channelId);
          break;
        }
        case 'typing': {
           
          const userId = (data.user_id || data.userId) as string;
           
          const isTyping = (data.typing ?? data.is_typing ?? false) as boolean;
          if (userId) useGroupStore.getState().setTypingUser(channelId, userId, isTyping);
          break;
        }
        case 'reaction_added': {
           
          const msgId = (data.message_id || data.messageId) as string;
           
          const emoji = data.emoji as string;
           
          const userId = (data.user_id || data.userId) as string;
          if (msgId && emoji && userId) {
            useGroupStore.getState().addReactionToChannelMessage(msgId, emoji, userId);
          }
          break;
        }
        case 'reaction_removed': {
           
          const msgId = (data.message_id || data.messageId) as string;
           
          const emoji = data.emoji as string;
           
          const userId = (data.user_id || data.userId) as string;
          if (msgId && emoji && userId) {
            useGroupStore.getState().removeReactionFromChannelMessage(msgId, emoji, userId);
          }
          break;
        }
      }
    });

    return () => {
      unsubMessage();
      socketManager.leaveChannel(topic);
    };
  },
  reset: () => set({
    groups: [],
    activeGroupId: null,
    activeChannelId: null,
    channelMessages: {},
    channelMessageIds: {},
    members: {},
    isLoadingGroups: false,
    isLoadingMessages: false,
    hasMoreMessages: {},
    typingUsers: {},
    justJoinedGroupName: null,
  }),
}));

// ── Selector hooks ───────────────────────────────────────────────────

export const useGroups = () => useGroupStore((s) => s.groups);
export const useActiveGroupId = () => useGroupStore((s) => s.activeGroupId);
export const useActiveChannelId = () => useGroupStore((s) => s.activeChannelId);
export const useIsLoadingGroups = () => useGroupStore((s) => s.isLoadingGroups);

export default useGroupStore;

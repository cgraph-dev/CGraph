import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  memberCount: number;
  onlineMemberCount: number;
  ownerId: string;
  categories: ChannelCategory[];
  channels: Channel[];
  roles: Role[];
  myMember: Member | null;
  createdAt: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'video' | 'announcement' | 'forum';
  topic: string | null;
  categoryId: string | null;
  position: number;
  isNsfw: boolean;
  slowModeSeconds: number;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  isDefault: boolean;
  isMentionable: boolean;
}

export interface Member {
  id: string;
  userId: string;
  nickname: string | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
  };
  roles: Role[];
  joinedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'sticker' | 'gif' | 'system';
  replyToId: string | null;
  replyTo: ChannelMessage | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: Record<string, any>;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    member: Member | null;
  };
  createdAt: string;
}

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  activeChannelId: string | null;
  channelMessages: Record<string, ChannelMessage[]>;
  members: Record<string, Member[]>;
  isLoadingGroups: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  typingUsers: Record<string, string[]>;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
  fetchChannelMessages: (channelId: string, before?: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, replyToId?: string) => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  addChannelMessage: (message: ChannelMessage) => void;
  updateChannelMessage: (message: ChannelMessage) => void;
  removeChannelMessage: (messageId: string, channelId: string) => void;
  setTypingUser: (channelId: string, userId: string, isTyping: boolean) => void;
  createGroup: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},

  fetchGroups: async () => {
    set({ isLoadingGroups: true });
    try {
      const response = await api.get('/api/v1/groups');
      set({ groups: response.data.data, isLoadingGroups: false });
    } catch (error) {
      set({ isLoadingGroups: false });
      throw error;
    }
  },

  fetchGroup: async (groupId: string) => {
    try {
      const response = await api.get(`/api/v1/groups/${groupId}`);
      const group = response.data.data;
      set((state) => ({
        groups: state.groups.some((g) => g.id === groupId)
          ? state.groups.map((g) => (g.id === groupId ? group : g))
          : [...state.groups, group],
      }));
    } catch (error) {
      throw error;
    }
  },

  fetchChannelMessages: async (channelId: string, before?: string) => {
    set({ isLoadingMessages: true });
    try {
      const params = before ? { before, limit: 50 } : { limit: 50 };
      const response = await api.get(`/api/v1/channels/${channelId}/messages`, { params });
      const newMessages = response.data.data;
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
    try {
      const response = await api.get(`/api/v1/groups/${groupId}/members`);
      set((state) => ({
        members: {
          ...state.members,
          [groupId]: response.data.data,
        },
      }));
    } catch (error) {
      throw error;
    }
  },

  sendChannelMessage: async (channelId: string, content: string, replyToId?: string) => {
    try {
      const payload: any = { content };
      if (replyToId) payload.reply_to_id = replyToId;

      const response = await api.post(`/api/v1/channels/${channelId}/messages`, payload);
      get().addChannelMessage(response.data.data);
    } catch (error) {
      throw error;
    }
  },

  setActiveGroup: (groupId: string | null) => {
    set({ activeGroupId: groupId, activeChannelId: null });
  },

  setActiveChannel: (channelId: string | null) => {
    set({ activeChannelId: channelId });
  },

  addChannelMessage: (message: ChannelMessage) => {
    set((state) => {
      const channelMessages = state.channelMessages[message.channelId] || [];
      if (channelMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        channelMessages: {
          ...state.channelMessages,
          [message.channelId]: [...channelMessages, message],
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
    const group = response.data.data;
    set((state) => ({
      groups: [group, ...state.groups],
    }));
    return group;
  },

  joinGroup: async (inviteCode: string) => {
    const response = await api.post(`/api/v1/invites/${inviteCode}/join`);
    const group = response.data.data;
    set((state) => ({
      groups: state.groups.some((g) => g.id === group.id)
        ? state.groups
        : [...state.groups, group],
    }));
  },

  leaveGroup: async (groupId: string) => {
    await api.delete(`/api/v1/groups/${groupId}/members/@me`);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
    }));
  },
}));

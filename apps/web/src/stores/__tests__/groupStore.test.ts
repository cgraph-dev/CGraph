/**
 * groupStore Unit Tests
 *
 * Tests for Zustand group store state management.
 * These tests cover groups, channels, members, messages,
 * typing indicators, and all async API operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useGroupStore } from '../groupStore';
import type { Group, Channel, Member, ChannelMessage, Role } from '../groupStore';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the idempotency key generator
vi.mock('@cgraph/utils', () => ({
  createIdempotencyKey: () => 'test-idempotency-key-123',
}));

// Import the mocked api with proper typing
import { api } from '@/lib/api';

// Type the mocked API properly
const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// Mock role
const mockRole: Role = {
  id: 'role-1',
  name: 'Member',
  color: '#ffffff',
  position: 1,
  permissions: 0,
  isDefault: true,
  isMentionable: false,
};

// Mock channel
const mockChannel: Channel = {
  id: 'channel-1',
  name: 'general',
  type: 'text',
  topic: 'General discussion',
  categoryId: 'cat-1',
  position: 0,
  isNsfw: false,
  slowModeSeconds: 0,
  unreadCount: 0,
  lastMessageAt: '2026-01-30T10:00:00Z',
};

const mockChannel2: Channel = {
  id: 'channel-2',
  name: 'announcements',
  type: 'announcement',
  topic: 'Server announcements',
  categoryId: 'cat-1',
  position: 1,
  isNsfw: false,
  slowModeSeconds: 0,
  unreadCount: 2,
  lastMessageAt: '2026-01-30T11:00:00Z',
};

// Mock member
const mockMember: Member = {
  id: 'member-1',
  userId: 'user-123',
  nickname: 'TestNick',
  user: {
    id: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
    status: 'online',
  },
  roles: [mockRole],
  joinedAt: '2026-01-15T08:00:00Z',
};

// Mock group
const mockGroup: Group = {
  id: 'group-1',
  name: 'Test Group',
  slug: 'test-group',
  description: 'A test group for testing',
  iconUrl: 'https://example.com/icon.png',
  bannerUrl: 'https://example.com/banner.png',
  isPublic: true,
  memberCount: 150,
  onlineMemberCount: 42,
  ownerId: 'user-123',
  categories: [],
  channels: [mockChannel, mockChannel2],
  roles: [mockRole],
  myMember: mockMember,
  createdAt: '2026-01-01T00:00:00Z',
};

const mockGroup2: Group = {
  id: 'group-2',
  name: 'Second Group',
  slug: 'second-group',
  description: 'Another test group',
  iconUrl: null,
  bannerUrl: null,
  isPublic: false,
  memberCount: 25,
  onlineMemberCount: 5,
  ownerId: 'user-456',
  categories: [],
  channels: [],
  roles: [],
  myMember: null,
  createdAt: '2026-01-15T00:00:00Z',
};

// Mock channel message
const mockMessage: ChannelMessage = {
  id: 'msg-1',
  channelId: 'channel-1',
  authorId: 'user-123',
  content: 'Hello, world!',
  messageType: 'text',
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  author: {
    id: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
    member: mockMember,
  },
  createdAt: '2026-01-30T10:30:00Z',
};

const mockMessage2: ChannelMessage = {
  id: 'msg-2',
  channelId: 'channel-1',
  authorId: 'user-456',
  content: 'Hi there!',
  messageType: 'text',
  replyToId: 'msg-1',
  replyTo: mockMessage,
  isPinned: false,
  isEdited: true,
  deletedAt: null,
  metadata: {},
  reactions: [{ emoji: '👍', count: 2, hasReacted: true }],
  author: {
    id: 'user-456',
    username: 'anotheruser',
    displayName: 'Another User',
    avatarUrl: null,
    member: null,
  },
  createdAt: '2026-01-30T10:31:00Z',
};

// Get initial state for reset
const getInitialState = () => ({
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
});

// Reset store state after each test
afterEach(() => {
  useGroupStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('groupStore', () => {
  describe('initial state', () => {
    beforeEach(() => {
      useGroupStore.setState(getInitialState());
    });

    it('should have empty groups initially', () => {
      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(0);
    });

    it('should have null activeGroupId initially', () => {
      const state = useGroupStore.getState();
      expect(state.activeGroupId).toBeNull();
    });

    it('should have null activeChannelId initially', () => {
      const state = useGroupStore.getState();
      expect(state.activeChannelId).toBeNull();
    });

    it('should have empty channelMessages initially', () => {
      const state = useGroupStore.getState();
      expect(state.channelMessages).toEqual({});
    });

    it('should have empty members initially', () => {
      const state = useGroupStore.getState();
      expect(state.members).toEqual({});
    });

    it('should not be loading groups initially', () => {
      const state = useGroupStore.getState();
      expect(state.isLoadingGroups).toBe(false);
    });

    it('should not be loading messages initially', () => {
      const state = useGroupStore.getState();
      expect(state.isLoadingMessages).toBe(false);
    });

    it('should have empty typingUsers initially', () => {
      const state = useGroupStore.getState();
      expect(state.typingUsers).toEqual({});
    });
  });

  describe('fetchGroups action', () => {
    it('should set loading state while fetching', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { groups: [] } }), 100);
          })
      );

      const fetchPromise = useGroupStore.getState().fetchGroups();

      expect(useGroupStore.getState().isLoadingGroups).toBe(true);

      await fetchPromise;

      expect(useGroupStore.getState().isLoadingGroups).toBe(false);
    });

    it('should fetch and set groups data', async () => {
      mockedApi.get.mockResolvedValue({
        data: { groups: [mockGroup, mockGroup2] },
      });

      await useGroupStore.getState().fetchGroups();

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(2);
      expect(state.groups[0]!.id).toBe('group-1');
      expect(state.groups[1]!.id).toBe('group-2');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { groups: [] } });

      await useGroupStore.getState().fetchGroups();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/groups');
    });

    it('should reset loading state on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useGroupStore.getState().fetchGroups()).rejects.toThrow('Network error');

      expect(useGroupStore.getState().isLoadingGroups).toBe(false);
    });
  });

  describe('fetchGroup action', () => {
    it('should fetch a single group and add to store', async () => {
      mockedApi.get.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().fetchGroup('group-1');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]!.name).toBe('Test Group');
    });

    it('should update existing group in store', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      const updatedGroup = { ...mockGroup, name: 'Updated Group Name' };
      mockedApi.get.mockResolvedValue({ data: { group: updatedGroup } });

      await useGroupStore.getState().fetchGroup('group-1');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]!.name).toBe('Updated Group Name');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().fetchGroup('group-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/groups/group-1');
    });
  });

  describe('createGroup action', () => {
    it('should create a group and add to store', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      const result = await useGroupStore.getState().createGroup({
        name: 'Test Group',
        description: 'A test group for testing',
        isPublic: true,
      });

      expect(result.id).toBe('group-1');
      expect(result.name).toBe('Test Group');
      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
    });

    it('should call API with correct payload', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().createGroup({
        name: 'Test Group',
        description: 'A test group',
        isPublic: false,
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/groups', {
        name: 'Test Group',
        description: 'A test group',
        isPublic: false,
      });
    });

    it('should add new group to beginning of list', async () => {
      useGroupStore.setState({ groups: [mockGroup2] });
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().createGroup({ name: 'Test Group' });

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(2);
      expect(state.groups[0]!.id).toBe('group-1');
    });

    it('should throw error if group creation fails', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(useGroupStore.getState().createGroup({ name: 'Test' })).rejects.toThrow(
        'Failed to create group'
      );
    });
  });

  describe('joinGroup action', () => {
    it('should join a group via invite code', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinGroup('invite-code-123');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]!.id).toBe('group-1');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinGroup('abc123');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/invites/abc123/join');
    });

    it('should not duplicate group if already in store', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinGroup('invite-code-123');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
    });
  });

  describe('leaveGroup action', () => {
    it('should remove group from store after leaving', async () => {
      useGroupStore.setState({ groups: [mockGroup, mockGroup2] });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]!.id).toBe('group-2');
    });

    it('should call API with correct endpoint', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/groups/group-1/members/@me');
    });

    it('should reset activeGroupId if leaving active group', async () => {
      useGroupStore.setState({ groups: [mockGroup], activeGroupId: 'group-1' });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBeNull();
    });

    it('should not reset activeGroupId if leaving different group', async () => {
      useGroupStore.setState({
        groups: [mockGroup, mockGroup2],
        activeGroupId: 'group-2',
      });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBe('group-2');
    });
  });

  describe('sendChannelMessage action', () => {
    it('should send a message and add to store', async () => {
      const newMessage: ChannelMessage = { ...mockMessage, id: 'msg-new' };
      mockedApi.post.mockResolvedValue({ data: { message: newMessage } });

      await useGroupStore.getState().sendChannelMessage('channel-1', 'Hello!');

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(1);
      expect(state.channelMessages['channel-1']![0]!.content).toBe('Hello, world!');
    });

    it('should call API with correct payload', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage } });

      await useGroupStore.getState().sendChannelMessage('channel-1', 'Test message');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/channels/channel-1/messages', {
        content: 'Test message',
        client_message_id: 'test-idempotency-key-123',
      });
    });

    it('should include reply_to_id when replying', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage2 } });

      await useGroupStore.getState().sendChannelMessage('channel-1', 'Reply', 'msg-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/channels/channel-1/messages', {
        content: 'Reply',
        client_message_id: 'test-idempotency-key-123',
        reply_to_id: 'msg-1',
      });
    });
  });

  describe('setActiveGroup action', () => {
    it('should set active group id', () => {
      useGroupStore.getState().setActiveGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBe('group-1');
    });

    it('should reset activeChannelId when setting active group', () => {
      useGroupStore.setState({ activeChannelId: 'channel-1' });

      useGroupStore.getState().setActiveGroup('group-1');

      expect(useGroupStore.getState().activeChannelId).toBeNull();
    });

    it('should allow setting active group to null', () => {
      useGroupStore.setState({ activeGroupId: 'group-1' });

      useGroupStore.getState().setActiveGroup(null);

      expect(useGroupStore.getState().activeGroupId).toBeNull();
    });
  });

  describe('setActiveChannel action', () => {
    it('should set active channel id', () => {
      useGroupStore.getState().setActiveChannel('channel-1');

      expect(useGroupStore.getState().activeChannelId).toBe('channel-1');
    });

    it('should allow setting active channel to null', () => {
      useGroupStore.setState({ activeChannelId: 'channel-1' });

      useGroupStore.getState().setActiveChannel(null);

      expect(useGroupStore.getState().activeChannelId).toBeNull();
    });
  });

  describe('setTypingUser action (addTypingUser / removeTypingUser)', () => {
    it('should add typing user to channel', () => {
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);

      const state = useGroupStore.getState();
      expect(state.typingUsers['channel-1']).toContain('user-123');
    });

    it('should remove typing user from channel', () => {
      useGroupStore.setState({
        typingUsers: { 'channel-1': ['user-123', 'user-456'] },
      });

      useGroupStore.getState().setTypingUser('channel-1', 'user-123', false);

      const state = useGroupStore.getState();
      expect(state.typingUsers['channel-1']).not.toContain('user-123');
      expect(state.typingUsers['channel-1']).toContain('user-456');
    });

    it('should not duplicate typing users', () => {
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);

      const state = useGroupStore.getState();
      expect(state.typingUsers['channel-1']).toHaveLength(1);
    });

    it('should handle multiple typing users', () => {
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);
      useGroupStore.getState().setTypingUser('channel-1', 'user-456', true);
      useGroupStore.getState().setTypingUser('channel-1', 'user-789', true);

      const state = useGroupStore.getState();
      expect(state.typingUsers['channel-1']).toHaveLength(3);
    });
  });

  describe('addChannelMessage action', () => {
    it('should add a message to channel', () => {
      useGroupStore.getState().addChannelMessage(mockMessage);

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(1);
      expect(state.channelMessages['channel-1']![0]!.id).toBe('msg-1');
    });

    it('should not duplicate messages with same id', () => {
      useGroupStore.getState().addChannelMessage(mockMessage);
      useGroupStore.getState().addChannelMessage(mockMessage);

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(1);
    });

    it('should append message to existing messages', () => {
      useGroupStore.setState({
        channelMessages: { 'channel-1': [mockMessage] },
      });

      useGroupStore.getState().addChannelMessage(mockMessage2);

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(2);
    });
  });

  describe('updateChannelMessage action', () => {
    it('should update existing message', () => {
      useGroupStore.setState({
        channelMessages: { 'channel-1': [mockMessage] },
      });
      const updatedMessage = { ...mockMessage, content: 'Updated content' };

      useGroupStore.getState().updateChannelMessage(updatedMessage);

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']![0]!.content).toBe('Updated content');
    });

    it('should not modify other messages', () => {
      useGroupStore.setState({
        channelMessages: { 'channel-1': [mockMessage, mockMessage2] },
      });
      const updatedMessage = { ...mockMessage, content: 'Updated' };

      useGroupStore.getState().updateChannelMessage(updatedMessage);

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']![1]!.content).toBe('Hi there!');
    });
  });

  describe('removeChannelMessage action', () => {
    it('should remove message from channel', () => {
      useGroupStore.setState({
        channelMessages: { 'channel-1': [mockMessage, mockMessage2] },
      });

      useGroupStore.getState().removeChannelMessage('msg-1', 'channel-1');

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(1);
      expect(state.channelMessages['channel-1']![0]!.id).toBe('msg-2');
    });

    it('should handle removing from empty channel', () => {
      useGroupStore.getState().removeChannelMessage('msg-1', 'channel-1');

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(0);
    });
  });

  describe('fetchChannelMessages action', () => {
    it('should set loading state while fetching', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { messages: [] } }), 100);
          })
      );

      const fetchPromise = useGroupStore.getState().fetchChannelMessages('channel-1');

      expect(useGroupStore.getState().isLoadingMessages).toBe(true);

      await fetchPromise;

      expect(useGroupStore.getState().isLoadingMessages).toBe(false);
    });

    it('should fetch messages and set in store', async () => {
      mockedApi.get.mockResolvedValue({
        data: { messages: [mockMessage, mockMessage2] },
      });

      await useGroupStore.getState().fetchChannelMessages('channel-1');

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(2);
    });

    it('should call API with correct params', async () => {
      mockedApi.get.mockResolvedValue({ data: { messages: [] } });

      await useGroupStore.getState().fetchChannelMessages('channel-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/channels/channel-1/messages', {
        params: { limit: 50 },
      });
    });

    it('should pass before param for pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: { messages: [] } });

      await useGroupStore.getState().fetchChannelMessages('channel-1', 'msg-cursor');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/channels/channel-1/messages', {
        params: { before: 'msg-cursor', limit: 50 },
      });
    });

    it('should set hasMoreMessages based on response length', async () => {
      const fiftyMessages = Array.from({ length: 50 }, (_, i) => ({
        ...mockMessage,
        id: `msg-${i}`,
      }));
      mockedApi.get.mockResolvedValue({ data: { messages: fiftyMessages } });

      await useGroupStore.getState().fetchChannelMessages('channel-1');

      expect(useGroupStore.getState().hasMoreMessages['channel-1']).toBe(true);
    });

    it('should reset loading state on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useGroupStore.getState().fetchChannelMessages('channel-1')).rejects.toThrow();

      expect(useGroupStore.getState().isLoadingMessages).toBe(false);
    });
  });

  describe('fetchMembers action', () => {
    it('should fetch and set members for a group', async () => {
      mockedApi.get.mockResolvedValue({ data: { members: [mockMember] } });

      await useGroupStore.getState().fetchMembers('group-1');

      const state = useGroupStore.getState();
      expect(state.members['group-1']).toHaveLength(1);
      expect(state.members['group-1']![0]!.userId).toBe('user-123');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { members: [] } });

      await useGroupStore.getState().fetchMembers('group-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/groups/group-1/members');
    });
  });

  describe('updateGroup action', () => {
    it('should update group and return updated data', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      const updatedGroup = { ...mockGroup, name: 'Updated Name' };
      mockedApi.patch.mockResolvedValue({ data: { group: updatedGroup } });

      const result = await useGroupStore
        .getState()
        .updateGroup('group-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(useGroupStore.getState().groups[0]!.name).toBe('Updated Name');
    });

    it('should throw error if update fails', async () => {
      mockedApi.patch.mockResolvedValue({ data: {} });

      await expect(
        useGroupStore.getState().updateGroup('group-1', { name: 'Test' })
      ).rejects.toThrow('Failed to update group');
    });
  });

  describe('deleteGroup action', () => {
    it('should remove group from store', async () => {
      useGroupStore.setState({ groups: [mockGroup, mockGroup2] });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().deleteGroup('group-1');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]!.id).toBe('group-2');
    });

    it('should reset activeGroupId if deleting active group', async () => {
      useGroupStore.setState({ groups: [mockGroup], activeGroupId: 'group-1' });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().deleteGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBeNull();
    });
  });

  describe('createInvite action', () => {
    it('should create invite and return code', async () => {
      mockedApi.post.mockResolvedValue({
        data: { invite: { code: 'abc123', expiresAt: '2026-02-01T00:00:00Z' } },
      });

      const result = await useGroupStore.getState().createInvite('group-1');

      expect(result.code).toBe('abc123');
      expect(result.expiresAt).toBe('2026-02-01T00:00:00Z');
    });

    it('should call API with options', async () => {
      mockedApi.post.mockResolvedValue({
        data: { invite: { code: 'xyz789', expiresAt: '2026-02-01T00:00:00Z' } },
      });

      await useGroupStore.getState().createInvite('group-1', { maxUses: 10, expiresIn: 86400 });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/groups/group-1/invites', {
        max_uses: 10,
        expires_in: 86400,
      });
    });
  });
});

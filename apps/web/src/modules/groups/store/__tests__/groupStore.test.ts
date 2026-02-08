/**
 * Group Store (modules) Unit Tests
 *
 * Comprehensive tests for the modular Zustand group store.
 * Covers initial state, CRUD operations, async API actions,
 * message management, typing indicators, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useGroupStore } from '@/modules/groups/store';
import type { Group, Channel, Member, ChannelMessage, Role } from '@/modules/groups/store';

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

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ============================================================================
// Test Fixtures
// ============================================================================

const mockRole: Role = {
  id: 'role-1',
  name: 'Member',
  color: '#ffffff',
  position: 1,
  permissions: 0,
  isDefault: true,
  isMentionable: false,
};

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

const mockChannel3: Channel = {
  id: 'channel-3',
  name: 'off-topic',
  type: 'text',
  topic: null,
  categoryId: 'cat-2',
  position: 2,
  isNsfw: false,
  slowModeSeconds: 0,
  unreadCount: 0,
  lastMessageAt: null,
};

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

const mockMember2: Member = {
  id: 'member-2',
  userId: 'user-456',
  nickname: null,
  user: {
    id: 'user-456',
    username: 'anotheruser',
    displayName: 'Another User',
    avatarUrl: null,
    status: 'offline',
  },
  roles: [],
  joinedAt: '2026-01-20T12:00:00Z',
};

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

const mockMessage3: ChannelMessage = {
  id: 'msg-3',
  channelId: 'channel-2',
  authorId: 'user-123',
  content: 'Announcement!',
  messageType: 'text',
  replyToId: null,
  replyTo: null,
  isPinned: true,
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
  createdAt: '2026-01-30T12:00:00Z',
};

// ============================================================================
// Helpers
// ============================================================================

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

// ============================================================================
// Tests
// ============================================================================

afterEach(() => {
  useGroupStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('groupStore (modules)', () => {
  // --------------------------------------------------------------------------
  // Initial state
  // --------------------------------------------------------------------------
  describe('initial state', () => {
    beforeEach(() => {
      useGroupStore.setState(getInitialState());
    });

    it('should have empty groups array', () => {
      const state = useGroupStore.getState();
      expect(state.groups).toEqual([]);
    });

    it('should have null active IDs', () => {
      const state = useGroupStore.getState();
      expect(state.activeGroupId).toBeNull();
      expect(state.activeChannelId).toBeNull();
    });

    it('should have empty channelMessages, members, hasMoreMessages, typingUsers', () => {
      const state = useGroupStore.getState();
      expect(state.channelMessages).toEqual({});
      expect(state.members).toEqual({});
      expect(state.hasMoreMessages).toEqual({});
      expect(state.typingUsers).toEqual({});
    });

    it('should not be loading groups or messages', () => {
      const state = useGroupStore.getState();
      expect(state.isLoadingGroups).toBe(false);
      expect(state.isLoadingMessages).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // fetchGroups
  // --------------------------------------------------------------------------
  describe('fetchGroups', () => {
    it('should set isLoadingGroups true while fetching', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { groups: [] } }), 50))
      );

      const promise = useGroupStore.getState().fetchGroups();
      expect(useGroupStore.getState().isLoadingGroups).toBe(true);

      await promise;
      expect(useGroupStore.getState().isLoadingGroups).toBe(false);
    });

    it('should populate groups from API response', async () => {
      mockedApi.get.mockResolvedValue({ data: { groups: [mockGroup, mockGroup2] } });

      await useGroupStore.getState().fetchGroups();

      const { groups } = useGroupStore.getState();
      expect(groups).toHaveLength(2);
      expect(groups[0]!.id).toBe('group-1');
      expect(groups[1]!.id).toBe('group-2');
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { groups: [] } });

      await useGroupStore.getState().fetchGroups();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/groups');
    });

    it('should reset isLoadingGroups on error and re-throw', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useGroupStore.getState().fetchGroups()).rejects.toThrow('Network error');
      expect(useGroupStore.getState().isLoadingGroups).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // fetchGroup
  // --------------------------------------------------------------------------
  describe('fetchGroup', () => {
    it('should add a new group to the store', async () => {
      mockedApi.get.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().fetchGroup('group-1');

      expect(useGroupStore.getState().groups).toHaveLength(1);
      expect(useGroupStore.getState().groups[0]!.name).toBe('Test Group');
    });

    it('should update an existing group in the store', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      const updated = { ...mockGroup, name: 'Renamed Group' };
      mockedApi.get.mockResolvedValue({ data: { group: updated } });

      await useGroupStore.getState().fetchGroup('group-1');

      expect(useGroupStore.getState().groups).toHaveLength(1);
      expect(useGroupStore.getState().groups[0]!.name).toBe('Renamed Group');
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().fetchGroup('group-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/groups/group-1');
    });
  });

  // --------------------------------------------------------------------------
  // createGroup
  // --------------------------------------------------------------------------
  describe('createGroup', () => {
    it('should create a group, prepend it, and return it', async () => {
      useGroupStore.setState({ groups: [mockGroup2] });
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      const result = await useGroupStore.getState().createGroup({
        name: 'Test Group',
        description: 'A test group for testing',
        isPublic: true,
      });

      expect(result.id).toBe('group-1');
      const { groups } = useGroupStore.getState();
      expect(groups).toHaveLength(2);
      expect(groups[0]!.id).toBe('group-1'); // prepended
    });

    it('should call API with the correct payload', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().createGroup({
        name: 'Test Group',
        description: 'desc',
        isPublic: false,
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/groups', {
        name: 'Test Group',
        description: 'desc',
        isPublic: false,
      });
    });

    it('should throw when API returns no group object', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(useGroupStore.getState().createGroup({ name: 'X' })).rejects.toThrow(
        'Failed to create group'
      );
    });
  });

  // --------------------------------------------------------------------------
  // updateGroup
  // --------------------------------------------------------------------------
  describe('updateGroup', () => {
    it('should update the group in the store and return it', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      const updated = { ...mockGroup, name: 'Updated Name' };
      mockedApi.patch.mockResolvedValue({ data: { group: updated } });

      const result = await useGroupStore
        .getState()
        .updateGroup('group-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(useGroupStore.getState().groups[0]!.name).toBe('Updated Name');
    });

    it('should throw when API returns no group object', async () => {
      mockedApi.patch.mockResolvedValue({ data: {} });

      await expect(useGroupStore.getState().updateGroup('group-1', { name: 'X' })).rejects.toThrow(
        'Failed to update group'
      );
    });
  });

  // --------------------------------------------------------------------------
  // deleteGroup
  // --------------------------------------------------------------------------
  describe('deleteGroup', () => {
    it('should remove the group from the store', async () => {
      useGroupStore.setState({ groups: [mockGroup, mockGroup2] });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().deleteGroup('group-1');

      const { groups } = useGroupStore.getState();
      expect(groups).toHaveLength(1);
      expect(groups[0]!.id).toBe('group-2');
    });

    it('should reset activeGroupId when deleting the active group', async () => {
      useGroupStore.setState({ groups: [mockGroup], activeGroupId: 'group-1' });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().deleteGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBeNull();
    });

    it('should not reset activeGroupId when deleting a different group', async () => {
      useGroupStore.setState({ groups: [mockGroup, mockGroup2], activeGroupId: 'group-2' });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().deleteGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBe('group-2');
    });

    it('should propagate API errors', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.delete.mockRejectedValue(new Error('Forbidden'));

      await expect(useGroupStore.getState().deleteGroup('group-1')).rejects.toThrow('Forbidden');
    });
  });

  // --------------------------------------------------------------------------
  // joinGroup
  // --------------------------------------------------------------------------
  describe('joinGroup', () => {
    it('should add the joined group to the store', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinGroup('invite-abc');

      expect(useGroupStore.getState().groups).toHaveLength(1);
      expect(useGroupStore.getState().groups[0]!.id).toBe('group-1');
    });

    it('should not duplicate group if already present', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinGroup('invite-abc');

      expect(useGroupStore.getState().groups).toHaveLength(1);
    });

    it('should call the correct invite endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinGroup('xyz');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/invites/xyz/join');
    });
  });

  // --------------------------------------------------------------------------
  // leaveGroup
  // --------------------------------------------------------------------------
  describe('leaveGroup', () => {
    it('should remove the group from the store', async () => {
      useGroupStore.setState({ groups: [mockGroup, mockGroup2] });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      expect(useGroupStore.getState().groups).toHaveLength(1);
      expect(useGroupStore.getState().groups[0]!.id).toBe('group-2');
    });

    it('should reset activeGroupId when leaving the active group', async () => {
      useGroupStore.setState({ groups: [mockGroup], activeGroupId: 'group-1' });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      expect(useGroupStore.getState().activeGroupId).toBeNull();
    });

    it('should call the correct endpoint', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.delete.mockResolvedValue({});

      await useGroupStore.getState().leaveGroup('group-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/groups/group-1/members/@me');
    });
  });

  // --------------------------------------------------------------------------
  // setActiveGroup / setActiveChannel
  // --------------------------------------------------------------------------
  describe('setActiveGroup', () => {
    it('should set the activeGroupId', () => {
      useGroupStore.getState().setActiveGroup('group-1');
      expect(useGroupStore.getState().activeGroupId).toBe('group-1');
    });

    it('should reset activeChannelId when switching groups', () => {
      useGroupStore.setState({ activeChannelId: 'channel-1' });
      useGroupStore.getState().setActiveGroup('group-2');
      expect(useGroupStore.getState().activeChannelId).toBeNull();
    });

    it('should allow setting to null', () => {
      useGroupStore.setState({ activeGroupId: 'group-1' });
      useGroupStore.getState().setActiveGroup(null);
      expect(useGroupStore.getState().activeGroupId).toBeNull();
    });
  });

  describe('setActiveChannel', () => {
    it('should set the activeChannelId', () => {
      useGroupStore.getState().setActiveChannel('channel-1');
      expect(useGroupStore.getState().activeChannelId).toBe('channel-1');
    });

    it('should allow setting to null', () => {
      useGroupStore.setState({ activeChannelId: 'channel-1' });
      useGroupStore.getState().setActiveChannel(null);
      expect(useGroupStore.getState().activeChannelId).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // fetchChannelMessages
  // --------------------------------------------------------------------------
  describe('fetchChannelMessages', () => {
    it('should set isLoadingMessages while fetching', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { messages: [] } }), 50))
      );

      const promise = useGroupStore.getState().fetchChannelMessages('channel-1');
      expect(useGroupStore.getState().isLoadingMessages).toBe(true);

      await promise;
      expect(useGroupStore.getState().isLoadingMessages).toBe(false);
    });

    it('should store fetched messages under the channel id', async () => {
      mockedApi.get.mockResolvedValue({ data: { messages: [mockMessage, mockMessage2] } });

      await useGroupStore.getState().fetchChannelMessages('channel-1');

      expect(useGroupStore.getState().channelMessages['channel-1']).toHaveLength(2);
    });

    it('should pass before param for pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: { messages: [] } });

      await useGroupStore.getState().fetchChannelMessages('channel-1', 'cursor-id');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/channels/channel-1/messages', {
        params: { before: 'cursor-id', limit: 50 },
      });
    });

    it('should set hasMoreMessages to true when 50 messages returned', async () => {
      const fiftyMsgs = Array.from({ length: 50 }, (_, i) => ({ ...mockMessage, id: `msg-${i}` }));
      mockedApi.get.mockResolvedValue({ data: { messages: fiftyMsgs } });

      await useGroupStore.getState().fetchChannelMessages('channel-1');

      expect(useGroupStore.getState().hasMoreMessages['channel-1']).toBe(true);
    });

    it('should set hasMoreMessages to false when fewer than 50 messages', async () => {
      mockedApi.get.mockResolvedValue({ data: { messages: [mockMessage] } });

      await useGroupStore.getState().fetchChannelMessages('channel-1');

      expect(useGroupStore.getState().hasMoreMessages['channel-1']).toBe(false);
    });

    it('should reset isLoadingMessages on error and re-throw', async () => {
      mockedApi.get.mockRejectedValue(new Error('Fetch failed'));

      await expect(useGroupStore.getState().fetchChannelMessages('channel-1')).rejects.toThrow(
        'Fetch failed'
      );

      expect(useGroupStore.getState().isLoadingMessages).toBe(false);
    });

    it('should prepend messages when paginating with before param', async () => {
      useGroupStore.setState({ channelMessages: { 'channel-1': [mockMessage2] } });
      mockedApi.get.mockResolvedValue({ data: { messages: [mockMessage] } });

      await useGroupStore.getState().fetchChannelMessages('channel-1', 'msg-2');

      const msgs = useGroupStore.getState().channelMessages['channel-1']!;
      expect(msgs).toHaveLength(2);
      expect(msgs[0]!.id).toBe('msg-1'); // prepended
      expect(msgs[1]!.id).toBe('msg-2');
    });
  });

  // --------------------------------------------------------------------------
  // sendChannelMessage
  // --------------------------------------------------------------------------
  describe('sendChannelMessage', () => {
    it('should send a message and add it to the store', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage } });

      await useGroupStore.getState().sendChannelMessage('channel-1', 'Hello!');

      expect(useGroupStore.getState().channelMessages['channel-1']).toHaveLength(1);
    });

    it('should include idempotency key in payload', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage } });

      await useGroupStore.getState().sendChannelMessage('channel-1', 'Test');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/channels/channel-1/messages', {
        content: 'Test',
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

  // --------------------------------------------------------------------------
  // addChannelMessage / updateChannelMessage / removeChannelMessage
  // --------------------------------------------------------------------------
  describe('addChannelMessage', () => {
    it('should add a message to the correct channel', () => {
      useGroupStore.getState().addChannelMessage(mockMessage);

      expect(useGroupStore.getState().channelMessages['channel-1']).toHaveLength(1);
      expect(useGroupStore.getState().channelMessages['channel-1']![0]!.id).toBe('msg-1');
    });

    it('should not duplicate a message with the same id', () => {
      useGroupStore.getState().addChannelMessage(mockMessage);
      useGroupStore.getState().addChannelMessage(mockMessage);

      expect(useGroupStore.getState().channelMessages['channel-1']).toHaveLength(1);
    });

    it('should append to existing messages', () => {
      useGroupStore.setState({ channelMessages: { 'channel-1': [mockMessage] } });

      useGroupStore.getState().addChannelMessage(mockMessage2);

      expect(useGroupStore.getState().channelMessages['channel-1']).toHaveLength(2);
    });

    it('should keep messages from different channels separate', () => {
      useGroupStore.getState().addChannelMessage(mockMessage);
      useGroupStore.getState().addChannelMessage(mockMessage3);

      const state = useGroupStore.getState();
      expect(state.channelMessages['channel-1']).toHaveLength(1);
      expect(state.channelMessages['channel-2']).toHaveLength(1);
    });
  });

  describe('updateChannelMessage', () => {
    it('should update an existing message in place', () => {
      useGroupStore.setState({ channelMessages: { 'channel-1': [mockMessage, mockMessage2] } });
      const edited = { ...mockMessage, content: 'Edited content', isEdited: true };

      useGroupStore.getState().updateChannelMessage(edited);

      const msgs = useGroupStore.getState().channelMessages['channel-1']!;
      expect(msgs[0]!.content).toBe('Edited content');
      expect(msgs[0]!.isEdited).toBe(true);
      expect(msgs[1]!.content).toBe('Hi there!'); // untouched
    });
  });

  describe('removeChannelMessage', () => {
    it('should remove a specific message from the channel', () => {
      useGroupStore.setState({ channelMessages: { 'channel-1': [mockMessage, mockMessage2] } });

      useGroupStore.getState().removeChannelMessage('msg-1', 'channel-1');

      const msgs = useGroupStore.getState().channelMessages['channel-1']!;
      expect(msgs).toHaveLength(1);
      expect(msgs[0]!.id).toBe('msg-2');
    });

    it('should handle removing from empty / non-existent channel gracefully', () => {
      useGroupStore.getState().removeChannelMessage('msg-999', 'nonexistent');

      expect(useGroupStore.getState().channelMessages['nonexistent']).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // fetchMembers
  // --------------------------------------------------------------------------
  describe('fetchMembers', () => {
    it('should fetch and store members for a group', async () => {
      mockedApi.get.mockResolvedValue({ data: { members: [mockMember, mockMember2] } });

      await useGroupStore.getState().fetchMembers('group-1');

      const members = useGroupStore.getState().members['group-1']!;
      expect(members).toHaveLength(2);
      expect(members[0]!.userId).toBe('user-123');
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { members: [] } });

      await useGroupStore.getState().fetchMembers('group-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/groups/group-1/members');
    });
  });

  // --------------------------------------------------------------------------
  // setTypingUser
  // --------------------------------------------------------------------------
  describe('setTypingUser', () => {
    it('should add a typing user', () => {
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);

      expect(useGroupStore.getState().typingUsers['channel-1']).toContain('user-123');
    });

    it('should remove a typing user', () => {
      useGroupStore.setState({ typingUsers: { 'channel-1': ['user-123', 'user-456'] } });

      useGroupStore.getState().setTypingUser('channel-1', 'user-123', false);

      const typing = useGroupStore.getState().typingUsers['channel-1']!;
      expect(typing).not.toContain('user-123');
      expect(typing).toContain('user-456');
    });

    it('should not duplicate typing users', () => {
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);
      useGroupStore.getState().setTypingUser('channel-1', 'user-123', true);

      expect(useGroupStore.getState().typingUsers['channel-1']).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // updateChannelOrder
  // --------------------------------------------------------------------------
  describe('updateChannelOrder', () => {
    it('should reorder channels locally after API call', async () => {
      const groupWithChannels: Group = {
        ...mockGroup,
        channels: [mockChannel, mockChannel2, mockChannel3],
      };
      useGroupStore.setState({ groups: [groupWithChannels] });
      mockedApi.patch.mockResolvedValue({});

      await useGroupStore
        .getState()
        .updateChannelOrder('group-1', ['channel-3', 'channel-1', 'channel-2']);

      const channels = useGroupStore.getState().groups[0]!.channels;
      expect(channels[0]!.id).toBe('channel-3');
      expect(channels[1]!.id).toBe('channel-1');
      expect(channels[2]!.id).toBe('channel-2');
    });

    it('should call the correct API endpoint with channel_ids', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.patch.mockResolvedValue({});

      await useGroupStore.getState().updateChannelOrder('group-1', ['channel-2', 'channel-1']);

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/groups/group-1/channels/order', {
        channel_ids: ['channel-2', 'channel-1'],
      });
    });
  });

  // --------------------------------------------------------------------------
  // createInvite
  // --------------------------------------------------------------------------
  describe('createInvite', () => {
    it('should return the invite code and expiry', async () => {
      mockedApi.post.mockResolvedValue({
        data: { invite: { code: 'abc123', expiresAt: '2026-03-01T00:00:00Z' } },
      });

      const result = await useGroupStore.getState().createInvite('group-1');

      expect(result.code).toBe('abc123');
      expect(result.expiresAt).toBe('2026-03-01T00:00:00Z');
    });

    it('should forward options to the API', async () => {
      mockedApi.post.mockResolvedValue({
        data: { invite: { code: 'xyz', expiresAt: '2026-03-01T00:00:00Z' } },
      });

      await useGroupStore.getState().createInvite('group-1', { maxUses: 5, expiresIn: 3600 });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/groups/group-1/invites', {
        max_uses: 5,
        expires_in: 3600,
      });
    });
  });

  // --------------------------------------------------------------------------
  // Error handling (additional coverage)
  // --------------------------------------------------------------------------
  describe('error handling', () => {
    it('fetchGroups should not leave stale loading state on rejection', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      await expect(useGroupStore.getState().fetchGroups()).rejects.toThrow('Server error');

      expect(useGroupStore.getState().isLoadingGroups).toBe(false);
      expect(useGroupStore.getState().groups).toEqual([]);
    });

    it('joinGroup should propagate API errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Invalid invite'));

      await expect(useGroupStore.getState().joinGroup('bad-code')).rejects.toThrow(
        'Invalid invite'
      );
    });

    it('sendChannelMessage should propagate API errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Rate limited'));

      await expect(
        useGroupStore.getState().sendChannelMessage('channel-1', 'spam')
      ).rejects.toThrow('Rate limited');
    });

    it('fetchMembers should propagate API errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(useGroupStore.getState().fetchMembers('group-1')).rejects.toThrow(
        'Unauthorized'
      );
    });
  });
});

/**
 * Groups Hooks Unit Tests
 *
 * Tests for useGroups, useGroupMembers, useGroupChannels,
 * useActiveGroup, useChannelMessages, and useGroupTyping hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroups } from '../useGroupList';
import { useGroupMembers } from '../useGroupMembers';
import { useGroupChannels } from '../useGroupChannels';
import { useActiveGroup } from '../useActiveGroup';
import { useChannelMessages, useGroupTyping } from '../useChannelMessages';
import type { Group, Channel, Member, ChannelMessage } from '../../store';

// --- Factories -------------------------------------------------------------

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'g-1',
    name: 'Test Group',
    slug: 'test-group',
    description: null,
    iconUrl: null,
    bannerUrl: null,
    isPublic: true,
    memberCount: 5,
    onlineMemberCount: 2,
    ownerId: 'u-owner',
    categories: [],
    channels: [],
    roles: [],
    myMember: null,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'ch-1',
    name: 'general',
    type: 'text',
    topic: null,
    categoryId: null,
    position: 0,
    isNsfw: false,
    slowModeSeconds: 0,
    unreadCount: 0,
    lastMessageAt: null,
    ...overrides,
  };
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm-1',
    userId: 'u-1',
    nickname: null,
    user: {
      id: 'u-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      status: 'online',
    },
    roles: [],
    joinedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeMessage(overrides: Partial<ChannelMessage> = {}): ChannelMessage {
  return {
    id: 'msg-1',
    channelId: 'ch-1',
    authorId: 'u-1',
    content: 'Hello world',
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    author: {
      id: 'u-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      member: null,
    },
    createdAt: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

// --- Mock store state ------------------------------------------------------

const mockGroupState: Record<string, unknown> = {
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
  fetchGroups: vi.fn().mockResolvedValue(undefined),
  fetchGroup: vi.fn().mockResolvedValue(undefined),
  fetchChannelMessages: vi.fn().mockResolvedValue(undefined),
  fetchMembers: vi.fn().mockResolvedValue(undefined),
  sendChannelMessage: vi.fn().mockResolvedValue(undefined),
  setActiveGroup: vi.fn(),
  setActiveChannel: vi.fn(),
  addChannelMessage: vi.fn(),
  updateChannelMessage: vi.fn(),
  removeChannelMessage: vi.fn(),
  setTypingUser: vi.fn(),
  createGroup: vi.fn().mockResolvedValue(makeGroup()),
  joinGroup: vi.fn().mockResolvedValue(undefined),
  leaveGroup: vi.fn().mockResolvedValue(undefined),
  updateGroup: vi.fn().mockResolvedValue(makeGroup()),
  deleteGroup: vi.fn().mockResolvedValue(undefined),
  updateChannelOrder: vi.fn().mockResolvedValue(undefined),
  createInvite: vi.fn().mockResolvedValue({ code: 'ABC123', expiresAt: '2025-12-31' }),
};

vi.mock('../../store', () => ({
  useGroupStore: vi.fn((selector?: (s: typeof mockGroupState) => unknown) =>
    selector ? selector(mockGroupState) : mockGroupState
  ),
}));

// ---------------------------------------------------------------------------

function resetState() {
  Object.assign(mockGroupState, {
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
  vi.clearAllMocks();
}

// ===========================================================================
// useGroups
// ===========================================================================

describe('useGroups', () => {
  beforeEach(resetState);

  it('returns empty groups list by default', () => {
    const { result } = renderHook(() => useGroups());
    expect(result.current.groups).toEqual([]);
  });

  it('fetches groups on mount when list is empty', () => {
    renderHook(() => useGroups());
    expect(mockGroupState.fetchGroups).toHaveBeenCalled();
  });

  it('does not re-fetch when groups already loaded', () => {
    mockGroupState.groups = [makeGroup()];
    renderHook(() => useGroups());
    expect(mockGroupState.fetchGroups).not.toHaveBeenCalled();
  });

  it('returns filtered myGroups (groups where myMember is set)', () => {
    mockGroupState.groups = [
      makeGroup({ id: 'g-1', myMember: makeMember() }),
      makeGroup({ id: 'g-2', myMember: null }),
    ];
    const { result } = renderHook(() => useGroups());
    expect(result.current.myGroups).toHaveLength(1);
    expect(result.current.myGroups[0].id).toBe('g-1');
  });

  it('returns filtered publicGroups', () => {
    mockGroupState.groups = [
      makeGroup({ id: 'g-1', isPublic: true }),
      makeGroup({ id: 'g-2', isPublic: false }),
    ];
    const { result } = renderHook(() => useGroups());
    expect(result.current.publicGroups).toHaveLength(1);
    expect(result.current.publicGroups[0].id).toBe('g-1');
  });

  it('delegates join to store', async () => {
    const { result } = renderHook(() => useGroups());
    await act(async () => {
      await result.current.join('invite-code');
    });
    expect(mockGroupState.joinGroup).toHaveBeenCalledWith('invite-code');
  });

  it('delegates leave to store', async () => {
    const { result } = renderHook(() => useGroups());
    await act(async () => {
      await result.current.leave('g-1');
    });
    expect(mockGroupState.leaveGroup).toHaveBeenCalledWith('g-1');
  });

  it('delegates create to store', async () => {
    const { result } = renderHook(() => useGroups());
    await act(async () => {
      await result.current.create('New Group', 'A description', true);
    });
    expect(mockGroupState.createGroup).toHaveBeenCalledWith({
      name: 'New Group',
      description: 'A description',
      isPublic: true,
    });
  });

  it('exposes isLoading from store', () => {
    mockGroupState.isLoadingGroups = true;
    const { result } = renderHook(() => useGroups());
    expect(result.current.isLoading).toBe(true);
  });
});

// ===========================================================================
// useGroupMembers
// ===========================================================================

describe('useGroupMembers', () => {
  beforeEach(resetState);

  it('returns empty members when no groupId', () => {
    const { result } = renderHook(() => useGroupMembers(undefined));
    expect(result.current.members).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('fetches members on mount for a given groupId', () => {
    renderHook(() => useGroupMembers('g-1'));
    expect(mockGroupState.fetchMembers).toHaveBeenCalledWith('g-1');
  });

  it('splits members into online and offline', () => {
    mockGroupState.members = {
      'g-1': [
        makeMember({
          id: 'm-1',
          user: { id: 'u-1', username: 'a', displayName: null, avatarUrl: null, status: 'online' },
        }),
        makeMember({
          id: 'm-2',
          user: { id: 'u-2', username: 'b', displayName: null, avatarUrl: null, status: 'offline' },
        }),
        makeMember({
          id: 'm-3',
          user: { id: 'u-3', username: 'c', displayName: null, avatarUrl: null, status: 'away' },
        }),
      ],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.onlineMembers).toHaveLength(2); // online + away
    expect(result.current.offlineMembers).toHaveLength(1);
    expect(result.current.onlineCount).toBe(2);
  });

  it('groups members by role', () => {
    const role = {
      id: 'r-admin',
      name: 'Admin',
      color: '#f00',
      position: 0,
      permissions: 0,
      isDefault: false,
      isMentionable: true,
    };
    mockGroupState.members = {
      'g-1': [makeMember({ id: 'm-1', roles: [role] }), makeMember({ id: 'm-2', roles: [] })],
    };

    const { result } = renderHook(() => useGroupMembers('g-1'));
    expect(result.current.membersByRole['r-admin']).toHaveLength(1);
    expect(result.current.membersByRole['default']).toHaveLength(1);
  });

  it('refresh calls fetchMembers with groupId', async () => {
    const { result } = renderHook(() => useGroupMembers('g-1'));
    vi.clearAllMocks();
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockGroupState.fetchMembers).toHaveBeenCalledWith('g-1');
  });
});

// ===========================================================================
// useGroupChannels
// ===========================================================================

describe('useGroupChannels', () => {
  beforeEach(resetState);

  it('returns empty channels when no groupId', () => {
    const { result } = renderHook(() => useGroupChannels(undefined));
    expect(result.current.channels).toEqual([]);
    expect(result.current.textChannels).toEqual([]);
    expect(result.current.voiceChannels).toEqual([]);
  });

  it('returns channels from the matching group', () => {
    mockGroupState.groups = [
      makeGroup({
        id: 'g-1',
        channels: [
          makeChannel({ id: 'ch-1', type: 'text' }),
          makeChannel({ id: 'ch-2', type: 'voice' }),
          makeChannel({ id: 'ch-3', type: 'video' }),
        ],
      }),
    ];

    const { result } = renderHook(() => useGroupChannels('g-1'));
    expect(result.current.channels).toHaveLength(3);
    expect(result.current.textChannels).toHaveLength(1);
    expect(result.current.voiceChannels).toHaveLength(2); // voice + video
  });

  it('groups channels by category', () => {
    const cat = { id: 'cat-1', name: 'General', position: 0, channels: [] };
    mockGroupState.groups = [
      makeGroup({
        id: 'g-1',
        categories: [cat],
        channels: [
          makeChannel({ id: 'ch-1', categoryId: 'cat-1' }),
          makeChannel({ id: 'ch-2', categoryId: null }),
        ],
      }),
    ];

    const { result } = renderHook(() => useGroupChannels('g-1'));
    expect(result.current.channelsByCategory['cat-1']).toHaveLength(1);
    expect(result.current.channelsByCategory['uncategorized']).toHaveLength(1);
  });

  it('delegates selectChannel to store', () => {
    mockGroupState.groups = [makeGroup({ id: 'g-1' })];
    const { result } = renderHook(() => useGroupChannels('g-1'));
    act(() => {
      result.current.selectChannel('ch-1');
    });
    expect(mockGroupState.setActiveChannel).toHaveBeenCalledWith('ch-1');
  });

  it('delegates reorderChannels to store', async () => {
    mockGroupState.groups = [makeGroup({ id: 'g-1' })];
    const { result } = renderHook(() => useGroupChannels('g-1'));
    await act(async () => {
      await result.current.reorderChannels(['ch-2', 'ch-1']);
    });
    expect(mockGroupState.updateChannelOrder).toHaveBeenCalledWith('g-1', ['ch-2', 'ch-1']);
  });
});

// ===========================================================================
// useActiveGroup
// ===========================================================================

describe('useActiveGroup', () => {
  beforeEach(resetState);

  it('returns null group when no activeGroupId', () => {
    const { result } = renderHook(() => useActiveGroup());
    expect(result.current.group).toBeNull();
    expect(result.current.channel).toBeNull();
  });

  it('returns active group from store', () => {
    const group = makeGroup({ id: 'g-1', channels: [makeChannel({ id: 'ch-1' })] });
    mockGroupState.groups = [group];
    mockGroupState.activeGroupId = 'g-1';
    mockGroupState.activeChannelId = 'ch-1';

    const { result } = renderHook(() => useActiveGroup());
    expect(result.current.group?.id).toBe('g-1');
    expect(result.current.channel?.id).toBe('ch-1');
  });

  it('selectGroup sets active group and auto-selects first text channel', () => {
    const group = makeGroup({
      id: 'g-1',
      channels: [
        makeChannel({ id: 'ch-voice', type: 'voice' }),
        makeChannel({ id: 'ch-text', type: 'text' }),
      ],
    });
    mockGroupState.groups = [group];

    const { result } = renderHook(() => useActiveGroup());
    act(() => {
      result.current.selectGroup('g-1');
    });

    expect(mockGroupState.setActiveGroup).toHaveBeenCalledWith('g-1');
    expect(mockGroupState.setActiveChannel).toHaveBeenCalledWith('ch-text');
  });

  it('remove deletes group and clears selection', async () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useActiveGroup());
    await act(async () => {
      await result.current.remove();
    });
    expect(mockGroupState.deleteGroup).toHaveBeenCalledWith('g-1');
    expect(mockGroupState.setActiveGroup).toHaveBeenCalledWith(null);
  });

  it('invite creates an invite for the active group', async () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useActiveGroup());
    let invite: { code: string; expiresAt: string } | null = null;
    await act(async () => {
      invite = await result.current.invite({ maxUses: 10 });
    });
    expect(mockGroupState.createInvite).toHaveBeenCalledWith('g-1', { maxUses: 10 });
    expect(invite).toEqual({ code: 'ABC123', expiresAt: '2025-12-31' });
  });

  it('refresh fetches the active group', async () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useActiveGroup());
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockGroupState.fetchGroup).toHaveBeenCalledWith('g-1');
  });
});

// ===========================================================================
// useChannelMessages
// ===========================================================================

describe('useChannelMessages', () => {
  beforeEach(resetState);

  it('returns empty messages when no channelId', () => {
    const { result } = renderHook(() => useChannelMessages(undefined));
    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('fetches messages on mount for a given channel', () => {
    renderHook(() => useChannelMessages('ch-1'));
    expect(mockGroupState.fetchChannelMessages).toHaveBeenCalledWith('ch-1');
  });

  it('sends a message to the channel', async () => {
    const { result } = renderHook(() => useChannelMessages('ch-1'));
    await act(async () => {
      await result.current.send('Hello!', 'reply-id');
    });
    expect(mockGroupState.sendChannelMessage).toHaveBeenCalledWith('ch-1', 'Hello!', 'reply-id');
  });

  it('removes a message from the channel', () => {
    const { result } = renderHook(() => useChannelMessages('ch-1'));
    act(() => {
      result.current.removeMessage('msg-1');
    });
    expect(mockGroupState.removeChannelMessage).toHaveBeenCalledWith('msg-1', 'ch-1');
  });

  it('adds a message via addMessage', () => {
    const msg = makeMessage();
    const { result } = renderHook(() => useChannelMessages('ch-1'));
    act(() => {
      result.current.addMessage(msg);
    });
    expect(mockGroupState.addChannelMessage).toHaveBeenCalledWith(msg);
  });

  it('updates a message via updateMessage', () => {
    const msg = makeMessage({ content: 'Updated' });
    const { result } = renderHook(() => useChannelMessages('ch-1'));
    act(() => {
      result.current.updateMessage(msg);
    });
    expect(mockGroupState.updateChannelMessage).toHaveBeenCalledWith(msg);
  });

  it('loads more messages when hasMore and messages exist', async () => {
    const msg = makeMessage({ id: 'msg-oldest' });
    mockGroupState.channelMessages = { 'ch-1': [msg] };
    mockGroupState.hasMoreMessages = { 'ch-1': true };

    const { result } = renderHook(() => useChannelMessages('ch-1'));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(mockGroupState.fetchChannelMessages).toHaveBeenCalledWith('ch-1', 'msg-oldest');
  });

  it('returns typing users for the channel', () => {
    mockGroupState.typingUsers = { 'ch-1': ['u-1', 'u-2'] };
    const { result } = renderHook(() => useChannelMessages('ch-1'));
    expect(result.current.typingUsers).toEqual(['u-1', 'u-2']);
  });
});

// ===========================================================================
// useGroupTyping
// ===========================================================================

describe('useGroupTyping', () => {
  beforeEach(resetState);

  it('returns empty when no channelId', () => {
    const { result } = renderHook(() => useGroupTyping(undefined));
    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('returns typing users for the channel', () => {
    mockGroupState.typingUsers = { 'ch-1': ['u-1'] };
    const { result } = renderHook(() => useGroupTyping('ch-1'));
    expect(result.current.typingUsers).toEqual(['u-1']);
    expect(result.current.isTyping).toBe(true);
  });

  it('delegates setTyping to store', () => {
    const { result } = renderHook(() => useGroupTyping('ch-1'));
    act(() => {
      result.current.setTyping('u-1', true);
    });
    expect(mockGroupState.setTypingUser).toHaveBeenCalledWith('ch-1', 'u-1', true);
  });
});

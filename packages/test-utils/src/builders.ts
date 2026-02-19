/**
 * Typed test-data builders for all core domain entities.
 *
 * Each builder returns a fully-populated entity matching
 * the canonical interface from @cgraph/shared-types, with
 * every field set to a deterministic default.
 *
 * Usage:
 *   const user = buildUser({ displayName: 'Alice' });
 *   const msg  = buildMessage({ content: 'Hello!' });
 */

import type {
  User,
  UserBasic,
  UserStatus,
  Conversation,
  Message,
  MessageMetadata,
  Reaction,
  Group,
  Channel,
  ChannelCategory,
  Role,
  Member,
  Friend,
  FriendRequest,
} from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

let _seq = 0;

/** Monotonically increasing ID — deterministic within a test run. */
function nextId(): string {
  return String(++_seq);
}

/** ISO timestamp offset by `n` seconds from epoch for reproducibility. */
function ts(offsetSeconds = 0): string {
  return new Date(1_700_000_000_000 + offsetSeconds * 1000).toISOString();
}

/** Reset the internal sequence counter (call in `beforeEach` if needed). */
export function resetBuilderSequence(): void {
  _seq = 0;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export function buildUserBasic(overrides: Partial<UserBasic> = {}): UserBasic {
  const id = overrides.id ?? nextId();
  return {
    id,
    username: `user_${id}`,
    displayName: `User ${id}`,
    avatarUrl: null,
    status: 'online' as UserStatus,
    ...overrides,
  };
}

export function buildUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId();
  return {
    id,
    email: `user${id}@test.local`,
    username: `user_${id}`,
    displayName: `User ${id}`,
    avatarUrl: null,
    walletAddress: null,
    bio: null,
    pronouns: null,
    status: 'online' as UserStatus,
    statusMessage: null,
    emailVerifiedAt: ts(),
    twoFactorEnabled: false,
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

export function buildReaction(overrides: Partial<Reaction> = {}): Reaction {
  const id = overrides.id ?? nextId();
  return {
    id,
    emoji: '👍',
    userId: nextId(),
    user: buildUserBasic(),
    createdAt: ts(),
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  const id = overrides.id ?? nextId();
  return {
    id,
    conversationId: nextId(),
    channelId: null,
    senderId: nextId(),
    sender: buildUserBasic(),
    content: `Test message ${id}`,
    encryptedContent: null,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {} as MessageMetadata,
    reactions: [],
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

export function buildConversation(overrides: Partial<Conversation> = {}): Conversation {
  const id = overrides.id ?? nextId();
  return {
    id,
    type: 'direct',
    name: null,
    avatarUrl: null,
    participants: [],
    lastMessage: null,
    unreadCount: 0,
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

export function buildRole(overrides: Partial<Role> = {}): Role {
  const id = overrides.id ?? nextId();
  return {
    id,
    groupId: nextId(),
    name: `Role ${id}`,
    color: '#99aab5',
    position: 0,
    permissions: 0,
    isDefault: false,
    isMentionable: false,
    createdAt: ts(),
    ...overrides,
  };
}

export function buildChannel(overrides: Partial<Channel> = {}): Channel {
  const id = overrides.id ?? nextId();
  return {
    id,
    groupId: nextId(),
    categoryId: null,
    name: `channel-${id}`,
    type: 'text',
    topic: null,
    position: 0,
    isNsfw: false,
    slowModeSeconds: 0,
    unreadCount: 0,
    lastMessageAt: null,
    ...overrides,
  };
}

export function buildMember(overrides: Partial<Member> = {}): Member {
  const id = overrides.id ?? nextId();
  return {
    id,
    groupId: nextId(),
    userId: nextId(),
    user: buildUserBasic(),
    nickname: null,
    roles: [],
    isMuted: false,
    mutedUntil: null,
    isBanned: false,
    joinedAt: ts(),
    ...overrides,
  };
}

export function buildGroup(overrides: Partial<Group> = {}): Group {
  const id = overrides.id ?? nextId();
  return {
    id,
    name: `Group ${id}`,
    slug: `group-${id}`,
    description: null,
    iconUrl: null,
    bannerUrl: null,
    isPublic: true,
    memberCount: 1,
    onlineMemberCount: 1,
    ownerId: nextId(),
    owner: buildUserBasic(),
    categories: [] as ChannelCategory[],
    channels: [],
    roles: [],
    myMember: null,
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

export function buildFriend(overrides: Partial<Friend> = {}): Friend {
  const id = overrides.id ?? nextId();
  return {
    id,
    username: `friend_${id}`,
    displayName: `Friend ${id}`,
    avatarUrl: null,
    status: 'online' as UserStatus,
    statusMessage: null,
    friendshipId: nextId(),
    since: ts(),
    ...overrides,
  };
}

export function buildFriendRequest(overrides: Partial<FriendRequest> = {}): FriendRequest {
  const id = overrides.id ?? nextId();
  return {
    id,
    user: buildUserBasic(),
    type: 'incoming',
    mutualFriendsCount: 0,
    createdAt: ts(),
    ...overrides,
  };
}

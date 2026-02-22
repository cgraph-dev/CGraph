/**
 * Test data factories.
 *
 * Builder functions that produce realistic mock data with
 * sensible defaults. Pass overrides to customize.
 *
 * @module @cgraph/test-utils/factories
 */

interface MockUser {
  readonly id: string;
  readonly uid: string;
  readonly email: string;
  readonly username: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly level: number;
  readonly xp: number;
  readonly karma: number;
  readonly isVerified: boolean;
  readonly isPremium: boolean;
  readonly isAdmin: boolean;
  readonly status: 'online' | 'offline' | 'away' | 'dnd';
  readonly createdAt: string;
}

interface MockMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
  readonly messageType: 'text' | 'image' | 'audio' | 'file';
  readonly isEncrypted: boolean;
  readonly isEdited: boolean;
  readonly reactions: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface MockConversation {
  readonly id: string;
  readonly type: 'direct' | 'group';
  readonly name: string | null;
  readonly lastMessageAt: string;
  readonly createdAt: string;
}

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** Creates a mock user with sensible defaults. */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: nextId('user'),
    uid: `uid-${Date.now()}`,
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
    level: 1,
    xp: 0,
    karma: 0,
    isVerified: true,
    isPremium: false,
    isAdmin: false,
    status: 'online',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Creates a mock message with sensible defaults. */
export function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  const now = new Date().toISOString();
  return {
    id: nextId('msg'),
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Test message',
    messageType: 'text',
    isEncrypted: false,
    isEdited: false,
    reactions: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Creates a mock conversation with sensible defaults. */
export function createMockConversation(
  overrides: Partial<MockConversation> = {}
): MockConversation {
  return {
    id: nextId('conv'),
    type: 'direct',
    name: null,
    lastMessageAt: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

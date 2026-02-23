/**
 * MSW (Mock Service Worker) Handlers
 *
 * Comprehensive API mocks for testing. These handlers simulate the backend
 * API responses for unit and integration tests.
 *
 * @module mocks/handlers
 * @see https://mswjs.io/docs/
 * @since v0.7.27
 * @updated v0.9.9 - Added comprehensive handlers for all API endpoints
 */

import { http, HttpResponse, delay } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ============================================================================
// Mock Data Factories
// ============================================================================

const mockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-1',
  uid: '1234567890',
  email: 'demo@example.com',
  username: 'demo',
  displayName: 'Demo User',
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
});

const mockMessage = (overrides: Partial<MockMessage> = {}): MockMessage => ({
  id: `msg-${Date.now()}`,
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Test message',
  messageType: 'text',
  isEncrypted: false,
  isEdited: false,
  reactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const mockConversation = (overrides: Partial<MockConversation> = {}): MockConversation => ({
  id: 'conv-1',
  type: 'direct',
  name: null,
  participants: [
    {
      id: 'part-1',
      userId: 'user-1',
      user: mockUser(),
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00Z',
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  isPinned: false,
  isMuted: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockFriend = (overrides: Partial<MockFriend> = {}): MockFriend => ({
  id: 'friend-1',
  username: 'testfriend',
  displayName: 'Test Friend',
  avatarUrl: null,
  status: 'online',
  friendshipId: 'friendship-1',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

// ============================================================================
// Type Definitions
// ============================================================================

interface MockUser {
  id: string;
  uid: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  karma: number;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  status: string;
  createdAt: string;
}

interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  isEncrypted: boolean;
  isEdited: boolean;
  reactions: Array<{ emoji: string; userId: string }>;
  createdAt: string;
  updatedAt: string;
}

interface MockConversation {
  id: string;
  type: string;
  name: string | null;
  participants: Array<{
    id: string;
    userId: string;
    user: MockUser;
    nickname: string | null;
    isMuted: boolean;
    mutedUntil: string | null;
    joinedAt: string;
  }>;
  lastMessage: MockMessage | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockFriend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
  friendshipId: string;
  createdAt: string;
}

// ============================================================================
// Health Check Handler
// ============================================================================

const healthHandlers = [
  http.get(`${API_BASE}/api/v1/health`, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: Date.now() });
  }),
];

// ============================================================================
// Authentication Handlers
// ============================================================================

const authHandlers = [
  // Login
  http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { identifier?: string; password?: string };
    const idempotencyKey = request.headers.get('idempotency-key');

    if (!body?.identifier || !body?.password) {
      return HttpResponse.json({ error: 'missing_credentials' }, { status: 400 });
    }

    if (!idempotencyKey) {
      return HttpResponse.json({ error: 'missing_idempotency' }, { status: 400 });
    }

    // Simulate invalid credentials
    if (body.password === 'wrongpassword') {
      return HttpResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    return HttpResponse.json({
      data: {
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
        user: mockUser({ email: `${body.identifier}@example.com` }),
      },
    });
  }),

  // Register
  http.post(`${API_BASE}/api/v1/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; username?: string };

    if (!body?.email || !body?.password || !body?.username) {
      return HttpResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    return HttpResponse.json(
      {
        data: {
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
          },
          user: mockUser({ email: body.email, username: body.username }),
        },
      },
      { status: 201 }
    );
  }),

  // Logout
  http.post(`${API_BASE}/api/v1/auth/logout`, () => {
    return HttpResponse.json({ data: { message: 'Logged out successfully' } });
  }),

  // Refresh token
  http.post(`${API_BASE}/api/v1/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refresh_token?: string };

    if (!body?.refresh_token || body.refresh_token === 'expired') {
      return HttpResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    return HttpResponse.json({
      data: {
        access_token: 'mock-new-access-token',
        refresh_token: 'mock-new-refresh-token',
      },
    });
  }),

  // Get current user
  http.get(`${API_BASE}/api/v1/users/me`, () => {
    return HttpResponse.json({ data: mockUser() });
  }),

  // Update current user
  http.patch(`${API_BASE}/api/v1/users/me`, async ({ request }) => {
    const body = (await request.json()) as Partial<MockUser>; // safe downcast – API response field
    return HttpResponse.json({ data: mockUser(body) });
  }),
];

// ============================================================================
// Messages Handlers
// ============================================================================

const messageHandlers = [
  // List conversations
  http.get(`${API_BASE}/api/v1/conversations`, () => {
    return HttpResponse.json({
      data: [mockConversation()],
      meta: { page: 1, total: 1 },
    });
  }),

  // Get single conversation
  http.get(`${API_BASE}/api/v1/conversations/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      data: mockConversation({ id: id as string }),
    });
  }),

  // Create conversation
  http.post(`${API_BASE}/api/v1/conversations`, async () => {
    return HttpResponse.json(
      {
        data: mockConversation({
          id: `conv-${Date.now()}`,
        }),
      },
      { status: 201 }
    );
  }),

  // List messages in conversation
  http.get(`${API_BASE}/api/v1/conversations/:id/messages`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      data: [
        mockMessage({ conversationId: id as string, content: 'First message' }),
        mockMessage({ conversationId: id as string, content: 'Second message' }),
      ],
      meta: { page: 1, total: 2, hasMore: false },
    });
  }),

  // Send message
  http.post(`${API_BASE}/api/v1/conversations/:id/messages`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { content: string };

    await delay(100); // Simulate network latency

    return HttpResponse.json(
      {
        data: mockMessage({
          conversationId: id as string,
          content: body.content,
        }),
      },
      { status: 201 }
    );
  }),

  // Update message (edit)
  http.patch(`${API_BASE}/api/v1/messages/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { content: string };

    return HttpResponse.json({
      data: mockMessage({
        id: id as string,
        content: body.content,
        isEdited: true,
      }),
    });
  }),

  // Delete message
  http.delete(`${API_BASE}/api/v1/messages/:id`, ({ params: _params }) => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Add reaction
  http.post(`${API_BASE}/api/v1/messages/:id/reactions`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { emoji: string };

    return HttpResponse.json(
      {
        data: { messageId: id, emoji: body.emoji, userId: 'user-1' },
      },
      { status: 201 }
    );
  }),

  // Remove reaction
  http.delete(`${API_BASE}/api/v1/messages/:id/reactions/:emoji`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// ============================================================================
// Friends Handlers
// ============================================================================

const friendHandlers = [
  // List friends
  http.get(`${API_BASE}/api/v1/friends`, () => {
    return HttpResponse.json({
      data: [mockFriend(), mockFriend({ id: 'friend-2', username: 'friend2' })],
    });
  }),

  // Send friend request
  http.post(`${API_BASE}/api/v1/friends/requests`, async ({ request }) => {
    const body = (await request.json()) as { userId: string };
    return HttpResponse.json(
      {
        data: { id: 'request-1', userId: body.userId, status: 'pending' },
      },
      { status: 201 }
    );
  }),

  // List pending requests
  http.get(`${API_BASE}/api/v1/friends/requests`, () => {
    return HttpResponse.json({
      data: {
        incoming: [
          {
            id: 'request-1',
            user: mockUser({ id: 'user-2', username: 'requester' }),
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        outgoing: [],
      },
    });
  }),

  // Accept friend request
  http.post(`${API_BASE}/api/v1/friends/requests/:id/accept`, ({ params }) => {
    return HttpResponse.json({
      data: mockFriend({ friendshipId: params.id as string }),
    });
  }),

  // Reject friend request
  http.post(`${API_BASE}/api/v1/friends/requests/:id/reject`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Remove friend
  http.delete(`${API_BASE}/api/v1/friends/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Block user
  http.post(`${API_BASE}/api/v1/users/:id/block`, () => {
    return HttpResponse.json({ data: { blocked: true } });
  }),

  // Unblock user
  http.delete(`${API_BASE}/api/v1/users/:id/block`, () => {
    return HttpResponse.json({ data: { blocked: false } });
  }),
];

// ============================================================================
// Settings Handlers
// ============================================================================

const settingsHandlers = [
  // Get user settings
  http.get(`${API_BASE}/api/v1/users/me/settings`, () => {
    return HttpResponse.json({
      data: {
        notifications: { email: true, push: true, desktop: true },
        privacy: { showOnline: true, showLastSeen: true },
        appearance: { theme: 'system', fontSize: 'medium' },
      },
    });
  }),

  // Update user settings
  http.patch(`${API_BASE}/api/v1/users/me/settings`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: body });
  }),
];

// ============================================================================
// Notifications Handlers
// ============================================================================

const notificationHandlers = [
  // List notifications
  http.get(`${API_BASE}/api/v1/notifications`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'notif-1',
          type: 'friend_request',
          title: 'New friend request',
          read: false,
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'notif-2',
          type: 'message',
          title: 'New message',
          read: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { unreadCount: 1 },
    });
  }),

  // Mark notification as read
  http.patch(`${API_BASE}/api/v1/notifications/:id/read`, () => {
    return HttpResponse.json({ data: { read: true } });
  }),

  // Mark all as read
  http.post(`${API_BASE}/api/v1/notifications/read-all`, () => {
    return HttpResponse.json({ data: { updatedCount: 5 } });
  }),
];

// ============================================================================
// Forum Handlers
// ============================================================================

const forumHandlers = [
  // List forums
  http.get(`${API_BASE}/api/v1/forums`, () => {
    return HttpResponse.json({
      data: [
        { id: 'forum-1', name: 'General', description: 'General discussion', memberCount: 100 },
        { id: 'forum-2', name: 'Tech', description: 'Technology talk', memberCount: 50 },
      ],
    });
  }),

  // Get forum details
  http.get(`${API_BASE}/api/v1/forums/:id`, ({ params }) => {
    return HttpResponse.json({
      data: { id: params.id, name: 'General', description: 'General discussion', memberCount: 100 },
    });
  }),

  // List forum posts
  http.get(`${API_BASE}/api/v1/forums/:id/posts`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'post-1',
          title: 'First post',
          content: 'Hello world',
          authorId: 'user-1',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { page: 1, total: 1 },
    });
  }),

  // Create forum post
  http.post(`${API_BASE}/api/v1/forums/:id/posts`, async ({ request }) => {
    const body = (await request.json()) as { title: string; content: string };
    return HttpResponse.json(
      {
        data: { id: 'post-new', ...body, authorId: 'user-1', createdAt: new Date().toISOString() },
      },
      { status: 201 }
    );
  }),
];

// ============================================================================
// Upload Handlers
// ============================================================================

const uploadHandlers = [
  // Upload file
  http.post(`${API_BASE}/api/v1/uploads`, async () => {
    await delay(500); // Simulate upload time
    return HttpResponse.json(
      {
        data: {
          url: 'https://cdn.example.com/uploads/file-123.png',
          filename: 'file-123.png',
          size: 1024,
          mimeType: 'image/png',
        },
      },
      { status: 201 }
    );
  }),
];

// ============================================================================
// Export All Handlers
// ============================================================================

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...messageHandlers,
  ...friendHandlers,
  ...settingsHandlers,
  ...notificationHandlers,
  ...forumHandlers,
  ...uploadHandlers,
];

// Re-export factories for use in tests
export { mockUser, mockMessage, mockConversation, mockFriend };

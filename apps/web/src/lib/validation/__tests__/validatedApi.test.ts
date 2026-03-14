/**
 * Tests for the Validated API Client.
 *
 * Verifies that all API methods properly validate responses via Zod schemas,
 * normalize nested response formats, and propagate errors correctly.
 *
 * Uses MSW (Mock Service Worker) to intercept HTTP requests.
 *
 * @module lib/validation/__tests__/validatedApi.test
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { authApi, conversationsApi, messagesApi, notificationsApi } from '../validatedApi';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTokens = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'Bearer',
};

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  uid: '1234567890',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  level: 1,
  xp: 0,
  pulse: 0,
  is_verified: true,
  inserted_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockConversation = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'direct',
  participants: [
    {
      id: mockUser.id,
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null,
    },
  ],
  last_message: null,
  inserted_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockMessage = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  content: 'Hello world',
  message_type: 'text',
  sender_id: mockUser.id,
  sender: {
    id: mockUser.id,
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: null,
  },
  conversation_id: mockConversation.id,
  inserted_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockNotification = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  type: 'message',
  title: 'New message',
  body: 'You have a new message',
  is_read: false,
  data: {},
  inserted_at: '2024-01-01T00:00:00Z',
};

const API_BASE = 'http://localhost:4000';

// ---------------------------------------------------------------------------
// Auth API Tests
// ---------------------------------------------------------------------------

describe('authApi', () => {
  describe('login', () => {
    it('validates and returns login response', async () => {
      server.use(
        http.post(`${API_BASE}/api/v1/auth/login`, () =>
          HttpResponse.json({
            user: mockUser,
            tokens: mockTokens,
          })
        )
      );

      const result = await authApi.login('test@example.com', 'password123');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens.access_token).toBe('test-access-token');
    });

    it('propagates API errors', async () => {
      server.use(
        http.post(`${API_BASE}/api/v1/auth/login`, () =>
          HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        )
      );

      await expect(authApi.login('invalid@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('sends registration payload correctly', async () => {
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(`${API_BASE}/api/v1/auth/register`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            user: mockUser,
            tokens: mockTokens,
          });
        })
      );

      await authApi.register('test@example.com', 'newuser', 'password123');

      expect(capturedBody).toMatchObject({
        user: {
          email: 'test@example.com',
          username: 'newuser',
          password: 'password123',
          password_confirmation: 'password123',
        },
      });
    });
  });

  describe('refresh', () => {
    it('normalizes nested token response', async () => {
      server.use(
        http.post(`${API_BASE}/api/v1/auth/refresh`, () =>
          HttpResponse.json({ tokens: mockTokens })
        )
      );

      const result = await authApi.refresh('old-refresh-token');
      expect(result.access_token).toBe('test-access-token');
    });

    it('handles flat token response', async () => {
      server.use(http.post(`${API_BASE}/api/v1/auth/refresh`, () => HttpResponse.json(mockTokens)));

      const result = await authApi.refresh('old-refresh-token');
      expect(result.access_token).toBe('test-access-token');
    });
  });

  describe('me', () => {
    it('normalizes { data: user } wrapper', async () => {
      server.use(http.get(`${API_BASE}/api/v1/me`, () => HttpResponse.json({ data: mockUser })));

      const result = await authApi.me();
      expect(result.username).toBe('testuser');
    });

    it('normalizes { user: ... } wrapper', async () => {
      server.use(http.get(`${API_BASE}/api/v1/me`, () => HttpResponse.json({ user: mockUser })));

      const result = await authApi.me();
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('logout', () => {
    it('sends logout request', async () => {
      let called = false;
      server.use(
        http.post(`${API_BASE}/api/v1/auth/logout`, () => {
          called = true;
          return HttpResponse.json({});
        })
      );

      await authApi.logout();
      expect(called).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Conversations API Tests
// ---------------------------------------------------------------------------

describe('conversationsApi', () => {
  describe('list', () => {
    it('normalizes array response', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/conversations`, () => HttpResponse.json([mockConversation]))
      );

      const result = await conversationsApi.list();
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(mockConversation.id);
    });

    it('normalizes { conversations: [...] } wrapper', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/conversations`, () =>
          HttpResponse.json({ conversations: [mockConversation] })
        )
      );

      const result = await conversationsApi.list();
      expect(result).toHaveLength(1);
    });

    it('normalizes { data: [...] } wrapper', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/conversations`, () =>
          HttpResponse.json({ data: [mockConversation] })
        )
      );

      const result = await conversationsApi.list();
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('sends user IDs in the payload', async () => {
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(`${API_BASE}/api/v1/conversations`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ conversation: mockConversation });
        })
      );

      await conversationsApi.create(['user-1', 'user-2']);
      expect(capturedBody).toMatchObject({
        user_ids: ['user-1', 'user-2'],
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Messages API Tests
// ---------------------------------------------------------------------------

describe('messagesApi', () => {
  describe('list', () => {
    it('normalizes { messages: [...] } response', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/conversations/:convId/messages`, () =>
          HttpResponse.json({
            messages: [mockMessage],
            meta: { has_more: false },
          })
        )
      );

      const result = await messagesApi.list(mockConversation.id);
      expect(result.messages).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('detects hasMore from array length when meta is absent', async () => {
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        ...mockMessage,
        id: `msg-${i}`,
      }));

      server.use(
        http.get(`${API_BASE}/api/v1/conversations/:convId/messages`, () =>
          HttpResponse.json(manyMessages)
        )
      );

      const result = await messagesApi.list(mockConversation.id);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('send', () => {
    it('includes all optional fields in payload', async () => {
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(`${API_BASE}/api/v1/conversations/:convId/messages`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ message: mockMessage });
        })
      );

      await messagesApi.send(mockConversation.id, 'Hello', {
        replyToId: 'msg-parent',
        encryptedContent: 'encrypted-data',
      });

      expect(capturedBody).toMatchObject({
        content: 'Hello',
        reply_to_id: 'msg-parent',
        encrypted_content: 'encrypted-data',
      });
    });
  });

  describe('edit', () => {
    it('sends PATCH with new content', async () => {
      let method = '';
      server.use(
        http.patch(`${API_BASE}/api/v1/conversations/:convId/messages/:msgId`, ({ request }) => {
          method = request.method;
          return HttpResponse.json({ message: { ...mockMessage, content: 'updated' } });
        })
      );

      await messagesApi.edit(mockConversation.id, mockMessage.id, 'updated');
      expect(method).toBe('PATCH');
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      let called = false;
      server.use(
        http.delete(`${API_BASE}/api/v1/conversations/:convId/messages/:msgId`, () => {
          called = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await messagesApi.delete(mockConversation.id, mockMessage.id);
      expect(called).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Notifications API Tests
// ---------------------------------------------------------------------------

describe('notificationsApi', () => {
  describe('list', () => {
    it('normalizes { notifications: [...] } response', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/notifications`, () =>
          HttpResponse.json({
            notifications: [mockNotification],
            meta: { unread_count: 1 },
          })
        )
      );

      const result = await notificationsApi.list();
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
    });

    it('calculates unread count from data when meta is absent', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/notifications`, () =>
          HttpResponse.json([
            { ...mockNotification, is_read: false },
            { ...mockNotification, id: 'notif-2', is_read: true },
          ])
        )
      );

      const result = await notificationsApi.list();
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('sends POST to mark specific notification', async () => {
      let called = false;
      server.use(
        http.post(`${API_BASE}/api/v1/notifications/:id/read`, () => {
          called = true;
          return HttpResponse.json({});
        })
      );

      await notificationsApi.markAsRead('notif-1');
      expect(called).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('sends POST to mark all notifications', async () => {
      let called = false;
      server.use(
        http.post(`${API_BASE}/api/v1/notifications/read`, () => {
          called = true;
          return HttpResponse.json({});
        })
      );

      await notificationsApi.markAllAsRead();
      expect(called).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('sends DELETE to clear all notifications', async () => {
      let called = false;
      server.use(
        http.delete(`${API_BASE}/api/v1/notifications`, () => {
          called = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await notificationsApi.clearAll();
      expect(called).toBe(true);
    });
  });
});

/**
 * Validation / Zod Schema Tests
 *
 * Tests for auth, user, conversation, social, notification, and base schemas,
 * plus the validateResponse / validateWithFallback utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  dateTimeSchema,
  uuidSchema,
  emailSchema,
  paginationSchema,
  userStatusSchema,
  userRefSchema,
  userSchema,
  tokensSchema,
  loginResponseSchema,
  refreshResponseSchema,
  participantSchema,
  messageSchema,
  conversationSchema,
  friendRequestStatusSchema,
  friendSchema,
  groupRoleSchema,
  groupSchema,
  channelSchema,
  apiErrorSchema,
  notificationTypeSchema,
  notificationSchema,
  validateResponse,
  validateWithFallback,
} from '../index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const validUserRef = {
  id: validUuid,
  username: 'alice',
  display_name: 'Alice',
  avatar_url: null,
};

const validUser = {
  id: validUuid,
  email: 'alice@example.com',
  username: 'alice',
  display_name: 'Alice',
  avatar_url: null,
};

// ---------------------------------------------------------------------------
// Base Schemas
// ---------------------------------------------------------------------------

describe('dateTimeSchema', () => {
  it('accepts ISO 8601 datetime with offset', () => {
    expect(dateTimeSchema.safeParse('2026-01-15T10:30:00+00:00').success).toBe(true);
  });

  it('accepts datetime without offset via regex fallback', () => {
    expect(dateTimeSchema.safeParse('2026-01-15T10:30:00').success).toBe(true);
  });

  it('rejects plain date strings', () => {
    expect(dateTimeSchema.safeParse('2026-01-15').success).toBe(false);
  });
});

describe('uuidSchema', () => {
  it('accepts valid UUID v4', () => {
    expect(uuidSchema.safeParse(validUuid).success).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('accepts a valid pagination object', () => {
    const result = paginationSchema.safeParse({ page: 1, total: 100, has_more: true });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    expect(paginationSchema.safeParse({}).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// User Schemas
// ---------------------------------------------------------------------------

describe('userStatusSchema', () => {
  it('accepts valid statuses', () => {
    for (const s of ['online', 'idle', 'dnd', 'offline']) {
      expect(userStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it('rejects unknown status', () => {
    expect(userStatusSchema.safeParse('invisible').success).toBe(false);
  });
});

describe('userRefSchema', () => {
  it('accepts a valid user ref', () => {
    expect(userRefSchema.safeParse(validUserRef).success).toBe(true);
  });

  it('rejects user ref with invalid uuid', () => {
    expect(userRefSchema.safeParse({ ...validUserRef, id: 'bad' }).success).toBe(false);
  });
});

describe('userSchema', () => {
  it('accepts a full user object', () => {
    expect(userSchema.safeParse(validUser).success).toBe(true);
  });

  it('accepts user with optional gamification fields', () => {
    const user = { ...validUser, level: 5, xp: 1200, coins: 300, badges: ['early_adopter'] };
    expect(userSchema.safeParse(user).success).toBe(true);
  });

  it('rejects user without email', () => {
    const { email: _, ...noEmail } = validUser;
    expect(userSchema.safeParse(noEmail).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Auth Schemas
// ---------------------------------------------------------------------------

describe('tokensSchema', () => {
  it('accepts valid tokens', () => {
    const tokens = { access_token: 'abc', refresh_token: 'def' };
    expect(tokensSchema.safeParse(tokens).success).toBe(true);
  });

  it('rejects missing access_token', () => {
    expect(tokensSchema.safeParse({ refresh_token: 'x' }).success).toBe(false);
  });
});

describe('loginResponseSchema', () => {
  it('accepts user + tokens', () => {
    const loginResp = {
      user: validUser,
      tokens: { access_token: 'a', refresh_token: 'r' },
    };
    expect(loginResponseSchema.safeParse(loginResp).success).toBe(true);
  });
});

describe('refreshResponseSchema', () => {
  it('accepts wrapped tokens', () => {
    const data = { tokens: { access_token: 'a', refresh_token: 'r' } };
    expect(refreshResponseSchema.safeParse(data).success).toBe(true);
  });

  it('accepts direct tokens object', () => {
    const data = { access_token: 'a', refresh_token: 'r' };
    expect(refreshResponseSchema.safeParse(data).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Conversation Schemas
// ---------------------------------------------------------------------------

describe('participantSchema', () => {
  it('accepts valid participant', () => {
    const p = { id: validUuid, user_id: validUuid };
    expect(participantSchema.safeParse(p).success).toBe(true);
  });
});

describe('messageSchema', () => {
  it('accepts a minimal valid message', () => {
    const msg = {
      id: validUuid,
      conversation_id: validUuid,
      sender_id: validUuid,
      content: 'Hello',
    };
    expect(messageSchema.safeParse(msg).success).toBe(true);
  });

  it('rejects message without conversation_id', () => {
    const msg = { id: validUuid, sender_id: validUuid, content: 'Hi' };
    expect(messageSchema.safeParse(msg).success).toBe(false);
  });
});

describe('conversationSchema', () => {
  it('accepts a valid conversation', () => {
    const conv = { id: validUuid, type: 'direct' };
    expect(conversationSchema.safeParse(conv).success).toBe(true);
  });

  it('rejects invalid conversation type', () => {
    expect(conversationSchema.safeParse({ id: validUuid, type: 'unknown' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Social Schemas
// ---------------------------------------------------------------------------

describe('friendRequestStatusSchema', () => {
  it('accepts valid statuses', () => {
    for (const s of ['pending', 'accepted', 'rejected', 'blocked']) {
      expect(friendRequestStatusSchema.safeParse(s).success).toBe(true);
    }
  });
});

describe('friendSchema', () => {
  it('accepts valid friend', () => {
    const f = {
      id: validUuid,
      user_id: validUuid,
      friend_id: validUuid,
      status: 'accepted',
    };
    expect(friendSchema.safeParse(f).success).toBe(true);
  });
});

describe('groupRoleSchema', () => {
  it('accepts valid roles', () => {
    for (const r of ['owner', 'admin', 'moderator', 'member']) {
      expect(groupRoleSchema.safeParse(r).success).toBe(true);
    }
  });
});

describe('groupSchema', () => {
  it('accepts valid group', () => {
    const g = { id: validUuid, name: 'Test Group' };
    expect(groupSchema.safeParse(g).success).toBe(true);
  });

  it('rejects group without name', () => {
    expect(groupSchema.safeParse({ id: validUuid }).success).toBe(false);
  });
});

describe('channelSchema', () => {
  it('accepts valid channel', () => {
    const c = { id: validUuid, group_id: validUuid, name: 'general' };
    expect(channelSchema.safeParse(c).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Notification Schemas
// ---------------------------------------------------------------------------

describe('notificationTypeSchema', () => {
  it('accepts valid notification types', () => {
    for (const t of [
      'message',
      'friend_request',
      'group_invite',
      'mention',
      'forum_reply',
      'system',
    ]) {
      expect(notificationTypeSchema.safeParse(t).success).toBe(true);
    }
  });

  it('rejects unknown types', () => {
    expect(notificationTypeSchema.safeParse('sms').success).toBe(false);
  });
});

describe('notificationSchema', () => {
  it('accepts valid notification', () => {
    const n = {
      id: validUuid,
      type: 'message',
      title: 'New message',
      body: 'You have a new message',
      is_read: false,
    };
    expect(notificationSchema.safeParse(n).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API Error Schema
// ---------------------------------------------------------------------------

describe('apiErrorSchema', () => {
  it('accepts error with message', () => {
    expect(apiErrorSchema.safeParse({ error: 'Not found', status: 404 }).success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    expect(apiErrorSchema.safeParse({}).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation Utilities
// ---------------------------------------------------------------------------

describe('validateResponse', () => {
  it('returns success for valid data', () => {
    const result = validateResponse(emailSchema, 'test@example.com');
    expect(result.success).toBe(true);
    expect(result.data).toBe('test@example.com');
  });

  it('returns failure with error for invalid data', () => {
    const result = validateResponse(emailSchema, 'not-an-email');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateWithFallback', () => {
  it('returns parsed data on success', () => {
    const result = validateWithFallback(uuidSchema, validUuid);
    expect(result).toBe(validUuid);
  });

  it('returns raw data as fallback on failure', () => {
    const raw = 'not-a-uuid';
    const result = validateWithFallback(uuidSchema, raw);
    // Falls back to raw data
    expect(result).toBe(raw);
  });
});

/**
 * API Utils Tests
 *
 * Tests for normalizers, type guards, response extractors, and accessors.
 */

import { describe, it, expect } from 'vitest';
import {
  ensureArray,
  ensureObject,
  extractPagination,
  extractErrorMessage,
  isNonEmptyString,
  isValidId,
  getParticipantUserId,
  getParticipantDisplayName,
  getParticipantAvatarUrl,
  getMessageSenderId,
  resolveMediaUrl,
  normalizeMessage,
  normalizeConversation,
  normalizeConversations,
} from '../index';

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

describe('isNonEmptyString', () => {
  it('returns true for a non-empty string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('returns false for empty / whitespace-only strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(42)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });
});

describe('isValidId', () => {
  it('accepts non-empty string IDs', () => {
    expect(isValidId('abc-123')).toBe(true);
  });

  it('accepts numeric IDs', () => {
    expect(isValidId(1)).toBe(true);
  });

  it('rejects NaN', () => {
    expect(isValidId(NaN)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidId('')).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(isValidId(null)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Response Extractors — ensureArray
// ---------------------------------------------------------------------------

describe('ensureArray', () => {
  it('returns empty array for null/undefined', () => {
    expect(ensureArray(null)).toEqual([]);
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('returns direct array as-is', () => {
    expect(ensureArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('unwraps array from specified key', () => {
    expect(ensureArray({ friends: [1, 2] }, 'friends')).toEqual([1, 2]);
  });

  it('falls back to common keys (data, items, results)', () => {
    expect(ensureArray({ data: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(ensureArray({ items: [1] })).toEqual([1]);
    expect(ensureArray({ results: [true] })).toEqual([true]);
  });

  it('returns empty array when no array found', () => {
    expect(ensureArray({ foo: 'bar' })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Response Extractors — ensureObject
// ---------------------------------------------------------------------------

describe('ensureObject', () => {
  it('returns null for null/undefined', () => {
    expect(ensureObject(null)).toBeNull();
    expect(ensureObject(undefined)).toBeNull();
  });

  it('unwraps from specified key', () => {
    const input = { user: { id: '1', name: 'Alice' } };
    expect(ensureObject(input, 'user')).toEqual({ id: '1', name: 'Alice' });
  });

  it('unwraps from "data" key', () => {
    const input = { data: { id: '2' } };
    expect(ensureObject(input)).toEqual({ id: '2' });
  });

  it('returns direct object when it has own properties', () => {
    const obj = { id: '3', email: 'a@b.com' };
    expect(ensureObject(obj)).toEqual(obj);
  });
});

// ---------------------------------------------------------------------------
// Response Extractors — extractPagination
// ---------------------------------------------------------------------------

describe('extractPagination', () => {
  it('returns defaults for null', () => {
    const p = extractPagination(null);
    expect(p).toEqual({ page: 1, perPage: 20, total: 0, totalPages: 1, hasMore: false });
  });

  it('extracts pagination from meta key', () => {
    const p = extractPagination({ meta: { page: 2, total: 50, has_more: true } });
    expect(p.page).toBe(2);
    expect(p.total).toBe(50);
    expect(p.hasMore).toBe(true);
  });

  it('handles snake_case per_page', () => {
    const p = extractPagination({ per_page: 10 });
    expect(p.perPage).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Response Extractors — extractErrorMessage
// ---------------------------------------------------------------------------

describe('extractErrorMessage', () => {
  it('returns default message for null', () => {
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('returns string error directly', () => {
    expect(extractErrorMessage('Something failed')).toBe('Something failed');
  });

  it('extracts from axios-style response.data.error', () => {
    const axiosError = {
      response: { data: { error: 'Unauthorized' } },
    };
    expect(extractErrorMessage(axiosError)).toBe('Unauthorized');
  });

  it('extracts from nested error.message object', () => {
    const axiosError = {
      response: { data: { error: { message: 'Token expired' } } },
    };
    expect(extractErrorMessage(axiosError)).toBe('Token expired');
  });

  it('falls back to message property', () => {
    expect(extractErrorMessage({ message: 'Network error' })).toBe('Network error');
  });

  it('uses custom default when provided', () => {
    expect(extractErrorMessage(null, 'Custom default')).toBe('Custom default');
  });
});

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

describe('getParticipantUserId', () => {
  it('returns null for null input', () => {
    expect(getParticipantUserId(null)).toBeNull();
  });

  it('extracts userId (camelCase)', () => {
    expect(getParticipantUserId({ userId: 'u1' })).toBe('u1');
  });

  it('extracts user_id (snake_case)', () => {
    expect(getParticipantUserId({ user_id: 'u2' })).toBe('u2');
  });

  it('extracts from nested user object', () => {
    expect(getParticipantUserId({ user: { id: 'u3' } })).toBe('u3');
  });
});

describe('getParticipantDisplayName', () => {
  it('returns "Unknown" for null', () => {
    expect(getParticipantDisplayName(null)).toBe('Unknown');
  });

  it('prefers nickname over username', () => {
    expect(getParticipantDisplayName({ nickname: 'Nick', username: 'user1' })).toBe('Nick');
  });

  it('falls back to user.username', () => {
    expect(getParticipantDisplayName({ user: { username: 'fallback' } })).toBe('fallback');
  });
});

describe('getParticipantAvatarUrl', () => {
  it('returns null for null input', () => {
    expect(getParticipantAvatarUrl(null)).toBeNull();
  });

  it('extracts from nested user.avatarUrl', () => {
    expect(getParticipantAvatarUrl({ user: { avatarUrl: 'http://img.png' } })).toBe(
      'http://img.png'
    );
  });
});

describe('getMessageSenderId', () => {
  it('returns null for null input', () => {
    expect(getMessageSenderId(null)).toBeNull();
  });

  it('extracts senderId', () => {
    expect(getMessageSenderId({ senderId: 's1' })).toBe('s1');
  });

  it('extracts sender.id', () => {
    expect(getMessageSenderId({ sender: { id: 's2' } })).toBe('s2');
  });
});

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

describe('resolveMediaUrl', () => {
  it('returns undefined for falsy input', () => {
    expect(resolveMediaUrl(null)).toBeUndefined();
    expect(resolveMediaUrl(undefined)).toBeUndefined();
    expect(resolveMediaUrl('')).toBeUndefined();
  });

  it('passes absolute URLs through unchanged', () => {
    expect(resolveMediaUrl('https://cdn.example.com/img.png')).toBe(
      'https://cdn.example.com/img.png'
    );
  });

  it('passes data URLs through unchanged', () => {
    expect(resolveMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('prefixes relative paths with API base URL', () => {
    const result = resolveMediaUrl('/uploads/avatar.png');
    expect(result).toContain('/uploads/avatar.png');
    expect(result).toMatch(/^https?:\/\//);
  });
});

describe('normalizeMessage', () => {
  it('normalizes snake_case fields to camelCase', () => {
    const raw = {
      id: 'msg-1',
      sender_id: 'u-1',
      conversation_id: 'c-1',
      content: 'hello',
      content_type: 'text',
      is_edited: true,
      is_pinned: false,
      created_at: '2026-01-01T00:00:00Z',
    };
    const msg = normalizeMessage(raw);
    expect(msg.senderId).toBe('u-1');
    expect(msg.conversationId).toBe('c-1');
    expect(msg.contentType).toBe('text');
    expect(msg.isEdited).toBe(true);
  });

  it('handles already camelCase input', () => {
    const raw = {
      id: 'msg-2',
      senderId: 'u-2',
      conversationId: 'c-2',
      content: 'hi',
      contentType: 'text',
    };
    const msg = normalizeMessage(raw);
    expect(msg.senderId).toBe('u-2');
  });

  it('defaults content to empty string', () => {
    const msg = normalizeMessage({ id: 'msg-3' });
    expect(msg.content).toBe('');
  });
});

describe('normalizeConversation', () => {
  it('normalizes a conversation with participants', () => {
    const raw = {
      id: 'conv-1',
      type: 'direct',
      participants: [{ id: 'p1', user_id: 'u1', user: { id: 'u1', username: 'alice' } }],
      last_message: { id: 'm1', content: 'hi', sender_id: 'u1', conversation_id: 'conv-1' },
      unread_count: 3,
    };
    const conv = normalizeConversation(raw);
    expect(conv.id).toBe('conv-1');
    expect(conv.unreadCount).toBe(3);
    expect(Array.isArray(conv.participants)).toBe(true);
    expect(conv.lastMessage).toBeTruthy();
  });

  it('returns empty participants for missing array', () => {
    const conv = normalizeConversation({ id: 'conv-2' });
    expect(conv.participants).toEqual([]);
  });
});

describe('normalizeConversations', () => {
  it('returns empty array for non-array input', () => {
    expect(normalizeConversations('bad' as unknown as unknown[])).toEqual([]);
  });

  it('normalizes each conversation in the array', () => {
    const result = normalizeConversations([{ id: 'c1' }, { id: 'c2' }]);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('c1');
  });
});

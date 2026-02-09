// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────

const { mockRemoveReaction, mockAddReaction } = vi.hoisted(() => ({
  mockRemoveReaction: vi.fn().mockResolvedValue(undefined),
  mockAddReaction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ user: { id: 'me' } }),
  },
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: {
    getState: vi.fn().mockReturnValue({
      removeReaction: mockRemoveReaction,
      addReaction: mockAddReaction,
      activeConversationId: null,
    }),
  },
}));

import {
  formatDateHeader,
  formatLastSeen,
  parseMessageDate,
  groupMessagesByDate,
} from '../messageUtils';
import {
  aggregateReactions,
  aggregateReactionsSimple,
  handleRemoveReaction,
  handleAddReaction,
  toggleReaction,
  type RawReaction,
} from '../reactionUtils';

// ═════════════════════════════════════════════════════════════════════
// messageUtils
// ═════════════════════════════════════════════════════════════════════

describe('messageUtils', () => {
  // ── formatDateHeader ─────────────────────────────────────────────

  describe('formatDateHeader', () => {
    it('returns "Today" for today\'s date', () => {
      expect(formatDateHeader(new Date())).toBe('Today');
    });

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDateHeader(yesterday)).toBe('Yesterday');
    });

    it('returns formatted date for older dates', () => {
      const old = new Date('2024-01-15');
      expect(formatDateHeader(old)).toBe('January 15, 2024');
    });

    it('returns "Unknown" for invalid date', () => {
      expect(formatDateHeader(new Date('invalid'))).toBe('Unknown');
    });

    it('returns "Unknown" for null-ish date cast', () => {
      expect(formatDateHeader(null as unknown as Date)).toBe('Unknown');
    });
  });

  // ── formatLastSeen ──────────────────────────────────────────────

  describe('formatLastSeen', () => {
    it('returns "Offline" for null', () => {
      expect(formatLastSeen(null)).toBe('Offline');
    });

    it('returns "Offline" for undefined', () => {
      expect(formatLastSeen(undefined)).toBe('Offline');
    });

    it('returns "Offline" for invalid date string', () => {
      expect(formatLastSeen('not-a-date')).toBe('Offline');
    });

    it('returns "Last seen just now" for < 1 min ago', () => {
      const now = new Date().toISOString();
      expect(formatLastSeen(now)).toBe('Last seen just now');
    });

    it('returns minutes ago for < 60 min', () => {
      const d = new Date(Date.now() - 5 * 60_000).toISOString();
      expect(formatLastSeen(d)).toMatch(/Last seen 5m ago/);
    });

    it('returns hours ago for < 24 hours', () => {
      const d = new Date(Date.now() - 3 * 3600_000).toISOString();
      expect(formatLastSeen(d)).toMatch(/Last seen 3h ago/);
    });

    it('returns "Last seen yesterday" for 1 day', () => {
      const d = new Date(Date.now() - 86400_000).toISOString();
      expect(formatLastSeen(d)).toBe('Last seen yesterday');
    });

    it('returns days ago for 2-6 days', () => {
      const d = new Date(Date.now() - 3 * 86400_000).toISOString();
      expect(formatLastSeen(d)).toMatch(/Last seen 3d ago/);
    });

    it('returns formatted date for 7+ days', () => {
      const d = new Date(Date.now() - 10 * 86400_000).toISOString();
      expect(formatLastSeen(d)).toMatch(/Last seen/);
    });
  });

  // ── parseMessageDate ────────────────────────────────────────────

  describe('parseMessageDate', () => {
    it('parses a valid ISO string', () => {
      const d = parseMessageDate('2025-06-15T12:00:00Z');
      expect(d.getFullYear()).toBe(2025);
    });

    it('returns current date for null', () => {
      const before = Date.now();
      const d = parseMessageDate(null);
      expect(d.getTime()).toBeGreaterThanOrEqual(before - 10);
    });

    it('returns current date for undefined', () => {
      const d = parseMessageDate(undefined);
      expect(d).toBeInstanceOf(Date);
    });

    it('returns current date for invalid string', () => {
      const d = parseMessageDate('garbage');
      expect(d.getTime()).toBeLessThanOrEqual(Date.now() + 100);
    });
  });

  // ── groupMessagesByDate ─────────────────────────────────────────

  describe('groupMessagesByDate', () => {
    const makeMsg = (id: string, date: string) =>
      ({ id, createdAt: date }) as { id: string; createdAt: string };

    it('returns empty array for empty input', () => {
      expect(groupMessagesByDate([])).toEqual([]);
    });

    it('groups same-day messages together', () => {
      const msgs = [makeMsg('1', '2025-03-01T10:00:00Z'), makeMsg('2', '2025-03-01T14:00:00Z')];
      const groups = groupMessagesByDate(msgs as any);
      expect(groups).toHaveLength(1);
      expect(groups[0].messages).toHaveLength(2);
    });

    it('creates separate groups for different days', () => {
      const msgs = [makeMsg('1', '2025-03-01T10:00:00Z'), makeMsg('2', '2025-03-02T10:00:00Z')];
      const groups = groupMessagesByDate(msgs as any);
      expect(groups).toHaveLength(2);
    });

    it('handles a single message', () => {
      const groups = groupMessagesByDate([makeMsg('1', '2025-03-01T10:00:00Z')] as any);
      expect(groups).toHaveLength(1);
      expect(groups[0].messages).toHaveLength(1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
// reactionUtils
// ═════════════════════════════════════════════════════════════════════

describe('reactionUtils', () => {
  const reaction = (emoji: string, userId: string, username = 'user'): RawReaction => ({
    id: `r-${emoji}-${userId}`,
    emoji,
    userId,
    user: { id: userId, username },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── aggregateReactions ──────────────────────────────────────────

  describe('aggregateReactions', () => {
    it('returns empty array for undefined input', () => {
      expect(aggregateReactions(undefined)).toEqual([]);
    });

    it('returns empty array for empty array', () => {
      expect(aggregateReactions([])).toEqual([]);
    });

    it('groups reactions by emoji', () => {
      const reactions = [reaction('👍', 'u1'), reaction('👍', 'u2'), reaction('❤️', 'u3')];
      const result = aggregateReactions(reactions, 'me');
      expect(result).toHaveLength(2);
      const thumbs = result.find((r) => r.emoji === '👍');
      expect(thumbs?.count).toBe(2);
    });

    it('sets hasReacted true when user reacted', () => {
      const reactions = [reaction('👍', 'me')];
      const result = aggregateReactions(reactions, 'me');
      expect(result[0].hasReacted).toBe(true);
    });

    it('sets hasReacted false when user has not reacted', () => {
      const reactions = [reaction('👍', 'other')];
      const result = aggregateReactions(reactions, 'me');
      expect(result[0].hasReacted).toBe(false);
    });

    it('collects user list per emoji', () => {
      const reactions = [reaction('🔥', 'u1', 'Alice'), reaction('🔥', 'u2', 'Bob')];
      const result = aggregateReactions(reactions, 'me');
      expect(result[0].users).toHaveLength(2);
      expect(result[0].users[0].username).toBe('Alice');
    });

    it('skips reactions with missing emoji', () => {
      const bad = { id: 'r1', emoji: '', userId: 'u1', user: { id: 'u1', username: 'x' } };
      const result = aggregateReactions([bad as RawReaction], 'me');
      expect(result).toEqual([]);
    });

    it('handles missing user data gracefully', () => {
      const noUser = { id: 'r1', emoji: '👍', userId: 'u1', user: undefined } as any;
      const result = aggregateReactions([noUser], 'me');
      expect(result).toHaveLength(1);
      // Falls back to userId when user object is missing
      expect(result[0].users[0].username).toBe('Unknown User');
    });
  });

  // ── aggregateReactionsSimple ────────────────────────────────────

  describe('aggregateReactionsSimple', () => {
    it('returns empty object for undefined', () => {
      expect(aggregateReactionsSimple(undefined)).toEqual({});
    });

    it('returns empty object for empty array', () => {
      expect(aggregateReactionsSimple([])).toEqual({});
    });

    it('counts reactions per emoji', () => {
      const reactions = [reaction('👍', 'u1'), reaction('👍', 'u2')];
      const result = aggregateReactionsSimple(reactions, 'me');
      expect(result['👍'].count).toBe(2);
    });

    it('marks hasReacted correctly', () => {
      const reactions = [reaction('👍', 'me')];
      const result = aggregateReactionsSimple(reactions, 'me');
      expect(result['👍'].hasReacted).toBe(true);
    });

    it('hasReacted is false when someone else reacted', () => {
      const reactions = [reaction('👍', 'other')];
      const result = aggregateReactionsSimple(reactions, 'me');
      expect(result['👍'].hasReacted).toBe(false);
    });
  });

  // ── handleRemoveReaction ────────────────────────────────────────

  describe('handleRemoveReaction', () => {
    it('calls store removeReaction', async () => {
      await handleRemoveReaction('msg-1', '👍');
      expect(mockRemoveReaction).toHaveBeenCalledWith('msg-1', '👍');
    });

    it('does not throw on store error', async () => {
      mockRemoveReaction.mockRejectedValueOnce(new Error('fail'));
      await expect(handleRemoveReaction('msg-1', '👍')).resolves.toBeUndefined();
    });
  });

  // ── handleAddReaction ───────────────────────────────────────────

  describe('handleAddReaction', () => {
    it('calls store addReaction', async () => {
      await handleAddReaction('msg-1', '❤️');
      expect(mockAddReaction).toHaveBeenCalledWith('msg-1', '❤️');
    });

    it('does not throw on store error', async () => {
      mockAddReaction.mockRejectedValueOnce(new Error('fail'));
      await expect(handleAddReaction('msg-1', '❤️')).resolves.toBeUndefined();
    });
  });

  // ── toggleReaction ──────────────────────────────────────────────

  describe('toggleReaction', () => {
    it('removes when hasReacted is true', async () => {
      await toggleReaction('msg-1', '👍', true);
      expect(mockRemoveReaction).toHaveBeenCalledWith('msg-1', '👍');
      expect(mockAddReaction).not.toHaveBeenCalled();
    });

    it('adds when hasReacted is false', async () => {
      await toggleReaction('msg-1', '👍', false);
      expect(mockAddReaction).toHaveBeenCalledWith('msg-1', '👍');
      expect(mockRemoveReaction).not.toHaveBeenCalled();
    });
  });
});

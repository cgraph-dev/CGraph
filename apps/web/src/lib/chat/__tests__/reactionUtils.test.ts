import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────

const { mockRemoveReaction, mockAddReaction } = vi.hoisted(() => ({
  mockRemoveReaction: vi.fn().mockResolvedValue(undefined),
  mockAddReaction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ user: { id: 'currentUser' } }),
  },
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: {
    getState: vi.fn().mockReturnValue({
      removeReaction: mockRemoveReaction,
      addReaction: mockAddReaction,
    }),
  },
}));

import {
  aggregateReactions,
  aggregateReactionsSimple,
  handleRemoveReaction,
  handleAddReaction,
  toggleReaction,
  type RawReaction,
} from '../reactionUtils';

// ═══════════════════════════════════════════════════════════════════
// aggregateReactions
// ═══════════════════════════════════════════════════════════════════

describe('aggregateReactions', () => {
  const makeReaction = (emoji: string, userId: string, username = 'user'): RawReaction => ({
    id: `r-${emoji}-${userId}`,
    emoji,
    userId,
    user: { id: userId, username },
  });

  it('returns empty array for undefined', () => {
    expect(aggregateReactions(undefined)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(aggregateReactions([])).toEqual([]);
  });

  it('aggregates single reaction', () => {
    const reactions = [makeReaction('👍', 'user1')];
    const result = aggregateReactions(reactions, 'me');
    expect(result).toHaveLength(1);
    expect(result[0].emoji).toBe('👍');
    expect(result[0].count).toBe(1);
  });

  it('groups same emoji from different users', () => {
    const reactions = [
      makeReaction('👍', 'user1'),
      makeReaction('👍', 'user2'),
      makeReaction('👍', 'user3'),
    ];
    const result = aggregateReactions(reactions, 'me');
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
    expect(result[0].users).toHaveLength(3);
  });

  it('separates different emojis', () => {
    const reactions = [makeReaction('👍', 'user1'), makeReaction('❤️', 'user2')];
    const result = aggregateReactions(reactions, 'me');
    expect(result).toHaveLength(2);
  });

  it('sets hasReacted=true when currentUser reacted', () => {
    const reactions = [makeReaction('👍', 'currentUser')];
    const result = aggregateReactions(reactions, 'currentUser');
    expect(result[0].hasReacted).toBe(true);
  });

  it('sets hasReacted=false when currentUser has not reacted', () => {
    const reactions = [makeReaction('👍', 'other')];
    const result = aggregateReactions(reactions, 'me');
    expect(result[0].hasReacted).toBe(false);
  });

  it('skips reactions with missing emoji', () => {
    const reactions = [{ id: 'r1', emoji: '', userId: 'u1', user: { id: 'u1', username: 'u' } }];
    const result = aggregateReactions(reactions as RawReaction[], 'me');
    expect(result).toHaveLength(0);
  });

  it('handles reactions with missing user object', () => {
    const reactions = [
      { id: 'r1', emoji: '🔥', userId: 'u1', user: undefined } as unknown as RawReaction,
    ];
    const result = aggregateReactions(reactions, 'me');
    expect(result).toHaveLength(1);
    expect(result[0].users[0].id).toBe('u1');
  });

  it('handles null currentUserId — falls back to auth store', () => {
    const reactions = [makeReaction('👍', 'currentUser')];
    const result = aggregateReactions(reactions); // no userId passed
    expect(result[0].hasReacted).toBe(true); // store returns user.id = 'currentUser'
  });

  it('tracks multiple users per emoji', () => {
    const reactions = [makeReaction('👍', 'a', 'Alice'), makeReaction('👍', 'b', 'Bob')];
    const result = aggregateReactions(reactions, 'x');
    expect(result[0].users).toEqual([
      { id: 'a', username: 'Alice' },
      { id: 'b', username: 'Bob' },
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// aggregateReactionsSimple
// ═══════════════════════════════════════════════════════════════════

describe('aggregateReactionsSimple', () => {
  const makeReaction = (emoji: string, userId: string): RawReaction => ({
    id: `r-${emoji}-${userId}`,
    emoji,
    userId,
    user: { id: userId, username: userId },
  });

  it('returns empty object for undefined', () => {
    expect(aggregateReactionsSimple(undefined)).toEqual({});
  });

  it('returns empty object for empty array', () => {
    expect(aggregateReactionsSimple([])).toEqual({});
  });

  it('counts single reaction', () => {
    const result = aggregateReactionsSimple([makeReaction('👍', 'u1')], 'u1');
    expect(result['👍'].count).toBe(1);
    expect(result['👍'].hasReacted).toBe(true);
  });

  it('counts multiple same emoji', () => {
    const reactions = [makeReaction('❤️', 'u1'), makeReaction('❤️', 'u2')];
    const result = aggregateReactionsSimple(reactions, 'u1');
    expect(result['❤️'].count).toBe(2);
    expect(result['❤️'].hasReacted).toBe(true);
  });

  it('hasReacted is false when user did not react', () => {
    const result = aggregateReactionsSimple([makeReaction('👍', 'u1')], 'u2');
    expect(result['👍'].hasReacted).toBe(false);
  });

  it('handles multiple different emojis', () => {
    const reactions = [makeReaction('👍', 'u1'), makeReaction('❤️', 'u1')];
    const result = aggregateReactionsSimple(reactions, 'u1');
    expect(Object.keys(result)).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// handleRemoveReaction / handleAddReaction / toggleReaction
// ═══════════════════════════════════════════════════════════════════

describe('handleRemoveReaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls removeReaction on the chat store', async () => {
    await handleRemoveReaction('msg1', '👍');
    expect(mockRemoveReaction).toHaveBeenCalledWith('msg1', '👍');
  });

  it('does not throw on store error', async () => {
    mockRemoveReaction.mockRejectedValueOnce(new Error('fail'));
    await expect(handleRemoveReaction('msg1', '👍')).resolves.toBeUndefined();
  });
});

describe('handleAddReaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls addReaction on the chat store', async () => {
    await handleAddReaction('msg2', '❤️');
    expect(mockAddReaction).toHaveBeenCalledWith('msg2', '❤️');
  });

  it('does not throw on store error', async () => {
    mockAddReaction.mockRejectedValueOnce(new Error('fail'));
    await expect(handleAddReaction('msg2', '❤️')).resolves.toBeUndefined();
  });
});

describe('toggleReaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes reaction when hasReacted is true', async () => {
    await toggleReaction('msg1', '👍', true);
    expect(mockRemoveReaction).toHaveBeenCalledWith('msg1', '👍');
    expect(mockAddReaction).not.toHaveBeenCalled();
  });

  it('adds reaction when hasReacted is false', async () => {
    await toggleReaction('msg1', '👍', false);
    expect(mockAddReaction).toHaveBeenCalledWith('msg1', '👍');
    expect(mockRemoveReaction).not.toHaveBeenCalled();
  });
});

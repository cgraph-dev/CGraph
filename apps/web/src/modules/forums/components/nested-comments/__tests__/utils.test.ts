import { describe, it, expect } from 'vitest';
import { sortComments, getTopLevelComments } from '../utils';

const makeComment = (
  overrides: Partial<{
    id: string;
    parentId: string | null;
    score: number;
    createdAt: string;
    isBestAnswer: boolean;
  }> = {}
) => ({
  id: overrides.id ?? '1',
  parentId: overrides.parentId ?? null,
  score: overrides.score ?? 0,
  createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
  isBestAnswer: overrides.isBestAnswer ?? false,
  content: 'test',
  authorId: 'user-1',
  author: { id: 'user-1', username: 'test', displayName: 'Test' },
  reactions: [],
  children: [],
  depth: 0,
  isCollapsed: false,
  isDeleted: false,
  updatedAt: '2025-01-01T00:00:00Z',
});

describe('sortComments', () => {
  it('sorts by "best" - best answers first, then score, then newest', () => {
    const comments = [
      makeComment({ id: '1', score: 5 }),
      makeComment({ id: '2', score: 10, isBestAnswer: true }),
      makeComment({ id: '3', score: 20 }),
    ];
    const sorted = sortComments(comments as never[], 'best');
    expect(sorted[0].id).toBe('2'); // best answer first
    expect(sorted[1].id).toBe('3'); // highest score
    expect(sorted[2].id).toBe('1'); // lowest score
  });

  it('sorts by "new" - newest first', () => {
    const comments = [
      makeComment({ id: '1', createdAt: '2025-01-01T00:00:00Z' }),
      makeComment({ id: '2', createdAt: '2025-06-15T00:00:00Z' }),
      makeComment({ id: '3', createdAt: '2025-03-01T00:00:00Z' }),
    ];
    const sorted = sortComments(comments as never[], 'new');
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  it('sorts by "old" - oldest first', () => {
    const comments = [
      makeComment({ id: '1', createdAt: '2025-06-15T00:00:00Z' }),
      makeComment({ id: '2', createdAt: '2025-01-01T00:00:00Z' }),
    ];
    const sorted = sortComments(comments as never[], 'old');
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
  });

  it('sorts by "controversial"', () => {
    const comments = [makeComment({ id: '1', score: 100 }), makeComment({ id: '2', score: 1 })];
    const sorted = sortComments(comments as never[], 'controversial');
    expect(sorted.length).toBe(2);
  });

  it('returns copy without mutation', () => {
    const comments = [makeComment({ id: '1', score: 5 }), makeComment({ id: '2', score: 10 })];
    const sorted = sortComments(comments as never[], 'new');
    expect(sorted).not.toBe(comments);
  });
});

describe('getTopLevelComments', () => {
  it('returns only comments without parentId', () => {
    const comments = [
      makeComment({ id: '1', parentId: null }),
      makeComment({ id: '2', parentId: '1' }),
      makeComment({ id: '3', parentId: null }),
    ];
    const topLevel = getTopLevelComments(comments as never[]);
    expect(topLevel).toHaveLength(2);
    expect(topLevel.map((c) => c.id)).toEqual(['1', '3']);
  });

  it('returns empty array for all-child comments', () => {
    const comments = [
      makeComment({ id: '1', parentId: 'root' }),
      makeComment({ id: '2', parentId: 'root' }),
    ];
    const topLevel = getTopLevelComments(comments as never[]);
    expect(topLevel).toHaveLength(0);
  });
});

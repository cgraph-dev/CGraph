import { describe, it, expect } from 'vitest';
import { buildCommentTree, countDescendants } from '../utils';

const makeComment = (id: string, parentId: string | null, score = 0, isBestAnswer = false) => ({
  id,
  parentId,
  score,
  isBestAnswer,
  content: `Comment ${id}`,
  authorId: 'user-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  reactions: [],
  isDeleted: false,
});

describe('buildCommentTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('creates a flat list for all top-level comments', () => {
    const comments = [makeComment('1', null), makeComment('2', null), makeComment('3', null)];
    const tree = buildCommentTree(comments as never[]);
    expect(tree).toHaveLength(3);
    tree.forEach((node) => {
      expect(node.children).toHaveLength(0);
    });
  });

  it('nests child comments under parents', () => {
    const comments = [makeComment('1', null), makeComment('2', '1'), makeComment('3', '1')];
    const tree = buildCommentTree(comments as never[]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
  });

  it('handles deep nesting', () => {
    const comments = [makeComment('1', null), makeComment('2', '1'), makeComment('3', '2')];
    const tree = buildCommentTree(comments as never[]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].children).toHaveLength(1);
  });

  it('sorts by best answer first, then score', () => {
    const comments = [
      makeComment('1', null, 5, false),
      makeComment('2', null, 10, false),
      makeComment('3', null, 3, true),
    ];
    const tree = buildCommentTree(comments as never[]);
    expect(tree[0].id).toBe('3'); // best answer
    expect(tree[1].id).toBe('2'); // highest score
    expect(tree[2].id).toBe('1'); // lowest score
  });

  it('treats comments with missing parent as top-level', () => {
    const comments = [makeComment('1', 'missing-parent'), makeComment('2', null)];
    const tree = buildCommentTree(comments as never[]);
    expect(tree).toHaveLength(2);
  });
});

describe('countDescendants', () => {
  it('returns 0 for leaf node', () => {
    const node = { children: [] };
    expect(countDescendants(node as never)).toBe(0);
  });

  it('counts direct children', () => {
    const node = {
      children: [{ children: [] }, { children: [] }],
    };
    expect(countDescendants(node as never)).toBe(2);
  });

  it('counts nested descendants', () => {
    const node = {
      children: [
        {
          children: [{ children: [] }, { children: [{ children: [] }] }],
        },
      ],
    };
    // 1 + 2 + 1 = 4
    expect(countDescendants(node as never)).toBe(4);
  });
});

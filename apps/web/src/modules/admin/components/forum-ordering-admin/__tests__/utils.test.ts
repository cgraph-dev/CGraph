import { describe, it, expect } from 'vitest';
import { updateDisplayOrders, moveItem } from '../utils';
import type { ForumItem } from '../types';

function makeItem(id: string, order: number, children?: ForumItem[]): ForumItem {
  return { id, name: `Item ${id}`, display_order: order, type: 'forum', children };
}

describe('forum-ordering-admin/utils', () => {
  describe('updateDisplayOrders', () => {
    it('assigns sequential display_order based on position', () => {
      const items = [makeItem('a', 5), makeItem('b', 10), makeItem('c', 3)];
      const result = updateDisplayOrders(items);
      expect(result[0]!.display_order).toBe(0);
      expect(result[1]!.display_order).toBe(1);
      expect(result[2]!.display_order).toBe(2);
    });

    it('recursively updates children', () => {
      const items = [makeItem('a', 0, [makeItem('a1', 5), makeItem('a2', 10)])];
      const result = updateDisplayOrders(items);
      expect(result[0]!.children![0]!.display_order).toBe(0);
      expect(result[0]!.children![1]!.display_order).toBe(1);
    });
  });

  describe('moveItem', () => {
    it('moves item up', () => {
      const items = [makeItem('a', 0), makeItem('b', 1), makeItem('c', 2)];
      const result = moveItem(items, 'b', 'up');
      expect(result[0]!.id).toBe('b');
      expect(result[1]!.id).toBe('a');
    });

    it('moves item down', () => {
      const items = [makeItem('a', 0), makeItem('b', 1), makeItem('c', 2)];
      const result = moveItem(items, 'b', 'down');
      expect(result[1]!.id).toBe('c');
      expect(result[2]!.id).toBe('b');
    });

    it('returns unchanged list when moving first item up', () => {
      const items = [makeItem('a', 0), makeItem('b', 1)];
      const result = moveItem(items, 'a', 'up');
      expect(result[0]!.id).toBe('a');
    });

    it('returns unchanged list when moving last item down', () => {
      const items = [makeItem('a', 0), makeItem('b', 1)];
      const result = moveItem(items, 'b', 'down');
      expect(result[1]!.id).toBe('b');
    });

    it('returns unchanged list for unknown item id', () => {
      const items = [makeItem('a', 0)];
      const result = moveItem(items, 'nonexistent', 'up');
      expect(result).toEqual(items);
    });

    it('updates display_order after move', () => {
      const items = [makeItem('a', 0), makeItem('b', 1), makeItem('c', 2)];
      const result = moveItem(items, 'c', 'up');
      result.forEach((item, i) => {
        expect(item.display_order).toBe(i);
      });
    });
  });
});

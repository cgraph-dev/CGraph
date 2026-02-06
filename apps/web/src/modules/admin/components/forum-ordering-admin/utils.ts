/**
 * ForumOrderingAdmin utility functions
 * @module modules/admin/components/forum-ordering-admin
 */

import type { ForumItem } from './types';

/**
 * Updates display_order for all items based on their position
 */
export function updateDisplayOrders(items: ForumItem[]): ForumItem[] {
  return items.map((item, index) => ({
    ...item,
    display_order: index,
    children: item.children ? updateDisplayOrders(item.children) : undefined,
  }));
}

/**
 * Moves an item up or down in the list
 */
export function moveItem(
  items: ForumItem[],
  itemId: string,
  direction: 'up' | 'down'
): ForumItem[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) return items;

  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= items.length) return items;

  const newItems = [...items];
  const removed = newItems.splice(index, 1)[0];
  if (!removed) return items;
  newItems.splice(newIndex, 0, removed);

  return updateDisplayOrders(newItems);
}

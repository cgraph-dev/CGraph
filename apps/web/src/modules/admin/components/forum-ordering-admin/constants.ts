/**
 * ForumOrderingAdmin constants
 * @module modules/admin/components/forum-ordering-admin
 */

import { FolderIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { ItemType } from './types';

export const MAX_HISTORY_LENGTH = 20;

export const ITEM_TYPE_ICONS: Record<ItemType, typeof FolderIcon> = {
  forum: ChatBubbleLeftRightIcon,
  category: FolderIcon,
  board: ChatBubbleLeftRightIcon,
};

export const ITEM_TYPE_COLORS: Record<ItemType, string> = {
  forum: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  category: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  board: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
};

/**
 * EmptyState component
 * @module modules/admin/components/forum-ordering-admin
 */

import { FolderIcon } from '@heroicons/react/24/outline';
import type { ItemType } from './types';

interface EmptyStateProps {
  itemType: ItemType;
}

export function EmptyState({ itemType }: EmptyStateProps) {
  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <FolderIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>No {itemType}s to order</p>
    </div>
  );
}

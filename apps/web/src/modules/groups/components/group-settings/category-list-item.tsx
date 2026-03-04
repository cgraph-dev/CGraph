/**
 * CategoryListItem - Single category row with edit/delete/reorder controls
 *
 * @module modules/groups/components/group-settings
 */

import {
  FolderIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

export interface Category {
  id: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  channelCount: number;
}

interface CategoryListItemProps {
  category: Category;
  index: number;
  totalCount: number;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSave: (categoryId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (category: Category) => void;
  onDeleteRequest: (categoryId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Category List Item component.
 */
export function CategoryListItem({
  category,
  index,
  totalCount,
  isEditing,
  editName,
  onEditNameChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
}: CategoryListItemProps) {
  return (
    <GlassCard variant="frosted" className="px-4 py-3">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(category.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
            className="flex-1 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-sm text-white focus:border-primary-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => onSave(category.id)}
            className="rounded px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/[0.08]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium uppercase tracking-wider text-gray-300">
              {category.name}
            </span>
            <span className="text-xs text-gray-600">
              {category.channelCount} channel
              {category.channelCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="rounded p-1 text-gray-500 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
            >
              <ChevronUpIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === totalCount - 1}
              className="rounded p-1 text-gray-500 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onStartEdit(category)}
              className="rounded p-1 text-gray-500 hover:bg-white/[0.08] hover:text-white"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeleteRequest(category.id)}
              className="rounded p-1 text-gray-500 hover:bg-white/[0.08] hover:text-red-400"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

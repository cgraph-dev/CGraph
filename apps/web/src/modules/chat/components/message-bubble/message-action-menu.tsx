/**
 * Message Action Menu Component
 *
 * Dropdown menu for message actions (edit, pin, forward, delete).
 */

import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import type { MessageActionMenuProps } from './types';
import { ReplyIcon, EditIcon, PinIcon, ForwardIcon, DeleteIcon } from './icons';

/**
 * unknown for the chat module.
 */
/**
 * Message Action Menu component.
 */
export function MessageActionMenu({
  onReply,
  onEdit,
  onPin,
  onForward,
  onDelete,
  isMenuOpen,
  onToggleMenu,
}: MessageActionMenuProps) {
  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={onReply}
        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
        title="Reply"
      >
        <ReplyIcon />
      </button>
      <button
        onClick={onToggleMenu}
        className="rounded p-1 text-gray-500 hover:bg-dark-700 hover:text-white"
        title="More"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg bg-dark-800 py-1 shadow-lg ring-1 ring-white/10">
          <button
            onClick={onEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
          >
            <EditIcon />
            Edit
          </button>
          <button
            onClick={onPin}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
          >
            <PinIcon />
            Pin
          </button>
          <button
            onClick={onForward}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
          >
            <ForwardIcon />
            Forward
          </button>
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-700"
          >
            <DeleteIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

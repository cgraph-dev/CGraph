/**
 * Message Edit Form Component
 *
 * Inline editing form for message content.
 */

import type { MessageEditFormProps } from './types';

export function MessageEditForm({
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
}: MessageEditFormProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={editContent}
        onChange={(e) => onEditContentChange?.(e.target.value)}
        className="w-full rounded-lg border border-gray-600 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        rows={3}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onSaveEdit}
          className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-500"
        >
          Save
        </button>
        <button
          onClick={onCancelEdit}
          className="rounded-lg bg-dark-600 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-dark-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

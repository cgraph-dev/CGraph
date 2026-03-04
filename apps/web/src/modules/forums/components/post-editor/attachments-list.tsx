/**
 * Attachments list component for the forum post editor.
 * @module modules/forums/components/post-editor/attachments-list
 */
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { AttachmentsListProps } from './types';

/**
 * AttachmentsList Component
 *
 * Displays list of attached files with remove buttons
 */
export function AttachmentsList({ attachments, onRemove }: AttachmentsListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-white/[0.06] p-4">
      <div className="mb-2 text-sm font-medium">Attachments ({attachments.length})</div>
      <div className="flex flex-wrap gap-2">
        {attachments.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm"
          >
            <PaperClipIcon className="h-4 w-4 text-gray-400" />
            <span className="max-w-[150px] truncate">{file.name}</span>
            <button onClick={() => onRemove(index)} className="text-gray-400 hover:text-red-400">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttachmentsList;

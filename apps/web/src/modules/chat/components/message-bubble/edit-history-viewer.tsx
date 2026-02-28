/**
 * Edit History Viewer
 *
 * Popover listing previous message versions in reverse chronological order.
 * Triggered by clicking the "(edited)" indicator on a message.
 *
 * @module modules/chat/components/message-bubble
 */

import { useRef, useEffect } from 'react';
import type { EditHistory } from '@/modules/chat/store';

interface EditHistoryViewerProps {
  edits: EditHistory[];
  currentContent: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatEditTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Popover that displays the full edit history of a message.
 */
export function EditHistoryViewer({
  edits,
  currentContent,
  isOpen,
  onClose,
}: EditHistoryViewerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target;
      if (popoverRef.current && target instanceof Node && !popoverRef.current.contains(target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Show entries in reverse chronological order (newest first)
  const sortedEdits = [...edits].sort((a, b) => b.editNumber - a.editNumber);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 z-50 mb-1 w-72 rounded-lg border border-dark-600 bg-dark-800 shadow-xl"
    >
      <div className="border-b border-dark-600 px-3 py-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Edit History
        </h4>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {/* Current version */}
        <div className="border-b border-dark-700 px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-primary-400">Current</span>
            <span className="text-xs text-gray-500">Latest</span>
          </div>
          <p className="line-clamp-3 text-sm text-gray-200">{currentContent}</p>
        </div>

        {/* Previous versions */}
        {sortedEdits.map((edit) => (
          <div key={edit.id} className="border-b border-dark-700/50 px-3 py-2 last:border-b-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Edit #{edit.editNumber}</span>
              <span className="text-xs text-gray-500">{formatEditTime(edit.createdAt)}</span>
            </div>
            <p className="line-clamp-3 text-sm text-gray-400">{edit.previousContent}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Message Action Menu Component
 *
 * Dropdown menu for message actions (edit, pin, forward, save, delete).
 */

import { useState, useCallback, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import type { MessageActionMenuProps } from './types';
import { ReplyIcon, EditIcon, PinIcon, ForwardIcon, DeleteIcon, BookmarkIcon, BookmarkFilledIcon } from './icons';
import { api } from '@/lib/api';

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
  messageId,
}: MessageActionMenuProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check saved state when menu opens
  useEffect(() => {
    if (!isMenuOpen || !messageId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/v1/saved-messages');
        const saved = (data.data || []).find(
          (s: { message_id: string; id: string }) => s.message_id === messageId
        );
        if (!cancelled) {
          setIsSaved(!!saved);
          setSavedId(saved?.id ?? null);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [isMenuOpen, messageId]);

  const handleToggleSave = useCallback(async () => {
    if (saving || !messageId) return;
    setSaving(true);
    try {
      if (isSaved && savedId) {
        await api.delete(`/api/v1/saved-messages/${savedId}`);
        setIsSaved(false);
        setSavedId(null);
      } else {
        const { data } = await api.post('/api/v1/saved-messages', { message_id: messageId });
        setIsSaved(true);
        setSavedId(data.data?.id ?? null);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [isSaved, savedId, saving, messageId]);

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
            onClick={handleToggleSave}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
            disabled={saving}
          >
            {isSaved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
            {isSaved ? 'Unsave' : 'Save'}
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

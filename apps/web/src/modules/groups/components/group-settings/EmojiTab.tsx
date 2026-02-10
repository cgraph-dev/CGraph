/**
 * EmojiTab - Group emoji management
 *
 * Admin UI for uploading, renaming, and deleting custom emoji for a group.
 * Discord-style emoji management with upload, preview grid, and tier limits.
 * Uses /api/v1/groups/:group_id/emojis
 *
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaceSmileIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';
import { entranceVariants } from '@/lib/animation-presets/presets';

interface GroupEmoji {
  id: string;
  name: string;
  imageUrl: string;
  isAnimated: boolean;
  isAvailable: boolean;
  uploadedBy: string;
  createdAt: string;
}

interface EmojiTabProps {
  groupId: string;
}

const MAX_EMOJI_SIZE = 256 * 1024; // 256KB
const ALLOWED_TYPES = ['image/png', 'image/gif', 'image/webp', 'image/jpeg'];

export function EmojiTab({ groupId }: EmojiTabProps) {
  const [emojis, setEmojis] = useState<GroupEmoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmojis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/emojis`);
      const data = res.data?.data ?? res.data ?? [];
      setEmojis(
        (Array.isArray(data) ? data : []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          name: (e.name ?? '') as string,
          imageUrl: (e.image_url ?? e.imageUrl ?? '') as string,
          isAnimated: !!(e.is_animated ?? e.isAnimated),
          isAvailable: e.is_available !== false && e.isAvailable !== false,
          uploadedBy: (e.uploaded_by ?? e.uploadedBy ?? '') as string,
          createdAt: (e.inserted_at ?? e.createdAt ?? '') as string,
        }))
      );
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchEmojis();
  }, [fetchEmojis]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate filetype
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PNG, GIF, WebP, and JPEG files are allowed.');
      return;
    }

    // Validate size
    if (file.size > MAX_EMOJI_SIZE) {
      setError('Emoji must be under 256KB.');
      return;
    }

    // Extract name from filename (remove extension)
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('emoji', file);
      formData.append('name', name);

      await api.post(`/api/v1/groups/${groupId}/emojis`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchEmojis();
    } catch {
      setError('Failed to upload emoji. You may have hit the emoji limit.');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRename = async (emojiId: string) => {
    if (!editName.trim()) return;
    const cleanName = editName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    try {
      await api.put(`/api/v1/groups/${groupId}/emojis/${emojiId}`, {
        name: cleanName,
      });
      setEditingId(null);
      fetchEmojis();
    } catch {
      // Handle error
    }
  };

  const handleDelete = async (emojiId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}/emojis/${emojiId}`);
      setEmojis((prev) => prev.filter((e) => e.id !== emojiId));
      setDeleteConfirmId(null);
    } catch {
      // Handle error
    }
  };

  const startEdit = (emoji: GroupEmoji) => {
    setEditingId(emoji.id);
    setEditName(emoji.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-white">Emoji</h2>
          <p className="text-gray-400">
            Upload custom emoji for your group. {emojis.length} emoji
            {emojis.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <ArrowUpTrayIcon className="h-4 w-4" />
          )}
          Upload Emoji
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.gif,.webp,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Grid */}
      <GlassCard variant="frosted" className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : emojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FaceSmileIcon className="mb-3 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">No custom emoji yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Upload PNG, GIF, or WebP images (max 256KB)
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600"
            >
              <PlusIcon className="h-4 w-4" />
              Upload your first emoji
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {emojis.map((emoji, index) => (
              <motion.div
                key={emoji.id}
                variants={entranceVariants.fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.03 }}
                className="group relative rounded-xl border border-gray-700/50 bg-dark-800/50 p-3 transition-colors hover:border-gray-600"
              >
                {/* Emoji Image */}
                <div className="mb-2 flex items-center justify-center">
                  <img
                    src={emoji.imageUrl}
                    alt={`:${emoji.name}:`}
                    className="h-12 w-12 object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Emoji Name */}
                {editingId === emoji.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(emoji.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full rounded border border-gray-700 bg-dark-900 px-1.5 py-0.5 text-xs text-white focus:border-primary-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(emoji.id)}
                      className="text-xs text-primary-400"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <p className="truncate text-center text-xs text-gray-400">
                    :{emoji.name}:
                  </p>
                )}

                {/* Animated badge */}
                {emoji.isAnimated && (
                  <span className="absolute right-1 top-1 rounded bg-purple-500/20 px-1 text-[10px] text-purple-400">
                    GIF
                  </span>
                )}

                {/* Hover actions */}
                <div className="absolute inset-x-0 bottom-0 flex translate-y-1 justify-center gap-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(emoji)}
                    className="rounded bg-dark-900/90 p-1 text-gray-400 hover:text-white"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(emoji.id)}
                    className="rounded bg-dark-900/90 p-1 text-gray-400 hover:text-red-400"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Upload placeholder card */}
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-3 text-gray-500 transition-colors hover:border-primary-500/50 hover:text-gray-400"
            >
              <PlusIcon className="mb-1 h-8 w-8" />
              <span className="text-xs">Upload</span>
            </motion.button>
          </div>
        )}
      </GlassCard>

      {/* Guidelines */}
      <div className="rounded-lg border border-gray-800 bg-dark-800/50 px-4 py-3">
        <h4 className="mb-1 text-sm font-medium text-gray-300">Emoji Guidelines</h4>
        <ul className="space-y-0.5 text-xs text-gray-500">
          <li>• Supported formats: PNG, GIF, WebP, JPEG</li>
          <li>• Maximum file size: 256KB</li>
          <li>• Recommended dimensions: 128×128 pixels</li>
          <li>• Names can only contain letters, numbers, and underscores</li>
        </ul>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">Delete Emoji</h3>
              <p className="text-sm text-gray-400">
                This emoji will be permanently removed and can no longer be used in
                messages.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

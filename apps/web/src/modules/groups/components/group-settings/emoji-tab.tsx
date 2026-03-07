/**
 * EmojiTab - Group emoji management
 *
 * Admin UI for uploading, renaming, and deleting custom emoji for a group.
 * Emoji management with upload, preview grid, and tier limits.
 * Uses /api/v1/groups/:group_id/emojis
 *
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { asString } from '@/lib/api-utils';
import { EmojiGrid } from './emoji-grid';
import type { GroupEmoji } from './emoji-grid';
import { DeleteEmojiModal } from './delete-emoji-modal';

const ANIMATION_FORMATS = new Set(['gif', 'apng', 'webp', 'lottie']);
function toAnimationFormat(value: string): GroupEmoji['animationFormat'] {
  if (ANIMATION_FORMATS.has(value)) {
    // validated via set membership above
    return value as 'gif' | 'apng' | 'webp' | 'lottie'; // eslint-disable-line @typescript-eslint/consistent-type-assertions
  }
  return null;
}

interface EmojiTabProps {
  groupId: string;
}

const MAX_EMOJI_SIZE = 256 * 1024; // 256KB for images
const MAX_LOTTIE_SIZE = 500 * 1024; // 500KB for Lottie JSON
const ALLOWED_TYPES = ['image/png', 'image/gif', 'image/webp', 'image/jpeg'];

/**
 * unknown for the groups module.
 */
/**
 * Emoji Tab component.
 */
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
          id: asString(e.id),
          name: asString(e.name),
          imageUrl: asString(e.image_url) || asString(e.imageUrl),
          isAnimated: !!(e.is_animated ?? e.isAnimated),
          isAvailable: e.is_available !== false && e.isAvailable !== false,
          uploadedBy: asString(e.uploaded_by) || asString(e.uploadedBy),
          createdAt: asString(e.inserted_at) || asString(e.createdAt),
          animationFormat: toAnimationFormat(
            asString(e.animation_format) || asString(e.animationFormat)
          ),
          lottieUrl: asString(e.lottie_url) || asString(e.lottieUrl) || undefined,
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
    const isLottie = file.name.endsWith('.json');

    if (isLottie) {
      if (file.size > MAX_LOTTIE_SIZE) {
        setError('Lottie JSON must be under 500KB.');
        return;
      }
      // Validate Lottie JSON structure
      try {
        const text = await file.text();
        const json: Record<string, unknown> = JSON.parse(text);
        const required = ['v', 'fr', 'ip', 'op', 'w', 'h', 'layers'] as const;
        for (const key of required) {
          if (!(key in json)) {
            setError(`Invalid Lottie file: missing required field "${key}".`);
            return;
          }
        }
        const duration = (Number(json.op) - Number(json.ip)) / Number(json.fr);
        if (duration > 10) {
          setError('Lottie animation must not exceed 10 seconds.');
          return;
        }
      } catch {
        setError('File is not valid JSON.');
        return;
      }
    } else {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only PNG, GIF, WebP, JPEG, and Lottie JSON files are allowed.');
        return;
      }
      if (file.size > MAX_EMOJI_SIZE) {
        setError('Emoji must be under 256KB.');
        return;
      }
    }

    const name = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('emoji', file);
      formData.append('name', name);
      if (isLottie) {
        formData.append('animation_format', 'lottie');
      }

      await api.post(`/api/v1/groups/${groupId}/emojis`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchEmojis();
    } catch {
      setError('Failed to upload emoji. You may have hit the emoji limit.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRename = async (emojiId: string) => {
    if (!editName.trim()) return;
    const cleanName = editName
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
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

  const triggerUpload = () => fileInputRef.current?.click();

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
          onClick={triggerUpload}
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
          accept=".png,.gif,.webp,.jpg,.jpeg,.json"
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
      <EmojiGrid
        emojis={emojis}
        loading={loading}
        editingId={editingId}
        editName={editName}
        onEditNameChange={setEditName}
        onStartEdit={startEdit}
        onCancelEdit={() => setEditingId(null)}
        onRename={handleRename}
        onDeleteRequest={setDeleteConfirmId}
        onUploadClick={triggerUpload}
      />

      {/* Guidelines */}
      <div className="rounded-lg border border-gray-800 bg-white/[0.04] px-4 py-3">
        <h4 className="mb-1 text-sm font-medium text-gray-300">Emoji Guidelines</h4>
        <ul className="space-y-0.5 text-xs text-gray-500">
          <li>• Supported formats: PNG, GIF, WebP, JPEG, Lottie JSON</li>
          <li>• Maximum file size: 256KB (images), 500KB (Lottie JSON)</li>
          <li>• Recommended dimensions: 128×128 pixels</li>
          <li>• Names can only contain letters, numbers, and underscores</li>
          <li>• Lottie animations must be under 10 seconds</li>
        </ul>
      </div>

      {/* Delete Confirmation */}
      <DeleteEmojiModal
        deleteConfirmId={deleteConfirmId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </motion.div>
  );
}

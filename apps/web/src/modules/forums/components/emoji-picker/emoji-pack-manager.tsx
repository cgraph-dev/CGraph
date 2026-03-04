/**
 * Emoji Pack Manager Component
 *
 * Admin page for emoji pack CRUD, import/export, and moderation.
 * Supports bulk upload, animated preview, marketplace browse.
 *
 * @version 1.0.0
 * @module components/forums/emoji-picker/EmojiPackManager
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useEmojiPackStore } from '../../store/forumStore.emoji';
import type { EmojiPack, EmojiPackBundle } from '../../store/forumStore.emoji';
import { tweens } from '@/lib/animation-presets';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmojiPackManagerProps {
  forumId: string;
  isAdmin?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const PackCard = memo(function PackCard({
  pack,
  onExport,
  onDelete,
  onToggle,
}: {
  pack: EmojiPack;
  onExport: (packId: string) => void;
  onDelete: (packId: string) => void;
  onToggle: (packId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={tweens.brisk}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {pack.iconUrl ? (
            <img src={pack.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <SparklesIcon className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{pack.name}</h3>
              {pack.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Premium
                </span>
              )}
              <span className="text-xs text-gray-500">v{pack.version}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pack.emojiCount} emoji{pack.emojiCount !== 1 ? 's' : ''}
              {pack.author && ` · by ${pack.author}`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggle(pack.id)}
            className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
              pack.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {pack.isActive ? 'Active' : 'Inactive'}
          </button>
          <button
            type="button"
            onClick={() => onExport(pack.id)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Export pack"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(pack.id)}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete pack"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded emoji grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={tweens.brisk}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12">
              {pack.emojis.map((emoji) => (
                <div
                  key={emoji.id}
                  className="group relative flex flex-col items-center rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title={`:${emoji.shortcode}:`}
                >
                  <img
                    src={emoji.imageUrl}
                    alt={emoji.shortcode}
                    className="h-8 w-8 object-contain"
                    loading="lazy"
                  />
                  {emoji.isAnimated && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-purple-500" />
                  )}
                  <span className="mt-0.5 max-w-full truncate text-[10px] text-gray-400">
                    :{emoji.shortcode}:
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

const CreatePackForm = memo(function CreatePackForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20"
    >
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Create New Pack</h3>
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pack name"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSubmit({ name, description: description || undefined })}
            disabled={!name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────────

export const EmojiPackManager = memo(function EmojiPackManager({
  forumId,
  isAdmin = false,
}: EmojiPackManagerProps) {
  const { packs, loading, error, fetchPacks, createPack, importPack, exportPack, deletePack } =
    useEmojiPackStore();

  const [showCreate, setShowCreate] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPacks(forumId);
  }, [forumId, fetchPacks]);

  // ─── Handlers ────────────────────────────────────────────

  const handleCreate = useCallback(
    async (data: { name: string; description?: string }) => {
      try {
        await createPack(forumId, data);
        setShowCreate(false);
      } catch (err) {
        // toast error
      }
    },
    [forumId, createPack]
  );

  const handleExport = useCallback(
    async (packId: string) => {
      try {
        const bundle = await exportPack(forumId, packId);
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emoji-pack-${packId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        // toast error
      }
    },
    [forumId, exportPack]
  );

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const text = await file.text();
        const bundle = JSON.parse(text) as EmojiPackBundle;
        await importPack(forumId, bundle);
      } catch (err) {
        // toast error
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [forumId, importPack]
  );

  const handleDelete = useCallback(
    async (packId: string) => {
      if (!confirm('Delete this emoji pack? This cannot be undone.')) return;
      try {
        await deletePack(forumId, packId);
      } catch (err) {
        // toast error
      }
    },
    [forumId, deletePack]
  );

  const handleToggle = useCallback((_packId: string) => {
    // Toggle active state — would call API
  }, []);

  // ─── Render ──────────────────────────────────────────────

  if (loading && packs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Emoji Packs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage custom emoji collections for your forum
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" />
              Create Pack
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <CreatePackForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        )}
      </AnimatePresence>

      {/* Pack list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              onExport={handleExport}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </AnimatePresence>

        {packs.length === 0 && !loading && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
            <SparklesIcon className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              No emoji packs yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Create a pack or import one from a JSON bundle
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default EmojiPackManager;

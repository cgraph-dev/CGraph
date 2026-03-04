/**
 * Custom emoji management page component.
 * @module
 */
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Smile, Trash2, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { useCustomEmoji, CATEGORIES } from './hooks';
import UploadEmojiModal from './upload-emoji-modal';
import type { CustomEmoji } from './types';

function EmojiCard({ emoji, onDelete }: { emoji: CustomEmoji; onDelete: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex flex-col items-center rounded-xl bg-dark-800/50 p-4 transition-colors hover:bg-dark-700/50"
    >
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
        <img
          src={emoji.imageUrl}
          alt={emoji.name}
          className="h-12 w-12 object-contain"
          loading="lazy"
          onError={(e) => {
             
            (e.target as HTMLImageElement).src = ''; // safe downcast – DOM element
             
            (e.target as HTMLImageElement).style.display = 'none'; // safe downcast – DOM element
          }}
        />
        {emoji.isAnimated && (
          <span className="absolute -right-1 -top-1 rounded-full bg-purple-500/20 p-0.5">
            <Sparkles className="h-3 w-3 text-purple-400" />
          </span>
        )}
      </div>
      <span className="max-w-full truncate text-xs font-medium text-white/80">{emoji.name}</span>
      <span className="mt-0.5 text-[10px] text-white/40">:{emoji.shortcode}:</span>
      <span className="mt-1 text-[10px] text-white/30">
        {emoji.usageCount.toLocaleString()} uses
      </span>

      {/* Delete on hover */}
      <button
        type="button"
        onClick={() => onDelete(emoji.id)}
        className="absolute right-2 top-2 rounded-md p-1 text-white/0 transition-colors group-hover:text-white/30 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-400"
        title="Delete emoji"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

/**
 * Custom Emoji Page — route-level page component.
 */
export default function CustomEmojiPage() {
  const {
    emojis,
    totalCount,
    category,
    setCategory,
    search,
    setSearch,
    showUploadModal,
    setShowUploadModal,
    deleteEmoji,
    isLoading,
  } = useCustomEmoji();

  return (
    <PageContainer
      title="Custom Emoji"
      subtitle={`${totalCount} custom emoji available`}
      maxWidth="xl"
      actions={
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Upload Emoji
        </button>
      }
    >
      {/* Search + Category filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-dark-800/50 py-2 pl-10 pr-3 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-dark-800/50 p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.value
                  ? 'bg-dark-700 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && emojis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-dark-800">
            <Smile className="h-10 w-10 text-white/20" />
          </div>
          <h3 className="text-lg font-semibold text-white/60">No emoji found</h3>
          <p className="mt-1 text-sm text-white/40">
            {search ? 'Try a different search term' : 'Upload your first custom emoji'}
          </p>
        </div>
      )}

      {/* Emoji grid */}
      {!isLoading && emojis.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        >
          <AnimatePresence mode="popLayout">
            {emojis.map((emoji) => (
              <EmojiCard key={emoji.id} emoji={emoji} onDelete={deleteEmoji} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Upload modal */}
      {showUploadModal && <UploadEmojiModal onClose={() => setShowUploadModal(false)} />}
    </PageContainer>
  );
}

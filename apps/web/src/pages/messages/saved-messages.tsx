/**
 * SavedMessages - Page for viewing bookmarked/saved messages
 * Accessible from sidebar
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { entranceVariants, springs, staggerConfigs } from '@/lib/animation-presets';
import {
  BookmarkIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface SavedMessage {
  id: string;
  message_id: string;
  content: string;
  sender_name: string;
  sender_avatar?: string;
  conversation_name?: string;
  saved_at: string;
  note?: string;
}

/**
 *
 */
export function SavedMessages() {
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const { data } = await api.get(`/api/v1/saved-messages?${params}`);
      setMessages(data.data || []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`/api/v1/saved-messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // noop
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <BookmarkIcon className="h-7 w-7 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Saved Messages</h1>
        </div>
        <p className="text-sm text-white/40">Your bookmarked messages from all conversations</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved messages..."
          className="w-full rounded-xl border border-white/10 bg-dark-700 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
        />
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : messages.length === 0 ? (
        <motion.div
          variants={entranceVariants.fadeUp}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center py-16 text-center"
        >
          <BookmarkIcon className="mb-4 h-14 w-14 text-white/10" />
          <p className="text-lg font-medium text-white/40">No saved messages</p>
          <p className="mt-1 text-sm text-white/20">
            Bookmark messages from conversations to find them here
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            animate: { transition: { staggerChildren: staggerConfigs.fast.staggerChildren } },
          }}
          className="space-y-3"
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={entranceVariants.fadeUp}
                exit={{ opacity: 0, x: -20 }}
                layout
                className="group rounded-xl border border-white/5 bg-dark-700/50 p-4 transition-colors hover:border-white/10"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                    {msg.sender_avatar ? (
                      <img
                        src={msg.sender_avatar}
                        alt={msg.sender_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
                      {msg.conversation_name && (
                        <span className="flex items-center gap-1 text-xs text-white/30">
                          <ChatBubbleLeftIcon className="h-3 w-3" />
                          {msg.conversation_name}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-white/20">
                        {formatDate(msg.saved_at)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-white/70">{msg.content}</p>
                    {msg.note && (
                      <p className="mt-1.5 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs italic text-primary-300">
                        Note: {msg.note}
                      </p>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(msg.id)}
                    className="rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    title="Remove from saved"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/**
 * ChannelThreadPanel - Side panel for viewing/replying to channel message threads
 *
 * Opens when clicking "Reply in Thread" on a channel message.
 * Displays parent message, thread replies, and a send input.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { entranceVariants, springs } from '@/lib/animation-presets';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useChannelThreadStore } from '@/modules/groups/store/channelThreadStore';

/**
 * Channel Thread Panel component.
 */
export function ChannelThreadPanel() {
  const { activeThread, threadReplies, isLoading, closeThread, sendThreadReply } =
    useChannelThreadStore();

  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isOpen = !!activeThread;

  // Auto-scroll on new replies
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadReplies.length]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!replyText.trim() || isSending) return;
    const content = replyText.trim();
    setReplyText('');
    setIsSending(true);
    try {
      await sendThreadReply(content);
    } catch {
      setReplyText(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && activeThread && (
        <motion.div
          variants={entranceVariants.slideRight}
          initial="initial"
          animate="animate"
          exit="initial"
          transition={springs.gentle}
          className="flex h-full w-96 flex-col border-l border-white/10 bg-white/[0.04]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-400" />
              <h3 className="font-semibold text-white">Thread</h3>
              <span className="text-xs text-white/40">
                {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
            <button
              onClick={closeThread}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Parent message */}
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                {activeThread.author.avatarUrl ? (
                  <img
                    src={activeThread.author.avatarUrl}
                    alt={activeThread.author.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {(activeThread.author.displayName ?? activeThread.author.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white">
                    {activeThread.author.displayName ?? activeThread.author.username}
                  </span>
                  <span className="text-xs text-white/30">
                    {formatTime(activeThread.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/80">
                  {activeThread.content}
                </p>
              </div>
            </div>
          </div>

          {/* Replies list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : threadReplies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ChatBubbleLeftRightIcon className="mb-3 h-10 w-10 text-white/20" />
                <p className="text-sm text-white/40">No replies yet</p>
                <p className="mt-1 text-xs text-white/20">Be the first to reply</p>
              </div>
            ) : (
              <div className="space-y-4">
                {threadReplies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                      {reply.author?.avatarUrl ? (
                        <img
                          src={reply.author.avatarUrl}
                          alt={reply.author.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                          {(reply.author?.displayName ?? reply.author?.username ?? '?')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white">
                          {reply.author?.displayName ?? reply.author?.username}
                        </span>
                        <span className="text-xs text-white/30">{formatTime(reply.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/70">
                        {reply.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Reply input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2 rounded-xl bg-white/[0.06] px-3 py-2">
              <textarea
                ref={inputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to thread..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                style={{ maxHeight: '100px' }}
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || isSending}
                className="rounded-lg p-1.5 text-primary-400 hover:bg-primary-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

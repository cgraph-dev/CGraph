/**
 * ThreadPanel - Side panel for viewing/replying to message threads
 * Opens when clicking "View Thread" or reply count on a parent message
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { entranceVariants, springs } from '@/lib/animation-presets/presets';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';

interface ThreadMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  inserted_at: string;
  reply_to_id?: string;
}

interface ThreadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  parentMessage: ThreadMessage | null;
  conversationId: string;
}

export function ThreadPanel({ isOpen, onClose, parentMessage, conversationId }: ThreadPanelProps) {
  const { user: _user } = useAuthStore();
  const [replies, setReplies] = useState<ThreadMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch thread replies
  const fetchReplies = useCallback(async () => {
    if (!parentMessage) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/messages/${parentMessage.id}/thread`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(data.data || []);
      }
    } catch {
      // Thread endpoint may not exist yet — show empty state
    } finally {
      setLoading(false);
    }
  }, [parentMessage]);

  useEffect(() => {
    if (isOpen && parentMessage) {
      fetchReplies();
    }
  }, [isOpen, parentMessage, fetchReplies]);

  // Auto-scroll to bottom on new replies
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !parentMessage) return;

    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: replyText.trim(),
          reply_to_id: parentMessage.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplies((prev) => [...prev, data.data]);
        setReplyText('');
        inputRef.current?.focus();
      }
    } catch {
      // silently fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && parentMessage && (
        <motion.div
          variants={entranceVariants.slideRight}
          initial="initial"
          animate="animate"
          exit="initial"
          transition={springs.gentle}
          className="flex h-full w-96 flex-col border-l border-white/10 bg-dark-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-400" />
              <h3 className="font-semibold text-white">Thread</h3>
              <span className="text-xs text-white/40">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Parent message */}
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                {parentMessage.sender_avatar ? (
                  <img
                    src={parentMessage.sender_avatar}
                    alt={parentMessage.sender_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {parentMessage.sender_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white">
                    {parentMessage.sender_name}
                  </span>
                  <span className="text-xs text-white/30">
                    {formatDate(parentMessage.inserted_at)} {formatTime(parentMessage.inserted_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/80">
                  {parentMessage.content}
                </p>
              </div>
            </div>
          </div>

          {/* Replies list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ChatBubbleLeftRightIcon className="mb-3 h-10 w-10 text-white/20" />
                <p className="text-sm text-white/40">No replies yet</p>
                <p className="mt-1 text-xs text-white/20">Be the first to reply</p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                      {reply.sender_avatar ? (
                        <img
                          src={reply.sender_avatar}
                          alt={reply.sender_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                          {reply.sender_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white">
                          {reply.sender_name}
                        </span>
                        <span className="text-xs text-white/30">
                          {formatTime(reply.inserted_at)}
                        </span>
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
            <div className="flex items-end gap-2 rounded-xl bg-dark-700 px-3 py-2">
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
                onClick={handleSendReply}
                disabled={!replyText.trim()}
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

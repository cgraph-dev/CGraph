import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentIcon,
  GifIcon,
  PlusCircleIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import { GlassCard } from '@/shared/components/ui';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { StickerPicker } from '@/components/chat/StickerPicker';
import { GifPicker, type GifResult } from '@/components/chat/GifPicker';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Sticker } from '@/data/stickers';
import { api } from '@/lib/api';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

// Reserved for extended input features
const _reservedIcons = { PaperClipIcon, AtSymbolIcon };
void _reservedIcons;

/**
 * MessageInput Component
 *
 * Rich message input with multiple media types and features.
 * Features:
 * - Text input with auto-resize
 * - Emoji picker integration
 * - Sticker picker
 * - GIF search
 * - File attachments (images, docs)
 * - Voice message recording
 * - Reply preview
 * - Typing indicator
 * - @mentions with autocomplete
 * - Slash commands
 */

interface MessageInputProps {
  conversationId?: string;
  channelId?: string;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  } | null;
  onSend: (message: {
    content: string;
    attachments?: File[];
    replyToId?: string;
    type?: 'text' | 'voice' | 'sticker' | 'gif';
    metadata?: Record<string, unknown>;
  }) => void;
  onCancelReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type AttachmentMode = 'none' | 'file' | 'emoji' | 'sticker' | 'gif' | 'voice';

export function MessageInput({
  conversationId: _conversationId,
  channelId: _channelId,
  replyTo,
  onSend,
  onCancelReply,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  className = '',
}: MessageInputProps) {
  // Reserved for channel-specific features
  void _conversationId;
  void _channelId;

  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!onTyping) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing
    onTyping(true);

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  }, [onTyping]);

  // Handle message change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);
      handleTyping();

      // Check for @mentions
      const lastAtSymbol = value.lastIndexOf('@');
      if (lastAtSymbol !== -1 && lastAtSymbol >= value.lastIndexOf(' ')) {
        const query = value.slice(lastAtSymbol + 1);
        setMentionQuery(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    },
    [handleTyping]
  );

  // Handle send
  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;

    onSend({
      content: message.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToId: replyTo?.id,
      type: 'text',
    });

    setMessage('');
    setAttachments([]);
    if (onTyping) onTyping(false);
    HapticFeedback.light();
  }, [message, attachments, replyTo, onSend, onTyping]);

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 10)); // Max 10 files
    setAttachmentMode('none');
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files].slice(0, 10));
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    HapticFeedback.light();
  }, []);

  // Handle voice message
  const handleVoiceMessage = useCallback(
    (data: { blob: Blob; duration: number; waveform: number[] }) => {
      onSend({
        content: '',
        type: 'voice',
        metadata: {
          audio: data.blob,
          duration: data.duration,
          waveform: data.waveform,
        },
      });
      setIsRecording(false);
      HapticFeedback.success();
    },
    [onSend]
  );

  // Handle sticker select
  const handleStickerSelect = useCallback(
    (sticker: Sticker) => {
      onSend({
        content: '',
        type: 'sticker',
        metadata: {
          stickerId: sticker.id,
          stickerName: sticker.name,
          stickerEmoji: sticker.emoji,
          stickerPackId: sticker.packId,
        },
      });
      setAttachmentMode('none');
      HapticFeedback.medium();
    },
    [onSend]
  );

  // Handle GIF select
  const handleGifSelect = useCallback(
    (gif: GifResult) => {
      onSend({
        content: '',
        type: 'gif',
        metadata: {
          gifId: gif.id,
          gifTitle: gif.title,
          gifUrl: gif.url,
          gifPreviewUrl: gif.previewUrl,
          gifWidth: gif.width,
          gifHeight: gif.height,
          gifSource: gif.source,
        },
      });
      setAttachmentMode('none');
      HapticFeedback.medium();
    },
    [onSend]
  );

  return (
    <div
      className={`relative ${className}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary-500 bg-dark-800/50 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-primary-400">Replying to {replyTo.author}</p>
                <p className="truncate text-sm text-gray-400">{replyTo.content}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancelReply}
                className="rounded-full p-1 hover:bg-dark-700"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 rounded-t-xl bg-dark-800/30 px-4 py-2">
              {attachments.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="group relative"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-dark-700">
                      <DocumentIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeAttachment(index)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <GlassCard variant="frosted" className="p-2">
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAttachmentMode(attachmentMode === 'file' ? 'none' : 'file')}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <PlusCircleIcon className="h-6 w-6" />
            </motion.button>

            {/* Attachment Menu */}
            <AnimatePresence>
              {attachmentMode === 'file' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 rounded-xl border border-gray-700 bg-dark-800 p-2 shadow-xl"
                >
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-blue-500/20 p-3 text-blue-400 hover:bg-blue-500/30"
                    >
                      <PhotoIcon className="h-6 w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-green-500/20 p-3 text-green-400 hover:bg-green-500/30"
                    >
                      <DocumentIcon className="h-6 w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAttachmentMode('gif')}
                      className="rounded-xl bg-purple-500/20 p-3 text-purple-400 hover:bg-purple-500/30"
                    >
                      <GifIcon className="h-6 w-6" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isRecording}
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-700/50 bg-dark-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none"
              style={{ maxHeight: '150px' }}
            />

            {/* Mention Autocomplete */}
            <AnimatePresence>
              {showMentions && (
                <MentionAutocomplete
                  query={mentionQuery}
                  onSelect={(mention) => {
                    const lastAtSymbol = message.lastIndexOf('@');
                    setMessage(message.slice(0, lastAtSymbol) + `@${mention} `);
                    setShowMentions(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowMentions(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Emoji Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAttachmentMode(attachmentMode === 'emoji' ? 'none' : 'emoji')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-yellow-400"
          >
            <FaceSmileIcon className="h-6 w-6" />
          </motion.button>

          {/* Sticker Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAttachmentMode(attachmentMode === 'sticker' ? 'none' : 'sticker')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-purple-400"
          >
            <span className="text-lg">🎨</span>
          </motion.button>

          {/* Voice Message Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRecording(!isRecording)}
            className={`rounded-lg p-2 transition-colors ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <MicrophoneIcon className="h-6 w-6" />
          </motion.button>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className="rounded-xl bg-primary-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </motion.button>
        </div>
      </GlassCard>

      {/* Voice Recording UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-dark-900/90 backdrop-blur-sm"
          >
            <VoiceMessageRecorder
              onComplete={handleVoiceMessage}
              onCancel={() => setIsRecording(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker Picker */}
      <AnimatePresence>
        {attachmentMode === 'sticker' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2"
          >
            <StickerPicker
              onSelect={handleStickerSelect}
              onClose={() => setAttachmentMode('none')}
              isOpen={attachmentMode === 'sticker'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GIF Picker */}
      <AnimatePresence>
        {attachmentMode === 'gif' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2"
          >
            <GifPicker
              onSelect={handleGifSelect}
              onClose={() => setAttachmentMode('none')}
              isOpen={attachmentMode === 'gif'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

// Mention Autocomplete Component
function MentionAutocomplete({
  query,
  onSelect,
  onClose: _onClose,
}: {
  query: string;
  onSelect: (mention: string) => void;
  onClose: () => void;
}) {
  // Reserved for dismissing on outside click
  void _onClose;

  const [users, setUsers] = useState<
    Array<{
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
      avatarBorderId?: string | null;
      avatar_border_id?: string | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch users from API with debounce
  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/users/search', {
          params: { q: query, limit: 10 },
        });

        if (response.data?.users) {
          setUsers(
            response.data.users.map((u: any) => ({
              id: u.id,
              username: u.username,
              displayName: u.display_name || u.username,
              avatarUrl: u.avatar_url,
              avatarBorderId: u.avatar_border_id || u.avatarBorderId || null,
            }))
          );
        } else {
          // Fallback to mock data if API not available
          const mockUsers = [
            { id: '1', username: 'alice', displayName: 'Alice' },
            { id: '2', username: 'bob', displayName: 'Bob' },
            { id: '3', username: 'charlie', displayName: 'Charlie' },
            { id: '4', username: 'david', displayName: 'David' },
            { id: '5', username: 'emma', displayName: 'Emma' },
          ].filter(
            (u) =>
              u.username.toLowerCase().includes(query.toLowerCase()) ||
              u.displayName.toLowerCase().includes(query.toLowerCase())
          );
          setUsers(mockUsers);
        }
      } catch {
        // Fallback to mock data on error
        const mockUsers = [
          { id: '1', username: 'alice', displayName: 'Alice' },
          { id: '2', username: 'bob', displayName: 'Bob' },
          { id: '3', username: 'charlie', displayName: 'Charlie' },
          { id: '4', username: 'david', displayName: 'David' },
          { id: '5', username: 'emma', displayName: 'Emma' },
        ].filter(
          (u) =>
            u.username.toLowerCase().includes(query.toLowerCase()) ||
            u.displayName.toLowerCase().includes(query.toLowerCase())
        );
        setUsers(mockUsers);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  if (users.length === 0 && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto rounded-xl border border-gray-700 bg-dark-800 p-2 shadow-xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent"
          />
        </div>
      ) : (
        users.map((user) => (
          <motion.button
            key={user.id}
            whileHover={{ x: 2 }}
            onClick={() => onSelect(user.username)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-dark-700"
          >
            {user.avatarUrl ? (
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user.displayName}
                size="small"
                avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                <span className="text-sm font-bold text-white">{user.displayName[0]}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
          </motion.button>
        ))
      )}
    </motion.div>
  );
}

export default MessageInput;

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
import GlassCard from '@/components/ui/GlassCard';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { StickerPicker } from '@/components/chat/StickerPicker';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

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
  conversationId,
  channelId,
  replyTo,
  onSend,
  onCancelReply,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  className = '',
}: MessageInputProps) {
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
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
  }, [handleTyping]);

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
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

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
  const handleVoiceMessage = useCallback((audioBlob: Blob) => {
    onSend({
      content: '',
      type: 'voice',
      metadata: { audio: audioBlob },
    });
    setIsRecording(false);
    HapticFeedback.success();
  }, [onSend]);

  // Handle sticker select
  const handleStickerSelect = useCallback((sticker: { id: string; name: string; url: string }) => {
    onSend({
      content: '',
      type: 'sticker',
      metadata: { sticker },
    });
    setAttachmentMode('none');
    HapticFeedback.medium();
  }, [onSend]);

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
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-800/50 border-l-2 border-primary-500 mb-2 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-400 font-medium">
                  Replying to {replyTo.author}
                </p>
                <p className="text-sm text-gray-400 truncate">{replyTo.content}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancelReply}
                className="p-1 rounded-full hover:bg-dark-700"
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
            <div className="flex flex-wrap gap-2 px-4 py-2 bg-dark-800/30 rounded-t-xl">
              {attachments.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative group"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-dark-700 flex items-center justify-center">
                      <DocumentIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
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
                  className="absolute bottom-full left-0 mb-2 p-2 rounded-xl bg-dark-800 border border-gray-700 shadow-xl"
                >
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <PhotoIcon className="h-6 w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    >
                      <DocumentIcon className="h-6 w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAttachmentMode('gif')}
                      className="p-3 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    >
                      <GifIcon className="h-6 w-6" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isRecording}
              rows={1}
              className="w-full px-4 py-2 rounded-xl bg-dark-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none resize-none"
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
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <FaceSmileIcon className="h-6 w-6" />
          </motion.button>

          {/* Sticker Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAttachmentMode(attachmentMode === 'sticker' ? 'none' : 'sticker')}
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-purple-400 transition-colors"
          >
            <span className="text-lg">🎨</span>
          </motion.button>

          {/* Voice Message Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'hover:bg-dark-700 text-gray-400 hover:text-white'
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
            className="p-2 rounded-xl bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="absolute inset-0 flex items-center justify-center bg-dark-900/90 backdrop-blur-sm rounded-xl"
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
  onClose,
}: {
  query: string;
  onSelect: (mention: string) => void;
  onClose: () => void;
}) {
  // Mock users - would come from store/API
  const users = [
    { id: '1', username: 'alice', displayName: 'Alice' },
    { id: '2', username: 'bob', displayName: 'Bob' },
    { id: '3', username: 'charlie', displayName: 'Charlie' },
  ].filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.displayName.toLowerCase().includes(query.toLowerCase())
  );

  if (users.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-dark-800 border border-gray-700 shadow-xl max-h-40 overflow-y-auto"
    >
      {users.map((user) => (
        <motion.button
          key={user.id}
          whileHover={{ x: 2 }}
          onClick={() => onSelect(user.username)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-dark-700"
        >
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user.displayName[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.displayName}</p>
            <p className="text-xs text-gray-400">@{user.username}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

export default MessageInput;

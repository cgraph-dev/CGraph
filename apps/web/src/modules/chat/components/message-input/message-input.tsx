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

import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { GlassCard } from '@/shared/components/ui';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';
import { StickerPicker } from '@/modules/chat/components/sticker-picker';
import { GifPicker } from '@/modules/chat/components/gif-picker';
import { useMessageInput } from './useMessageInput';
import { ReplyPreview } from './reply-preview';
import { AttachmentsPreview } from './attachments-preview';
import { AttachmentMenu } from './attachment-menu';
import { InputToolbar } from './input-toolbar';
import { MentionAutocomplete } from './mention-autocomplete';
import type { MessageInputProps } from './types';

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

  const {
    message,
    attachments,
    attachmentMode,
    isRecording,
    showMentions,
    mentionQuery,
    inputRef,
    fileInputRef,
    handleChange,
    handleSend,
    handleKeyDown,
    handleFileSelect,
    handleDrop,
    removeAttachment,
    handleVoiceMessage,
    handleStickerSelect,
    handleGifSelect,
    handleMentionSelect,
    toggleAttachmentMode,
    setIsRecording,
    setAttachmentMode,
    setShowMentions,
  } = useMessageInput({ onSend, onTyping, replyTo });

  const canSend = message.trim().length > 0 || attachments.length > 0;

  return (
    <div
      className={`relative ${className}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
      <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />

      {/* Main Input Area */}
      <GlassCard variant="frosted" className="p-2">
        <div className="flex items-end gap-2">
          <AttachmentMenu
            attachmentMode={attachmentMode}
            onToggle={toggleAttachmentMode}
            onFileSelect={() => fileInputRef.current?.click()}
          />

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

            <AnimatePresence>
              {showMentions && (
                <MentionAutocomplete
                  query={mentionQuery}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMentions(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <InputToolbar
            attachmentMode={attachmentMode}
            isRecording={isRecording}
            canSend={canSend}
            disabled={disabled}
            primaryColor={colors.primary}
            onToggleMode={toggleAttachmentMode}
            onToggleRecording={() => setIsRecording(!isRecording)}
            onSend={handleSend}
          />
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

export default MessageInput;

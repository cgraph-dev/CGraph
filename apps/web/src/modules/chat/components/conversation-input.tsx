/**
 * ConversationInput Component
 *
 * Message input area with emoji, sticker, GIF pickers, voice recording,
 * and file attachment support.
 */

import { memo, RefObject } from 'react';
import { motion } from 'motion/react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  SparklesIcon,
  MicrophoneIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { VoiceMessageRecorder } from '@/components/media/voice-message-recorder';
import { StickerPicker, StickerButton } from '@/modules/chat/components/sticker-picker';
import { GifPicker, type GifResult } from '@/modules/chat/components/gif-picker';
import { EmojiPicker } from '@/modules/chat/components/emoji-picker';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Message } from '@/modules/chat/store';
import type { Sticker } from '@/data/stickers';

interface ConversationInputProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  isSending: boolean;
  isVoiceMode: boolean;
  setIsVoiceMode: (value: boolean) => void;
  replyTo: Message | null;
  setReplyTo: (value: Message | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (value: boolean) => void;
  showStickerPicker: boolean;
  setShowStickerPicker: (value: boolean) => void;
  showGifPicker: boolean;
  setShowGifPicker: (value: boolean) => void;
  uiPreferences: {
    enableHaptic: boolean;
  };
  onSend: () => void;
  onTyping: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect: (sticker: Sticker) => void;
  onGifSelect: (gif: GifResult) => void;
  onVoiceComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScheduleClick: () => void;
  inputContainerRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
}

function ConversationInputComponent({
  messageInput,
  setMessageInput,
  isSending,
  isVoiceMode,
  setIsVoiceMode,
  replyTo,
  setReplyTo,
  showEmojiPicker,
  setShowEmojiPicker,
  showStickerPicker,
  setShowStickerPicker,
  showGifPicker,
  setShowGifPicker,
  uiPreferences,
  onSend,
  onTyping,
  onKeyPress,
  onEmojiSelect,
  onStickerSelect,
  onGifSelect,
  onVoiceComplete,
  onFileSelect,
  onScheduleClick,
  inputContainerRef,
  fileInputRef,
}: ConversationInputProps) {
  return (
    <div
      ref={inputContainerRef}
      className="flex-shrink-0 border-t border-white/10 bg-dark-900/80 p-4 backdrop-blur-xl"
    >
      {/* Reply Preview */}
      {replyTo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mb-3 flex items-center gap-2 rounded-lg bg-primary-500/10 p-2"
        >
          <div className="h-10 w-1 rounded-full bg-primary-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary-400">
              Replying to {replyTo.sender?.displayName || 'User'}
            </p>
            <p className="truncate text-sm text-gray-400">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="rounded-full p-1 text-gray-500 hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {/* Picker Containers */}
      <div className="relative">
        <StickerPicker
          isOpen={showStickerPicker}
          onClose={() => setShowStickerPicker(false)}
          onSelect={onStickerSelect}
          className="bottom-16 left-0"
        />
        <GifPicker
          isOpen={showGifPicker}
          onClose={() => setShowGifPicker(false)}
          onSelect={onGifSelect}
          className="bottom-16 left-0"
        />
        <EmojiPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={onEmojiSelect}
          className="bottom-16 left-0"
        />
      </div>

      {isVoiceMode ? (
        <VoiceMessageRecorder
          onComplete={onVoiceComplete}
          onCancel={() => {
            setIsVoiceMode(false);
            if (uiPreferences.enableHaptic) HapticFeedback.medium();
          }}
          maxDuration={120}
          className="w-full"
        />
      ) : (
        <div className="flex items-end gap-3 p-2">
          {/* File Attachment Button */}
          <motion.button
            onClick={() => {
              fileInputRef.current?.click();
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            className="group rounded-xl p-2.5 text-gray-400 transition-all hover:bg-primary-500/20 hover:text-primary-400"
            whileHover={{ scale: 1.1, rotate: -15 }}
            whileTap={{ scale: 0.9 }}
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </motion.button>

          {/* Message Input */}
          <div className="flex-1 rounded-xl border border-primary-500/20 bg-dark-900/50 transition-all focus-within:border-primary-500/50">
            <textarea
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                onTyping();
              }}
              onKeyDown={onKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="max-h-32 w-full resize-none bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
              style={{ minHeight: '48px' }}
            />
          </div>

          {/* Emoji Button */}
          <motion.button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowStickerPicker(false);
              setShowGifPicker(false);
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            className={`group rounded-xl p-2.5 transition-all ${
              showEmojiPicker
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:bg-primary-500/20 hover:text-primary-400'
            }`}
            whileHover={{ scale: 1.1, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
            title="Add emoji"
          >
            <FaceSmileIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </motion.button>

          {/* Sticker Button */}
          <StickerButton
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowGifPicker(false);
              setShowEmojiPicker(false);
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            isActive={showStickerPicker}
            className="rounded-xl hover:bg-primary-500/20 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />

          {/* GIF Button */}
          <motion.button
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowStickerPicker(false);
              setShowEmojiPicker(false);
              if (uiPreferences.enableHaptic) HapticFeedback.light();
            }}
            className={`group rounded-xl p-2.5 transition-all ${
              showGifPicker
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:bg-primary-500/20 hover:text-primary-400'
            }`}
            whileHover={{ scale: 1.1, rotate: -15 }}
            whileTap={{ scale: 0.9 }}
            title="Send GIF"
          >
            <SparklesIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </motion.button>

          {/* Schedule Button (only when there's text) */}
          {messageInput.trim() && (
            <motion.button
              onClick={() => {
                onScheduleClick();
                if (uiPreferences.enableHaptic) HapticFeedback.medium();
              }}
              className="group rounded-xl p-2.5 text-gray-400 transition-all hover:bg-purple-500/20 hover:text-purple-400"
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              title="Schedule message"
            >
              <ClockIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </motion.button>
          )}

          {/* Voice / Send Button */}
          {messageInput.trim() ? (
            <motion.button
              onClick={onSend}
              disabled={isSending}
              className="rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 p-2.5 text-white shadow-lg transition-all hover:shadow-primary-500/30 disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Send message"
            >
              {isSending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => {
                setIsVoiceMode(true);
                if (uiPreferences.enableHaptic) HapticFeedback.medium();
              }}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-2.5 text-white shadow-lg transition-all hover:shadow-orange-500/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Record voice message"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

export const ConversationInput = memo(ConversationInputComponent);

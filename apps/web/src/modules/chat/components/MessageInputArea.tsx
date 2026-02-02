import { useRef, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { GlassCard } from '@/shared/components/ui';
import { StickerPicker, StickerButton } from '@/components/chat/StickerPicker';
import { GifPicker, type GifResult } from '@/components/chat/GifPicker';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Sticker } from '@/data/stickers';
import type { UIPreferences } from './MessageBubble';

export interface MessageInputAreaProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  isSending: boolean;
  isVoiceMode: boolean;
  setIsVoiceMode: (value: boolean) => void;
  showStickerPicker: boolean;
  setShowStickerPicker: (value: boolean) => void;
  showGifPicker: boolean;
  setShowGifPicker: (value: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (value: boolean) => void;
  uiPreferences: UIPreferences;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTyping: () => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onVoiceComplete: (data: { blob: Blob; duration: number; waveform: number[] }) => void;
  onStickerSelect: (sticker: Sticker) => void;
  onGifSelect: (gif: GifResult) => void;
  onEmojiSelect: (emoji: string) => void;
  onScheduleClick: () => void;
}

/**
 * MessageInputArea - The input area component for sending messages
 * Includes text input, emoji/sticker/GIF pickers, voice recorder, and send button
 */
export function MessageInputArea({
  messageInput,
  setMessageInput,
  isSending,
  isVoiceMode,
  setIsVoiceMode,
  showStickerPicker,
  setShowStickerPicker,
  showGifPicker,
  setShowGifPicker,
  showEmojiPicker,
  setShowEmojiPicker,
  uiPreferences,
  fileInputRef,
  onTyping,
  onSend,
  onKeyPress,
  onVoiceComplete,
  onStickerSelect,
  onGifSelect,
  onEmojiSelect,
  onScheduleClick,
}: MessageInputAreaProps) {
  const inputContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="z-10 p-4">
      <GlassCard
        variant={uiPreferences.glassEffect}
        glow={uiPreferences.enableGlow}
        hover3D={false}
        borderGradient
        className="rounded-2xl p-2"
      >
        {/* Sticker & GIF Pickers - positioned above input */}
        <div className="relative" ref={inputContainerRef}>
          <StickerPicker
            isOpen={showStickerPicker}
            onClose={() => setShowStickerPicker(false)}
            onSelect={onStickerSelect}
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
            {/* Attach file button */}
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

            {/* Text input */}
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

            {/* Schedule Button */}
            {messageInput.trim() && (
              <motion.button
                onClick={onScheduleClick}
                className="group rounded-xl p-2.5 text-gray-400 transition-all hover:bg-purple-500/20 hover:text-purple-400"
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                title="Schedule message"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <ClockIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              </motion.button>
            )}

            {/* Morphing Send/Mic Button */}
            <AnimatePresence mode="wait">
              {messageInput.trim() ? (
                <motion.button
                  key="send"
                  onClick={() => {
                    onSend();
                    if (uiPreferences.enableHaptic) HapticFeedback.success();
                  }}
                  disabled={isSending}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 p-3 text-white transition-all hover:from-primary-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {uiPreferences.enableGlow && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 opacity-0 transition-opacity group-hover:opacity-50"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <PaperAirplaneIcon className="relative z-10 h-5 w-5" />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  onClick={() => {
                    setIsVoiceMode(true);
                    if (uiPreferences.enableHaptic) HapticFeedback.medium();
                  }}
                  disabled={isSending}
                  className="group rounded-xl border border-red-500/20 p-3 text-gray-400 transition-all hover:bg-red-500/20 hover:text-red-400"
                  title="Record voice message"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MicrophoneIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default MessageInputArea;

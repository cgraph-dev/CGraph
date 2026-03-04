/**
 * InputToolbar component - emoji, sticker, voice, send buttons
 */

import { motion } from 'motion/react';
import { PaperAirplaneIcon, FaceSmileIcon, MicrophoneIcon, GifIcon } from '@heroicons/react/24/outline';
import type { AttachmentMode } from './types';

interface InputToolbarProps {
  attachmentMode: AttachmentMode;
  isRecording: boolean;
  canSend: boolean;
  disabled?: boolean;
  primaryColor: string;
  onToggleMode: (mode: AttachmentMode) => void;
  onToggleRecording: () => void;
  onSend: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Input Toolbar component.
 */
export function InputToolbar({
  attachmentMode: _attachmentMode,
  isRecording,
  canSend,
  disabled = false,
  primaryColor,
  onToggleMode,
  onToggleRecording,
  onSend,
}: InputToolbarProps) {
  return (
    <>
      {/* Emoji Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleMode('emoji')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-yellow-400"
      >
        <FaceSmileIcon className="h-6 w-6" />
      </motion.button>

      {/* Sticker Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleMode('sticker')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-purple-400"
      >
        <span className="text-lg">🎨</span>
      </motion.button>

      {/* GIF Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleMode('gif')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-green-400"
      >
        <GifIcon className="h-6 w-6" />
      </motion.button>

      {/* Voice Message Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleRecording}
        className={`rounded-lg p-2 transition-colors ${
          isRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
        }`}
      >
        <MicrophoneIcon className="h-6 w-6" />
      </motion.button>

      {/* Send Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSend}
        disabled={disabled || !canSend}
        className="rounded-xl bg-primary-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        <PaperAirplaneIcon className="h-6 w-6" />
      </motion.button>
    </>
  );
}

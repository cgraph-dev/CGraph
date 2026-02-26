/**
 * MessageInputArea - message input with sticker picker and send button
 */

import { motion } from 'framer-motion';
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { StickerPicker, StickerButton } from '@/modules/chat/components/sticker-picker';
import type { MessageInputAreaProps } from './types';
import { tweens } from '@/lib/animation-presets';

interface MessageInputAreaWithRefProps extends MessageInputAreaProps {
  inputContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * unknown for the messages module.
 */
/**
 * Message Input Area component.
 */
export function MessageInputArea({
  messageInput,
  isSending,
  showStickerPicker,
  inputContainerRef,
  onMessageChange,
  onSend,
  onToggleStickerPicker,
  onStickerSelect,
}: MessageInputAreaWithRefProps) {
  return (
    <GlassCard
      variant="frosted"
      intensity="strong"
      className="flex-shrink-0 rounded-none border-t border-white/10 p-4"
    >
      {/* Sticker Picker */}
      <div className="relative" ref={inputContainerRef}>
        <StickerPicker
          isOpen={showStickerPicker}
          onClose={() => onToggleStickerPicker()}
          onSelect={onStickerSelect}
        />
      </div>

      <div className="flex items-end gap-2">
        <motion.button
          className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          <PaperClipIcon className="h-5 w-5" />
        </motion.button>

        <StickerButton onClick={onToggleStickerPicker} isActive={showStickerPicker} />

        <div className="flex-1 rounded-xl border border-white/10 bg-dark-700/50 backdrop-blur-sm">
          <textarea
            value={messageInput}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {messageInput.trim() ? (
          <motion.button
            onClick={onSend}
            disabled={isSending}
            className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 p-2.5 text-white disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isSending ? { rotate: 360 } : {}}
            transition={tweens.smooth}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.button
            className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-primary-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * Message reply preview component.
 * @module
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { Message } from '@/modules/chat/store';
import type { UIPreferences } from './message-bubble';
import { tweens, loop, springs } from '@/lib/animation-presets';

export interface ReplyPreviewProps {
  replyTo: Message;
  uiPreferences: UIPreferences;
  onClear: () => void;
}

/**
 * ReplyPreview - Shows the message being replied to above the input
 */
export function ReplyPreview({ replyTo, uiPreferences, onClear }: ReplyPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={springs.default}
      className="z-10 px-4 py-2"
    >
      <GlassCard
        variant={uiPreferences.glassEffect}
        glow={uiPreferences.enableGlow}
        borderGradient
        className="flex items-center justify-between rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="h-10 w-1.5 rounded-full bg-gradient-to-b from-primary-500 to-purple-500"
            animate={
              uiPreferences.enableGlow
                ? {
                    boxShadow: [
                      '0 0 5px rgba(16, 185, 129, 0.3)',
                      '0 0 15px rgba(16, 185, 129, 0.6)',
                      '0 0 5px rgba(16, 185, 129, 0.3)',
                    ],
                  }
                : {}
            }
            transition={loop(tweens.ambient)}
          />
          <div>
            <p className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-xs font-semibold text-transparent">
              Replying to {replyTo.sender?.displayName || replyTo.sender?.username || 'Unknown'}
            </p>
            <p className="max-w-md truncate text-sm text-gray-300">{replyTo.content}</p>
          </div>
        </div>
        <motion.button
          onClick={() => {
            onClear();
            if (uiPreferences.enableHaptic) HapticFeedback.light();
          }}
          className="group rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            className="h-4 w-4 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}

export default ReplyPreview;

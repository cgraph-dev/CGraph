/**
 * ConversationHeader - glassmorphic header with user info and actions
 */

import { motion } from 'framer-motion';
import { PhoneIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCardNeon } from '@/shared/components/ui';
import type { ConversationHeaderProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

export function ConversationHeader({
  conversationName,
  isTyping,
  onGenerateTheme,
}: ConversationHeaderProps) {
  return (
    <GlassCardNeon className="flex h-16 flex-shrink-0 items-center justify-between rounded-none border-b border-primary-500/20 px-4">
      <motion.div
        className="flex items-center gap-3"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <motion.div
            className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ring-2 ring-primary-500/50"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
              {(conversationName || 'U').charAt(0).toUpperCase()}
            </div>
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-900 bg-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={loop(tweens.ambient)}
          />
        </div>

        <div>
          <h2 className="font-semibold text-white">{conversationName || 'Conversation'}</h2>
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="h-3 w-3 text-green-400" />
            <p className="text-xs text-gray-400">
              {isTyping ? (
                <motion.span
                  className="text-primary-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={loop(tweens.verySlow)}
                >
                  typing...
                </motion.span>
              ) : (
                'Online'
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* AI Theme Button */}
        <motion.button
          onClick={onGenerateTheme}
          className="rounded-lg bg-primary-500/20 p-2 text-primary-400 transition-colors hover:bg-primary-500/30"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          title="Generate AI Theme"
        >
          <SparklesIcon className="h-5 w-5" />
        </motion.button>

        <motion.button
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PhoneIcon className="h-5 w-5" />
        </motion.button>
      </motion.div>
    </GlassCardNeon>
  );
}

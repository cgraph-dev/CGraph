/**
 * EmptyStates Components
 *
 * Empty state displays for the messages page.
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { UserIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { EmptyStateProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * Empty conversation list state
 */
export function EmptyConversationList({ searchQuery }: EmptyStateProps) {
  const { t } = useTranslation('messages');
  return (
    <motion.div
      className="px-4 py-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.smooth}
    >
      <div className="relative mb-4 inline-block">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 to-purple-500/20 backdrop-blur-sm">
          <UserIcon className="h-8 w-8 text-primary-400" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary-400/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={loop(tweens.ambient)}
        />
      </div>
      <p className="bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-lg font-semibold text-transparent">
        {searchQuery ? t('noConversationsFound') : t('noMessagesYet')}
      </p>
      <p className="mt-2 text-sm text-gray-500">{t('startNewConversation')}</p>
    </motion.div>
  );
}

/**
 * No conversation selected state
 */
export function NoConversationSelected() {
  const { t } = useTranslation('messages');
  return (
    <motion.div
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={tweens.smooth}
    >
      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={springs.dramatic}
      >
        <div className="relative mb-6 inline-block">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 shadow-2xl backdrop-blur-sm">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-primary-400" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-purple-400/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={loop(tweens.glacial)}
          />
          <motion.div
            className="absolute -inset-4 rounded-3xl border border-primary-400/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{ ...loop(tweens.decorative), delay: 0.5 }}
          />
        </div>

        <h3 className="mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-3xl font-bold text-transparent">
          {t('yourMessages')}
          <SparklesIcon className="h-6 w-6 animate-pulse text-primary-400" />
        </h3>
        <p className="max-w-md text-lg text-gray-400">{t('selectConversation')}</p>

        <motion.div
          className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={loop(tweens.ambient)}
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
          {t('endToEndEncrypted')}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Loading spinner for conversation list
 */
export function LoadingSpinner() {
  return (
    <motion.div
      className="flex items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={loop(tweens.ambient)}
        />
      </div>
    </motion.div>
  );
}

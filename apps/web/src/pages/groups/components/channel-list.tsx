/**
 * ChannelList component
 * @module pages/groups
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, Cog6ToothIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ChannelListProps } from './types';
import { ChannelItem } from './channel-item';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * unknown for the groups module.
 */
/**
 * Channel List component.
 */
export function ChannelList({
  activeGroup,
  channelId,
  expandedCategories,
  toggleCategory,
}: ChannelListProps) {
  if (!activeGroup) {
    return (
      <div className="relative z-10 flex w-60 flex-col border-r border-primary-500/20 bg-dark-800/50 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex h-12 items-center border-b border-primary-500/20 px-4"
        >
          <h2 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text font-semibold text-transparent">
            Select a server
          </h2>
        </motion.div>
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={loop(tweens.glacial)}
            >
              <UserGroupIcon className="mx-auto mb-3 h-12 w-12 text-primary-400" />
            </motion.div>
            <p className="text-gray-400">Select a server to view channels</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex w-60 flex-col border-r border-primary-500/20 bg-dark-800/50 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

      {/* Server Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <motion.div
          whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
          className="flex h-12 cursor-pointer items-center justify-between border-b border-primary-500/20 px-4 transition-colors"
        >
          <h2 className="truncate bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text font-semibold text-transparent">
            {activeGroup.name}
          </h2>
          <motion.div whileHover={{ rotate: 180 }} transition={tweens.standard}>
            <ChevronDownIcon className="h-4 w-4 text-primary-400" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Channels */}
      <div className="relative z-10 flex-1 space-y-0.5 overflow-y-auto py-3">
        {activeGroup.categories?.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.bouncy}
          >
            {/* Category Header */}
            <motion.button
              onClick={() => {
                toggleCategory(category.id);
                HapticFeedback.light();
              }}
              whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center gap-0.5 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary-400 transition-all"
            >
              <motion.div
                animate={{ rotate: expandedCategories.has(category.id) ? 0 : -90 }}
                transition={tweens.fast}
              >
                <ChevronDownIcon className="h-3 w-3" />
              </motion.div>
              {category.name}
            </motion.button>

            {/* Category Channels */}
            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={tweens.fast}
                  className="mt-0.5 overflow-hidden"
                >
                  {category.channels?.map((channel) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={springs.bouncy}
                    >
                      <ChannelItem
                        channel={channel}
                        groupId={activeGroup.id}
                        isActive={channel.id === channelId}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Uncategorized channels */}
        {activeGroup.channels
          ?.filter((c) => !c.categoryId)
          .map((channel) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springs.bouncy}
            >
              <ChannelItem
                channel={channel}
                groupId={activeGroup.id}
                isActive={channel.id === channelId}
              />
            </motion.div>
          ))}
      </div>

      {/* User Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 flex h-14 items-center gap-2 border-t border-primary-500/20 bg-dark-900/80 px-2 backdrop-blur-sm"
      >
        <motion.div
          whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-1 cursor-pointer items-center gap-2 rounded p-1 transition-colors"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700">
            <span className="text-sm font-bold">U</span>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-500/50"
              animate={{
                boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 6px rgba(16, 185, 129, 0)'],
              }}
              transition={loop(tweens.ambient)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate bg-gradient-to-r from-white to-primary-100 bg-clip-text text-sm font-medium text-transparent">
              User
            </p>
            <p className="truncate text-xs text-primary-400">Online</p>
          </div>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => HapticFeedback.light()}
          className="rounded-lg bg-dark-700/50 p-1.5 text-gray-400 transition-colors hover:bg-dark-600 hover:text-primary-400"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}

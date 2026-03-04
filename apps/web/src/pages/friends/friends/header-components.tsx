/**
 * Header components for Friends page
 * Includes AddFriendForm, FriendsTabBar, and FriendsSearchBar
 */

import { motion, AnimatePresence } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { UserPlusIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { AddFriendFormProps, FriendsTabBarProps, FriendsSearchBarProps } from './types';
import { tweens, springs } from '@/lib/animation-presets';

/**
 * unknown for the friends module.
 */
/**
 * Friends Header component.
 */
export function FriendsHeader({
  showAddFriend,
  setShowAddFriend,
}: {
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
}) {
  return (
    <motion.div
      className="mb-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.moderate}
    >
      <h2 className="flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        <UsersIcon className="h-6 w-6 text-primary-400" />
        Friends
      </h2>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setShowAddFriend(!showAddFriend);
          HapticFeedback.medium();
        }}
        className="group rounded-xl p-2 text-gray-400 transition-all hover:bg-primary-500/20 hover:text-primary-400"
        title="Add Friend"
      >
        <UserPlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </motion.button>
    </motion.div>
  );
}

/**
 * unknown for the friends module.
 */
/**
 * Add Friend Form component.
 */
export function AddFriendForm({
  isVisible,
  addFriendInput,
  setAddFriendInput,
  onSubmit,
  isLoading,
  isSubmitting,
  addFriendError,
  addFriendSuccess,
}: AddFriendFormProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={tweens.standard}
          className="mb-4"
        >
          <form onSubmit={onSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={addFriendInput}
                onChange={(e) => setAddFriendInput(e.target.value)}
                placeholder="Enter username..."
                className="flex-1 rounded-xl border border-primary-500/30 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/30 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading || isSubmitting}
                className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-sm font-medium shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              {addFriendError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 text-xs text-red-400"
                >
                  {addFriendError}
                </motion.p>
              )}
              {addFriendSuccess && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 text-xs text-green-400"
                >
                  Friend request sent!
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * unknown for the friends module.
 */
/**
 * Friends Tab Bar component.
 */
export function FriendsTabBar({ tabs, activeTab, setActiveTab }: FriendsTabBarProps) {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...tweens.moderate, delay: 0.1 }}
    >
      {tabs.map((tab) => (
        <motion.div
          key={tab.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springs.bouncy, delay: 0.15 }}
        >
          <motion.button
            onClick={() => {
              setActiveTab(tab.id);
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="friendsTabIndicator"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent"
                style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                transition={springs.bouncy}
              />
            )}
            <span
              className={`relative z-10 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}
            >
              {tab.label}
            </span>
            <AnimatePresence mode="wait">
              {tab.count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`relative z-10 rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                      : 'bg-white/[0.08] text-gray-400'
                  }`}
                >
                  {tab.count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * unknown for the friends module.
 */
/**
 * Friends Search Bar component.
 */
export function FriendsSearchBar({
  searchQuery,
  setSearchQuery,
  isVisible,
}: FriendsSearchBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={tweens.standard}
          className="mt-3"
        >
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full rounded-xl border border-primary-500/30 bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

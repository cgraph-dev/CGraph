/**
 * FriendListItem component
 * Displays a single friend in the list with actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import { LastSeenBadge } from '@/shared/components/last-seen-badge';
import {
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon,
  UserMinusIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import type { FriendListItemProps } from './types';

export function FriendListItem({
  friend,
  statusColor,
  onMessage,
  onRemove,
  onBlock,
  dropdownOpen,
  setDropdownOpen,
}: FriendListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`group relative flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 ${
        isHovered ? 'bg-primary-500/10' : 'hover:bg-primary-500/5'
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        HapticFeedback.selection();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onMessage()}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Avatar */}
      <UserProfileCard userId={friend.id} trigger="both" className="cursor-pointer">
        <div className="relative flex-shrink-0">
          {friend.avatarUrl ? (
            <img
              src={friend.avatarUrl}
              alt={friend.username}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-dark-700"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white ring-2 ring-dark-700">
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
          <motion.span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusColor} ring-2 ring-dark-900`}
            animate={
              friend.status === 'online'
                ? {
                    boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 4px rgba(34, 197, 94, 0)'],
                  }
                : {}
            }
            transition={friend.status === 'online' ? { duration: 2, repeat: Infinity } : {}}
          />
        </div>
      </UserProfileCard>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-white">
            {friend.displayName || friend.username}
          </p>
          {friend.equippedTitleId && (
            <TitleBadge title={friend.equippedTitleId} size="xs" animated />
          )}
        </div>
        <p className="truncate text-xs text-gray-400">@{friend.username}</p>
        <LastSeenBadge
          lastSeenAt={(friend as unknown as Record<string, unknown>).lastSeenAt as string | null}
          status={friend.status}
          isOnline={friend.status === 'online'}
        />
      </div>

      {/* Actions */}
      <div
        className="relative z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onMessage();
            HapticFeedback.medium();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-1.5 transition-all hover:bg-primary-600/20"
          title="Send Message"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 transition-colors hover:text-primary-400" />
        </motion.button>
        <div className="relative">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="rounded-lg p-1.5 transition-colors hover:bg-dark-600"
          >
            <EllipsisVerticalIcon className="h-4 w-4 text-gray-400 transition-colors hover:text-white" />
          </motion.button>
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full z-20 mt-1"
                >
                  <GlassCard variant="neon" className="min-w-[140px] py-1">
                    <button
                      onClick={() => {
                        onRemove();
                        setDropdownOpen(false);
                        HapticFeedback.medium();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-dark-600/50 hover:text-white"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                      Remove
                    </button>
                    <button
                      onClick={() => {
                        onBlock();
                        setDropdownOpen(false);
                        HapticFeedback.medium();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
                    >
                      <NoSymbolIcon className="h-4 w-4" />
                      Block
                    </button>
                  </GlassCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Card component for a single blocked user row
 */

import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { itemVariants } from './animations';
import type { BlockedUser } from './types';

interface BlockedUserCardProps {
  block: BlockedUser;
  unblockingId: string | null;
  onUnblockClick: (user: BlockedUser) => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Blocked User Card display component.
 */
export function BlockedUserCard({ block, unblockingId, onUnblockClick }: BlockedUserCardProps) {
  return (
    <motion.div
      key={block.id}
      variants={itemVariants}
      layout
      className="group flex items-center gap-4 rounded-xl border border-dark-700 bg-dark-800/30 p-4 transition-colors hover:border-dark-600"
    >
      {/* Avatar */}
      {block.blockedUser.avatarUrl ? (
        <ThemedAvatar
          src={block.blockedUser.avatarUrl}
          alt={block.blockedUser.displayName}
          size="medium"
          className="h-12 w-12 ring-2 ring-dark-600"
          avatarBorderId={
            block.blockedUser.avatarBorderId ?? block.blockedUser.avatar_border_id ?? null
          }
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-lg font-bold text-white">
          {block.blockedUser.displayName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-medium text-white">{block.blockedUser.displayName}</h4>
        <p className="truncate text-sm text-gray-500">@{block.blockedUser.username}</p>
      </div>

      {/* Blocked Time */}
      <div className="hidden text-sm text-gray-500 sm:block">
        Blocked {formatDistanceToNow(new Date(block.blockedAt), { addSuffix: true })}
      </div>

      {/* Unblock Button */}
      <button
        onClick={() => onUnblockClick(block)}
        disabled={unblockingId === block.blockedUserId}
        className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {unblockingId === block.blockedUserId ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        )}
        Unblock
      </button>
    </motion.div>
  );
}

/**
 * QuickActions - action buttons for user interactions
 */

import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellSlashIcon,
  NoSymbolIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  isMuted: boolean;
  isBlocking: boolean;
  isBlockLoading: boolean;
  onViewProfile: () => void;
  onCustomizeChat: () => void;
  onMuteToggle: () => void;
  onBlockClick: () => void;
  onReportClick: () => void;
}

export function QuickActions({
  isMuted,
  isBlocking,
  isBlockLoading,
  onViewProfile,
  onCustomizeChat,
  onMuteToggle,
  onBlockClick,
  onReportClick,
}: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="space-y-2 border-t border-white/10 pt-4"
    >
      <motion.button
        onClick={onViewProfile}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-500"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <UserCircleIcon className="h-5 w-5" />
        View Full Profile
      </motion.button>

      <motion.button
        onClick={onCustomizeChat}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-600/20 px-4 py-2 font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        Customize Chat
      </motion.button>

      <div className="grid grid-cols-2 gap-2">
        <motion.button
          onClick={onMuteToggle}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isMuted
              ? 'border border-yellow-500/30 bg-yellow-600/20 text-yellow-400'
              : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BellSlashIcon className="h-4 w-4" />
          {isMuted ? 'Unmute' : 'Mute'}
        </motion.button>

        <motion.button
          onClick={onBlockClick}
          disabled={isBlocking || isBlockLoading}
          className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <NoSymbolIcon className="h-4 w-4" />
          {isBlocking ? 'Blocking...' : 'Block'}
        </motion.button>
      </div>

      <motion.button
        onClick={onReportClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-dark-600"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FlagIcon className="h-4 w-4" />
        Report User
      </motion.button>
    </motion.div>
  );
}

/**
 * ServerList component
 * @module pages/groups
 */

import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { PlusIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { ServerListProps } from './types';
import { ServerIcon } from './ServerIcon';

export function ServerList({ groups, activeGroupId }: ServerListProps) {
  return (
    <div className="relative z-10 flex w-[72px] flex-col items-center gap-2 overflow-y-auto border-r border-primary-500/20 bg-dark-900/50 py-3 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

      {/* Home/DMs button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <NavLink to="/messages" onClick={() => HapticFeedback.medium()} className="group relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-700 transition-all duration-200 group-hover:rounded-xl group-hover:bg-primary-600"
            style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 blur-lg group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
        </NavLink>
      </motion.div>

      <div className="mx-auto h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      {/* Server list */}
      {groups.map((group, index) => (
        <motion.div
          key={group.id}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.1 + index * 0.05,
          }}
        >
          <ServerIcon group={group} isActive={group.id === activeGroupId} />
        </motion.div>
      ))}

      {/* Add server button */}
      <motion.button
        onClick={() => HapticFeedback.medium()}
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Create new server"
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-700 transition-all duration-200 hover:rounded-xl hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700"
        style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
      >
        <PlusIcon className="h-6 w-6 text-green-400 transition-colors group-hover:text-white" />
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-green-600/20 opacity-0 blur-lg group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    </div>
  );
}

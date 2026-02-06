/**
 * ServerIcon component
 * @module pages/groups
 */

import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { ServerIconProps } from './types';

export function ServerIcon({ group, isActive }: ServerIconProps) {
  return (
    <NavLink
      to={`/groups/${group.id}/channels/${group.channels?.[0]?.id || ''}`}
      onClick={() => HapticFeedback.medium()}
      className="group relative"
    >
      {/* Active indicator */}
      <motion.div
        className="absolute left-0 top-1/2 w-1 -translate-x-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-600"
        animate={{
          height: isActive ? 40 : 0,
        }}
        whileHover={{
          height: isActive ? 40 : 20,
        }}
        style={{
          boxShadow: isActive ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Icon */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
        <div
          className={`relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden transition-all ${
            isActive
              ? 'rounded-xl bg-gradient-to-br from-primary-600 to-primary-700'
              : 'rounded-2xl bg-dark-700 group-hover:rounded-xl group-hover:bg-primary-600'
          }`}
          style={{
            boxShadow: isActive
              ? '0 4px 15px rgba(16, 185, 129, 0.4)'
              : '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
        >
          {group.iconUrl ? (
            <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">
              {group.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Hover glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 blur-lg group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </NavLink>
  );
}

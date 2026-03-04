/**
 * Group Icon
 *
 * Circular group icon for the sidebar with active indicator and tooltip.
 */

import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { GroupIconProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Group Icon component.
 */
export function GroupIcon({ group, onClick }: GroupIconProps) {
  return (
    <NavLink
      to={`/groups/${group.id}`}
      onClick={() => {
        HapticFeedback.medium();
        onClick();
      }}
      className="group relative"
    >
      {({ isActive: routeActive }) => (
        <>
          {/* Active indicator */}
          <motion.div
            initial={false}
            animate={{
              height: routeActive ? 40 : 8,
              opacity: routeActive ? 1 : 0.5,
            }}
            className="absolute -left-3 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white"
          />

          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.05, borderRadius: '35%' }}
            whileTap={{ scale: 0.95 }}
            className="relative h-12 w-12 overflow-hidden rounded-full bg-dark-700 transition-all duration-200"
            style={{
              borderRadius: routeActive ? '35%' : '50%',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            }}
          >
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="font-bold text-white">{group.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}

            {/* Online indicator */}
            {group.onlineMemberCount > 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-dark-900 bg-green-500">
                <span className="text-[8px] font-bold text-white">
                  {group.onlineMemberCount > 99 ? '99+' : group.onlineMemberCount}
                </span>
              </div>
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 whitespace-nowrap rounded-lg bg-dark-800 px-3 py-2 text-sm font-medium text-white shadow-xl"
          >
            {group.name}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-dark-800" />
          </motion.div>
        </>
      )}
    </NavLink>
  );
}

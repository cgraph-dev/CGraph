/**
 * Group List Item
 *
 * Horizontal group item for list view.
 */

import { motion } from 'framer-motion';
import { LockClosedIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { GroupListItemProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Group List Item component.
 */
export function GroupListItem({ group, onClick }: GroupListItemProps) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard variant="frosted" className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-lg font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-white">{group.name}</h3>
              {!group.isPublic && (
                <LockClosedIcon className="h-4 w-4 flex-shrink-0 text-yellow-400" />
              )}
            </div>
            {group.description && (
              <p className="mt-0.5 truncate text-sm text-gray-400">{group.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span>{group.memberCount} members</span>
              {group.onlineMemberCount > 0 && (
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {group.onlineMemberCount} online
                </span>
              )}
            </div>
          </div>

          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        </div>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Group Card
 *
 * Rich group card for grid view with banner and stats.
 */

import { motion } from 'motion/react';
import { GlobeAltIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { GroupCardProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Group Card display component.
 */
export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Banner */}
        <div className="relative h-24">
          {group.bannerUrl ? (
            <img src={group.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary-600/50 to-purple-600/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />

          {/* Icon */}
          <div className="absolute -bottom-8 left-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border-4 border-dark-900 bg-white/[0.04]">
              {group.iconUrl ? (
                <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                  <span className="text-xl font-bold text-white">
                    {group.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Public/Private badge */}
          <div className="absolute right-2 top-2">
            {group.isPublic ? (
              <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                <GlobeAltIcon className="h-3 w-3" />
                Public
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                <LockClosedIcon className="h-3 w-3" />
                Private
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-10">
          <h3 className="truncate font-bold text-white">{group.name}</h3>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-400">{group.description}</p>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{group.memberCount} members</span>
            </div>
            {group.onlineMemberCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>{group.onlineMemberCount} online</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

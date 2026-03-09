/**
 * ProfileNameSection - Display name, verification badges, title, and status
 */

import { motion } from 'motion/react';
import { ShieldCheckIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import type { UserProfileData } from '@/types/profile.types';
import { springs } from '@/lib/animation-presets';

interface ProfileNameSectionProps {
  profile: UserProfileData;
}

/**
 * unknown for the profile module.
 */
/**
 * Profile Name Section section component.
 */
export function ProfileNameSection({ profile }: ProfileNameSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
          {profile.displayName || profile.username}
        </h1>
        {profile.isVerified && (
          <motion.div whileHover={{ scale: 1.2, rotate: 360 }} transition={springs.bouncy}>
            <CheckBadgeIcon className="h-6 w-6 text-primary-500" />
          </motion.div>
        )}
        {profile.isPremium && (
          <motion.div whileHover={{ scale: 1.2, rotate: 360 }} transition={springs.bouncy}>
            <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
          </motion.div>
        )}
      </div>

      {/* User Title */}
      <div className="mt-0.5 flex items-center gap-2">
        <p className="text-gray-400">@{profile.username}</p>
        {/* TODO(phase-26): Rewire — gamification components deleted */}
        {profile.equippedTitle && (
          <span className="text-xs text-purple-400">{profile.equippedTitle}</span>
        )}
      </div>

      {profile.statusMessage && (
        <p className="mt-1 text-sm text-gray-500">{profile.statusMessage}</p>
      )}
    </div>
  );
}

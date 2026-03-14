/**
 * Profile statistics display component.
 * @module
 */
import { motion } from 'motion/react';
import { springs } from '@/lib/animation-presets';
import {
  UserPlusIcon,
  StarIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { PulseDots } from '@/modules/pulse';
import { TipButton } from '@/modules/nodes/components/tip-button';
import type { UserProfileData } from '@/types/profile.types';

interface ProfileStatsGridProps {
  profile: UserProfileData;
}

/**
 * unknown for the social module.
 */
/**
 * Profile Stats Grid component.
 */
export function ProfileStatsGrid({ profile }: ProfileStatsGridProps) {
  return (
    <GlassCard variant="frosted" className="p-6">
      <h2 className="mb-4 flex items-center gap-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
        <ChartBarIcon className="h-5 w-5 text-primary-400" />
        Statistics
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div
          className="rounded-xl border border-primary-500/20 bg-white/[0.04] p-4 text-center"
          whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.5)' }}
        >
          <div className="bg-gradient-to-r from-primary-400 to-green-400 bg-clip-text text-2xl font-bold text-transparent">
            {(profile.level || 1).toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <StarIcon className="h-3 w-3" />
            Level
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-purple-500/20 bg-white/[0.04] p-4 text-center"
          whileHover={{ scale: 1.05, borderColor: 'rgba(139, 92, 246, 0.5)' }}
        >
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
            {(profile.totalXP || 0).toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <SparklesIcon className="h-3 w-3" />
            Total XP
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-orange-500/20 bg-white/[0.04] p-4 text-center"
          whileHover={{ scale: 1.05, borderColor: 'rgba(249, 115, 22, 0.5)' }}
        >
          <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-2xl font-bold text-transparent">
            {(profile.loginStreak || 0).toLocaleString()}
            {(profile.loginStreak || 0) > 0 && <FireIcon className="h-5 w-5 text-orange-400" />}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <BoltIcon className="h-3 w-3" />
            Day Streak
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-blue-500/20 bg-white/[0.04] p-4 text-center"
          whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
        >
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
            {(profile.friendsCount || 0).toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <UserPlusIcon className="h-3 w-3" />
            Friends
          </div>
        </motion.div>
      </div>
    </GlassCard>
  );
}

interface ProfileSidebarProps {
  profile: UserProfileData;
  /** Whether viewing own profile (hides tip button) */
  isOwnProfile?: boolean;
}

/**
 * unknown for the social module.
 */
/**
 * Profile Sidebar component.
 */
export function ProfileSidebar({ profile, isOwnProfile }: ProfileSidebarProps) {
  const topCommunities = profile.topCommunities ?? [];

  return (
    <div className="space-y-6">
      {/* Pulse Reputation Card */}
      <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <motion.div
            className="rounded-lg bg-primary-500/20 p-2"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.bouncy}
          >
            <SparklesIcon className="h-6 w-6 text-primary-400" />
          </motion.div>
          <div>
            <p className="text-sm text-gray-400">Pulse Reputation</p>
            {topCommunities.length > 0 && topCommunities[0] ? (
              <PulseDots
                score={topCommunities[0].score}
                tier={topCommunities[0].tier}
                size="md"
                showLabel
                showTooltip
              />
            ) : (
              <PulseDots score={0} tier="newcomer" size="md" showLabel showTooltip />
            )}
          </div>
        </div>

        {/* Top-3 Communities */}
        {topCommunities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Top Communities</p>
            {topCommunities.slice(0, 3).map((community) => (
              <div
                key={community.forumId}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
              >
                <span className="truncate text-sm text-gray-300">{community.forumName}</span>
                <PulseDots
                  score={community.score}
                  tier={community.tier}
                  size="sm"
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Tip Button (only for other users' profiles) */}
      {!isOwnProfile && (
        <GlassCard variant="frosted" className="p-4">
          <p className="mb-3 text-center text-sm text-gray-400">Support this creator</p>
          <TipButton
            recipientId={profile.id}
            recipientName={profile.displayName ?? profile.username}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600/20 px-4 py-2.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
          />
        </GlassCard>
      )}

      <GlassCard variant="frosted" className="space-y-4 p-6">
        <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 text-gray-400">
          <CalendarDaysIcon className="h-5 w-5 text-primary-400" />
          <span>
            Joined{' '}
            {new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </motion.div>

        {profile.location && (
          <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 text-gray-400">
            <MapPinIcon className="h-5 w-5 text-primary-400" />
            <span>{profile.location}</span>
          </motion.div>
        )}

        {profile.website && (
          <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 text-gray-400">
            <LinkIcon className="h-5 w-5 text-primary-400" />
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 transition-colors hover:text-primary-300"
              onClick={() => HapticFeedback.light()}
            >
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}

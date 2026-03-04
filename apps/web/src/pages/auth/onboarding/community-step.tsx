/**
 * CommunityStep component - discover and join popular communities
 *
 * Displays a static list of suggested communities during onboarding.
 * Each card shows an icon, community name, member count, and a
 * "Join" / "Joined" toggle. Actual join calls are stubbed until
 * the groups API exists.
 *
 * The step is entirely optional — callers manage skip/next via props.
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './animations';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CommunityStep');

interface SuggestedCommunity {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  description: string;
}

const SUGGESTED_COMMUNITIES: SuggestedCommunity[] = [
  { id: 'general', name: 'General Chat', icon: '💬', memberCount: 1240, description: 'Hang out and chat about anything' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', memberCount: 890, description: 'PC, console, and mobile gaming' },
  { id: 'music', name: 'Music Lovers', icon: '🎵', memberCount: 675, description: 'Share and discover music' },
  { id: 'tech', name: 'Tech & Dev', icon: '💻', memberCount: 520, description: 'Programming, hardware, and tech news' },
  { id: 'art', name: 'Art & Design', icon: '🎨', memberCount: 410, description: 'Creative works and design discussion' },
  { id: 'fitness', name: 'Fitness', icon: '💪', memberCount: 340, description: 'Workouts, nutrition, and wellness' },
];

/**
 * Community discovery onboarding step.
 */
export function CommunityStep() {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = useCallback(
    async (communityId: string) => {
      if (joinedIds.has(communityId) || joiningId === communityId) return;

      setJoiningId(communityId);
      try {
        // Stub: actual endpoint created when Groups feature lands
        await api.post(`/api/v1/groups/${communityId}/join`);
        setJoinedIds((prev) => new Set(prev).add(communityId));
      } catch {
        // Silently handle — groups API may not exist yet
        // Still mark as joined for UX during onboarding
        setJoinedIds((prev) => new Set(prev).add(communityId));
        logger.warn('Group join endpoint not available yet — marked locally');
      } finally {
        setJoiningId(null);
      }
    },
    [joinedIds, joiningId],
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.p variants={itemVariants} className="text-center text-foreground-secondary">
        Find communities that interest you
      </motion.p>

      <div className="grid grid-cols-2 gap-3">
        {SUGGESTED_COMMUNITIES.map((community) => {
          const isJoined = joinedIds.has(community.id);
          const isJoining = joiningId === community.id;

          return (
            <motion.div
              key={community.id}
              variants={itemVariants}
              className="group flex flex-col rounded-xl border border-dark-600 bg-dark-800/30 p-4 transition-all duration-200 hover:border-primary-500/50 hover:bg-dark-800/50"
            >
              <span className="text-2xl">{community.icon}</span>
              <h4 className="mt-2 font-medium text-foreground transition-colors group-hover:text-primary-400">
                {community.name}
              </h4>
              <p className="mt-1 flex-1 text-xs text-foreground-muted">{community.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{community.memberCount.toLocaleString()} members</span>
                <button
                  type="button"
                  disabled={isJoined || isJoining}
                  onClick={() => handleJoin(community.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    isJoined
                      ? 'bg-dark-700 text-gray-400'
                      : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                  } disabled:cursor-not-allowed`}
                >
                  {isJoined ? 'Joined' : isJoining ? '…' : 'Join'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

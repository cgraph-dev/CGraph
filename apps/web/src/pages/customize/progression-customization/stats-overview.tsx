/**
 * Progression stats overview component.
 * @module
 */
import { StarIcon, BoltIcon, FireIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

interface StatsOverviewProps {
  level: number;
  xp: number;
  currentStreak: number;
}

/**
 * unknown for the customize module.
 */
/**
 * Stats Overview component.
 */
export function StatsOverview({ level, xp, currentStreak }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <GlassCard variant="holographic" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500">
            <StarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/60">Level</p>
            <p className="text-2xl font-bold text-white">{level}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="holographic" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <BoltIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/60">Total XP</p>
            <p className="text-2xl font-bold text-white">{xp.toLocaleString()}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="holographic" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
            <FireIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/60">Streak</p>
            <p className="text-2xl font-bold text-white">{currentStreak} days</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

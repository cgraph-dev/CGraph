/**
 * StatsHeader component - shows achievement statistics summary
 */

import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { RARITY_COLORS } from './constants';
import type { AchievementRarity, AchievementStats } from './types';

interface StatsHeaderProps {
  stats: AchievementStats;
}

const RARITY_ORDER: AchievementRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export function StatsHeader({ stats }: StatsHeaderProps) {
  return (
    <GlassCard variant="frosted" className="mb-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="mb-1 text-lg font-semibold">Achievements</h3>
          <p className="text-sm text-gray-400">
            {stats.unlocked} of {stats.total} unlocked
          </p>
        </div>
        <div className="flex items-center gap-3">
          {RARITY_ORDER.map((rarity) => (
            <div
              key={rarity}
              className="flex items-center gap-1"
              title={`${rarity}: ${stats.byRarity[rarity].unlocked}/${stats.byRarity[rarity].total}`}
            >
              <StarIconSolid className="h-4 w-4" style={{ color: RARITY_COLORS[rarity] }} />
              <span className="text-sm">
                {stats.byRarity[rarity].unlocked}/{stats.byRarity[rarity].total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

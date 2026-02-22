/**
 * TitlesHeader Component
 *
 * Header section with page title, stats, and equipped badge
 */

import { SparklesIcon } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/glass-card';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import { TITLES } from '@/data/titles';
import type { TitlesHeaderProps } from './types';

export function TitlesHeader({ stats, equippedTitleId }: TitlesHeaderProps) {
  const equippedTitle = equippedTitleId ? TITLES.find((t) => t.id === equippedTitleId) : null;

  return (
    <GlassCard className="mb-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent-primary/20 rounded-xl p-2">
            <SparklesIcon className="text-accent-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-text-primary text-2xl font-bold">Titles</h1>
            <p className="text-text-secondary text-sm">
              {stats.owned} / {stats.total} titles collected
            </p>
          </div>
        </div>

        {equippedTitle && (
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">Equipped:</span>
            <TitleBadge title={equippedTitle.id} size="lg" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * TitlesGrid Component
 *
 * Grid display of title cards with loading/empty states
 */

import { AnimatePresence } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/glass-card';
import { TitleCard } from './title-card';
import type { TitlesGridProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Titles Grid component.
 */
export function TitlesGrid({
  titles,
  isLoading,
  actionLoading,
  equippedTitleId,
  isOwned,
  onEquip,
  onUnequip,
  onPurchase,
}: TitlesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GlassCard key={i} className="bg-surface-secondary h-48 animate-pulse">
            <div />
          </GlassCard>
        ))}
      </div>
    );
  }

  if (titles.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <SparklesIcon className="text-text-tertiary mx-auto mb-4 h-12 w-12" />
        <h3 className="text-text-primary mb-2 text-lg font-medium">No titles found</h3>
        <p className="text-text-secondary text-sm">
          Try adjusting your filters or check back later for new titles.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {titles.map((title) => (
          <TitleCard
            key={title.id}
            title={title}
            isOwned={isOwned(title.id)}
            isEquipped={equippedTitleId === title.id}
            actionLoading={actionLoading}
            onEquip={onEquip}
            onUnequip={onUnequip}
            onPurchase={onPurchase}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

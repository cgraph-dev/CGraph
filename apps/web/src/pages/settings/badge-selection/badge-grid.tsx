/**
 * Badge Grid Component
 */

import { Search } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS } from './constants';
import { BadgeCard } from './badge-card';
import type { BadgeGridProps } from './types';

export function BadgeGrid({
  badgesByCategory,
  equippedBadges,
  userIsPremium,
  onEquip,
  onPreview,
}: BadgeGridProps) {
  const categoryEntries = Object.entries(badgesByCategory);

  if (categoryEntries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Search className="mx-auto mb-4 h-16 w-16 text-gray-600" />
        <p className="text-gray-400">No badges found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categoryEntries.map(([category, categoryBadges]) => {
        if (categoryBadges.length === 0) return null;

        const Icon = CATEGORY_ICONS[category];

        return (
          <div key={category}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              {Icon && <Icon className="h-6 w-6" />}
              {CATEGORY_LABELS[category] || category}
              <span className="text-sm font-normal text-gray-400">({categoryBadges.length})</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {categoryBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isEquipped={equippedBadges.includes(badge.id)}
                  onEquip={() => onEquip(badge.id)}
                  onPreview={() => onPreview(badge)}
                  userIsPremium={userIsPremium}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

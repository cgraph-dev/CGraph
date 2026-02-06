/**
 * Badge Selection Page
 *
 * Main component for badge browsing, filtering, and equipping.
 */

import { useState, useMemo } from 'react';
import { Award } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useAuthStore } from '@/stores/authStore';
import VisibilityBadge from '@/modules/settings/components/VisibilityBadge';
import { toast } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';
import { MAX_EQUIPPED_BADGES } from './constants';
import { EquippedBadgesPanel } from './EquippedBadgesPanel';
import { BadgeFilters } from './BadgeFilters';
import { BadgeGrid } from './BadgeGrid';
import { BadgePreviewModal } from './BadgePreviewModal';
import type { Badge } from './types';

const logger = createLogger('BadgeSelection');

export default function BadgeSelection() {
  const user = useAuthStore((state) => state.user);
  const { achievements, equippedBadges, equipBadge, unequipBadge } = useGamificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [previewBadge, setPreviewBadge] = useState<Badge | null>(null);

  // Convert achievements to badges
  const badges = useMemo(() => {
    return achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rarity: achievement.rarity,
      isUnlocked: achievement.unlocked,
      isPremium: achievement.rarity === 'legendary' || achievement.rarity === 'epic',
      unlockedAt: achievement.unlockedAt,
      progress: achievement.progress,
      requirement: achievement.maxProgress,
    }));
  }, [achievements]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      const matchesSearch =
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [badges, searchQuery, selectedCategory, selectedRarity]);

  // Group badges by category
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, Badge[]> = {};
    filteredBadges.forEach((badge) => {
      const category = badge.category ?? 'other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category]!.push(badge);
    });
    return grouped;
  }, [filteredBadges]);

  const userIsPremium =
    user?.subscription?.tier === 'pro' || (user?.subscription?.tier as string) === 'business';

  const handleEquipBadge = async (badgeId: string) => {
    try {
      if (equippedBadges.length >= MAX_EQUIPPED_BADGES && !equippedBadges.includes(badgeId)) {
        toast.warning('You can only equip up to 5 badges. Unequip one first.');
        return;
      }

      if (equippedBadges.includes(badgeId)) {
        await unequipBadge(badgeId);
        toast.success('Badge unequipped!');
      } else {
        await equipBadge(badgeId);
        toast.success('Badge equipped!');
      }
    } catch (error) {
      logger.error('Failed to equip/unequip badge:', error);
      toast.error('Failed to update badge. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Award className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Badges</h1>
          <VisibilityBadge visible="others" />
        </div>
        <p className="text-gray-400">
          Equip up to 5 badges to display on your profile. Badges showcase your achievements.
        </p>
      </div>

      {/* Equipped Badges */}
      <EquippedBadgesPanel
        equippedBadges={equippedBadges}
        badges={badges}
        onUnequip={handleEquipBadge}
      />

      {/* Filters */}
      <BadgeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
      />

      {/* Badge Grid */}
      <BadgeGrid
        badgesByCategory={badgesByCategory}
        equippedBadges={equippedBadges}
        userIsPremium={userIsPremium}
        onEquip={handleEquipBadge}
        onPreview={setPreviewBadge}
      />

      {/* Preview Modal */}
      <BadgePreviewModal badge={previewBadge} onClose={() => setPreviewBadge(null)} />
    </div>
  );
}

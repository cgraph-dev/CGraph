/**
 * Badge Selection Page
 *
 * Main component for badge browsing, filtering, and equipping.
 */

import { useState, useMemo } from 'react';
import { Award } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { useProfileStore } from '@/modules/social/store/profileStore.impl';
import { ALL_BADGES } from '@/data/badgesCollection';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import { toast } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';
import { MAX_EQUIPPED_BADGES } from './constants';
import { EquippedBadgesPanel } from './equipped-badges-panel';
import { BadgeFilters } from './badge-filters';
import { BadgeGrid } from './badge-grid';
import { BadgePreviewModal } from './badge-preview-modal';
import type { Badge } from './types';

const logger = createLogger('BadgeSelection');

/** Map BadgeDefinition[] to Badge[] */
const MAPPED_BADGES: Badge[] = ALL_BADGES.map((b) => ({
  id: b.id,
  name: b.name,
  description: b.description,
  icon: b.icon,
  category: b.rarity, // group by rarity as category
  rarity: b.rarity,
  isUnlocked: b.unlocked,
  isPremium: b.isPremium,
  progress: b.unlocked ? 1 : 0,
  requirement: 1,
}));

/**
 * Badge Selection component.
 */
export default function BadgeSelection() {
  const user = useAuthStore((state) => state.user);
  const equippedBadges = useCustomizationStore((s) => s.equippedBadges) ?? [];
  const setEquippedBadges = useCustomizationStore((s) => s.setEquippedBadges);
  const profileEquipBadge = useProfileStore((s) => s.equipBadge);
  const profileUnequipBadge = useProfileStore((s) => s.unequipBadge);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [previewBadge, setPreviewBadge] = useState<Badge | null>(null);

  const badges = MAPPED_BADGES;

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
    user?.subscription?.tier === 'premium' ||
    (typeof user?.subscription?.tier === 'string' && user.subscription.tier === 'enterprise');

  const handleEquipBadge = async (badgeId: string) => {
    try {
      if (equippedBadges.length >= MAX_EQUIPPED_BADGES && !equippedBadges.includes(badgeId)) {
        toast.warning('You can only equip up to 5 badges. Unequip one first.');
        return;
      }

      if (equippedBadges.includes(badgeId)) {
        await profileUnequipBadge(badgeId);
        setEquippedBadges(equippedBadges.filter((id) => id !== badgeId));
        toast.success('Badge unequipped!');
      } else {
        await profileEquipBadge(badgeId);
        setEquippedBadges([...equippedBadges, badgeId]);
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

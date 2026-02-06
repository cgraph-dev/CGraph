/**
 * Badge Selection Types
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  isUnlocked: boolean;
  isPremium: boolean;
  unlockedAt?: string;
  progress: number;
  requirement: number;
}

export interface BadgeCardProps {
  badge: Badge;
  isEquipped: boolean;
  onEquip: () => void;
  onPreview: () => void;
  userIsPremium: boolean;
}

export interface EquippedBadgesPanelProps {
  equippedBadges: string[];
  badges: Badge[];
  onUnequip: (badgeId: string) => void;
}

export interface BadgeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedRarity: string;
  onRarityChange: (rarity: string) => void;
}

export interface BadgePreviewModalProps {
  badge: Badge | null;
  onClose: () => void;
}

export interface BadgeGridProps {
  badgesByCategory: Record<string, Badge[]>;
  equippedBadges: string[];
  userIsPremium: boolean;
  onEquip: (badgeId: string) => void;
  onPreview: (badge: Badge) => void;
}

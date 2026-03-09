/**
 * Title Selection Types
 */

import type { TitleRarity } from '@/data/titles';

export interface PreviewTitle {
  id: string;
  name: string;
  description: string;
  color: string;
  rarity: TitleRarity;
}

export interface TitleCardProps {
  title: {
    id: string;
    name: string;
    description: string;
    color: string;
    rarity: TitleRarity;
    unlocked?: boolean;
  };
  isEquipped: boolean;
  onEquip: () => void;
  onPreview: () => void;
  userIsPremium: boolean;
}

export interface TitlePreviewModalProps {
  previewTitle: PreviewTitle | null;
  displayName: string;
  getRarityColor: (rarity: TitleRarity) => string;
  onClose: () => void;
}

import type { ProfileCardStyle } from '@/modules/settings/store/customization';

export const profileStyles: {
  id: ProfileCardStyle;
  name: string;
  icon: string;
  premium?: boolean;
}[] = [
  { id: 'default', name: 'Default', icon: '📋' },
  { id: 'minimal', name: 'Minimal', icon: '✨' },
  { id: 'card', name: 'Card', icon: '🎴' },
  { id: 'full', name: 'Full Width', icon: '📐' },
  { id: 'compact', name: 'Compact', icon: '📦' },
  { id: 'premium', name: 'Premium', icon: '👑', premium: true },
];

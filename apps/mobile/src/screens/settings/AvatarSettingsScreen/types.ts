/**
 * AvatarSettingsScreen Types
 */

export interface AvatarStyle {
  borderStyle:
    | 'none'
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'pulse'
    | 'spin'
    | 'glow'
    | 'neon'
    | 'fire'
    | 'electric';
  borderWidth: number;
  borderColor: string;
  glowIntensity: number;
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast';
  shape: 'circle' | 'rounded-square' | 'hexagon' | 'octagon' | 'shield' | 'diamond';
  statusIndicator: 'dot' | 'ring' | 'none';
  statusColor: string;
  showBadge: boolean;
  badgePosition: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export interface SectionProps {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}

export interface OptionGridProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  columns?: number;
}

export interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
}

export interface ColorOption {
  name: string;
  color: string;
}

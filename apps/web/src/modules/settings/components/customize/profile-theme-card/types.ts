import type { ProfileThemeConfig } from '@/data/profileThemes';

export interface ProfileThemeCardProps {
  theme: ProfileThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
  allowPreview?: boolean;
  showParticles?: boolean;
}

export interface ProfileThemeGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

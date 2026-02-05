/**
 * Type definitions for ThemeCustomization
 * @module pages/customize/theme-customization
 */

export type ThemeCategory = 'profile' | 'chat' | 'forum' | 'app';

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  preview: string; // CSS gradient or solid color for preview
  unlocked: boolean;
  unlockRequirement?: string;
  isPremium?: boolean;
}

export interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isPreviewing: boolean;
  onApply: (theme: Theme) => void;
  delay?: number;
}

export interface CategoryTab {
  id: ThemeCategory;
  name: string;
  icon: React.ReactNode;
  description: string;
}

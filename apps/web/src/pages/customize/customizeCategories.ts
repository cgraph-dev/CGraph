/**
 * Customization page category definitions.
 * @module
 */
import {
  UserCircleIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export type CategoryId = 'identity' | 'themes' | 'chat' | 'effects' | 'progression';

export interface Category {
  id: CategoryId;
  label: string;
  icon: typeof UserCircleIcon;
  description: string;
  gradient: string;
  features: string[];
}

export const categories: Category[] = [
  {
    id: 'identity',
    label: 'Identity',
    icon: UserCircleIcon,
    description: 'Avatar borders, titles, badges & layouts',
    gradient: 'from-purple-500 to-pink-500',
    features: ['150+ Borders', '25+ Titles', 'Badges', 'Layouts'],
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: PaintBrushIcon,
    description: 'Profile, chat, forum & app themes',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['20+ Themes', 'Custom Colors', 'Presets'],
  },
  {
    id: 'chat',
    label: 'Chat Styling',
    icon: ChatBubbleLeftRightIcon,
    description: 'Bubble styles, effects & reactions',
    gradient: 'from-green-500 to-emerald-500',
    features: ['50+ Styles', 'Animations', 'Reactions'],
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: SparklesIcon,
    description: 'Particles, backgrounds & animations',
    gradient: 'from-yellow-500 to-orange-500',
    features: ['12+ Particles', '10+ BGs', 'UI Animations'],
  },
  {
    id: 'progression',
    label: 'Progression',
    icon: TrophyIcon,
    description: 'Achievements, quests & leaderboards',
    gradient: 'from-red-500 to-pink-500',
    features: ['Achievements', 'Quests', 'Rewards'],
  },
];

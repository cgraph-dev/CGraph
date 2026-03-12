/**
 * Interactive Demo Module Types
 */

/** Per-user profile metadata for the chat demo */
export interface DemoUserProfile {
  titleId: string;
  title: string;
  borderStyle: string;
  borderType: 'legendary' | 'electric' | 'fire' | 'ice' | 'none' | 'static';
  borderColor?: 'emerald' | 'purple' | 'cyan' | 'orange' | 'pink' | 'gold' | 'crimson' | 'arctic';
  titleAnimation?:
    | 'shimmer'
    | 'pulse'
    | 'glow'
    | 'fire'
    | 'electric'
    | 'rainbow'
    | 'sparkle'
    | 'wave'
    | 'none';
  bubbleAccent: string;
  bubbleBorder: string;
  nameColor: string;
  badges: { icon: string; label: string }[];
  karma: number;
}

/** Chat message in the demo conversation */
export interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { type: 'approved' | 'disapproved'; count: number }[];
  reactionsVisible?: boolean;
  profile?: DemoUserProfile;
  showTutorial?: boolean;
}

/** Tab configuration for the demo switcher */
export interface DemoTab {
  id: string;
  label: string;
  icon: string;
}

/** Props for the main InteractiveDemo component */
export interface InteractiveDemoProps {
  className?: string;
}

/** Title showcase entry */
export interface DemoTitle {
  id: string;
  name: string;
  rarity: string;
  color: string;
  animation: string;
  unlock: string;
}

/** Achievement showcase entry */
export interface DemoAchievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  rarity: string;
  category: string;
}

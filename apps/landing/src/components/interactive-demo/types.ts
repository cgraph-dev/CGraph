/**
 * Interactive Demo Module Types
 */

/** Per-user profile metadata for the chat demo */
export interface DemoUserProfile {
  level: number;
  title: string;
  titleColor: string;
  borderStyle: string;
  borderType: 'legendary' | 'electric' | 'fire';
  bubbleAccent: string;
  bubbleBorder: string;
  nameColor: string;
  badges: { icon: string; label: string }[];
  xp: number;
  maxXp: number;
  karma: number;
  streak: number;
}

/** Chat message in the demo conversation */
export interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
  profile?: DemoUserProfile;
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
  xp: number;
  category: string;
}

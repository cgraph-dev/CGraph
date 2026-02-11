/**
 * Interactive Demo Module Types
 */

/** Chat message in the demo conversation */
export interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
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

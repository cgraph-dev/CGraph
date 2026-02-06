/**
 * Interactive Demo Module Types
 *
 * Type definitions for the landing page interactive demo components.
 *
 * @module components/landing/interactive-demo
 */

/** Chat message in the demo conversation */
export interface Message {
  /** Unique message identifier */
  id: string;
  /** Author display name */
  author: string;
  /** Author avatar emoji */
  avatar: string;
  /** Message text content */
  content: string;
  /** Message timestamp */
  timestamp: Date;
  /** Emoji reactions on the message */
  reactions?: { emoji: string; count: number }[];
}

/** Tab configuration for the demo switcher */
export interface DemoTab {
  /** Unique tab identifier */
  id: string;
  /** Tab display label */
  label: string;
  /** Tab emoji icon */
  icon: string;
}

/** Props for the main InteractiveDemo component */
export interface InteractiveDemoProps {
  /** Additional CSS classes */
  className?: string;
}

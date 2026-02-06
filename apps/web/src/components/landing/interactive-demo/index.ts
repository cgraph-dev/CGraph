/**
 * Interactive Demo Module
 *
 * Landing page interactive demo showcasing platform features
 * through live chat, customization, and gamification previews.
 *
 * @module components/landing/interactive-demo
 */

// Main component
export { InteractiveDemo, default } from './InteractiveDemo';

// Sub-components
export { ChatDemo } from './ChatDemo';
export { CustomizeDemo } from './CustomizeDemo';
export { GamificationDemo } from './GamificationDemo';

// Types
export type { Message, DemoTab, InteractiveDemoProps } from './types';

// Constants
export { DEMO_TABS } from './constants';

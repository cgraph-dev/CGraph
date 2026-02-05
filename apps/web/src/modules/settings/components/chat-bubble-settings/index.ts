/**
 * ChatBubbleSettings Module
 *
 * Comprehensive chat bubble customization with tabs:
 * - Colors: Message background colors and gradients
 * - Shape: Border radius, bubble shape, tail
 * - Effects: Glass, shadow, border effects
 * - Animations: Entrance animations, hover effects
 * - Layout: Width, avatar, timestamp settings
 * - Backgrounds: Animated chat backgrounds
 */

// Types
export type {
  TabProps,
  BackgroundsTabProps,
  TabId,
  TabConfig,
  PresetConfig,
  CategoryColors,
} from './types';

// Tab components
export { ColorsTab, ShapeTab, EffectsTab, AnimationsTab, LayoutTab } from './tabs';
export { BackgroundsTab } from './BackgroundsTab';

// Main component (default export)
export { default } from './page';

/**
 * ChatBubbleSettings Module
 *
 * This file re-exports from the modularized chat-bubble-settings directory.
 * The original 938-line file has been split into:
 * - types.ts (~50 lines) - Type definitions
 * - tabs.tsx (~300 lines) - Tab components (Colors, Shape, Effects, Animations, Layout)
 * - BackgroundsTab.tsx (~280 lines) - Backgrounds tab component
 * - page.tsx (~270 lines) - Main component
 * - index.ts - Barrel exports
 */
export type {
  TabProps,
  BackgroundsTabProps,
  TabId,
  TabConfig,
  PresetConfig,
  CategoryColors,
} from './chat-bubble-settings/index';
export {
  ColorsTab,
  ShapeTab,
  EffectsTab,
  AnimationsTab,
  LayoutTab,
  BackgroundsTab,
} from './chat-bubble-settings/index';
export { default } from './chat-bubble-settings/index';

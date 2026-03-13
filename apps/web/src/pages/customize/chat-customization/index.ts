/**
 * Chat Customization Module
 * Barrel exports for chat customization components
 */

export { default, default as ChatCustomization } from './page';
export type {
  ChatCategory,
  BubbleStyle,
  MessageEffect,
  BubbleStylesSectionProps,
  MessageEffectsSectionProps,
  AdvancedControlsSectionProps,
  CategoryDefinition,
} from './types';
export {
  BUBBLE_STYLES,
  MESSAGE_EFFECTS,
  ENTRANCE_ANIMATIONS,
  type EntranceAnimationType,
} from './constants';
export { BubbleStylesSection, MessageEffectsSection, AdvancedControlsSection } from './sections';

/**
 * Chat Customization Module
 * Barrel exports for chat customization components
 */

export { default, default as ChatCustomization } from './page';
export type {
  ChatCategory,
  BubbleStyle,
  MessageEffect,
  ReactionStyle,
  BubbleStylesSectionProps,
  MessageEffectsSectionProps,
  ReactionStylesSectionProps,
  AdvancedControlsSectionProps,
  CategoryDefinition,
} from './types';
export {
  BUBBLE_STYLES,
  MESSAGE_EFFECTS,
  REACTION_STYLES,
  ENTRANCE_ANIMATIONS,
  type EntranceAnimationType,
} from './constants';
export {
  BubbleStylesSection,
  MessageEffectsSection,
  ReactionStylesSection,
  AdvancedControlsSection,
} from './sections';

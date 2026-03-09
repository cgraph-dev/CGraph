/**
 * ChatCustomization Component
 *
 * Chat styling customization with 2 sections:
 * 1. Bubble Styles - 25+ chat bubble shapes and styles
 * 2. Message Effects - 15+ send/receive animations
 *
 * Features:
 * - Live preview of chat bubbles
 * - Interactive animation demos
 * - Search/filter functionality
 * - Lock system for premium styles
 * - One-click apply
 *
 * @module chat-customization
 */

// Re-export from modular structure
export {
  default,
  ChatCustomization,
  // Types
  type ChatCategory,
  type BubbleStyle,
  type MessageEffect,
  type ReactionStyle,
  type BubbleStylesSectionProps,
  type MessageEffectsSectionProps,
  type ReactionStylesSectionProps,
  type AdvancedControlsSectionProps,
  type CategoryDefinition,
  // Constants
  BUBBLE_STYLES,
  MESSAGE_EFFECTS,
  REACTION_STYLES,
  ENTRANCE_ANIMATIONS,
  type EntranceAnimationType,
  // Sections
  BubbleStylesSection,
  MessageEffectsSection,
  ReactionStylesSection,
  AdvancedControlsSection,
} from './chat-customization/index';

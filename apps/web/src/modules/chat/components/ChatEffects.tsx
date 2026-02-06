/**
 * Chat Effects Components
 *
 * Renders:
 * - Message entrance animations (30+ effects)
 * - Bubble styles (15 presets)
 * - Typing indicators (8 styles)
 * - Particle effects
 * - Reaction animations
 *
 * @module ChatEffects
 * @see ./chat-effects for modular implementation
 */

export {
  // Types
  type MessageBubbleProps,
  type MessageWithEffectProps,
  type MessageParticlesProps,
  type TypingIndicatorProps,
  type ReactionAnimationProps,
  type ChatEffectsProviderProps,
  type Particle,
  // Constants
  PARTICLE_EFFECTS,
  shouldShowParticles,
  TYPING_SPEED_MAP,
  TYPING_SIZE_MAP,
  // Components
  MessageBubble,
  MessageWithEffect,
  MessageParticles,
  TypingIndicator,
  ReactionAnimation,
  ChatEffectsProvider,
  useChatEffects,
} from './chat-effects';

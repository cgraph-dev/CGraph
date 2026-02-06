/**
 * Chat Effects Module
 *
 * Provides animated message effects, typing indicators, and reaction animations
 * for the chat system.
 */

// Types
export type {
  MessageBubbleProps,
  MessageWithEffectProps,
  MessageParticlesProps,
  TypingIndicatorProps,
  ReactionAnimationProps,
  ChatEffectsProviderProps,
  Particle,
} from './types';

// Constants
export {
  PARTICLE_EFFECTS,
  shouldShowParticles,
  TYPING_SPEED_MAP,
  TYPING_SIZE_MAP,
} from './constants';

// Components
export { MessageBubble } from './MessageBubble';
export { MessageWithEffect } from './MessageWithEffect';
export { MessageParticles } from './MessageParticles';
export { TypingIndicator } from './TypingIndicator';
export { ReactionAnimation } from './ReactionAnimation';
export { ChatEffectsProvider, useChatEffects } from './ChatEffectsProvider';

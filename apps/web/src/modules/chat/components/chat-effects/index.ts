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
export { MessageBubble } from './message-bubble';
export { MessageWithEffect } from './message-with-effect';
export { MessageParticles } from './message-particles';
export { TypingIndicator } from './typing-indicator';
export { ReactionAnimation } from './reaction-animation';
export { ChatEffectsProvider, useChatEffects } from './chat-effects-provider';

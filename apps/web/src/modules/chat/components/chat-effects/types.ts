/**
 * ChatEffects Type Definitions
 */

import type {
  MessageEffect,
  BubbleStyleConfig,
  MessageEffectConfig,
  TypingIndicatorConfig,
  ReactionConfig,
} from '@/stores/chatEffectsStore';

export interface MessageBubbleProps {
  children: React.ReactNode;
  style?: BubbleStyleConfig;
  isOwn?: boolean;
  className?: string;
  animate?: boolean;
}

export interface MessageWithEffectProps {
  children: React.ReactNode;
  effect?: MessageEffect;
  config?: Partial<MessageEffectConfig>;
  bubbleStyle?: BubbleStyleConfig;
  isOwn?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

export interface MessageParticlesProps {
  effect: MessageEffect;
  config: Partial<MessageEffectConfig>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface TypingIndicatorProps {
  config?: TypingIndicatorConfig;
  username?: string;
  className?: string;
}

export interface ReactionAnimationProps {
  emoji: string;
  onComplete?: () => void;
  className?: string;
}

export interface ChatEffectsProviderProps {
  children: React.ReactNode;
  loadFromServer?: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

/**
 * ChatEffects Type Definitions
 */

import type {
  MessageEffect,
  BubbleStyleConfig,
  MessageEffectConfig,
  TypingIndicatorConfig,
} from '@/modules/chat/store';

export interface MessageBubbleProps {
  children: React.ReactNode;
  style?: BubbleStyleConfig;
  isOwn?: boolean;
  className?: string;
  animate?: boolean;
  config?: Partial<MessageEffectConfig>;
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
  style?:
    | 'dots'
    | 'wave'
    | 'bounce'
    | 'pulse'
    | 'typing-text'
    | 'pencil'
    | 'speech-bubble'
    | 'spinner'
    | 'custom';
  speed?: 'slow' | 'normal' | 'fast';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface ReactionAnimationProps {
  emoji: string;
  animation?: 'pop' | 'bounce' | 'float' | 'explode' | 'spin' | 'shake' | 'glow' | 'rainbow';
  size?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
  className?: string;
}

export interface ChatEffectsProviderProps {
  children: React.ReactNode;
  loadFromServer?: boolean;
  effectOverride?: MessageEffect;
  configOverride?: MessageEffectConfig;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

import { memo, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useChatEffectsStore,
  useActiveMessageEffect,
  useActiveBubbleStyle,
  useChatSoundSettings,
  useChatEffectSettings,
  type MessageEffect,
  type BubbleStyleConfig,
  type MessageEffectConfig,
  type TypingIndicatorConfig,
  MESSAGE_EFFECT_PRESETS,
} from '@/stores/chatEffectsStore';

/**
 * Chat Effects Components
 *
 * Renders:
 * - Message entrance animations (30+ effects)
 * - Bubble styles (15 presets)
 * - Typing indicators (8 styles)
 * - Particle effects
 * - Reaction animations
 */

// ==================== MESSAGE BUBBLE ====================

interface MessageBubbleProps {
  children: React.ReactNode;
  style?: BubbleStyleConfig;
  isOwn?: boolean;
  className?: string;
  animate?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  children,
  style: propStyle,
  isOwn = false,
  className,
  animate = true,
}: MessageBubbleProps) {
  const storeStyle = useActiveBubbleStyle();
  const { reduceMotion } = useChatEffectSettings();
  const style = propStyle ?? storeStyle;

  const bubbleStyle = useMemo((): React.CSSProperties => {
    if (!style) return {};

    const base: React.CSSProperties = {
      backgroundColor: style.gradient
        ? undefined
        : style.backgroundColor,
      color: style.textColor,
      borderRadius: style.borderRadius ?? '1rem',
      border: style.borderColor
        ? `${style.borderWidth ?? 1}px solid ${style.borderColor}`
        : undefined,
      boxShadow: style.shadow ?? (style.glow
        ? `0 0 ${style.glow.blur}px ${style.glow.color}`
        : undefined),
    };

    if (style.gradient) {
      base.background = `linear-gradient(${style.gradient.angle}deg, ${style.gradient.from}, ${style.gradient.to})`;
    }

    return base;
  }, [style]);

  const variants = {
    initial: reduceMotion ? {} : { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9 },
  };

  return (
    <motion.div
      className={cn(
        'px-4 py-2 max-w-[80%]',
        isOwn ? 'ml-auto' : 'mr-auto',
        className
      )}
      style={bubbleStyle}
      variants={animate ? variants : undefined}
      initial={animate ? 'initial' : undefined}
      animate={animate ? 'animate' : undefined}
      exit={animate ? 'exit' : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
});

// ==================== MESSAGE WITH EFFECT ====================

interface MessageWithEffectProps {
  children: React.ReactNode;
  effect?: MessageEffect;
  config?: Partial<MessageEffectConfig>;
  bubbleStyle?: BubbleStyleConfig;
  isOwn?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

export const MessageWithEffect = memo(function MessageWithEffect({
  children,
  effect: propEffect,
  config: propConfig,
  bubbleStyle,
  isOwn = false,
  className,
  onAnimationComplete,
}: MessageWithEffectProps) {
  const storeEffect = useActiveMessageEffect();
  const { reduceMotion, autoPlayEffects } = useChatEffectSettings();
  const { playSound } = useChatSoundSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  const effect = propEffect ?? storeEffect.effect;
  const config = { ...MESSAGE_EFFECT_PRESETS[effect], ...propConfig };

  useEffect(() => {
    if (config.sound && autoPlayEffects) {
      playSound('message-received');
    }
  }, [config.sound, autoPlayEffects, playSound]);

  const getAnimationVariants = useCallback(() => {
    if (reduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      };
    }

    switch (effect) {
      case 'fade-in':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
        };
      case 'slide-in':
        return {
          initial: { opacity: 0, x: isOwn ? 50 : -50 },
          animate: { opacity: 1, x: 0 },
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 0 },
          animate: { opacity: 1, scale: 1 },
        };
      case 'bounce':
        return {
          initial: { opacity: 0, y: 50 },
          animate: {
            opacity: 1,
            y: [50, -10, 5, 0],
          },
        };
      case 'shake':
        return {
          initial: { opacity: 1 },
          animate: {
            x: [0, -5, 5, -5, 5, 0],
            transition: { duration: 0.5 },
          },
        };
      case 'flip':
        return {
          initial: { opacity: 0, rotateY: 90 },
          animate: { opacity: 1, rotateY: 0 },
        };
      case 'glitch':
        return {
          initial: { opacity: 1 },
          animate: {
            x: [0, 2, -2, 2, -2, 0],
            opacity: [1, 0.8, 1, 0.9, 1],
            filter: [
              'none',
              'hue-rotate(90deg)',
              'none',
              'hue-rotate(-90deg)',
              'none',
            ],
          },
        };
      case 'matrix':
        return {
          initial: { opacity: 0, filter: 'blur(10px) brightness(2)' },
          animate: { opacity: 1, filter: 'blur(0px) brightness(1)' },
        };
      case 'neon-glow':
        return {
          initial: { opacity: 0, textShadow: `0 0 0px ${config.color}` },
          animate: {
            opacity: 1,
            textShadow: [
              `0 0 5px ${config.color}`,
              `0 0 20px ${config.color}`,
              `0 0 10px ${config.color}`,
            ],
          },
        };
      case 'holographic':
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            background: [
              'linear-gradient(45deg, rgba(255,0,0,0.1), transparent)',
              'linear-gradient(45deg, rgba(0,255,0,0.1), transparent)',
              'linear-gradient(45deg, rgba(0,0,255,0.1), transparent)',
              'linear-gradient(45deg, rgba(255,0,0,0.1), transparent)',
            ],
          },
        };
      default:
        return {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
        };
    }
  }, [effect, isOwn, config.color, reduceMotion]);

  const variants = getAnimationVariants();

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Particle effects layer */}
      {!reduceMotion && autoPlayEffects && shouldShowParticles(effect) && (
        <MessageParticles
          effect={effect}
          config={config}
          containerRef={containerRef}
        />
      )}

      {/* Message bubble with animation */}
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          duration: config.duration / 1000,
        }}
        onAnimationComplete={onAnimationComplete}
      >
        <MessageBubble style={bubbleStyle} isOwn={isOwn} animate={false}>
          {children}
        </MessageBubble>
      </motion.div>
    </div>
  );
});

// ==================== MESSAGE PARTICLES ====================

interface MessageParticlesProps {
  effect: MessageEffect;
  config: Partial<MessageEffectConfig>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const MessageParticles = memo(function MessageParticles({
  effect,
  config,
}: MessageParticlesProps) {
  const particleCount = config.particleCount ?? 20;
  const color = config.color ?? '#ffffff';

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1 + 0.5,
    }));
  }, [particleCount]);

  const getParticleContent = useCallback(() => {
    switch (effect) {
      case 'confetti':
        return '🎊';
      case 'hearts':
        return '❤️';
      case 'stars':
        return '⭐';
      case 'sparkle':
        return '✨';
      case 'snow':
        return '❄️';
      case 'fire':
        return '🔥';
      case 'sakura':
        return '🌸';
      case 'fireworks':
        return '🎆';
      default:
        return '•';
    }
  }, [effect]);

  const getParticleAnimation = useCallback((particle: typeof particles[0]) => {
    switch (effect) {
      case 'confetti':
        return {
          initial: { opacity: 1, y: 0, x: particle.x, rotate: 0 },
          animate: {
            opacity: [1, 1, 0],
            y: [0, 100, 200],
            x: particle.x + (Math.random() - 0.5) * 50,
            rotate: Math.random() * 360,
          },
        };
      case 'hearts':
      case 'stars':
      case 'sparkle':
        return {
          initial: { opacity: 0, scale: 0, y: 0 },
          animate: {
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [-20, -60],
          },
        };
      case 'snow':
        return {
          initial: { opacity: 0, y: -20 },
          animate: {
            opacity: [0, 1, 1, 0],
            y: [0, 100],
            x: [particle.x, particle.x + Math.sin(particle.id) * 20],
          },
        };
      case 'fire':
        return {
          initial: { opacity: 1, y: 0, scale: 1 },
          animate: {
            opacity: [1, 0.5, 0],
            y: [-10, -40],
            scale: [1, 0.5],
          },
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: [0, 1, 0] },
        };
    }
  }, [effect]);

  if (!shouldShowParticles(effect)) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const animation = getParticleAnimation(particle);
          return (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: particle.size,
                color,
              }}
              initial={animation.initial}
              animate={animation.animate}
              exit={{ opacity: 0 }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            >
              {getParticleContent()}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

function shouldShowParticles(effect: MessageEffect): boolean {
  return [
    'confetti',
    'fireworks',
    'sparkle',
    'hearts',
    'stars',
    'snow',
    'fire',
    'sakura',
    'cosmic',
    'explosion',
  ].includes(effect);
}

// ==================== TYPING INDICATOR ====================

interface TypingIndicatorProps {
  config?: TypingIndicatorConfig;
  username?: string;
  className?: string;
}

export const TypingIndicator = memo(function TypingIndicator({
  config: propConfig,
  username,
  className,
}: TypingIndicatorProps) {
  const storeConfig = useChatEffectsStore((s) => s.activeTypingIndicator);
  const config = propConfig ?? storeConfig;

  const speedMap = { slow: 0.8, normal: 0.5, fast: 0.3 };
  const sizeMap = { sm: 4, md: 6, lg: 8 };
  const speed = speedMap[config.speed];
  const dotSize = sizeMap[config.size];

  const renderIndicator = () => {
    switch (config.style) {
      case 'dots':
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: config.color,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: speed * 2,
                  repeat: Infinity,
                  delay: i * speed * 0.3,
                }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className="flex items-end gap-0.5 h-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: dotSize * 0.6,
                  backgroundColor: config.color,
                }}
                animate={{ height: [4, 16, 4] }}
                transition={{
                  duration: speed * 2,
                  repeat: Infinity,
                  delay: i * speed * 0.15,
                }}
              />
            ))}
          </div>
        );

      case 'bounce':
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: config.color,
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: speed * 1.5,
                  repeat: Infinity,
                  delay: i * speed * 0.2,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ backgroundColor: config.color + '33' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: speed * 3, repeat: Infinity }}
          >
            <span style={{ color: config.color }} className="text-sm">
              {username ? `${username} is typing` : 'typing'}
            </span>
          </motion.div>
        );

      case 'typing-text':
        return (
          <motion.span
            className="text-sm"
            style={{ color: config.color }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: speed * 2, repeat: Infinity }}
          >
            {username ? `${username} is typing...` : 'typing...'}
          </motion.span>
        );

      case 'pencil':
        return (
          <motion.span
            className="text-lg"
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: speed, repeat: Infinity }}
          >
            ✏️
          </motion.span>
        );

      case 'speech-bubble':
        return (
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: speed * 2, repeat: Infinity }}
          >
            💬
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: speed, repeat: Infinity }}
            />
          </motion.div>
        );

      default:
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: config.color,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: speed * 2,
                  repeat: Infinity,
                  delay: i * speed * 0.3,
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={cn('inline-flex items-center', className)}>
      {renderIndicator()}
    </div>
  );
});

// ==================== REACTION ANIMATION ====================

interface ReactionAnimationProps {
  emoji: string;
  onComplete?: () => void;
  className?: string;
}

export const ReactionAnimation = memo(function ReactionAnimation({
  emoji,
  onComplete,
  className,
}: ReactionAnimationProps) {
  const config = useChatEffectsStore((s) => s.activeReactionConfig);
  const { playSound } = useChatSoundSettings();
  const controls = useAnimationControls();

  useEffect(() => {
    if (config.sound) {
      playSound('reaction');
    }

    controls.start('animate').then(() => {
      onComplete?.();
    });
  }, [controls, config.sound, playSound, onComplete]);

  const getVariants = () => {
    switch (config.animation) {
      case 'pop':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: [0, config.scale, 1], opacity: 1 },
        };
      case 'bounce':
        return {
          initial: { y: 20, opacity: 0 },
          animate: { y: [20, -10, 0], opacity: 1 },
        };
      case 'float':
        return {
          initial: { y: 0, opacity: 1 },
          animate: { y: -30, opacity: 0 },
        };
      case 'explode':
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { scale: [1, 1.5, 0], opacity: [1, 1, 0] },
        };
      case 'spin':
        return {
          initial: { rotate: 0, scale: 0 },
          animate: { rotate: 360, scale: 1 },
        };
      case 'shake':
        return {
          initial: { x: 0, opacity: 1 },
          animate: { x: [-3, 3, -3, 3, 0], opacity: 1 },
        };
      case 'glow':
        return {
          initial: { opacity: 0, filter: 'brightness(1)' },
          animate: { opacity: 1, filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] },
        };
      case 'rainbow':
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            filter: [
              'hue-rotate(0deg)',
              'hue-rotate(180deg)',
              'hue-rotate(360deg)',
            ],
          },
        };
      default:
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
        };
    }
  };

  const variants = getVariants();

  return (
    <motion.span
      className={cn('inline-block text-xl', className)}
      variants={variants}
      initial="initial"
      animate={controls}
      transition={{ duration: config.duration / 1000, ease: 'easeOut' }}
    >
      {emoji}
    </motion.span>
  );
});

// ==================== CHAT EFFECTS PROVIDER ====================

interface ChatEffectsProviderProps {
  children: React.ReactNode;
  loadFromServer?: boolean;
}

export const ChatEffectsProvider = memo(function ChatEffectsProvider({
  children,
  loadFromServer = true,
}: ChatEffectsProviderProps) {
  const { loadFromServer: load } = useChatEffectsStore();

  useEffect(() => {
    if (loadFromServer) {
      load();
    }
  }, [loadFromServer, load]);

  return <>{children}</>;
});

// ==================== EXPORTS ====================

export {
  MESSAGE_EFFECT_PRESETS,
  BUBBLE_STYLE_PRESETS,
  TYPING_INDICATOR_PRESETS,
} from '@/stores/chatEffectsStore';

export default MessageWithEffect;

/**
 * FullScreenChatEffect — full-viewport overlay for confetti, fireworks,
 * hearts, snow, and similar ephemeral chat effects.
 *
 * Triggered when a user sends a message containing specific keywords
 * (e.g. /confetti, /fireworks, /hearts, /snow) or when receiving
 * an effect event from the Phoenix channel.
 *
 * Uses `canvas-confetti` for physics-based particle effects and
 * Framer Motion for floating emoji effects. The overlay is fully
 * transparent to pointer events.
 *
 * @module chat/components/chat-effects
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ChatEffectType = 'confetti' | 'fireworks' | 'hearts' | 'snow' | 'celebration';

export interface FullScreenChatEffectProps {
  /** Currently-active effect, or null for none. */
  effect: ChatEffectType | null;
  /** Called when the effect finishes its run. */
  onComplete?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating particle (used by hearts / snow)
// ─────────────────────────────────────────────────────────────────────────────

interface FloatingParticle {
  id: number;
  emoji: string;
  x: number; // % from left
  delay: number;
  duration: number;
  size: number;
}

function makeParticles(type: 'hearts' | 'snow', count: number): FloatingParticle[] {
  const emoji = type === 'hearts' ? '❤️' : '❄️';
  const altEmojis: string[] =
    type === 'hearts' ? ['💕', '💖', '💗', '💘', '💝'] : ['❄️', '✨', '🌨️'];

  return Array.from(
    { length: count },
    (_, i): FloatingParticle => ({
      id: i,
      emoji: i % 3 === 0 ? (altEmojis[i % altEmojis.length] ?? emoji) : emoji,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 16 + Math.random() * 16,
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas-confetti helpers
// ─────────────────────────────────────────────────────────────────────────────

function fireConfetti() {
  const end = Date.now() + 2500;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function fireFireworks() {
  const end = Date.now() + 2500;
  const interval = setInterval(() => {
    confetti({
      particleCount: 60,
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      origin: {
        x: 0.15 + Math.random() * 0.7,
        y: 0.2 + Math.random() * 0.3,
      },
      colors: ['#ff0', '#f0f', '#0ff', '#ff6b6b', '#54a0ff', '#feca57'],
    });
    if (Date.now() >= end) clearInterval(interval);
  }, 400);
}

function fireCelebration() {
  // Big initial burst
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { x: 0.5, y: 0.6 },
    colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#1dd1a1'],
  });
  // Delayed side bursts
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
  }, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * unknown for the chat module.
 */
/**
 * Full Screen Chat Effect component.
 */
export function FullScreenChatEffect({ effect, onComplete }: FullScreenChatEffectProps) {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    setParticles([]);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!effect) {
      setParticles([]);
      return;
    }

    clearTimeout(timerRef.current);

    switch (effect) {
      case 'confetti':
        fireConfetti();
        timerRef.current = setTimeout(cleanup, 3000);
        break;
      case 'fireworks':
        fireFireworks();
        timerRef.current = setTimeout(cleanup, 3200);
        break;
      case 'celebration':
        fireCelebration();
        timerRef.current = setTimeout(cleanup, 3000);
        break;
      case 'hearts':
        setParticles(makeParticles('hearts', 25));
        timerRef.current = setTimeout(cleanup, 4000);
        break;
      case 'snow':
        setParticles(makeParticles('snow', 35));
        timerRef.current = setTimeout(cleanup, 5000);
        break;
    }

    return () => clearTimeout(timerRef.current);
  }, [effect, cleanup]);

  // Hearts / snow use Framer Motion floating overlay
  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute select-none"
            style={{
              left: `${p.x}%`,
              fontSize: p.size,
              top: -40,
            }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: '110vh',
              opacity: [1, 1, 0.7, 0],
              rotate: effect === 'snow' ? [0, 180, 360] : 0,
              x: effect === 'snow' ? [0, 15, -10, 20, 0] : 0,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'linear',
            }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook — detects effect triggers in message text
// ─────────────────────────────────────────────────────────────────────────────

const EFFECT_TRIGGERS: Record<string, ChatEffectType> = {
  '/confetti': 'confetti',
  '/fireworks': 'fireworks',
  '/hearts': 'hearts',
  '/snow': 'snow',
  '/celebrate': 'celebration',
  '/party': 'celebration',
};

/**
 * Hook that manages the active chat effect state.
 * Call `triggerFromText(messageText)` after sending a message.
 */
export function useChatEffect() {
  const [activeEffect, setActiveEffect] = useState<ChatEffectType | null>(null);

  const triggerFromText = useCallback((text: string) => {
    const trimmed = text.trim().toLowerCase();
    for (const [trigger, effect] of Object.entries(EFFECT_TRIGGERS)) {
      if (trimmed.startsWith(trigger)) {
        setActiveEffect(effect);
        return true;
      }
    }
    return false;
  }, []);

  const trigger = useCallback((effect: ChatEffectType) => {
    setActiveEffect(effect);
  }, []);

  const clear = useCallback(() => {
    setActiveEffect(null);
  }, []);

  return { activeEffect, triggerFromText, trigger, clear };
}

export default FullScreenChatEffect;

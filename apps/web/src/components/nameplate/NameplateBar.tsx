/**
 * NameplateBar — decorative horizontal bar behind a username.
 *
 * Renders a layered nameplate composed of:
 *   1. Lottie animated background (or CSS gradient fallback)
 *   2. Border frame (solid / gradient / glow / animated / double)
 *   3. Emblem icon
 *   4. Text effect overlay (holo, rainbow, glitch, glow, fire, ice, neon, metallic, etc.)
 *   5. Particle integration via ParticleEngine
 *
 * Design tokens are sourced from `@cgraph/animation-constants` (shared with mobile).
 *
 * @module components/nameplate/NameplateBar
 */

import { useRef, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getNameplateById,
  type NameplateEntry,
  type NameplateBorderStyle,
  type NameplateTextEffect,
} from '@cgraph/animation-constants';
import { getNameplateLottieSource } from '@/assets/lottie/nameplates/nameplateMap';
import type { AnimationItem } from 'lottie-web';

// ── Constants ──────────────────────────────────────────────────────────

/** Default canvas dimensions matching the registry spec (300×48). */
const BAR_WIDTH = 300;
const BAR_HEIGHT = 48;

// ── Types ──────────────────────────────────────────────────────────────

export interface NameplateBarProps {
  /** Nameplate ID from the registry (e.g. 'plate_gold_shimmer'). null → hidden. */
  nameplateId: string | null;
  /** Optional className for the outermost wrapper. */
  className?: string;
  /** Custom width override. @default 300 */
  width?: number;
  /** Custom height override. @default 48 */
  height?: number;
}

// ── Reduced-motion hook ────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ── Border helpers ─────────────────────────────────────────────────────

/** Resolve border CSS for the given border style. */
function resolveBorderStyle(
  style: NameplateBorderStyle,
  color: string | null,
): React.CSSProperties {
  const c = color ?? 'transparent';
  switch (style) {
    case 'solid':
      return { border: `1px solid ${c}` };
    case 'gradient':
      return {
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `inset 0 0 0 1px ${c}, 0 0 6px ${c}40`,
      };
    case 'glow':
      return {
        border: `1px solid ${c}60`,
        boxShadow: `0 0 8px ${c}80, 0 0 16px ${c}40`,
      };
    case 'animated':
      return {
        border: `1px solid ${c}80`,
        boxShadow: `0 0 10px ${c}60, 0 0 20px ${c}30`,
      };
    case 'double':
      return {
        border: `3px double ${c}`,
      };
    case 'none':
    default:
      return {};
  }
}

// ── Text effect helpers ────────────────────────────────────────────────

/** Produce inline style for the specified text effect. */
function resolveTextEffectStyle(
  effect: NameplateTextEffect,
  color: string,
  secondary: string | null,
): React.CSSProperties {
  const sec = secondary ?? color;
  switch (effect) {
    case 'glow':
      return {
        color,
        textShadow: `0 0 6px ${color}80, 0 0 12px ${color}40`,
      };
    case 'metallic':
      return {
        background: `linear-gradient(135deg, ${color}, ${sec}, ${color})`,
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    case 'holographic':
      return {
        background: `linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'nameplate-holo 3s linear infinite',
      };
    case 'fire':
      return {
        color,
        textShadow: `0 0 4px ${sec}, 0 -2px 8px ${sec}80, 0 -4px 12px ${sec}40`,
      };
    case 'ice':
      return {
        color,
        textShadow: `0 0 6px ${sec}80, 0 0 12px ${sec}40`,
        filter: 'brightness(1.1)',
      };
    case 'neon':
      return {
        color,
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${sec}, 0 0 40px ${sec}`,
      };
    case 'glitch':
      return {
        color,
        animation: 'nameplate-glitch 2s steps(10, end) infinite',
      };
    case 'rainbow':
      return {
        background: `linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'nameplate-rainbow 4s linear infinite',
      };
    case 'shadow':
      return {
        color,
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
      };
    case 'emboss':
      return {
        color,
        textShadow: '1px 1px 0 rgba(255,255,255,0.3), -1px -1px 0 rgba(0,0,0,0.3)',
      };
    case 'none':
    default:
      return { color };
  }
}

// ── Lottie background layer ────────────────────────────────────────────

interface LottieBackgroundProps {
  /** Lottie JSON animation data from the asset map. */
  animationData: unknown;
  /** Whether to skip Lottie and show nothing. */
  disabled: boolean;
}

/** Renders a Lottie animation filling the nameplate background. */
function LottieBackground({ animationData, disabled }: LottieBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (disabled || !animationData || !containerRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const lottie = (await import('lottie-web/build/player/lottie_light')).default;
        if (cancelled || !containerRef.current) return;

        const anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- lottie-web animationData accepts object
          animationData: animationData as Record<string, unknown>,
        });

        anim.addEventListener('DOMLoaded', () => {
          if (!cancelled) {
            animRef.current = anim;
            setLoaded(true);
          }
        });

        anim.addEventListener('data_failed', () => {
          if (!cancelled) setLoaded(false);
        });
      } catch {
        /* Lottie load failure — gradient fallback takes over */
      }
    }

    void init();
    return () => {
      cancelled = true;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
      setLoaded(false);
    };
  }, [animationData, disabled]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      aria-hidden="true"
    />
  );
}

// ── Gradient fallback layer ────────────────────────────────────────────

/** Renders a CSS gradient background when Lottie is unavailable or as underlayer. */
function GradientBackground({
  gradient,
}: {
  gradient: readonly [string, string] | null;
}) {
  if (!gradient) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        borderRadius: 'inherit',
      }}
      aria-hidden="true"
    />
  );
}

// ── Particle overlay layer ─────────────────────────────────────────────

/** Lightweight inline particle canvas scoped to the nameplate bar. */
function NameplateParticles({
  particleType,
  colors,
  width,
  height,
}: {
  particleType: string;
  colors: readonly [string, string] | null;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  const particleColors = colors
    ? [colors[0], colors[1], `${colors[0]}80`]
    : ['#f59e0b', '#fbbf24', '#fcd34d'];

  useEffect(() => {
    if (particleType === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    interface MiniParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const particles: MiniParticle[] = [];
    const maxCount = 15;

    function spawn(): MiniParticle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        life: 0,
        maxLife: Math.random() * 150 + 80,
        color: particleColors[Math.floor(Math.random() * particleColors.length)] ?? '#fbbf24',
      };
    }

    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      while (particles.length < maxCount) {
        particles.push(spawn());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        const ratio = p.life / p.maxLife;
        const alpha = ratio > 0.7 ? p.opacity * (1 - (ratio - 0.7) / 0.3) : p.opacity;

        if (p.life >= p.maxLife || p.y < -5) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particleType, width, height, particleColors]);

  if (particleType === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────

/**
 * NameplateBar — renders a fully layered decorative nameplate bar.
 *
 * Layers (back→front): gradient bg → Lottie bg → border → emblem + text effect → particles.
 *
 * @example
 * ```tsx
 * <NameplateBar nameplateId="plate_gold_shimmer" />
 * ```
 */
export const NameplateBar = memo(function NameplateBar({
  nameplateId,
  className = '',
  width = BAR_WIDTH,
  height = BAR_HEIGHT,
}: NameplateBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Resolve entry from shared registry
  const entry: NameplateEntry | undefined = nameplateId
    ? getNameplateById(nameplateId)
    : undefined;

  // Resolve Lottie animation data from asset map
  const lottieData = nameplateId ? getNameplateLottieSource(nameplateId) : undefined;
  const hasLottie = Boolean(lottieData && entry?.lottieFile);

  if (!entry || entry.id === 'plate_none') {
    return null;
  }

  const borderStyles = resolveBorderStyle(entry.borderStyle, entry.borderColor);
  const textStyles = resolveTextEffectStyle(
    entry.textEffect,
    entry.textColor,
    entry.textColorSecondary,
  );

  // Animated border rotation for 'animated' border style
  const animatedBorderProps =
    entry.borderStyle === 'animated' && !prefersReducedMotion
      ? {
          animate: {
            boxShadow: [
              `0 0 8px ${entry.borderColor}60, 0 0 16px ${entry.borderColor}30`,
              `0 0 14px ${entry.borderColor}80, 0 0 28px ${entry.borderColor}40`,
              `0 0 8px ${entry.borderColor}60, 0 0 16px ${entry.borderColor}30`,
            ],
          },
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        }
      : {};

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={entry.id}
        className={`relative overflow-hidden ${className}`}
        style={{
          width,
          height,
          borderRadius: 8,
          ...borderStyles,
        }}
        initial={{ opacity: 0, scaleX: 0.85 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0, scaleX: 0.85 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        role="img"
        aria-label={`${entry.name} nameplate`}
        {...animatedBorderProps}
      >
        {/* Layer 1: CSS gradient background (always renders as fallback) */}
        <GradientBackground gradient={entry.barGradient} />

        {/* Layer 2: Lottie animated background */}
        <LottieBackground
          animationData={lottieData}
          disabled={prefersReducedMotion || !hasLottie}
        />

        {/* Layer 3: Content — emblem + username text effect */}
        <div
          className="relative z-10 flex h-full items-center justify-center gap-2 px-4"
          style={{ width, height }}
        >
          {/* Emblem */}
          {entry.emblem && (
            <motion.span
              className="flex-shrink-0 text-base"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
              aria-hidden="true"
            >
              {entry.emblem}
            </motion.span>
          )}

          {/* Text effect preview */}
          <span
            className="truncate text-sm font-bold"
            style={textStyles}
          >
            Username
          </span>

          {/* Trailing emblem for symmetry on high-rarity plates */}
          {entry.emblem && (entry.rarity === 'legendary' || entry.rarity === 'mythic') && (
            <motion.span
              className="flex-shrink-0 text-base"
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
              aria-hidden="true"
            >
              {entry.emblem}
            </motion.span>
          )}
        </div>

        {/* Layer 4: Particle overlay */}
        {!prefersReducedMotion && (
          <NameplateParticles
            particleType={entry.particleType}
            colors={entry.barGradient}
            width={width}
            height={height}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

export default NameplateBar;

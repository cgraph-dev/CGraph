/**
 * SeasonalEffects - Configurable seasonal overlay effects
 * Snowfall, hearts, fireworks, cherry blossoms, etc.
 * Canvas-based for performance, with per-season particle presets
 * @module components/ui
 */
import { memo, useRef, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────
export type SeasonalTheme =
  | 'snow'
  | 'hearts'
  | 'fireworks'
  | 'cherry-blossoms'
  | 'confetti'
  | 'none';

interface SeasonalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  shape: 'circle' | 'heart' | 'petal' | 'star' | 'rect';
  life: number;
  maxLife: number;
}

interface SeasonalEffectsProps {
  theme: SeasonalTheme;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

// ── Presets ─────────────────────────────────────────────────
const INTENSITY_COUNTS = {
  light: 30,
  medium: 60,
  heavy: 100,
} as const;

function createParticle(
  theme: SeasonalTheme,
  w: number,
  h: number,
): SeasonalParticle {
  const base: SeasonalParticle = {
    x: Math.random() * w,
    y: -20,
    vx: 0,
    vy: 1,
    size: 4,
    rotation: 0,
    rotationSpeed: 0,
    opacity: 1,
    color: '#fff',
    shape: 'circle',
    life: 0,
    maxLife: Infinity,
  };

  switch (theme) {
    case 'snow':
      return {
        ...base,
        y: Math.random() * -h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.3 + Math.random() * 0.7,
        size: 2 + Math.random() * 4,
        opacity: 0.4 + Math.random() * 0.5,
        color: '#fff',
        shape: 'circle',
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      };

    case 'hearts':
      return {
        ...base,
        y: h + 20,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.5 + Math.random() * 1),
        size: 6 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.4,
        color: ['#ef4444', '#ec4899', '#f43f5e', '#fb7185'][
          Math.floor(Math.random() * 4)
        ] as string,
        shape: 'heart',
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        maxLife: 300 + Math.random() * 200,
      };

    case 'cherry-blossoms':
      return {
        ...base,
        y: Math.random() * -h,
        vx: 0.3 + Math.random() * 0.5,
        vy: 0.4 + Math.random() * 0.6,
        size: 5 + Math.random() * 8,
        opacity: 0.3 + Math.random() * 0.5,
        color: ['#fbb6ce', '#f9a8d4', '#fbcfe8', '#fce7f3'][
          Math.floor(Math.random() * 4)
        ] as string,
        shape: 'petal',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
      };

    case 'fireworks': {
      const cx = w * 0.2 + Math.random() * w * 0.6;
      const cy = h * 0.15 + Math.random() * h * 0.4;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      return {
        ...base,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        opacity: 1,
        color: ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316'][
          Math.floor(Math.random() * 6)
        ] as string,
        shape: 'star',
        maxLife: 60 + Math.random() * 40,
      };
    }

    case 'confetti':
      return {
        ...base,
        y: Math.random() * -h * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        size: 4 + Math.random() * 4,
        opacity: 0.7 + Math.random() * 0.3,
        color: ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7', '#ec4899'][
          Math.floor(Math.random() * 6)
        ] as string,
        shape: 'rect',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      };

    default:
      return base;
  }
}

// ── Shape Drawers ──────────────────────────────────────────
function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y - s * 0.5, x - s, y - s * 0.5, x - s, y + s * 0.1);
  ctx.bezierCurveTo(x - s, y + s * 0.6, x, y + s, x, y + s);
  ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.6, x + s, y + s * 0.1);
  ctx.bezierCurveTo(x + s, y - s * 0.5, x, y - s * 0.5, x, y + s * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawPetal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const spikes = 5;
  const outerR = size;
  const innerR = size * 0.4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ── Component ──────────────────────────────────────────────
export const SeasonalEffects = memo(function SeasonalEffects({
  theme,
  intensity = 'medium',
  className = '',
}: SeasonalEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<SeasonalParticle[]>([]);
  const frameRef = useRef(0);

  const particleCount = INTENSITY_COUNTS[intensity];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      frameRef.current++;

      // Spawn particles to maintain count
      while (particlesRef.current.length < particleCount) {
        particlesRef.current.push(createParticle(theme, w, h));
      }

      // Fireworks spawn bursts periodically
      if (theme === 'fireworks' && frameRef.current % 90 === 0) {
        const burstCount = 20 + Math.floor(Math.random() * 15);
        for (let i = 0; i < burstCount; i++) {
          particlesRef.current.push(createParticle(theme, w, h));
        }
      }

      const alive: SeasonalParticle[] = [];

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life++;

        // Gravity for fireworks
        if (theme === 'fireworks') {
          p.vy += 0.03;
          p.opacity = Math.max(0, 1 - p.life / p.maxLife);
        }

        // Gentle sway for snow & petals
        if (theme === 'snow' || theme === 'cherry-blossoms') {
          p.vx += Math.sin(frameRef.current * 0.01 + p.y * 0.01) * 0.01;
        }

        // Fade out hearts as they rise
        if (theme === 'hearts') {
          p.opacity = Math.max(0, 1 - p.life / p.maxLife);
        }

        // Remove offscreen or expired
        const offscreen =
          p.y > h + 30 || p.y < -50 || p.x < -30 || p.x > w + 30;
        const expired = p.life >= p.maxLife;

        if (offscreen || expired) continue;

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'heart':
            drawHeart(ctx, 0, 0, p.size);
            break;
          case 'petal':
            drawPetal(ctx, 0, 0, p.size);
            break;
          case 'star':
            drawStar(ctx, 0, 0, p.size);
            break;
          case 'rect':
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            break;
        }

        ctx.restore();
        alive.push(p);
      }

      particlesRef.current = alive;
    },
    [theme, particleCount],
  );

  useEffect(() => {
    if (theme === 'none') return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Reset particles on theme change
    particlesRef.current = [];
    frameRef.current = 0;

    const loop = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      draw(ctx, w, h);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme, draw]);

  if (theme === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-[5] ${className}`}
      aria-hidden="true"
    />
  );
});

// ── Helpers ────────────────────────────────────────────────

/** Get the seasonal theme based on current date */
export function getAutoSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Dec 15 - Jan 5: Snow
  if (month === 12 && day >= 15) return 'snow';
  if (month === 1 && day <= 5) return 'snow';

  // Dec 31 - Jan 1: Fireworks (overrides snow)
  if ((month === 12 && day === 31) || (month === 1 && day === 1))
    return 'fireworks';

  // Feb 13-15: Hearts (Valentine's)
  if (month === 2 && day >= 13 && day <= 15) return 'hearts';

  // Mar 20 - Apr 15: Cherry Blossoms (Spring)
  if ((month === 3 && day >= 20) || (month === 4 && day <= 15))
    return 'cherry-blossoms';

  return 'none';
}

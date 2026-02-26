/**
 * Seasonal particle types, creation, and shape drawing utilities
 * @module components/ui
 */

// ── Types ──────────────────────────────────────────────────
export type SeasonalTheme =
  | 'snow'
  | 'hearts'
  | 'fireworks'
  | 'cherry-blossoms'
  | 'confetti'
  | 'none';

export interface SeasonalParticle {
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

export interface SeasonalEffectsProps {
  theme: SeasonalTheme;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

// ── Presets ─────────────────────────────────────────────────
export const INTENSITY_COUNTS = {
  light: 30,
  medium: 60,
  heavy: 100,
} as const;

// ── Particle Factory ───────────────────────────────────────
/**
 * Creates a new particle.
 */
export function createParticle(theme: SeasonalTheme, w: number, h: number): SeasonalParticle {
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
        ] as string, // type assertion: array index returns valid color string
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
        ] as string, // type assertion: array index returns valid color string
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
        ] as string, // type assertion: array index returns valid color string
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
        ] as string, // type assertion: array index returns valid color string
        shape: 'rect',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      };

    default:
      return base;
  }
}

// ── Shape Drawers ──────────────────────────────────────────
/**
 * unknown.
 *
 */
export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
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

/**
 * unknown.
 *
 */
export function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * draw Star.
 */
export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
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

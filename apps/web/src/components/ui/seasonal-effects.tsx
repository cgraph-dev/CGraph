/**
 * SeasonalEffects - Configurable seasonal overlay effects
 * Snowfall, hearts, fireworks, cherry blossoms, etc.
 * Canvas-based for performance, with per-season particle presets
 * @module components/ui
 */
import { memo, useRef, useEffect, useCallback } from 'react';
import {
  createParticle,
  drawHeart,
  drawPetal,
  drawStar,
  INTENSITY_COUNTS,
} from './seasonalParticles';
import type { SeasonalParticle, SeasonalEffectsProps } from './seasonalParticles';

// Re-export types for consumers
export type { SeasonalTheme, SeasonalEffectsProps } from './seasonalParticles';

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
        const offscreen = p.y > h + 30 || p.y < -50 || p.x < -30 || p.x > w + 30;
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
    [theme, particleCount]
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
export function getAutoSeasonalTheme(): import('./seasonalParticles').SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Dec 15 - Jan 5: Snow
  if (month === 12 && day >= 15) return 'snow';
  if (month === 1 && day <= 5) return 'snow';

  // Dec 31 - Jan 1: Fireworks (overrides snow)
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return 'fireworks';

  // Feb 13-15: Hearts (Valentine's)
  if (month === 2 && day >= 13 && day <= 15) return 'hearts';

  // Mar 20 - Apr 15: Cherry Blossoms (Spring)
  if ((month === 3 && day >= 20) || (month === 4 && day <= 15)) return 'cherry-blossoms';

  return 'none';
}
